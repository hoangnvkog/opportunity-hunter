# Opportunity Hunter 🎯

AI-powered platform that discovers startup opportunities by mining pain points from Reddit, Hacker News, Product Hunt, Twitter, and IndieHackers — then clusters, validates, and scores them into investable opportunities.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-660%2B%20passing-brightgreen.svg)]()
[![Sprints](https://img.shields.io/badge/sprints-68%20shipped-blue.svg)]()

## Features

- 🔍 **Multi-source Pain Detection** — Reddit, Twitter, Product Hunt, GitHub, HN, RSS
- 🧠 **AI Clustering** — Group similar pain points using NVIDIA embeddings
- 💡 **Opportunity Scoring** — Market size + demand + competition scoring
- ✅ **AI Validation** — 4-dimension feasibility gate (score ≥ 70 unlocks startup ideas)
- 📊 **Market Evidence Engine** — External signals (competitors, trends, TAM)
- 📈 **Forecast Engine** — Growth / momentum / pressure predictions
- 🏆 **Investment Scoring** — 7-dimension VC-grade evaluation
- 📄 **Venture Reports** — 17-section research reports
- 💰 **Investment Memos** — YC/Sequoia-style memos
- 🤖 **AI Investment Committee** — 5-agent (Market / Product / Financial / Tech / VC) vote aggregation
- 🧪 **Venture Studio Generator** — Canvas + GTM + MVP scaffolding
- 📊 **Financial Projections** — Projections + unit economics + break-even analysis
- 🔔 **Alerts & Digests** — Weekly opportunities email via Resend
- 💳 **Stripe Billing** — Subscription tiers (Free / Pro / Team)

## Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | Next.js 16.2.7 (App Router + Turbopack), React 19, Tailwind v4, shadcn/ui, Recharts |
| **Backend** | Next.js API Routes, Server Actions, Edge Middleware |
| **Database** | Supabase PostgreSQL + RLS (28+ tables) |
| **AI** | OpenAI GPT-4, NVIDIA embeddings, Gemini (stub) |
| **Payments** | Stripe (Checkout + Customer Portal + Webhooks) |
| **Email** | Resend |
| **Auth** | Supabase Auth (email + OAuth) |
| **Cron** | Vercel Cron (`/api/jobs/weekly-digest`) |
| **Testing** | Vitest (660+ tests, 65+ test files) |
| **Deployment** | Vercel (Production + Preview) |
| **Monitoring** | `/api/health` endpoint for uptime monitors |

## Quick Start

### Prerequisites

- Node.js 18+ (recommend 20+)
- pnpm or npm
- Supabase account (free tier works for dev)
- OpenAI API key (or set `AI_PROVIDER=mock` for dry runs)
- Stripe account (optional — only for billing flows)

### Install

```bash
git clone https://github.com/hoangnvkog/opportunity-hunter.git
cd opportunity-hunter
npm install
cp .env.example .env.local
```

Fill in `.env.local` (see [Environment Variables](#environment-variables)).

### Apply database schema

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Run all migrations
supabase db push
```

### Run the dev server

```bash
npm run dev
# → http://localhost:3000
```

### Run the AI pipeline

```bash
# Full 13-stage pipeline (takes ~5–15 minutes, costs ~$0.50–$2 in OpenAI credits)
npm run pipeline

# Just one stage
tsx src/scripts/clusters.ts   # pain point clustering
tsx src/scripts/opportunities.ts   # opportunity scoring
```

## Environment Variables

Required for any meaningful run:

| Variable | Purpose | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | [Supabase Dashboard](https://app.supabase.com/project/_/settings/api) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Same page |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (bypasses RLS) | Same page (⚠️ keep secret) |
| `OPENAI_API_KEY` | OpenAI API key | [platform.openai.com](https://platform.openai.com/api-keys) |

Optional (skip gracefully when missing):

| Variable | Purpose |
|---|---|
| `AI_PROVIDER` | `openai` (default) / `gemini` / `mock` |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Subscription billing |
| `RESEND_API_KEY` + `EMAIL_FROM` | Weekly digest emails |
| `CRON_SECRET` | Vercel Cron auth (≥ 16 chars) |
| `REDDIT_CLIENT_ID/SECRET/USER_AGENT` | Reddit collector |
| `INDIEHACKERS_API_KEY` | IndieHackers collector |
| `PRODUCT_HUNT_TOKEN` | Product Hunt collector |
| `TWITTER_BEARER_TOKEN` | Twitter/X collector |
| `GEMINI_API_KEY` | Gemini provider (stub) |

Validation runs at startup via `src/lib/env.server.ts` (Zod schema). Missing required vars throw immediately with a clear message.

Generate a cron secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Testing

```bash
# Run all tests (660+)
npm test

# Run a specific file
npm test -- opportunities

# Coverage report
npm run test:coverage

# Type check
npm run type-check

# Lint
npm run lint
```

CI runs `lint + type-check + test` on every PR via `.github/workflows/test.yml`.

## Project structure

```
src/
├─ app/                # Next.js App Router pages + API routes
│  ├─ api/             # 25 API routes (auth + billing + pipeline + cron)
│  ├─ dashboard/       # /dashboard/validated, /investment, /venture, etc.
│  ├─ opportunities/   # Public opportunity browsing
│  └─ admin/           # Admin panel
├─ components/         # 107 React components (shadcn/ui based)
├─ services/           # Domain services (billing, pipeline, sources, …)
├─ lib/                # Shared utilities
│  ├─ ai/              # AI provider abstraction (OpenAI / Gemini / mock)
│  ├─ auth/            # Auth guards (`requireUserAPI`, `requireCronSecret`)
│  ├─ db/              # Repository pattern (typed DB access)
│  ├─ scheduler/       # Background job runners
│  └─ rate-limit.ts    # In-memory sliding-window limiter (Sprint 69)
├─ middleware.ts       # Edge middleware — rate limit only (Sprint 69)
└─ test/               # Vitest tests
```

See [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) for the full pipeline description.

## Deployment

### Vercel (recommended)

1. Push to `master` — Vercel auto-deploys.
2. Set all environment variables from `.env.local` in the Vercel dashboard.
3. Add a Vercel Cron job matching `vercel.json` (already configured — every Monday 09:00 UTC).

### Verify after deploy

```bash
# Health check (should return 200)
curl https://your-app.vercel.app/api/health

# Trigger pipeline manually
curl -X POST https://your-app.vercel.app/api/pipeline \
  -H "Cookie: sb-access-token=..."
```

See [docs/SPRINT_69_PLAN.md](docs/SPRINT_69_PLAN.md) for the production hardening checklist.

## Architecture overview

```
Reddit / Twitter / PH / HN / GitHub / RSS
            ↓
   Collection (raw_posts)
            ↓
   13-stage AI pipeline:
   pain detection → clustering → opportunity scoring →
   validation → evidence → forecast → market intelligence →
   startup scoring → venture reports → investment memos →
   investment committee → venture studio → financial projections
            ↓
   Dashboard · Alerts · Weekly digest · Public opportunities
```

Read [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) for the detailed walk-through.

## Contributing

1. Fork the repo
2. Branch from `master`: `git checkout -b feature/your-feature`
3. Run `npm test` + `npm run type-check` + `npm run lint` locally
4. Open a PR

All code goes through `src/lib/auth/api-guard.ts` for protected routes and `src/lib/supabase` (barrel) for DB access — never import the Supabase server client from pipeline code.

## License

MIT © 2026 Opportunity Hunter contributors.

---

Built by [Quốc Sư](https://github.com/hoangnvkog) · AI-assisted by Tô Khất Nhi 🍵
