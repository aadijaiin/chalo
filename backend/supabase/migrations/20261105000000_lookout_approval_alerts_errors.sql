-- 1. The host approves lookouts. Joining as a lookout makes a request; until the host approves
--    it, the lookout sees nothing of the crew (positions, trails, statuses, pins) and gets no
--    alerts. The host is pushed the request; the crew hears once someone is actually watching.
--    Someone already in the crew who switches to watching doesn't need approving again.
-- 2. Watch links are the host's to hand out, like approving a lookout.
-- 3. Watch links carry each person's alert (SOS, arrived, fell behind) so the page can flag them.
-- 4. Recap cards leave out anyone who hid from lookouts.
-- 5. app_errors: crash and error reports from the app, written only through report_error().
--    Read them in the dashboard; they're kept for 30 days.

alter table public.party_members
  add column approved boolean not null default true;

-- You're waiting for the host to approve you as a lookout in this party.
create function public.is_pending_lookout(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.party_members m
    where m.party_id = pid and m.user_id = (select auth.uid())
      and m.role = 'lookout' and not m.approved and m.left_at is null
  );
$$;

revoke execute on function public.is_pending_lookout(uuid) from public, anon;
grant execute on function public.is_pending_lookout(uuid) to authenticated;

create or replace function public.can_see_member(pid uuid, uid uuid)
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
      and (me.role = 'crew' or (me.approved and not coalesce(them.hidden_from_lookouts, false)))
  );
$$;

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
        and (me.role = 'crew' or (me.approved and not coalesce(them.hidden_from_lookouts, false)))
    )
  );

drop policy "Members can see their party's pings" on public.party_pings;
create policy "Members can see their party's pings"
  on public.party_pings for select
  to authenticated
  using (public.is_party_member(party_id) and not public.is_pending_lookout(party_id));

drop policy "Members can see their party's pins" on public.party_pins;
create policy "Members can see their party's pins"
  on public.party_pins for select
  to authenticated
  using (public.is_party_member(party_id) and not public.is_pending_lookout(party_id));

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

  -- New lookouts wait for the host. Crew who switch to watching, and lookouts the host already
  -- approved who come back, don't.
  insert into public.party_members as m (party_id, user_id, role, approved)
  values (party.id, me, new_role, not as_lookout)
  on conflict (party_id, user_id) do update
    set role = excluded.role,
        approved = (excluded.role = 'crew') or m.approved,
        left_at = null,
        joined_at = case when m.left_at is null then m.joined_at else now() end
  where m.left_at is not null or m.role <> excluded.role;

  return party;
end;
$$;

create function public.approve_lookout(pid uuid, uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.parties p where p.id = pid and p.host_id = auth.uid()) then
    raise exception 'Only the host can approve a lookout';
  end if;
  update public.party_members set approved = true
  where party_id = pid and user_id = uid and role = 'lookout' and left_at is null and not approved;
end;
$$;

revoke execute on function public.approve_lookout(uuid, uuid) from public, anon;
grant execute on function public.approve_lookout(uuid, uuid) to authenticated;

-- One person's devices.
create function public.push_to_user(uid uuid, msg_title text, msg_body text, msg_data jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  messages jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'to', t.token, 'title', msg_title, 'body', msg_body, 'data', msg_data,
    'sound', 'default', 'priority', 'high', 'channelId', 'pings'
  )), '[]'::jsonb)
  into messages
  from public.push_tokens t where t.user_id = uid;

  if jsonb_array_length(messages) > 0 then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := messages,
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
  end if;
end;
$$;

revoke execute on function public.push_to_user(uuid, text, text, jsonb) from public, anon, authenticated;

-- Pending lookouts get nothing, not even "the party ended".
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
      or (m.approved and (
        msg_data ->> 'kind' = 'ended'
        or (msg_data ->> 'kind' in ('sos', 'sos_cleared', 'arrived', 'behind') and not about_hidden)
      ))
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

create or replace function public.on_member_joined()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  party public.parties;
  who text := public.first_name(new.user_id);
  arrived boolean := tg_op = 'INSERT' or old.left_at is not null or old.role <> new.role;
begin
  if new.left_at is not null then
    return null;
  end if;
  select * into party from public.parties where id = new.party_id;

  if new.role = 'lookout' and not new.approved then
    if arrived then
      perform public.push_to_user(
        party.host_id, who || ' wants to watch ' || party.name,
        'Approve or decline in chalo. Lookouts see the crew on the map; their own location isn''t shared.',
        jsonb_build_object('kind', 'lookout_request', 'partyId', party.id)
      );
    end if;
    return null;
  end if;

  if new.role = 'lookout' then
    -- Just approved: tell them they're in.
    if tg_op = 'UPDATE' and not old.approved and old.left_at is null and old.role = 'lookout' then
      perform public.push_to_user(
        new.user_id, 'You can now follow ' || party.name,
        'The host approved you. Open chalo to see the crew.',
        jsonb_build_object('kind', 'lookout_approved', 'partyId', party.id)
      );
    elsif not arrived then
      return null;
    end if;
    perform public.push_to_party(
      new.party_id, new.user_id, who || ' is watching ' || party.name,
      'They can see the crew on the map. Their own location isn''t shared.',
      jsonb_build_object('kind', 'lookout')
    );
    return null;
  end if;

  -- Crew. The host creating the party isn't news.
  if not arrived or (tg_op = 'INSERT' and new.user_id = party.host_id) then
    return null;
  end if;
  perform public.push_to_party(
    new.party_id, new.user_id, who || ' joined ' || party.name,
    'Now on the map with the crew.', jsonb_build_object('kind', 'joined')
  );
  return null;
end;
$$;

drop trigger push_member_joined on public.party_members;
create trigger push_member_joined after insert or update of left_at, role, approved on public.party_members
  for each row execute function public.on_member_joined();

create or replace function public.on_near_destination()
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
  where m.party_id = new.party_id and m.left_at is null and m.role = 'lookout' and m.approved;

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

create or replace function public.create_watch_link(pid uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text;
begin
  update public.parties set watch_token = coalesce(watch_token, public.new_link_token())
  where id = pid and host_id = auth.uid() and ended_at is null
  returning watch_token into token;
  if token is null then
    raise exception 'Only the host can make a watch link';
  end if;
  return token;
end;
$$;

create or replace function public.watch_party(token text)
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
        'battery', l.battery, 'updatedAt', l.updated_at,
        'alert', (
          select jsonb_build_object('kind', g.kind, 'at', g.created_at, 'message', g.message)
          from public.party_pings g
          where g.party_id = p.id and g.user_id = m.user_id and g.cleared_at is null
            and g.kind in ('sos', 'arrived', 'behind')
          order by g.created_at desc limit 1
        )
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

create or replace function public.recap_card(token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with party as (
    select * from public.parties p where p.recap_token = recap_card.token and p.ended_at is not null
  ),
  shown as (
    select m.user_id from public.party_members m
    where m.party_id = (select id from party) and m.role = 'crew' and not m.hidden_from_lookouts
  ),
  steps as (
    select t.user_id, t.at, t.speed,
      6371000 * sqrt(
        power(radians(t.lat - lag(t.lat) over w), 2) +
        power(radians(t.lng - lag(t.lng) over w) * cos(radians((t.lat + lag(t.lat) over w) / 2)), 2)
      ) as step_m
    from public.party_track_points t
    where t.party_id = (select id from party) and t.user_id in (select user_id from shown)
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

-- Error reports -------------------------------------------------------------------------------

create table public.app_errors (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete cascade,
  message text not null,
  stack text,
  fatal boolean not null default false,
  platform text,
  app_version text,
  created_at timestamptz not null default now()
);

create index app_errors_created on public.app_errors (created_at desc);

-- No policies: written through report_error() only, read in the dashboard.
alter table public.app_errors enable row level security;

-- Signed-out crashes count too (onboarding, sign up), so anon can report. Long fields are cut,
-- and a flood is capped: 30 an hour per person, 600 an hour overall.
create function public.report_error(
  message text,
  stack text default null,
  fatal boolean default false,
  platform text default null,
  app_version text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if (select count(*) from public.app_errors e where e.created_at > now() - interval '1 hour') >= 600
     or (me is not null and (
       select count(*) from public.app_errors e where e.user_id = me and e.created_at > now() - interval '1 hour'
     ) >= 30) then
    return;
  end if;
  insert into public.app_errors (user_id, message, stack, fatal, platform, app_version)
  values (me, left(coalesce(message, 'Unknown error'), 500), left(stack, 4000), coalesce(fatal, false),
          left(platform, 20), left(app_version, 40));
end;
$$;

revoke execute on function public.report_error(text, text, boolean, text, text) from public;
grant execute on function public.report_error(text, text, boolean, text, text) to anon, authenticated;

select cron.schedule('prune-app-errors', '41 3 * * *',
  $cron$delete from public.app_errors where created_at < now() - interval '30 days'$cron$);
