-- 1. Trip recap: share_location() keeps a breadcrumb trail per member (a point every ~100 m
--    or 5 minutes), so a finished party can show everyone's route, distance and top speed.
-- 2. Battery: phones post their battery level and whether they're charging, so the crew can
--    tell "Aadi's phone is dying" apart from "Aadi is ignoring us".
-- 3. Fairer fell-behind: people start from different places, so being far from the lead at
--    the start isn't falling behind. Each member's gap to the lead is remembered the first
--    time it's known, and only growth beyond that (5 km on, 3 km off) counts.

create table public.party_track_points (
  id bigint generated always as identity primary key,
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  speed real,
  at timestamptz not null default now()
);

create index party_track_points_member on public.party_track_points (party_id, user_id, id desc);

alter table public.party_track_points enable row level security;

create policy "Members can see their party's trails"
  on public.party_track_points for select
  to authenticated
  using (public.is_party_member(party_id));

alter table public.party_locations
  add column battery real check (battery between 0 and 1),
  add column charging boolean,
  add column gap_base_m integer;

drop function public.share_location(uuid, double precision, double precision, real, real, real, integer, integer);
create function public.share_location(
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

revoke execute on function public.share_location(uuid, double precision, double precision, real, real, real, integer, integer, real, boolean)
  from public, anon;
grant execute on function public.share_location(uuid, double precision, double precision, real, real, real, integer, integer, real, boolean)
  to authenticated;

create or replace function public.on_gap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lead_m integer;
  gap integer;
  grown integer;
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

  -- Remember where you started relative to the lead. This doesn't touch remaining_m, so it
  -- doesn't fire this trigger again.
  if new.gap_base_m is null then
    update public.party_locations set gap_base_m = gap
    where party_id = new.party_id and user_id = new.user_id;
    new.gap_base_m := gap;
  end if;
  -- Starting behind doesn't count against you; starting ahead and dropping back does.
  grown := gap - greatest(new.gap_base_m, 0);

  select g.id into current_id from public.party_pings g
  where g.party_id = new.party_id and g.user_id = new.user_id and g.kind = 'behind' and g.cleared_at is null
  order by g.created_at desc limit 1;

  if grown >= 5000 and current_id is null and not exists (
    -- Don't re-announce someone who just caught up and slipped back.
    select 1 from public.party_pings g
    where g.party_id = new.party_id and g.user_id = new.user_id and g.kind = 'behind'
      and g.created_at > now() - interval '20 minutes'
  ) then
    insert into public.party_pings (party_id, user_id, kind, message)
    values (new.party_id, new.user_id, 'behind', round(gap / 1000.0) || ' km');
  elsif grown < 3000 and current_id is not null then
    update public.party_pings set cleared_at = now(), cleared_by = new.user_id where id = current_id;
  end if;
  return null;
end;
$$;

-- A new destination resets everyone's ETAs, gap baselines and fell-behind statuses.
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

  update public.party_locations set eta_s = null, remaining_m = null, gap_base_m = null where party_id = pid;
  update public.party_pings set cleared_at = now(), cleared_by = auth.uid()
  where party_id = pid and kind = 'behind' and cleared_at is null;
  return party;
end;
$$;

-- Trails are only for recaps; keep a month of them.
select cron.schedule('prune-track-points', '17 3 * * *',
  $cron$delete from public.party_track_points where at < now() - interval '30 days'$cron$);
