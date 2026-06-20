# World Cup 2026 Records Tracker

Live FIFA World Cup 2026 records tracker with match center, golden boot standings, timeline, player & team stats, and an optional Supabase admin panel.

Built with **Next.js 15**, **TypeScript**, **Tailwind CSS 4**, and **Supabase**.

---

## Features

- **Live match board** — real-time scores, clock, possession, shots, and goals (polls every 15s)
- **Match center** — live, upcoming, and completed fixtures with detail pages
- **Golden Boot** — top scorers, standings table, and bar chart
- **Records** — broken records, new records, and record chase cards
- **Timeline** — chronological tournament events
- **Players & teams** — profiles, stats, and official FIFA squad photos
- **Statistics dashboard** — charts and tournament aggregates
- **Global search** — players, teams, matches, and records
- **Admin panel** — Supabase Auth with full CRUD (optional)
- **Dark / light mode**
- **SEO** — dynamic meta tags, Open Graph, Twitter cards, JSON-LD, sitemap, robots.txt

---

## Data sources

| Source | Used for |
|--------|----------|
| [TheStatsAPI](https://www.thestatsapi.com/world-cup/) | Full tournament fixture list |
| [ESPN FIFA World Cup API](https://site.api.espn.com) | Live scores, match stats, goal scorers |
| [FIFA Digital Hub](https://digitalhub.fifa.com) | Official player squad photos |
| **Supabase** | Records, timeline, admin content, auth |

Match scores and live status work **without Supabase**. The admin panel and records pages require a Supabase project.

---

## Tech stack

- [Next.js 15](https://nextjs.org/) — App Router, Server Components, ISR
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) — database, auth, storage
- [Recharts](https://recharts.org/) — statistics charts
- [GSAP](https://gsap.com/) — animations

---

## Getting started

### Prerequisites

- Node.js 18+
- npm

### 1. Clone and install

```bash
git clone https://github.com/farhansh911/fifa-world-cup-2026-records-tracker.git
cd fifa-world-cup-2026-records-tracker
npm install
```

### 2. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | For admin / records | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For admin / records | Supabase anon (public) key |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Site URL for SEO (e.g. `http://localhost:3000`) |
| `API_FOOTBALL_KEY` | Optional | Extra live data from [API-Football](https://www.api-football.com/) |

> **Never commit `.env.local`.** It is already listed in `.gitignore`.

### 3. Set up Supabase (optional)

Only needed if you want the admin panel and database-driven records.

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the Supabase SQL Editor
3. Create an admin user under **Authentication → Users**
4. Add them to the `admins` table:

```sql
INSERT INTO admins (user_id, email, name)
VALUES ('YOUR_USER_UUID', 'admin@example.com', 'Admin');
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

If you hit stale cache issues during development:

```bash
npm run dev:clean
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:clean` | Clear `.next` cache and start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |

---

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables from `.env.example` in the Vercel dashboard
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain
5. Deploy

Do **not** upload `.env.local` to GitHub or commit it — use Vercel's environment variable UI instead.

---

## Project structure

```
src/
├── app/                  # Pages & API routes
│   ├── api/live/         # Live match polling endpoint
│   ├── golden-boot/      # Golden Boot leaderboard
│   ├── matches/          # Match center
│   ├── records/          # Broken & new records
│   └── admin/            # Protected admin panel
├── components/           # UI components
├── lib/                  # Data fetching & utilities
│   ├── espn-*.ts         # ESPN live data
│   ├── fixtures-api.ts   # Tournament fixtures
│   ├── live-matches.ts   # Live match views
│   └── supabase/         # Supabase clients
└── types/                # TypeScript types
supabase/
└── schema.sql            # Database schema
```

---

## Admin panel

Access at `/admin/login`. Authenticated admins can:

- Add, edit, and delete broken & new records
- Manage matches, teams, and players
- Upload images to Supabase Storage
- Add timeline events
- Refresh tournament stats

---

## Database tables

| Table | Purpose |
|-------|---------|
| `teams` | Participating nations |
| `players` | Player profiles & stats |
| `matches` | Match fixtures & results |
| `records_broken` | Broken records |
| `records_created` | New records |
| `tournament_stats` | Live aggregate stats |
| `timeline_events` | Chronological feed |
| `admins` | Authorized admin users |
| `newsletter_signups` | Email subscriptions |
| `favorite_teams` | User favorite teams |

---

## License

Private project. All rights reserved.
