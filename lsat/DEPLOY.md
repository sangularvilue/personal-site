# lsat.grannis.xyz deployment notes

Cloned from the fedcourts pattern. Same Vercel project, same Upstash Redis,
just under the `lsat:` key prefix and `lsat_token` cookie.

## One-time setup

1. **Cloudflare DNS**: add CNAME `lsat` → `cname.vercel-dns.com`. Set to
   *DNS only* (gray cloud) until Vercel issues the TLS cert; then it can
   flip to proxied + Full (strict).

2. **Vercel → Project → Domains**: add `lsat.grannis.xyz`. Wait ~30s for
   the cert.

3. **Vercel env vars** (Production + Development):
   - `LSAT_SECRET` — `openssl rand -hex 32`. JWT signing for the
     `lsat_token` cookie. Falls back to `FC_SECRET` if unset.
   - `LSAT_ADMIN_USERNAME` — defaults to `willg` if unset.
   - `LSAT_ADMIN_MASTER_PASSWORD` — defaults to `Ozymandias` if unset.

   Already-set vars `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
   are reused; no action needed.

4. **Push** to `main`. The middleware block already routes
   `lsat.grannis.xyz` → `/lsat/...`. If auto-deploy doesn't fire on first
   push, force with `npx vercel deploy --prod --yes`.

## Seeding questions

Questions live in `lsat/content/questions.csv` (headers:
`question_id,pt,section_num,section_type,question_num,passage_id,stem,
choice_a..choice_e,correct_answer,skills`).

```bash
npx vercel env pull .env.local
node --env-file=.env.local --import tsx scripts/seed-lsat.ts
```

The seed is idempotent — re-running upserts every row; it only adds new
ids to the index sets, never removes. Rows without a `correct_answer` are
skipped (not all CSV rows are fully classified).

## Admin (Will G) workflow

1. Sign in at `lsat.grannis.xyz/login` with username `willg` and the
   master password (`Ozymandias`).
   - First login auto-creates the user record.
   - The `willg` username is reserved at signup, so no other user can
     register it.
2. While drilling, click the small `i` button by any question to open
   the editor. You can rewrite the stem, any of the 5 choices, change
   the correct letter, or change the skill tag. Save — it persists to
   Redis globally, so every future user sees the new version.
3. Non-admin users see a read-only "skill tag" view from the same `i`
   button.

## Pages

- `/` — mode picker (drill, speed, skill, section, marathon)
- `/drill` — adaptive 15
- `/speed` — 10 timed @ 60s
- `/skill` — pick one skill, drill 15
- `/section` — pick RC/LR/LG, drill 15
- `/marathon` — 25 untimed adaptive
- `/me` — profile: skill ratings, attempt history
- `/leaderboard` — by mode / skill / window
- `/login`, `/signup`

## Files added

```
lib/lsat-redis.ts     lib/lsat-auth.ts     lib/lsat-types.ts
app/lsat/...          app/api/lsat/...
scripts/seed-lsat.ts  middleware.ts (lsat.* host block)
```
