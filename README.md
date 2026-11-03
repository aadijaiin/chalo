# chalo

Live location sharing for groups. Start a party, and everyone in it shows up on one map with
their own avatar, so on a road trip or a group ride you always know who's ahead and who's behind.

## Repo layout

| Folder | What | Stack |
| --- | --- | --- |
| [`app/`](app) | The product: iOS + Android app | Expo / React Native, MapLibre, Supabase |
| [`backend/`](backend) | Database schema, auth config, migrations | Supabase (free tier) |
| [`web/`](web) | Marketing site, invite / watch / recap links | Next.js |
| [`store/`](store) | Google Play listing graphics and [the publishing guide](store/PLAY_STORE.md) | Pillow script |

Everything runs on free, open-source, or no-card free tiers.

Start with [`backend/README.md`](backend/README.md), then [`app/README.md`](app/README.md).
