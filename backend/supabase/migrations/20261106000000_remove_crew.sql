-- The host can remove anyone from the party, not just lookouts. Anyone with the code can join the
-- crew and see everyone's live location, so the host needs a way to take someone back off.
-- Removing someone ends their sharing (their position comes off the map, and their phone stops on
-- its next update), cuts off their view of the party, and blocks them from rejoining it in either
-- role (join_party already refuses anyone marked removed). They get a push saying so.

create function public.remove_member(pid uuid, uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  party public.parties;
begin
  select * into party from public.parties p where p.id = pid and p.host_id = auth.uid();
  if party.id is null then
    raise exception 'Only the host can remove someone';
  end if;
  if uid = party.host_id then
    raise exception 'cannot_remove_host';
  end if;

  update public.party_members set left_at = now(), removed = true
  where party_id = pid and user_id = uid and left_at is null;
  if not found then
    return;
  end if;
  delete from public.party_locations where party_id = pid and user_id = uid;
  -- Their statuses (a chai stop, an SOS) would otherwise linger on everyone's map.
  update public.party_pings set cleared_at = now(), cleared_by = auth.uid()
  where party_id = pid and user_id = uid and cleared_at is null;

  if party.ended_at is null then
    perform public.push_to_user(
      uid, 'You were removed from ' || party.name,
      'The host removed you. Location sharing with this party has stopped.',
      jsonb_build_object('kind', 'removed', 'partyId', pid)
    );
  end if;
end;
$$;

revoke execute on function public.remove_member(uuid, uuid) from public, anon;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
