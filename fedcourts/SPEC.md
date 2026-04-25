# fedcourts.grannis.xyz — spec

A drill-game site for federal courts law school skills. Login + leaderboard + 7 game modes + adaptive ratings + radar chart + analytics.

## Stack

- **App**: Next.js (App Router) — lives at `app/(fedcourts)/...` in the existing Website repo, served at `fedcourts.grannis.xyz` via Cloudflare CNAME → Vercel.
- **DB**: Neon Postgres (free tier, ~0.5GB).
- **Auth**: username + password, bcrypt cost 12, JWT sessions in HttpOnly cookies. No email verification v1.
- **Hosting**: Vercel hobby (existing account).
- **DNS**: Cloudflare (existing). Add CNAME `fedcourts` → `cname.vercel-dns.com`. Add domain `fedcourts.grannis.xyz` to Vercel project; Vercel issues TLS automatically.
- **Daily windows**: close at `00:00 America/New_York`. Store UTC; compute "today_est" at read time.

## Categories (Option A, 8 doctrinal buckets)

| code | name |
|---|---|
| just | Justiciability |
| cong | Congressional Control & Non-Article III Courts |
| fqj  | Federal Question & Supplemental Jurisdiction |
| scsr | Supreme Court Review of State Courts |
| erie | Erie & Federal Common Law |
| roa  | Rights of Action (Implied PROA + Bivens) |
| imm  | Immunities & § 1983 (SSI + Monell + QI + absolute) |
| hab  | Federal Habeas Corpus |

## Games (7 total)

1. **Speed Drill** — pick a category, 10 timed MCQs.
2. **Drills (Adaptive)** — mixed categories, Elo-rated, serves questions matched to user's per-category rating.
3. **Which Prong?** — given a hypo + a multi-prong test, identify the element at issue.
4. **Case Match** — concentration/memory game pairing case names with holdings/facts.
5. **Rule Builder** — pick correct elements (in order) of a multi-prong test from a tile bank.
6. **Daily Hypo** — single tough MCQ per day (00:00 EST reset), reveal at next reset.
7. **Case Wordle** — guess the case in 5 tries; clues progressively reveal.

## Adaptive rating (Drills)

- Per-user vector: `rating[category]` defaults 1000.
- Per-question: `rating[category]` defaults 1000.
- Update: Elo with K=24 for users, K=16 for questions.
- Selection: weighted by (1 - rating)/total_weakness × inv-recency × within ±150 of user rating.
- Tiers: ≤900 Novice / 900-1050 Developing / 1050-1200 Competent / 1200-1350 Advanced / 1350+ Expert.

## Schema (Postgres)

```sql
-- users
create table users (
  id           uuid primary key default gen_random_uuid(),
  username     text unique not null,
  password_hash text not null,
  display_name text not null,
  created_at   timestamptz default now()
);

-- per-user category ratings
create table user_ratings (
  user_id     uuid references users(id) on delete cascade,
  category    text not null,
  rating      int not null default 1000,
  num_answered int not null default 0,
  updated_at  timestamptz default now(),
  primary key (user_id, category)
);

-- questions (cached from CSV; CSV in git is source of truth)
create table questions (
  id              text primary key,
  category        text not null,
  difficulty      int not null,                   -- author hint, 1-5
  rating          int not null default 1000,      -- adaptive, calibrates
  num_answered    int not null default 0,
  stem            text not null,
  opt_a text not null, opt_b text not null,
  opt_c text not null, opt_d text not null,
  correct         char(1) not null,               -- a/b/c/d
  case_cited      text,
  rule_id         text,
  prong           text,
  explanation     text not null,
  tags            text[],
  daily_eligible  boolean default false,
  created_at      timestamptz default now()
);

-- cases (Case Wordle / Case Match)
create table cases (
  id text primary key,
  name text not null,
  year int,
  court text,                 -- 'SCOTUS', 'circuit', 'state', etc.
  category text not null,
  holding text not null,
  facts_one_liner text not null,
  cluster text,
  outline_section text,
  first_letter char(1),
  citation_hint text
);

-- rules (Rule Builder)
create table rules (
  id text primary key,
  name text not null,
  category text not null,
  elements text[] not null,         -- ordered
  source_case text,
  when_applied text,
  common_distractors text[]
);

-- answer event log (analytics + Wrapped)
create table answers (
  id           bigserial primary key,
  user_id      uuid references users(id),
  question_id  text references questions(id),
  game_mode    text not null,
  session_id   uuid not null,
  selected     char(1),                   -- null if timeout
  correct      boolean not null,
  ms_to_answer int,
  answered_at  timestamptz default now()
);
create index on answers (user_id, answered_at);
create index on answers (question_id);

-- daily hypo schedule
create table daily_hypos (
  date_est date primary key,
  question_id text references questions(id),
  unlocked_at_utc timestamptz,
  reveal_at_utc   timestamptz
);

-- case wordle daily schedule
create table daily_cases (
  date_est date primary key,
  case_id text references cases(id)
);

-- score snapshots per game/category for leaderboards
create table scores (
  id bigserial primary key,
  user_id uuid references users(id),
  game text not null,
  category text,                     -- null for cross-category games
  score int not null,
  metadata jsonb,
  played_at timestamptz default now()
);
create index on scores (game, category, score desc);

-- streaks
create table streaks (
  user_id uuid references users(id),
  game text not null,
  current_streak int default 0,
  longest_streak int default 0,
  last_played_date_est date,
  primary key (user_id, game)
);
```

## Routes

```
/                       landing + game picker
/login  /signup
/me                     profile (radar chart, stats)
/leaderboard            all leaderboards (tabs)
/drills                 adaptive drills (cross-category)
/drill/:cat             speed drill, single category
/prong/:rule            which-prong drill
/match                  case match
/builder                rule builder
/daily                  daily hypo + case wordle
/admin                  CRUD page (auth-gated to admin user)
/admin/import           CSV import
/admin/export           CSV export
/api/answer             POST: log an answer, update ratings
/api/daily              GET: today's hypo
/api/leaderboard        GET: filtered boards
```

## Content authoring flow

- **Source of truth**: `fedcourts/content/questions.csv` in git.
- **Build**: on deploy, `scripts/seed-fedcourts.ts` reads CSV → upserts into Postgres `questions` table by `id`.
- **CRUD page**: writes to DB and appends to a session-batch CSV that `/admin/export` lets you download and commit to git.
- **CSV import**: paste or upload CSV from `/admin/import` → preview → confirm → upsert.
- **CSV columns**: `id,category,difficulty,stem,opt_a,opt_b,opt_c,opt_d,correct,case,rule_id,prong,explanation,tags,daily_eligible`.

## Radar chart sketch

```tsx
function RadarChart({ ratings }: { ratings: Record<string, number> }) {
  const cats = ['just','cong','fqj','scsr','erie','roa','imm','hab'];
  const labels = ['Justiciability','Cong. Control','Fed Q','SCOTUS Review','Erie/FCL','Rts of Action','Immunities','Habeas'];
  const cx = 200, cy = 200, maxR = 160;
  // map rating 600-1500 to 0-maxR
  const r = (x: number) => Math.max(0, Math.min(maxR, ((x - 600) / 900) * maxR));
  const points = cats.map((c, i) => {
    const angle = (i / cats.length) * 2 * Math.PI - Math.PI / 2;
    const radius = r(ratings[c] ?? 1000);
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  });
  const path = points.map(([x,y], i) => `${i===0?'M':'L'}${x},${y}`).join(' ') + 'Z';
  // draw 5 reference rings + 8 spokes + filled polygon + label each axis
  // ...
}
```

5 concentric reference rings at ratings 750/900/1050/1200/1350 with the 1000 ring slightly bolded. Filled polygon at ~30% opacity, stroked. Labels offset 12px outside the 1500 ring.

## Roadmap

- **v1 launch**: 7 games, all CSV-seeded, ~500 questions.
- **v1.1**: full 1500-question bank, Fed Courts Wrapped page.
- **v2**: 1v1 head-to-head, push notifications for daily, study group leaderboards.
