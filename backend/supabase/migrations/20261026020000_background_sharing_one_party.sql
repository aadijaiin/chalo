-- 1. Background-safe location sharing.
--    Presence needs an open websocket, which phones suspend in the background.
--    Instead each member's latest fix lives in one row (overwritten in place,
--    deleted when they leave or the party ends), written over plain HTTP by
--    share_location() and streamed to the others via Realtime postgres_changes.
-- 2. One live party per person: create/join refuse while you're in another
--    live party unless the app passes replace_current after asking you.

-- Presence channel auth from the previous migration is no longer used.
drop policy if exists "Party members can listen" on realtime.messages;
drop policy if exists "Party members can publish" on realtime.messages;
drop function if exists public.can_share_in_party(text);

create table public.party_locations (
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy real,
  speed real,
  heading real,
  updated_at timestamptz not null default now(),
  primary key (party_id, user_id)
);

alter table public.party_locations enable row level security;
-- Deletes must carry party_id so Realtime's party filter can route them.
alter table public.party_locations replica identity full;

create policy "Members can see each other's location"
  on public.party_locations for select
  to authenticated
  using (public.is_party_member(party_id));

alter publication supabase_realtime add table public.party_locations;

-- Returns false when you're no longer an active member of a live party, which
-- tells the background task to stop.
create function public.share_location(
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
begin
  if not exists (
    select 1 from public.party_members m
    join public.parties p on p.id = m.party_id
    where m.party_id = pid and m.user_id = me and m.left_at is null and p.ended_at is null
  ) then
    return false;
  end if;

  insert into public.party_locations (party_id, user_id, lat, lng, accuracy, speed, heading, updated_at)
  values (pid, me, lat, lng, accuracy, speed, heading, now())
  on conflict (party_id, user_id) do update set
    lat = excluded.lat, lng = excluded.lng, accuracy = excluded.accuracy,
    speed = excluded.speed, heading = excluded.heading, updated_at = now();
  return true;
end;
$$;

-- Ends the parties you host and leaves the ones you don't, except `keep`.
create function public.release_live_parties(me uuid, keep uuid default null)
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
      update public.parties set ended_at = now() where id = current.id;
      delete from public.party_locations where party_id = current.id;
    else
      update public.party_members set left_at = now() where party_id = current.id and user_id = me;
      delete from public.party_locations where party_id = current.id and user_id = me;
    end if;
  end loop;
end;
$$;

-- Raises in_another_party (with the party's name in DETAIL and host/member in
-- HINT) when you're already live somewhere other than `keep`.
create function public.assert_free_for_party(me uuid, keep uuid default null)
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
  where m.user_id = me and m.left_at is null and p.ended_at is null
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

drop function public.create_party(text);
create function public.create_party(party_name text, replace_current boolean default false)
returns public.parties
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  party public.parties;
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  if replace_current then
    perform public.release_live_parties(me);
  else
    perform public.assert_free_for_party(me);
  end if;

  insert into public.parties (code, name, host_id)
  values (public.generate_party_code(), trim(party_name), me)
  returning * into party;

  insert into public.party_members (party_id, user_id) values (party.id, me);
  return party;
end;
$$;

drop function public.join_party(text);
create function public.join_party(party_code text, replace_current boolean default false)
returns public.parties
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  party public.parties;
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  select * into party from public.parties
  where code = upper(trim(party_code)) and ended_at is null;

  if party.id is null then
    raise exception 'party_not_found' using errcode = 'P0002';
  end if;

  if replace_current then
    perform public.release_live_parties(me, party.id);
  else
    perform public.assert_free_for_party(me, party.id);
  end if;

  insert into public.party_members (party_id, user_id) values (party.id, me)
  on conflict (party_id, user_id) do update set left_at = null, joined_at = now()
  where public.party_members.left_at is not null;

  return party;
end;
$$;

create or replace function public.leave_party(pid uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.party_members set left_at = now()
  where party_id = pid and user_id = (select auth.uid()) and left_at is null;
  delete from public.party_locations where party_id = pid and user_id = (select auth.uid());
$$;

create or replace function public.end_party(pid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.parties set ended_at = now()
  where id = pid and host_id = auth.uid() and ended_at is null;
  if not found then
    raise exception 'Only the host can end this party';
  end if;
  delete from public.party_locations where party_id = pid;
end;
$$;

revoke execute on function public.release_live_parties(uuid, uuid), public.assert_free_for_party(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function public.create_party(text, boolean), public.join_party(text, boolean),
  public.share_location(uuid, double precision, double precision, real, real, real) from public, anon;
grant execute on function public.create_party(text, boolean), public.join_party(text, boolean),
  public.share_location(uuid, double precision, double precision, real, real, real) to authenticated;
