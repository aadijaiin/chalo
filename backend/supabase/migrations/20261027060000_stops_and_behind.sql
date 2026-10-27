-- 1. Stops on everyone's route. Every 'stop' pin is a waypoint on the way to the destination;
--    share_location() now returns them with the destination, so a locked phone keeps its
--    route in step with the plan. Each phone decides which stops are still ahead of it.
-- 2. Fallen-behind alerts. When a member's distance left to the destination is 5 km or more
--    behind the lead, they get an automatic 'behind' status and the party gets a push. It
--    clears itself once they're within 3 km (the gap keeps it from flapping).

create or replace function public.share_location(
  pid uuid,
  lat double precision,
  lng double precision,
  accuracy real default null,
  speed real default null,
  heading real default null,
  eta_s integer default null,
  remaining_m integer default null
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
  moved_m double precision;
  result jsonb;
begin
  select p.* into party from public.party_members m
  join public.parties p on p.id = m.party_id
  where m.party_id = pid and m.user_id = me and m.left_at is null and p.ended_at is null;

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
    (party_id, user_id, lat, lng, accuracy, speed, heading, eta_s, remaining_m, updated_at)
  values (pid, me, lat, lng, accuracy, speed, heading, eta_s, remaining_m, now())
  on conflict (party_id, user_id) do update set
    lat = excluded.lat, lng = excluded.lng, accuracy = excluded.accuracy,
    speed = excluded.speed, heading = excluded.heading,
    eta_s = excluded.eta_s, remaining_m = excluded.remaining_m, updated_at = now();
  return result;
end;
$$;

-- 'behind' is set and cleared by the server; its message holds the gap, e.g. "6 km".
alter table public.party_pings drop constraint party_pings_kind_check;
alter table public.party_pings drop constraint party_pings_custom_has_message;
alter table public.party_pings
  add constraint party_pings_kind_check
  check (kind in ('chai', 'fuel', 'food', 'wait', 'custom', 'sos', 'arrived', 'behind')),
  add constraint party_pings_custom_has_message check (kind <> 'custom' or message is not null);

-- Sending a ping replaces your previous status, but not an SOS and not a 'behind' the server
-- set: clearing that would only have it set again (and pushed again) on your next update.
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

  if not exists (
    select 1 from public.party_members m
    join public.parties p on p.id = m.party_id
    where m.party_id = pid and m.user_id = me and m.left_at is null and p.ended_at is null
  ) then
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

create or replace function public.on_ping()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  who text := public.first_name(new.user_id);
  party public.parties;
  title text;
  body text;
begin
  select * into party from public.parties where id = new.party_id;
  case new.kind
    when 'chai' then title := 'Chai stop'; body := who || ' wants a chai stop';
    when 'fuel' then title := 'Fuel stop'; body := who || ' needs fuel';
    when 'food' then title := 'Food break'; body := who || ' is hungry';
    when 'wait' then title := 'Wait up'; body := who || ' asked everyone to wait up';
    when 'custom' then title := who || ' is stopping'; body := new.message;
    when 'sos' then title := 'SOS from ' || who; body := who || ' needs help. Open chalo to see where they are.';
    when 'arrived' then title := who || ' arrived'; body := 'at ' || coalesce(party.destination_name, 'the destination');
    when 'behind' then title := who || ' fell behind'; body := coalesce(new.message, 'Far') || ' behind the group';
  end case;
  perform public.push_to_party(
    new.party_id, new.user_id, title, body || ' · ' || party.name,
    jsonb_build_object('kind', new.kind), new.kind = 'sos'
  );
  return null;
end;
$$;

create function public.on_gap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lead_m integer;
  gap integer;
  current_id bigint;
begin
  if new.remaining_m is null then
    return null;
  end if;

  -- The lead is whoever else is closest to the destination, among those still reporting.
  select min(l.remaining_m) into lead_m
  from public.party_locations l
  where l.party_id = new.party_id and l.user_id <> new.user_id
    and l.remaining_m is not null and l.updated_at > now() - interval '10 minutes';
  if lead_m is null then
    return null;
  end if;
  gap := new.remaining_m - lead_m;

  select g.id into current_id from public.party_pings g
  where g.party_id = new.party_id and g.user_id = new.user_id and g.kind = 'behind' and g.cleared_at is null
  order by g.created_at desc limit 1;

  if gap >= 5000 and current_id is null and not exists (
    -- Don't re-announce someone who just caught up and slipped back.
    select 1 from public.party_pings g
    where g.party_id = new.party_id and g.user_id = new.user_id and g.kind = 'behind'
      and g.created_at > now() - interval '20 minutes'
  ) then
    insert into public.party_pings (party_id, user_id, kind, message)
    values (new.party_id, new.user_id, 'behind', round(gap / 1000.0) || ' km');
  elsif gap < 3000 and current_id is not null then
    update public.party_pings set cleared_at = now(), cleared_by = new.user_id where id = current_id;
  end if;
  return null;
end;
$$;

create trigger detect_gap after insert or update of remaining_m on public.party_locations
  for each row execute function public.on_gap();
