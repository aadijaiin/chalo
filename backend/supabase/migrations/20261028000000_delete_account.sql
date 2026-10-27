-- Deleting your account from inside the app (the Play Store requires it).
-- Removing the auth user cascades to the profile and from there to everything that's yours:
-- live location, trail, memberships, pings, push tokens; pins you dropped stay, unattributed.
-- Parties you host would cascade too, wiping them for everyone else, so first each one is
-- handed to the member who's been in it longest. Parties with nobody else in them go.

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  hosted record;
  heir uuid;
begin
  if me is null then
    raise exception 'Not signed in';
  end if;

  for hosted in select p.id from public.parties p where p.host_id = me loop
    -- Prefer someone still in the party, then whoever joined first.
    select m.user_id into heir from public.party_members m
    where m.party_id = hosted.id and m.user_id <> me
    order by (m.left_at is null) desc, m.joined_at
    limit 1;
    if heir is not null then
      update public.parties set host_id = heir where id = hosted.id;
    end if;
  end loop;

  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
