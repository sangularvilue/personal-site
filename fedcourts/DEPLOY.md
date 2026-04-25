# Deploying fedcourts.grannis.xyz

End-to-end checklist to get the subdomain live on the existing Vercel + Cloudflare setup, using the existing Upstash Redis (no new infra).

## 0. Prereqs

- The `Website` repo is already deployed to Vercel and connected to your domain.
- You have an Upstash Redis instance (the same one used for posts/crafts).
- DNS for `grannis.xyz` is on Cloudflare.

## 1. Environment variables (Vercel)

Open the Vercel project → **Settings** → **Environment Variables**. Confirm these already exist (from your existing site):

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ADMIN_SECRET` (used for admin JWT)

Add these new ones for fedcourts (Production + Preview):

- `FC_SECRET` — a random 32+ char string for fedcourts JWT signing.
  ```
  openssl rand -hex 32
  ```
- `FC_ADMINS` — comma-separated list of usernames who can use `/admin`. Default: `will,maddie`.

## 2. Cloudflare DNS

Add a CNAME record for `fedcourts`:

| Type  | Name      | Target               | Proxy status |
|-------|-----------|----------------------|--------------|
| CNAME | fedcourts | cname.vercel-dns.com | DNS only (gray cloud) |

> Use **DNS only** for now. Cloudflare's orange-cloud proxy can interfere with Vercel's TLS issuance until the domain is verified.

## 3. Add domain to Vercel project

Vercel project → **Settings** → **Domains** → **Add**.

- Domain: `fedcourts.grannis.xyz`
- Vercel will detect the CNAME and issue a TLS cert within ~30 seconds.
- Once verified, you can flip Cloudflare back to **Proxied** if you want CF features (caching, WAF). Set Cloudflare SSL/TLS mode to **Full (strict)** if you proxy.

## 4. Deploy

Push to `main`. Vercel auto-deploys.

```bash
git add fedcourts app/fedcourts app/api/fc lib/fc-* scripts/seed-fedcourts.ts middleware.ts
git commit -m "fedcourts: subdomain with 7 games, 500-question bank, adaptive ratings"
git push origin main
```

Watch the build in Vercel. At end you should see routes like `/fedcourts`, `/fedcourts/speed`, `/api/fc/answer`, etc.

## 5. Seed the question bank

The CSVs in `fedcourts/content/` are the source of truth. Run the seed script once after first deploy. From your local machine (with the Upstash env vars exported):

```bash
# Pull production env vars locally (Vercel CLI):
vercel env pull .env.local

# Install tsx if not present
npm i -D tsx

# Run the seed
npx tsx scripts/seed-fedcourts.ts
```

You should see:
```
Seeding 28 rules...
Seeding 142 cases...
Seeding 500 questions...
  50/500
  100/500
  ...
All done.
```

The seed is idempotent (upserts by id), so safe to re-run.

## 6. Schedule the daily content

The Daily Hypo and Case Wordle pages need a question / case mapped to each EST date. Easiest approach for v1: set today and a buffer of upcoming days manually via the Upstash console, or via a one-shot script:

```bash
# scripts/schedule-daily.ts (you can write this) — picks N questions
# tagged daily_eligible and N cases, schedules them for the next 30 days.
```

Or, in Upstash CLI:
```
SET fc:daily-hypo:2026-04-25 just-051
SET fc:daily-case:2026-04-25 lujan
```

You'll likely want to run this monthly. A Vercel cron (`vercel.json` → `crons`) can handle it:

```jsonc
{
  "crons": [
    { "path": "/api/fc/cron/schedule-daily", "schedule": "0 4 * * *" }
  ]
}
```
(Cron endpoint not yet implemented — easy to add later.)

## 7. Sanity test

Visit `https://fedcourts.grannis.xyz` (give DNS ~5 min to propagate).

1. Sign up an account.
2. Visit `/speed` → pick a category → play 10 questions. Score should post to leaderboard.
3. Visit `/me` → radar chart appears with shifted ratings after the round.
4. Visit `/leaderboard` → your score appears.
5. Visit `/admin` (only if your username is in `FC_ADMINS`) → add or import a question.

## 8. Custom dev workflow

Local dev:

```bash
# .env.local should have UPSTASH_* + FC_SECRET + ADMIN_SECRET
npm run dev
```

Visit `http://localhost:3000/fedcourts` directly (the subdomain rewrite only kicks in for `fedcourts.*` hostnames).

## 9. Editing content

- **Bulk**: edit `fedcourts/content/questions.csv`, commit, then run the seed script.
- **Single question**: log in to `/admin`, use "Add one" tab.
- **CSV import**: paste rows into `/admin` → CSV import tab.
- **Backup**: `/admin` → Export tab dumps current Redis state to a CSV. Commit it back to git as the new source of truth.

## 10. Future hooks

- **Vercel Cron** for daily scheduling (see step 6).
- **Fed Courts Wrapped** — semester-end report. Aggregate `fc:answers:all` via a one-off script; render at `/wrapped`.
- **PCA / clustering** — pull all `fc:answers:user_id` rows into a Jupyter notebook; cluster users by per-question response patterns.

## Troubleshooting

- **Subdomain shows the main site**: middleware didn't match. Check `middleware.ts` includes the `fedcourts.` block before the admin block.
- **"Unauthorized" on /admin**: your username isn't in `FC_ADMINS`. Edit env var, redeploy.
- **Login works but ratings stay at 1000**: confirm `/api/fc/answer` is being called — open DevTools Network on Speed Drill.
- **Daily page says "no hypo scheduled"**: run the schedule script (step 6).
