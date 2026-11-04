# chalo — website

The site at [chalo.aadijain.dev](https://chalo.aadijain.dev): Next.js (App Router) on Vercel,
Tailwind CSS 4, Motion for animation, MapLibre GL for the watch map.

```bash
cp .env.example .env.local   # Supabase URL + publishable key, contact email
bun install
bun run dev                  # http://localhost:3000
bun run lint && bun run build
```

## Pages

| Route | What |
| --- | --- |
| `/` | The landing page |
| `/download` | The Android app (newest GitHub release's `chalo.apk`) and install help |
| `/download/latest.json` | The newest version; installed apps read it to offer updates |
| `/j/<code>` | Invite links: open the app straight into the party (`?as=lookout` to watch) |
| `/w/<token>` | Watch links: the crew live on a map in the browser, read-only, until the trip ends |
| `/r/<token>` | Recap cards: a stats-only summary of a finished trip, with a preview image for chat apps |
| `/privacy`, `/terms`, `/delete-account` | Legal pages (Google Play links to the first and last) |
| `/reset-password` | Where the app's "forgot password" email lands |

Watch links and recap cards read the database signed out, through the `watch_party()` and
`recap_card()` functions, which only return what's meant to be public (see
[the backend README](../backend/README.md)).

Every branch deploys a Vercel preview; `main` is production. Visits are counted with cookieless
Vercel Web Analytics.
