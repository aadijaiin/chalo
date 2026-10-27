-- A party destination with everyone's ETA to it.
-- The host sets the destination. Each phone routes itself there, tracks its own progress, and
-- posts its ETA and distance left with its location, so ETAs keep coming from locked phones.
-- share_location() now returns the current destination, which is how a phone in the background
-- learns that the host changed it.

alter table public.parties
  add column destination_name text,
  add column destination_lat double precision,
  add column destination_lng double precision,
  add constraint parties_destination_complete check (
    (destination_name is null) = (destination_lat is null)
    and (destination_lat is null) = (destination_lng is null)
  );

alter table public.party_locations
  add column eta_s integer,
  add column remaining_m integer;

-- Pass nulls to clear it.
create function public.set_destination(
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

  -- Old ETAs point at the old destination.
  update public.party_locations set eta_s = null, remaining_m = null where party_id = pid;
  return party;
end;
$$;

revoke execute on function public.set_destination(uuid, text, double precision, double precision) from public, anon;
grant execute on function public.set_destination(uuid, text, double precision, double precision) to authenticated;

-- Returns null when you're no longer live in the party (the phone stops sharing), otherwise
-- {"destination": {"name", "lat", "lng"} | null}. Older app builds read any non-null as "still live".
drop function public.share_location(uuid, double precision, double precision, real, real, real);
create function public.share_location(
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

  result := jsonb_build_object('destination', case when party.destination_name is null then null else
    jsonb_build_object('name', party.destination_name, 'lat', party.destination_lat, 'lng', party.destination_lng)
  end);

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

revoke execute on function public.share_location(uuid, double precision, double precision, real, real, real, integer, integer)
  from public, anon;
grant execute on function public.share_location(uuid, double precision, double precision, real, real, real, integer, integer)
  to authenticated;
