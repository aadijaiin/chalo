-- Pings and push notifications.
-- Members send one-tap pings (chai, fuel, food, wait up, SOS). Every ping lands in
-- party_pings, which open apps get over Realtime, and triggers a push to everyone else in
-- the party through Expo's push service. Joins, arrivals and the party ending push too.
-- Pushes go straight from Postgres with pg_net, so there's no Edge Function to deploy.

create extension if not exists pg_net with schema extensions;

-- One row per device. A token moves to whoever signs in on that device last.
create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('android', 'ios')),
  updated_at timestamptz not null default now()
);

-- No policies: only the RPCs below touch it, and nobody can read anyone's tokens.
alter table public.push_tokens enable row level security;

create function public.register_push_token(token text, platform text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (token, (select auth.uid()), platform, now())
  on conflict on constraint push_tokens_pkey do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
$$;

create function public.unregister_push_token(token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_tokens t where t.token = unregister_push_token.token and t.user_id = (select auth.uid());
$$;

create table public.party_pings (
  id bigint generated always as identity primary key,
  party_id uuid not null references public.parties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('chai', 'fuel', 'food', 'wait', 'sos', 'arrived')),
  created_at timestamptz not null default now()
);

create index party_pings_party_created on public.party_pings (party_id, created_at desc);

alter table public.party_pings enable row level security;

create policy "Members can see their party's pings"
  on public.party_pings for select
  to authenticated
  using (public.is_party_member(party_id));

alter publication supabase_realtime add table public.party_pings;

-- Raises slow_down when you pinged under 15 s ago (SOS always goes through).
create function public.send_ping(pid uuid, kind text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if kind not in ('chai', 'fuel', 'food', 'wait', 'sos') then
    raise exception 'Unknown ping';
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
    where g.party_id = pid and g.user_id = me and g.created_at > now() - interval '15 seconds'
  ) then
    raise exception 'slow_down';
  end if;

  insert into public.party_pings (party_id, user_id, kind) values (pid, me, send_ping.kind);
end;
$$;

revoke execute on function public.register_push_token(text, text), public.unregister_push_token(text),
  public.send_ping(uuid, text) from public, anon;
grant execute on function public.register_push_token(text, text), public.unregister_push_token(text),
  public.send_ping(uuid, text) to authenticated;

-- Pushes to every active member's devices except `skip`'s.
create function public.push_to_party(
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
  where m.party_id = pid and m.left_at is null and t.user_id is distinct from skip;

  if jsonb_array_length(messages) > 0 then
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := messages,
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
  end if;
end;
$$;

create function public.first_name(uid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(split_part(p.full_name, ' ', 1), ''), p.username) from public.profiles p where p.id = uid;
$$;

revoke execute on function public.push_to_party(uuid, uuid, text, text, jsonb, boolean), public.first_name(uuid)
  from public, anon, authenticated;

create function public.on_ping()
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
    when 'chai' then title := '☕ Chai stop'; body := who || ' wants a chai stop';
    when 'fuel' then title := '⛽ Fuel stop'; body := who || ' needs fuel';
    when 'food' then title := '🍽️ Food break'; body := who || ' is hungry';
    when 'wait' then title := '✋ Wait up'; body := who || ' asked everyone to wait up';
    when 'sos' then title := '🆘 SOS from ' || who; body := who || ' needs help. Open chalo to see where they are.';
    when 'arrived' then title := '🏁 ' || who || ' arrived'; body := 'at ' || coalesce(party.destination_name, 'the destination');
  end case;
  perform public.push_to_party(
    new.party_id, new.user_id, title, body || ' · ' || party.name,
    jsonb_build_object('kind', new.kind), new.kind = 'sos'
  );
  return null;
end;
$$;

create trigger push_ping after insert on public.party_pings
  for each row execute function public.on_ping();

-- Someone joined (or rejoined).
create function public.on_member_joined()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  party public.parties;
begin
  if new.left_at is not null or (tg_op = 'UPDATE' and old.left_at is null) then
    return null;
  end if;
  select * into party from public.parties where id = new.party_id;
  -- The host creating the party isn't news.
  if tg_op = 'INSERT' and new.user_id = party.host_id then
    return null;
  end if;
  perform public.push_to_party(
    new.party_id, new.user_id, public.first_name(new.user_id) || ' joined ' || party.name,
    'Now on the map with the crew.', jsonb_build_object('kind', 'joined')
  );
  return null;
end;
$$;

create trigger push_member_joined after insert or update of left_at on public.party_members
  for each row execute function public.on_member_joined();

create function public.on_party_ended()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.ended_at is not null or new.ended_at is null then
    return null;
  end if;
  perform public.push_to_party(
    new.id,
    case when new.ended_reason = 'host' then new.host_id end,
    new.name || ' has ended',
    case new.ended_reason
      when 'expired' then 'It ended automatically after 24 hours. Location sharing has stopped.'
      when 'idle' then 'It ended after 2 hours with nobody sharing. Location sharing has stopped.'
      else 'The host ended it. Location sharing has stopped.'
    end,
    jsonb_build_object('kind', 'ended')
  );
  return null;
end;
$$;

create trigger push_party_ended after update of ended_at on public.parties
  for each row execute function public.on_party_ended();

-- A phone reports 0 m left when it's within reach of the destination. Announce it once;
-- GPS wobbling at the edge mustn't re-announce.
create function public.on_arrival()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.remaining_m is distinct from 0
     or (tg_op = 'UPDATE' and old.remaining_m is not distinct from 0) then
    return null;
  end if;
  if exists (
    select 1 from public.party_pings g
    where g.party_id = new.party_id and g.user_id = new.user_id and g.kind = 'arrived'
      and g.created_at > now() - interval '30 minutes'
  ) then
    return null;
  end if;
  insert into public.party_pings (party_id, user_id, kind) values (new.party_id, new.user_id, 'arrived');
  return null;
end;
$$;

create trigger announce_arrival after insert or update of remaining_m on public.party_locations
  for each row execute function public.on_arrival();
