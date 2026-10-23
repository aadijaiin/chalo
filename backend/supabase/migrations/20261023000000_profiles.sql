-- Public profile for every auth user. Filled automatically from the metadata
-- the app sends at sign up (full_name, username, avatar_style, avatar_seed).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  full_name text not null default '',
  avatar_style text not null default 'adventurer',
  avatar_seed text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Any signed-in user can see profiles (needed to render party members' avatars).
create policy "Profiles are visible to signed-in users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_style, avatar_seed)
  values (
    new.id,
    lower(new.raw_user_meta_data ->> 'username'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_style', 'adventurer'),
    coalesce(new.raw_user_meta_data ->> 'avatar_seed', new.id::text)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
