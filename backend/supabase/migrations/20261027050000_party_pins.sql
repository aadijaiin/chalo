-- Shared pins on the party map: stops along the way, meetup points, and notes.
-- Anyone in a live party can drop one; you can edit or remove your own, the host can
-- manage all of them. Adding a stop or a meetup pushes to everyone else.

create table public.party_pins (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  kind text not null check (kind in ('stop', 'meetup', 'note')),
  name text not null check (char_length(name) between 1 and 60),
  note text check (char_length(note) <= 200),
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index party_pins_party on public.party_pins (party_id);

alter table public.party_pins enable row level security;
-- Deletes must carry party_id so Realtime's party filter can route them.
alter table public.party_pins replica identity full;

create policy "Members can see their party's pins"
  on public.party_pins for select
  to authenticated
  using (public.is_party_member(party_id));

alter publication supabase_realtime add table public.party_pins;

create function public.add_pin(
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
  if not exists (
    select 1 from public.party_members m
    join public.parties p on p.id = m.party_id
    where m.party_id = pid and m.user_id = me and m.left_at is null and p.ended_at is null
  ) then
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

-- Yours, or any pin if you host the party.
create function public.can_edit_pin(pin_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.party_pins g
    join public.parties p on p.id = g.party_id
    where g.id = pin_id and p.ended_at is null
      and (g.created_by = (select auth.uid()) or p.host_id = (select auth.uid()))
  );
$$;

create function public.update_pin(pin_id uuid, pin_kind text, pin_name text, pin_note text default null)
returns public.party_pins
language plpgsql
security definer
set search_path = ''
as $$
declare
  pin public.party_pins;
begin
  if not public.can_edit_pin(pin_id) then
    raise exception 'pin_not_yours';
  end if;
  update public.party_pins
  set kind = pin_kind, name = trim(pin_name), note = nullif(trim(pin_note), ''), updated_at = now()
  where id = pin_id
  returning * into pin;
  return pin;
end;
$$;

create function public.remove_pin(pin_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_edit_pin(pin_id) then
    raise exception 'pin_not_yours';
  end if;
  delete from public.party_pins where id = pin_id;
end;
$$;

revoke execute on function public.add_pin(uuid, text, text, double precision, double precision, text),
  public.update_pin(uuid, text, text, text), public.remove_pin(uuid), public.can_edit_pin(uuid)
  from public, anon;
grant execute on function public.add_pin(uuid, text, text, double precision, double precision, text),
  public.update_pin(uuid, text, text, text), public.remove_pin(uuid), public.can_edit_pin(uuid)
  to authenticated;

create function public.on_pin_added()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  party public.parties;
begin
  if new.kind = 'note' then
    return null;
  end if;
  select * into party from public.parties where id = new.party_id;
  perform public.push_to_party(
    new.party_id, new.created_by,
    public.first_name(new.created_by) || case new.kind when 'meetup' then ' set a meetup point' else ' added a stop' end,
    new.name || coalesce(' · ' || new.note, '') || ' · ' || party.name,
    jsonb_build_object('kind', 'pin', 'pinId', new.id)
  );
  return null;
end;
$$;

create trigger push_pin_added after insert on public.party_pins
  for each row execute function public.on_pin_added();
