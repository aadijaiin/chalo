-- Recap cards: a jump between trail points faster than anything on the road (70 m/s, the same
-- limit the app uses) is a GPS glitch, not distance travelled. Without this a bad fix (after a
-- tunnel, or a network position) inflates the trip's kilometres.

create or replace function public.recap_card(token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with party as (
    select * from public.parties p where p.recap_token = recap_card.token and p.ended_at is not null
  ),
  shown as (
    select m.user_id from public.party_members m
    where m.party_id = (select id from party) and m.role = 'crew' and not m.hidden_from_lookouts
  ),
  points as (
    select t.user_id, t.at, t.speed,
      6371000 * sqrt(
        power(radians(t.lat - lag(t.lat) over w), 2) +
        power(radians(t.lng - lag(t.lng) over w) * cos(radians((t.lat + lag(t.lat) over w) / 2)), 2)
      ) as step_m,
      extract(epoch from t.at - lag(t.at) over w) as step_s
    from public.party_track_points t
    where t.party_id = (select id from party) and t.user_id in (select user_id from shown)
    window w as (partition by t.user_id order by t.id)
  ),
  steps as (
    select user_id, at, speed,
      case when step_s > 0 and step_m / step_s <= 70 then step_m else 0 end as step_m
    from points
  ),
  per_member as (
    select user_id,
      coalesce(sum(step_m), 0) as distance_m,
      coalesce(max(speed) filter (where speed < 70), 0) as top_ms,
      extract(epoch from max(at) - min(at)) as duration_s
    from steps group by user_id
  )
  select jsonb_build_object(
    'name', party.name,
    'destination', party.destination_name,
    'startedAt', party.created_at,
    'endedAt', party.ended_at,
    'totalM', coalesce((select sum(distance_m) from per_member), 0),
    'durationS', coalesce((select max(duration_s) from per_member), 0),
    'crew', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', coalesce(nullif(split_part(pr.full_name, ' ', 1), ''), pr.username),
        'avatarStyle', pr.avatar_style,
        'avatarSeed', pr.avatar_seed,
        'distanceM', round(pm.distance_m),
        'topKmh', round(pm.top_ms * 3.6)
      ) order by pm.distance_m desc)
      from per_member pm join public.profiles pr on pr.id = pm.user_id
    ), '[]'::jsonb)
  )
  from party;
$$;
