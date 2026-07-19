# M — Personal Assistant App

Personal-use iOS app with a Cloudflare Workers backend and Supabase database.
Sideloaded via Xcode — not distributed on the App Store.

## Repo layout

```
supabase/migrations/0001_init.sql   Full schema (tables + RLS)
backend/                           Cloudflare Worker (TypeScript, Hono, Anthropic SDK)
ios/                                XcodeGen SwiftUI project -> M.xcodeproj
```

## 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run `supabase/migrations/0001_init.sql` in full.
3. From Project Settings → API, copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this secret — server-side only)

RLS is enabled on every table with a single permissive policy for the `anon`
role. This is deliberate for a sideloaded, single-user app that's never
distributed — if you ever share this project or the Supabase instance for
anything else, tighten these policies first (see the migration file's
comment above the RLS block).

## 2. Deploy the backend (Cloudflare Workers)

```sh
cd backend
npm install
cp .dev.vars.example .dev.vars   # fill in for local dev with `wrangler dev`
```

Edit `wrangler.toml`:
- Set `SUPABASE_URL` to your project's URL.
- Adjust the `[triggers] crons` times if you want the nightly jobs (quote,
  news digest, phrase) to land at a different local time — they're defined
  in UTC, staggered 15 minutes apart.

Set the two secrets (never commit these):

```sh
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put SUPABASE_SERVICE_KEY
```

Deploy:

```sh
npx wrangler deploy
```

Note the deployed Worker URL (e.g. `https://m-backend.yourname.workers.dev`)
— you'll paste it into the iOS app's Settings screen.

Local dev: `npm run dev` (uses `.dev.vars`), `npm run typecheck` to type-check
without emitting.

## 3. Build the iOS app

Requires a Mac with Xcode 15+ installed.

```sh
cd ios
xcodegen generate   # regenerates M.xcodeproj from project.yml; only needed
                     # after changing project.yml or adding/removing files
open M.xcodeproj
```

If you don't have XcodeGen installed: `brew install xcodegen`, or download
the prebuilt binary from
[github.com/yonaskolb/XcodeGen/releases](https://github.com/yonaskolb/XcodeGen/releases).

In Xcode:
1. Select your development team under the M target's Signing & Capabilities.
2. Build and run on your device (sideload) or the simulator.
3. On first launch, go to Settings and fill in:
   - **Worker URL** — the Cloudflare Worker URL from step 2.
   - **Supabase Project URL** and **anon key** — from step 1. The app uses
     these directly for plain CRUD (goals, tasks, calendar, rituals,
     reading, screen time, HIIT, and history lists); the Worker holds the
     Anthropic key and handles chat, goal planning, fast-path logging, and
     the news digest.

The active language for the daily phrase feature starts as **Farsi** (seeded
by the migration). Switch it any time from Settings — the next nightly run
picks up the new language.

## Architecture notes

- **Model routing**: Haiku 4.5 handles chat, logging, quotes, and phrases
  (the bulk of usage). Sonnet 5 handles goal breakdown and the news digest
  (`/create-goal`, and the nightly `generateNewsDigest` job), which need
  stronger synthesis. Monthly progress reviews can route to Sonnet by
  sending `{"mode": "monthly_review"}` to `/chat`.
- **Two additions beyond the original spec's schema**, both required for
  functionality the spec describes but doesn't give a table for:
  - `rolling_summary` — a single row upserted nightly with a summary of
    recent activity, injected into the chat system prompt for cheap context.
  - `chat_messages` — persisted chat transcript (role, content, timestamp).
- **Data access split**: the Worker exposes exactly the 7 endpoints from the
  spec (`/chat`, `/log-sleep`, `/log-meal`, `/log-workout`, `/create-goal`,
  `/get-progress`, `/get-news-digest`). Everything else (goals list, tasks,
  calendar, rituals, reading, screen time, sleep/meal/workout history, HIIT
  logging) is direct Supabase CRUD from the iOS app via `supabase-swift`,
  using the anon key.
- **Ritual occurrences**: there's no server-side scheduler that creates
  `ritual_logs` rows ahead of time. The iOS app creates a ritual's log row
  for the current period (day/week/month) lazily, the first time the
  Rituals screen is opened for that period.
- **HIIT timer** is fully local — no network calls except the final
  "log session" write to `hiit_sessions` once a session completes.

## Known limitations / what to verify yourself

This was scaffolded in an environment without a full Xcode install (no iOS
SDK), so Swift files were only syntax-checked (`swiftc -parse`), not
type-checked or compiled against UIKit/SwiftUI/the `supabase-swift` package.
Before relying on it:

1. Open `M.xcodeproj` in Xcode and build — resolve any Swift Package
   Manager or type-checking issues that require the real SDK to surface.
2. Exercise each tab end-to-end against a real Supabase project + deployed
   Worker: check-in, chat (goal creation via tool use), calendar, rituals,
   HIIT timer, trackers, news digest, and the language switcher.
3. Confirm the nightly cron times in `backend/wrangler.toml` actually land
   when you want them, in your timezone.
