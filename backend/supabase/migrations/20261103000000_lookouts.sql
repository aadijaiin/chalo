-- 1. Lookouts: one-way sharing. Someone (a parent, a partner at home) joins a party as a lookout
--    to follow the crew on the map. They never share their own position, can't ping or drop pins,
--    and the crew can always see who's watching. A lookout isn't "live" anywhere, so watching
--    doesn't count against the one-live-party rule, and you can watch several trips at once.
--    Lookouts only get the pushes that matter from afar: SOS, arrivals, falling behind, the end.
-- 2. Live positions are only visible to people still in the party. is_party_member() also
--    counts people who left, which kept a member who left (or a removed lookout) on the feed.

alter table public.party_members
  add column role text not null default 'crew' check (role in ('crew', 'lookout'));

-- You're in this party right now (left or ended doesn't count).
create function public.is_live_member(pid uuid, crew_only boolean default false)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.party_members m
    join public.parties p on p.id = m.party_id
    where m.party_id = pid and m.user_id = (select auth.uid()) and m.left_at is null
      and p.ended_at is null and (not crew_only or m.role = 'crew')
  );
$$;

revoke execute on function public.is_live_member(uuid, boolean) from public, anon;
grant execute on function public.is_live_member(uuid, boolean) to authenticated;

drop policy "Members can see each other's location" on public.party_locations;
create policy "Current members can see each other's location"
  on public.party_locations for select
  to authenticated
  using (public.is_live_member(party_id));

-- Trails during the trip are as sensitive as live positions; once it's over they're the recap.
drop policy "Members can see their party's trails" on public.party_track_points;
create policy "Members can see their party's trails"
  on public.party_track_points for select
  to authenticated
  using (
    public.is_live_member(party_id)
    or (
      public.is_party_member(party_id)
      and exists (select 1 from public.parties p where p.id = party_id and p.ended_at is not null)
    )
  );

-- The one-live-party rule is about where you share, so lookouts don't count.
create or replace function public.release_live_parties(me uuid, keep uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current record;
begin
  for current in
    select p.id, p.host_id from public.party_members m
    join public.parties p on p.id = m.party_id
    where m.user_id = me and m.left_at is null and m.role = 'crew' and p.ended_at is null
      and (keep is null or p.id <> keep)
  loop
    if current.host_id = me then
      update public.parties set ended_at = now(), ended_reason = 'host' where id = current.id;
      delete from public.party_locations where party_id = current.id;
    else
      update public.party_members set left_at = now() where party_id = current.id and user_id = me;
      delete from public.party_locations where party_id = current.id and user_id = me;
    end if;
  end loop;
end;
$$;

create or replace function public.assert_free_for_party(me uuid, keep uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current record;
begin
  select p.name, p.host_id into current from public.party_members m
  join public.parties p on p.id = m.party_id
  where m.user_id = me and m.left_at is null and m.role = 'crew' and p.ended_at is null
    and (keep is null or p.id <> keep)
  order by m.joined_at desc
  limit 1;

  if found then
    raise exception 'in_another_party'
      using detail = current.name,
            hint = case when current.host_id = me then 'host' else 'member' end;
  end if;
end;
$$;

-- Joining again with the other role switches you over in place. Switching to lookout takes
-- your position off the map straight away.
drop function public.join_party(text, boolean);
create function public.join_party(party_code text, replace_current boolean default false, as_lookout boolean default false)
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

revoke execute on function public.join_party(text, boolean, boolean) from public, anon;
grant execute on function public.join_party(text, boolean, boolean) to authenticated;

-- The host can take a lookout off the party; they'd need the code to come back.
create function public.remove_lookout(pid uuid, uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.parties p where p.id = pid and p.host_id = auth.uid()) then
    raise exception 'Only the host can remove a lookout';
  end if;
  update public.party_members set left_at = now()
  where party_id = pid and user_id = uid and role = 'lookout' and left_at is null;
end;
$$;

revoke execute on function public.remove_lookout(uuid, uuid) from public, anon;
grant execute on function public.remove_lookout(uuid, uuid) to authenticated;

-- Only the crew shares. A lookout gets null back, which makes a phone stop sharing.
create or replace function public.share_location(
  pid uuid,
  lat double precision,
  lng double precision,
  accuracy real default null,
  speed real default null,
  heading real default null,
  eta_s integer default null,
  remaining_m integer default null,
  battery real default null,
  charging boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  party public.parties;
  prev record;
  crumb record;
  moved_m double precision;
  result jsonb;
begin
  select p.* into party from public.party_members m
  join public.parties p on p.id = m.party_id
  where m.party_id = pid and m.user_id = me and m.left_at is null and m.role = 'crew' and p.ended_at is null;

  if party.id is null then
    return null;
  end if;

  result := jsonb_build_object(
    'destination', case when party.destination_name is null then null else
      jsonb_build_object('name', party.destination_name, 'lat', party.destination_lat, 'lng', party.destination_lng)
    end,
    'stops', coalesce((
      select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'lat', g.lat, 'lng', g.lng) order by g.created_at)
      from public.party_pins g where g.party_id = pid and g.kind = 'stop'
    ), '[]'::jsonb)
  );

  -- The trail, sampled by distance so a parked phone doesn't pile up points.
  select t.lat, t.lng, t.at into crumb
  from public.party_track_points t where t.party_id = pid and t.user_id = me
  order by t.id desc limit 1;
  if not found or crumb.at < now() - interval '5 minutes' or 6371000 * sqrt(
    power(radians(lat - crumb.lat), 2) +
    power(radians(lng - crumb.lng) * cos(radians((lat + crumb.lat) / 2)), 2)
  ) >= 100 then
    insert into public.party_track_points (party_id, user_id, lat, lng, speed)
    values (pid, me, lat, lng, speed);
  end if;

  select l.lat, l.lng, l.updated_at, l.eta_s into prev
  from public.party_locations l where l.party_id = pid and l.user_id = me;

  if found then
    -- Equirectangular approximation; plenty accurate at these distances.
    moved_m := 6371000 * sqrt(
      power(radians(lat - prev.lat), 2) +
      power(radians(lng - prev.lng) * cos(radians((lat + prev.lat) / 2)), 2)
    );
    -- Too soon after the last write, or barely moved and not yet due for a heartbeat.
    -- A first ETA after a destination change always goes through.
    if not (prev.eta_s is null and eta_s is not null) and (
      prev.updated_at > now() - interval '3 seconds'
      or (moved_m < 15 and prev.updated_at > now() - interval '45 seconds')
    ) then
      return result;
    end if;
  end if;

  insert into public.party_locations as l
    (party_id, user_id, lat, lng, accuracy, speed, heading, eta_s, remaining_m, battery, charging, updated_at)
  values (pid, me, lat, lng, accuracy, speed, heading, eta_s, remaining_m, battery, charging, now())
  on conflict (party_id, user_id) do update set
    lat = excluded.lat, lng = excluded.lng, accuracy = excluded.accuracy,
    speed = excluded.speed, heading = excluded.heading,
    eta_s = excluded.eta_s, remaining_m = excluded.remaining_m,
    battery = coalesce(excluded.battery, l.battery), charging = coalesce(excluded.charging, l.charging),
    updated_at = now();
  return result;
end;
$$;

-- Pings and pins are the crew's; a lookout is following along, not on the road.
create or replace function public.send_ping(pid uuid, kind text, message text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  note text := nullif(trim(message), '');
begin
  if kind not in ('chai', 'fuel', 'food', 'wait', 'custom', 'sos') then
    raise exception 'Unknown ping';
  end if;
  if (kind = 'custom') <> (note is not null) then
    raise exception 'custom_needs_message';
  end if;

  if not public.is_live_member(pid, true) then
    raise exception 'not_in_party';
  end if;

  if kind <> 'sos' and exists (
    select 1 from public.party_pings g
    where g.party_id = pid and g.user_id = me and g.kind <> 'behind'
      and g.created_at > now() - interval '15 seconds'
  ) then
    raise exception 'slow_down';
  end if;

  update public.party_pings g set cleared_at = now(), cleared_by = me
  where g.party_id = pid and g.user_id = me and g.cleared_at is null and g.kind not in ('sos', 'behind');

  insert into public.party_pings (party_id, user_id, kind, message)
  values (pid, me, send_ping.kind, left(note, 80));
end;
$$;

create or replace function public.add_pin(
  pid uuid,
  pin_kind text,
  pin_name text,
  pin_lat double precision,
  pin_lng double precision,
  pin_note text default null
)
returns public.party_pins
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  pin public.party_pins;
begin
  if not public.is_live_member(pid, true) then
    raise exception 'not_in_party';
  end if;
  if (select count(*) from public.party_pins where party_id = pid) >= 30 then
    raise exception 'too_many_pins';
  end if;

  insert into public.party_pins (party_id, created_by, kind, name, note, lat, lng)
  values (pid, me, pin_kind, trim(pin_name), nullif(trim(pin_note), ''), pin_lat, pin_lng)
  returning * into pin;
  return pin;
end;
$$;

-- Lookouts get the pushes that matter from afar; chai stops and new pins are crew chatter.
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
    and (m.role = 'crew' or msg_data ->> 'kind' in ('sos', 'sos_cleared', 'arrived', 'behind', 'ended'));

  if jsonb_array_length(messages) > 0 then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := messages,
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
  end if;
end;
$$;

-- The crew always hears when someone starts watching.
create or replace function public.on_member_joined()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  party public.parties;
  who text := public.first_name(new.user_id);
begin
  if new.left_at is not null then
    return null;
  end if;
  -- Rejoins and role switches are news; anything else that touches the row isn't.
  if tg_op = 'UPDATE' and old.left_at is null and old.role = new.role then
    return null;
  end if;
  select * into party from public.parties where id = new.party_id;
  -- The host creating the party isn't news.
  if tg_op = 'INSERT' and new.user_id = party.host_id then
    return null;
  end if;
  if new.role = 'lookout' then
    perform public.push_to_party(
      new.party_id, new.user_id, who || ' is watching ' || party.name,
      'They can see the crew on the map. Their own location isn''t shared.',
      jsonb_build_object('kind', 'lookout')
    );
  else
    perform public.push_to_party(
      new.party_id, new.user_id, who || ' joined ' || party.name,
      'Now on the map with the crew.', jsonb_build_object('kind', 'joined')
    );
  end if;
  return null;
end;
$$;

drop trigger push_member_joined on public.party_members;
create trigger push_member_joined after insert or update of left_at, role on public.party_members
  for each row execute function public.on_member_joined();

-- Hosting means being on the road, so a party passes to someone in the crew.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  hosted record;
  heir uuid;
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  for hosted in select p.id from public.parties p where p.host_id = me loop
    -- Prefer someone still in the party, then whoever joined first.
    select m.user_id into heir from public.party_members m
    where m.party_id = hosted.id and m.user_id <> me and m.role = 'crew'
    order by (m.left_at is null) desc, m.joined_at
    limit 1;
    if heir is not null then
      update public.parties set host_id = heir where id = hosted.id;
    end if;
  end loop;

  delete from auth.users where id = me;
end;
$$;
