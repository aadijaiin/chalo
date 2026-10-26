-- Parties: a host starts one, shares a 6-character code, and friends join with it.
-- All writes go through the RPCs at the bottom so codes and membership rules are
-- enforced on the server; the tables themselves are read-only to clients.

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  name text not null check (char_length(name) between 1 and 40),
  host_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create table public.party_members (
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (party_id, user_id)
);

create index party_members_user_idx on public.party_members (user_id);

alter table public.parties enable row level security;
alter table public.party_members enable row level security;

-- Security definer so the party_members policy can check membership without
-- recursing into its own policy.
create function public.is_party_member(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.party_members
    where party_id = pid and user_id = (select auth.uid())
  );
$$;

create policy "Members can see their parties"
  on public.parties for select
  to authenticated
  using (public.is_party_member(id));

create policy "Members can see each other"
  on public.party_members for select
  to authenticated
  using (public.is_party_member(party_id));

-- Unambiguous alphabet: no 0/O, 1/I/L.
create function public.generate_party_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text;
begin
  loop
    result := '';
    for i in 1..6 loop
      result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.parties where code = result);
  end loop;
  return result;
end;
$$;

create function public.create_party(party_name text)
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

  insert into public.parties (code, name, host_id)
  values (public.generate_party_code(), trim(party_name), me)
  returning * into party;

  insert into public.party_members (party_id, user_id) values (party.id, me);
  return party;
end;
$$;

create function public.join_party(party_code text)
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

  -- Rejoining after leaving brings you back in.
  insert into public.party_members (party_id, user_id) values (party.id, me)
  on conflict (party_id, user_id) do update set left_at = null, joined_at = now()
  where public.party_members.left_at is not null;

  return party;
end;
$$;

create function public.leave_party(pid uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.party_members set left_at = now()
  where party_id = pid and user_id = (select auth.uid()) and left_at is null;
$$;

create function public.end_party(pid uuid)
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
end;
$$;

revoke execute on function public.generate_party_code() from public, anon, authenticated;
revoke execute on function public.create_party(text), public.join_party(text),
  public.leave_party(uuid), public.end_party(uuid) from public, anon;
grant execute on function public.create_party(text), public.join_party(text),
  public.leave_party(uuid), public.end_party(uuid) to authenticated;

-- Lobbies update live as people join, leave, or the host ends the party.
alter publication supabase_realtime add table public.parties, public.party_members;
