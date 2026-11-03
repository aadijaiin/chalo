-- 1. Removing a lookout sticks: they can't come back with the code, in either role.
-- 2. Consent inside the crew: anyone in the crew can hide themselves from lookouts. Lookouts
--    then can't see their position, trail or alerts; the rest of the crew still can.
-- 3. "Almost there" for lookouts: one push when someone gets within 5 km of the destination.
-- 4. Watch links: a crew member makes a private web link (chalo.../w/<token>) so family can
--    follow the trip in a browser without the app. Read-only, live parties only, revocable by
--    the host, and it never shows anyone hidden from lookouts.
-- 5. Recap cards: a member of an ended party makes a link (chalo.../r/<token>) to a stats-only
--    summary for the group chat. No positions or routes, just names, distance and time.

alter table public.party_members
  add column removed boolean not null default false,
  add column hidden_from_lookouts boolean not null default false;

alter table public.parties
  add column watch_token text unique,
  add column recap_token text unique;

alter table public.party_locations
  add column near_notified boolean not null default false;

create function public.new_link_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select replace(gen_random_uuid()::text, '-', '');
$$;

revoke execute on function public.new_link_token() from public, anon, authenticated;

-- Whether the signed-in user may see `uid`'s position in party `pid` right now.
create function public.can_see_member(pid uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.party_members me
    join public.parties p on p.id = me.party_id
    left join public.party_members them on them.party_id = me.party_id and them.user_id = uid
    where me.party_id = pid and me.user_id = (select auth.uid()) and me.left_at is null
      and p.ended_at is null
      and (me.role = 'crew' or not coalesce(them.hidden_from_lookouts, false))
  );
$$;

revoke execute on function public.can_see_member(uuid, uuid) from public, anon;
grant execute on function public.can_see_member(uuid, uuid) to authenticated;

drop policy "Current members can see each other's location" on public.party_locations;
create policy "Current members can see each other's location"
  on public.party_locations for select
  to authenticated
  using (public.can_see_member(party_id, user_id));

drop policy "Members can see their party's trails" on public.party_track_points;
create policy "Members can see their party's trails"
  on public.party_track_points for select
  to authenticated
  using (
    public.can_see_member(party_id, user_id)
    or exists (
      select 1 from public.party_members me
      join public.parties p on p.id = me.party_id
      left join public.party_members them on them.party_id = me.party_id and them.user_id = party_track_points.user_id
      where me.party_id = party_track_points.party_id and me.user_id = (select auth.uid())
        and p.ended_at is not null
        and (me.role = 'crew' or not coalesce(them.hidden_from_lookouts, false))
    )
  );

create function public.set_hidden_from_lookouts(pid uuid, hidden boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.party_members set hidden_from_lookouts = hidden
  where party_id = pid and user_id = auth.uid() and role = 'crew' and left_at is null;
  if not found then
    raise exception 'not_in_party';
  end if;
end;
$$;

revoke execute on function public.set_hidden_from_lookouts(uuid, boolean) from public, anon;
grant execute on function public.set_hidden_from_lookouts(uuid, boolean) to authenticated;

create or replace function public.remove_lookout(pid uuid, uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.parties p where p.id = pid and p.host_id = auth.uid()) then
    raise exception 'Only the host can remove a lookout';
  end if;
  update public.party_members set left_at = now(), removed = true
  where party_id = pid and user_id = uid and role = 'lookout' and left_at is null;
end;
$$;

create or replace function public.join_party(party_code text, replace_current boolean default false, as_lookout boolean default false)
returns public.parties
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  party public.parties;
  new_role text := case when as_lookout then 'lookout' else 'crew' end;
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  select * into party from public.parties
  where code = upper(trim(party_code)) and ended_at is null;

  if party.id is null then
    raise exception 'party_not_found' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.party_members m where m.party_id = party.id and m.user_id = me and m.removed) then
    raise exception 'removed_from_party';
  end if;

  if as_lookout then
    if party.host_id = me then
      raise exception 'host_cannot_watch';
    end if;
    delete from public.party_locations where party_id = party.id and user_id = me;
  elsif replace_current then
    perform public.release_live_parties(me, party.id);
  else
    perform public.assert_free_for_party(me, party.id);
  end if;

  insert into public.party_members as m (party_id, user_id, role) values (party.id, me, new_role)
  on conflict (party_id, user_id) do update
    set role = excluded.role,
        left_at = null,
        joined_at = case when m.left_at is null then m.joined_at else now() end
  where m.left_at is not null or m.role <> excluded.role;

  return party;
end;
$$;

-- Lookouts don't hear about people hidden from them. For these kinds `skip` is the person the
-- push is about (the one who sent the SOS, arrived, or fell behind).
create or replace function public.push_to_party(
  pid uuid,
  skip uuid,
  msg_title text,
  msg_body text,
  msg_data jsonb,
  urgent boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  messages jsonb;
  about_hidden boolean := exists (
    select 1 from public.party_members h
    where h.party_id = pid and h.user_id = skip and h.hidden_from_lookouts
  );
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'to', t.token,
    'title', msg_title,
    'body', msg_body,
    'data', msg_data || jsonb_build_object('partyId', pid),
    'sound', 'default',
    'priority', 'high',
    'channelId', case when urgent then 'sos' else 'pings' end
  )), '[]'::jsonb)
  into messages
  from public.push_tokens t
  join public.party_members m on m.user_id = t.user_id
  where m.party_id = pid and m.left_at is null and t.user_id is distinct from skip
    and (
      m.role = 'crew'
      or msg_data ->> 'kind' = 'ended'
      or (msg_data ->> 'kind' in ('sos', 'sos_cleared', 'arrived', 'behind') and not about_hidden)
    );

  if jsonb_array_length(messages) > 0 then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := messages,
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
  end if;
end;
$$;

-- Lookouts only: someone is nearly there. Once per person per destination.
create function public.on_near_destination()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  party public.parties;
  messages jsonb;
begin
  -- Crossing in from further out; starting the trip close by isn't news.
  if tg_op <> 'UPDATE' or new.remaining_m is null or new.remaining_m > 5000 or new.remaining_m = 0
     or new.near_notified or old.remaining_m is null or old.remaining_m <= 5000 then
    return null;
  end if;
  update public.party_locations set near_notified = true
  where party_id = new.party_id and user_id = new.user_id;

  if exists (
    select 1 from public.party_members h
    where h.party_id = new.party_id and h.user_id = new.user_id and h.hidden_from_lookouts
  ) then
    return null;
  end if;

  select * into party from public.parties where id = new.party_id;
  select coalesce(jsonb_agg(jsonb_build_object(
    'to', t.token,
    'title', public.first_name(new.user_id) || ' is almost there',
    'body', round(new.remaining_m / 1000.0, 1) || ' km from ' || coalesce(party.destination_name, 'the destination')
      || ' · ' || party.name,
    'data', jsonb_build_object('kind', 'near', 'partyId', new.party_id),
    'sound', 'default',
    'priority', 'high',
    'channelId', 'pings'
  )), '[]'::jsonb)
  into messages
  from public.push_tokens t
  join public.party_members m on m.user_id = t.user_id
  where m.party_id = new.party_id and m.left_at is null and m.role = 'lookout';

  if jsonb_array_length(messages) > 0 then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := messages,
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
  end if;
  return null;
end;
$$;

create trigger announce_near_destination after insert or update of remaining_m on public.party_locations
  for each row execute function public.on_near_destination();

-- A new destination: everyone can be "almost there" again.
create or replace function public.set_destination(
  pid uuid,
  dest_name text,
  dest_lat double precision,
  dest_lng double precision
)
returns public.parties
language plpgsql
security definer
set search_path = ''
as $$
declare
  party public.parties;
  clean_name text := nullif(trim(dest_name), '');
begin
  update public.parties p
  set destination_name = clean_name,
      destination_lat = case when clean_name is null then null else dest_lat end,
      destination_lng = case when clean_name is null then null else dest_lng end
  where p.id = pid and p.host_id = auth.uid() and p.ended_at is null
  returning * into party;

  if party.id is null then
    raise exception 'Only the host can set the destination';
  end if;

  update public.party_locations
  set eta_s = null, remaining_m = null, gap_base_m = null, near_notified = false
  where party_id = pid;
  update public.party_pings set cleared_at = now(), cleared_by = auth.uid()
  where party_id = pid and kind = 'behind' and cleared_at is null;
  return party;
end;
$$;

-- Watch links ---------------------------------------------------------------------------------

create function public.create_watch_link(pid uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text;
begin
  if not public.is_live_member(pid, true) then
    raise exception 'not_in_party';
  end if;
  update public.parties set watch_token = coalesce(watch_token, public.new_link_token())
  where id = pid
  returning watch_token into token;
  return token;
end;
$$;

create function public.revoke_watch_link(pid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.parties set watch_token = null where id = pid and host_id = auth.uid();
  if not found then
    raise exception 'Only the host can turn off the watch link';
  end if;
end;
$$;

-- What a watch link shows: the party, and each visible crew member's latest position.
-- Null once the party has ended or the link was turned off.
create function public.watch_party(token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'name', p.name,
    'startedAt', p.created_at,
    'destination', case when p.destination_name is null then null else
      jsonb_build_object('name', p.destination_name, 'lat', p.destination_lat, 'lng', p.destination_lng) end,
    'crew', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', coalesce(nullif(split_part(pr.full_name, ' ', 1), ''), pr.username),
        'avatarStyle', pr.avatar_style,
        'avatarSeed', pr.avatar_seed,
        'host', m.user_id = p.host_id,
        'lat', l.lat, 'lng', l.lng, 'speed', l.speed,
        'etaS', l.eta_s, 'remainingM', l.remaining_m,
        'battery', l.battery, 'updatedAt', l.updated_at
      ) order by m.joined_at)
      from public.party_members m
      join public.profiles pr on pr.id = m.user_id
      left join public.party_locations l on l.party_id = m.party_id and l.user_id = m.user_id
      where m.party_id = p.id and m.left_at is null and m.role = 'crew' and not m.hidden_from_lookouts
    ), '[]'::jsonb)
  )
  from public.parties p
  where p.watch_token = watch_party.token and p.ended_at is null;
$$;

-- Recap cards ---------------------------------------------------------------------------------

create function public.share_recap(pid uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text;
begin
  if not public.is_party_member(pid) then
    raise exception 'not_in_party';
  end if;
  update public.parties set recap_token = coalesce(recap_token, public.new_link_token())
  where id = pid and ended_at is not null
  returning recap_token into token;
  if token is null then
    raise exception 'party_still_live';
  end if;
  return token;
end;
$$;

-- Stats only: names, avatars, distance, time, top speed. No positions or routes.
create function public.recap_card(token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with party as (
    select * from public.parties p where p.recap_token = recap_card.token and p.ended_at is not null
  ),
  steps as (
    select t.user_id, t.at, t.speed,
      6371000 * sqrt(
        power(radians(t.lat - lag(t.lat) over w), 2) +
        power(radians(t.lng - lag(t.lng) over w) * cos(radians((t.lat + lag(t.lat) over w) / 2)), 2)
      ) as step_m
    from public.party_track_points t
    where t.party_id = (select id from party)
    window w as (partition by t.user_id order by t.id)
  ),
  per_member as (
    select user_id,
      coalesce(sum(step_m), 0) as distance_m,
      coalesce(max(speed) filter (where speed < 70), 0) as top_ms,
      extract(epoch from max(at) - min(at)) as duration_s
    from steps group by user_id
  )
  select jsonb_build_object(
    'name', party.name,
    'destination', party.destination_name,
    'startedAt', party.created_at,
    'endedAt', party.ended_at,
    'totalM', coalesce((select sum(distance_m) from per_member), 0),
    'durationS', coalesce((select max(duration_s) from per_member), 0),
    'crew', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', coalesce(nullif(split_part(pr.full_name, ' ', 1), ''), pr.username),
        'avatarStyle', pr.avatar_style,
        'avatarSeed', pr.avatar_seed,
        'distanceM', round(pm.distance_m),
        'topKmh', round(pm.top_ms * 3.6)
      ) order by pm.distance_m desc)
      from per_member pm join public.profiles pr on pr.id = pm.user_id
    ), '[]'::jsonb)
  )
  from party;
$$;

revoke execute on function public.create_watch_link(uuid), public.revoke_watch_link(uuid),
  public.share_recap(uuid) from public, anon;
grant execute on function public.create_watch_link(uuid), public.revoke_watch_link(uuid),
  public.share_recap(uuid) to authenticated;
-- The two read-only link endpoints are for people without an account.
revoke execute on function public.watch_party(text), public.recap_card(text) from public;
grant execute on function public.watch_party(text), public.recap_card(text) to anon, authenticated;
