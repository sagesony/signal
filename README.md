# Signal

AI-powered competitive intelligence for solo marketers, indie hackers, small D2C brands, and agencies.

Signal monitors competitor advertising and surfaces what matters: emerging messaging patterns, dominant formats, emotional angles being tested, and market narratives that are scaling.

> **Demo login:** `demo@signal.app` / `demo1234`

---

## Features

- **Dashboard** — Stats overview, recent insights, latest competitor ads
- **Competitor Tracking** — Add brands with website and Meta Ad Library URLs
- **Ads Feed** — Browse all tracked ads with filters (brand, hook, format, offer, search)
- **Insights** — AI-style market intelligence cards with confidence scores and category filters
- **Saved Ads** — Bookmark ads, add notes and tags to build a swipe file

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | SQLite via Prisma (swap to PostgreSQL for prod) |
| Auth | NextAuth.js v4 — credentials + JWT |
| Styling | Tailwind CSS + custom design tokens |
| UI | Custom components (Radix primitives) |
| Animations | CSS keyframes + Tailwind Animate |
| Deployment | Vercel |

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Push database schema
DATABASE_URL="file:./dev.db" npx prisma db push

# 3. Seed with realistic Indian D2C mock data
DATABASE_URL="file:./dev.db" npx tsx prisma/seed.ts

# 4. Start dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) and log in with `demo@signal.app` / `demo1234`.

Or run everything in one step:

```bash
npm run setup && npm run dev
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite: `file:./dev.db` · PostgreSQL: `postgresql://...` |
| `NEXTAUTH_SECRET` | Random string — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL — `http://localhost:3000` locally |

Copy `.env.example` to `.env.local` and fill in your values.

---

## Database

**Schema:** `prisma/schema.prisma`

| Model | Purpose |
|---|---|
| `User` | Auth — email/password |
| `Competitor` | Tracked brands per user |
| `Ad` | Individual ad creatives with classification |
| `SavedAd` | User bookmarks with notes and tags |
| `Insight` | AI-generated market intelligence summaries |

**Useful commands:**

```bash
npm run db:push      # Sync schema to database
npm run db:seed      # Seed with mock data
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:reset     # Drop and re-seed (destructive)
```

**Ad classification fields:**

- `hookType` — curiosity · authority · transformation · problem · social_proof · emotional
- `angleType` — premium · affordability · science_backed · emotional · convenience
- `formatType` — ugc · founder_led · demo · testimonial · meme
- `offerType` — discount · bundle · starter_pack · subscription · free_shipping

---

## Project Structure

```
signal/
├── app/
│   ├── (auth)/             # Login + register pages
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── dashboard/      # /dashboard — home
│   │   ├── competitors/    # /competitors
│   │   ├── ads/            # /ads
│   │   ├── insights/       # /insights
│   │   └── saved/          # /saved
│   └── api/                # REST API routes
│       ├── auth/           # NextAuth handler
│       ├── register/       # User registration
│       ├── competitors/    # CRUD
│       ├── ads/            # Read + save toggle
│       ├── insights/       # Read with category filter
│       ├── saved/          # Read + update notes/tags
│       └── dashboard/      # Aggregated stats
├── components/
│   ├── ui/                 # Primitives (button, card, badge, dialog, …)
│   ├── layout/             # Sidebar, topbar
│   ├── dashboard/          # Stats grid, recent insights, activity feed
│   ├── competitors/        # Competitor card, add dialog
│   ├── ads/                # Ad card, filter bar
│   ├── insights/           # Insight card
│   └── saved/              # Saved ad card with notes editor
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── db.ts               # Prisma singleton
│   └── utils.ts            # cn(), formatDate(), label maps, color maps
├── prisma/
│   ├── schema.prisma
│   └── seed.ts             # 8 competitors · 26 ads · 9 insights
├── types/
│   └── index.ts            # Shared TypeScript types
└── middleware.ts            # Route protection
```

---

## Deploying to Vercel

1. Push to GitHub
2. Import into Vercel
3. Add environment variables:
   - `DATABASE_URL` — use [Neon](https://neon.tech) or [Supabase](https://supabase.com) PostgreSQL
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your Vercel domain (auto-set in prod, can omit)
4. Update `prisma/schema.prisma` datasource provider from `"sqlite"` to `"postgresql"`
5. Deploy — Vercel will run `prisma generate` via the `postinstall` script automatically

---

## Future-Ready Architecture

The codebase is structured to support these extensions without rewrites:

| Feature | Where to add |
|---|---|
| Real Meta Ad Library scraping | `lib/scrapers/meta.ts` + scheduled job |
| OpenAI insight generation | `lib/ai/insights.ts` called from a cron route |
| Playwright automation | `lib/scrapers/playwright.ts` |
| Reddit / TikTok intelligence | New `platform` values on the `Ad` model |
| Email digests | `app/api/cron/digest/route.ts` |
| Scheduled ingestion | Vercel Cron → `app/api/cron/ingest/route.ts` |

The `Ad` model already has `platform`, `firstSeen`, `lastSeen`, and classification fields ready for real data. The `Insight` model is generic enough to hold both mock and AI-generated content.
