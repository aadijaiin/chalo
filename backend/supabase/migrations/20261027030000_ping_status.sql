-- Pings become statuses you can end: a chai stop is over, an SOS was a mistake.
-- A ping stays your status until you clear it, send another one, or it expires
-- (the app decides how long each kind lasts). Clearing an SOS tells everyone you're OK.
-- Also drops the emojis from push titles; the app shows icons instead.

alter table public.party_pings
  add column cleared_at timestamptz,
  add column cleared_by uuid references public.profiles (id) on delete set null;

-- A new ping replaces your previous status. An SOS stays until it's cleared on purpose.
create or replace function public.send_ping(pid uuid, kind text)
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

  update public.party_pings g set cleared_at = now(), cleared_by = me
  where g.party_id = pid and g.user_id = me and g.cleared_at is null and g.kind <> 'sos';

  insert into public.party_pings (party_id, user_id, kind) values (pid, me, send_ping.kind);
end;
$$;

-- Your own status, or anyone's if you're the host.
create function public.clear_ping(ping_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  update public.party_pings g set cleared_at = now(), cleared_by = me
  from public.parties p
  where g.id = ping_id and p.id = g.party_id and g.cleared_at is null
    and (g.user_id = me or p.host_id = me);
  if not found then
    raise exception 'ping_not_found';
  end if;
end;
$$;

revoke execute on function public.clear_ping(bigint) from public, anon;
grant execute on function public.clear_ping(bigint) to authenticated;

create function public.on_ping_cleared()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  who text := public.first_name(new.user_id);
  party public.parties;
begin
  if new.kind <> 'sos' or old.cleared_at is not null or new.cleared_at is null then
    return null;
  end if;
  select * into party from public.parties where id = new.party_id;
  perform public.push_to_party(
    new.party_id, new.cleared_by, 'SOS cancelled',
    case when new.cleared_by = new.user_id
      then who || ' is OK and cancelled the SOS'
      else public.first_name(new.cleared_by) || ' cleared ' || who || '''s SOS'
    end || ' · ' || party.name,
    jsonb_build_object('kind', 'sos_cleared')
  );
  return null;
end;
$$;

create trigger push_ping_cleared after update of cleared_at on public.party_pings
  for each row execute function public.on_ping_cleared();

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
    when 'sos' then title := 'SOS from ' || who; body := who || ' needs help. Open chalo to see where they are.';
    when 'arrived' then title := who || ' arrived'; body := 'at ' || coalesce(party.destination_name, 'the destination');
  end case;
  perform public.push_to_party(
    new.party_id, new.user_id, title, body || ' · ' || party.name,
    jsonb_build_object('kind', new.kind), new.kind = 'sos'
  );
  return null;
end;
$$;
