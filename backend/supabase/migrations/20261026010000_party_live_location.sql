-- Live location rides on a private Realtime channel per party ("party:<id>").
-- Positions are never stored: each member tracks their latest fix as Presence
-- state, so late joiners get everyone's position on connect and a member
-- vanishes when their app disconnects. These policies make sure only current
-- members of a live party can listen or publish on its channel.

create function public.can_share_in_party(topic text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.party_members m
    join public.parties p on p.id = m.party_id
    where 'party:' || m.party_id::text = topic
      and m.user_id = (select auth.uid())
      and m.left_at is null
      and p.ended_at is null
  );
$$;

create policy "Party members can listen"
  on realtime.messages for select
  to authenticated
  using (
    realtime.messages.extension in ('broadcast', 'presence')
    and public.can_share_in_party((select realtime.topic()))
  );

create policy "Party members can publish"
  on realtime.messages for insert
  to authenticated
  with check (
    realtime.messages.extension in ('broadcast', 'presence')
    and public.can_share_in_party((select realtime.topic()))
  );
