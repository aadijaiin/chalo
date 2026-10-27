-- 1. Parties end on their own, so a forgotten party doesn't keep phones sharing forever:
--    after 24 hours, or after 2 hours with nobody posting a position. A pg_cron job
--    sweeps every 5 minutes; share_location() then returns false and phones stop.
-- 2. parties.ended_reason says why a party ended, so the app can tell people.
-- 3. share_location() skips writes that wouldn't tell anyone anything new (tiny moves
--    shortly after the last post), since every write is fanned out over Realtime to
--    the whole party and counts against the free-tier message quota.

alter table public.parties
  add column ended_reason text check (ended_reason in ('host', 'expired', 'idle'));

update public.parties set ended_reason = 'host' where ended_at is not null;

create or replace function public.end_stale_parties()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  with stale as (
    update public.parties p
    set ended_at = now(),
        ended_reason = case when p.created_at < now() - interval '24 hours' then 'expired' else 'idle' end
    where p.ended_at is null
      and (
        p.created_at < now() - interval '24 hours'
        or coalesce(
          (select max(l.updated_at) from public.party_locations l where l.party_id = p.id),
          p.created_at
        ) < now() - interval '2 hours'
      )
    returning p.id
  )
  delete from public.party_locations l using stale where l.party_id = stale.id;
end;
$$;

revoke execute on function public.end_stale_parties() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
select cron.schedule('end-stale-parties', '*/5 * * * *', 'select public.end_stale_parties()');

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
    where m.user_id = me and m.left_at is null and p.ended_at is null
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

create or replace function public.end_party(pid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.parties set ended_at = now(), ended_reason = 'host'
  where id = pid and host_id = auth.uid() and ended_at is null;
  if not found then
    raise exception 'Only the host can end this party';
  end if;
  delete from public.party_locations where party_id = pid;
end;
$$;

create or replace function public.share_location(
  pid uuid,
  lat double precision,
  lng double precision,
  accuracy real default null,
  speed real default null,
  heading real default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  prev record;
  moved_m double precision;
begin
  if not exists (
    select 1 from public.party_members m
    join public.parties p on p.id = m.party_id
    where m.party_id = pid and m.user_id = me and m.left_at is null and p.ended_at is null
  ) then
    return false;
  end if;

  select l.lat, l.lng, l.updated_at into prev
  from public.party_locations l where l.party_id = pid and l.user_id = me;

  if found then
    -- Equirectangular approximation; plenty accurate at these distances.
    moved_m := 6371000 * sqrt(
      power(radians(lat - prev.lat), 2) +
      power(radians(lng - prev.lng) * cos(radians((lat + prev.lat) / 2)), 2)
    );
    -- Too soon after the last write, or barely moved and not yet due for a heartbeat.
    if prev.updated_at > now() - interval '3 seconds'
       or (moved_m < 15 and prev.updated_at > now() - interval '45 seconds') then
      return true;
    end if;
  end if;

  insert into public.party_locations (party_id, user_id, lat, lng, accuracy, speed, heading, updated_at)
  values (pid, me, lat, lng, accuracy, speed, heading, now())
  on conflict (party_id, user_id) do update set
    lat = excluded.lat, lng = excluded.lng, accuracy = excluded.accuracy,
    speed = excluded.speed, heading = excluded.heading, updated_at = now();
  return true;
end;
$$;
