-- A custom ping: you write why you're stopping ("Picking up Riya", "ATM run").
-- It behaves like any other status, and the push carries your words.

alter table public.party_pings
  add column message text check (char_length(message) between 1 and 80);

alter table public.party_pings drop constraint party_pings_kind_check;
alter table public.party_pings
  add constraint party_pings_kind_check
  check (kind in ('chai', 'fuel', 'food', 'wait', 'custom', 'sos', 'arrived')),
  add constraint party_pings_custom_has_message check ((kind = 'custom') = (message is not null));

drop function public.send_ping(uuid, text);
create function public.send_ping(pid uuid, kind text, message text default null)
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
    where g.party_id = pid and g.user_id = me and g.created_at > now() - interval '15 seconds'
  ) then
    raise exception 'slow_down';
  end if;

  update public.party_pings g set cleared_at = now(), cleared_by = me
  where g.party_id = pid and g.user_id = me and g.cleared_at is null and g.kind <> 'sos';

  insert into public.party_pings (party_id, user_id, kind, message)
  values (pid, me, send_ping.kind, left(note, 80));
end;
$$;

revoke execute on function public.send_ping(uuid, text, text) from public, anon;
grant execute on function public.send_ping(uuid, text, text) to authenticated;

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
  end case;
  perform public.push_to_party(
    new.party_id, new.user_id, title, body || ' · ' || party.name,
    jsonb_build_object('kind', new.kind), new.kind = 'sos'
  );
  return null;
end;
$$;
