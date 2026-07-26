# System Architecture

> **Last updated:** 2026-07-26 (Sprint 68)
> **Coverage:** Sprints 1–68, 28+ database tables, 13-stage AI pipeline

This document describes the current end-to-end architecture of the
Opportunity Hunter system. It supersedes older per-sprint architecture
notes that have drifted out of sync with the implementation.

## High-level data flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                              │
│  Reddit · Twitter · Product Hunt · GitHub · Hacker News · RSS    │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              COLLECTION (src/services/reddit + adapters)         │
│  fetchAllSources()  →  raw_posts (PostgreSQL via Supabase)       │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              13-STAGE AI PIPELINE                                │
│  (src/services/pipeline/)                                       │
│                                                                  │
│   1.  fetchAllSources                  → raw_posts              │
│   2.  extractPainPointsFromPosts       → pain_points            │
│   3.  generateEmbeddingsFromDatabase   → pain_point_embeddings  │
│   4.  clusterPainPointsFromDatabase    → pain_clusters          │
│   5.  generateOpportunitiesFromDB      → opportunities          │
│   6.  validateOpportunitiesFromDB      → opportunity_validations│
│   7.  generateStartupIdeasFromDB       → startup_ideas          │
│   8.  generateEvidenceBatch            → opportunity_evidence   │
│   9.  generateForecastBatch            → opportunity_forecasts  │
│  10.  processForecastAlerts            → alerts                 │
│  11.  generateMarketIntelligenceBatch  → market_intelligence    │
│  12.  generateStartupScoreBatch        → startup_scores         │
│  13.  generateVentureReportBatch       → venture_reports        │
│  14.  generateInvestmentMemoBatch      → investment_memos       │
│  15.  generateCommittees               → investment_committees  │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              DASHBOARD & APIs                                    │
│  /dashboard · /opportunities · /api/* · Admin panel              │
└─────────────────────────────────────────────────────────────────┘
```

## Stack

| Layer | Tech | Notes |
|---|---|---|
| Frontend | Next.js 16 (App Router, Turbopack) + React 19 | `app/`, `components/` |
| Styling | Tailwind v4 + shadcn/ui + lucide-react | `components/ui/` |
| Backend | Next.js API routes (App Router) | `app/api/*/route.ts` |
| Database | PostgreSQL via Supabase + RLS | 28 tables |
| Auth | Supabase Auth (session cookies) + custom API guards | `lib/auth/api-guard.ts` |
| AI | OpenAI-compatible (default NVIDIA nv-embedqa-e5-v5) | `lib/ai/openai.provider.ts` |
| Email | Resend | `services/email/` |
| Billing | Stripe | `services/billing/` |
| Scheduler | Vercel Cron | `app/api/jobs/weekly-digest/route.ts` |
| Hosting | Vercel | — |
| Tests | Vitest (jsdom + globals) | `src/test/**/*.test.ts` |

## Module layout

```
src/
├── app/                          Next.js App Router
│   ├── (pages)                   Public + authed pages
│   │   ├── dashboard/            /dashboard/*
│   │   ├── opportunities/        /opportunities/*
│   │   ├── admin/                /admin/*
│   │   ├── saved/                /saved
│   │   ├── watchlists/           /watchlists
│   │   └── …
│   ├── api/                      API endpoints (25 routes)
│   │   ├── dashboard/            GET  → dashboard metrics
│   │   ├── pipeline/             POST → trigger pipeline
│   │   ├── research/jobs/        GET/POST → research agent
│   │   ├── committee/[…]         Sprint 61/67 investment committee
│   │   ├── backtests/[…]         Sprint 59 backtesting
│   │   ├── investment-memos/[…]   Sprint 58 memos
│   │   ├── venture-score/[…]      Sprint 65 venture score
│   │   ├── portfolio/export/      Sprint 60 portfolio
│   │   ├── stripe/[…]             Billing webhooks
│   │   └── jobs/weekly-digest/    Cron route (CRON_SECRET)
│   └── auth/                     Supabase callback
├── components/                   React components
│   ├── ui/                       shadcn primitives
│   ├── dashboard/                Dashboard widgets
│   ├── opportunities/            Opportunity cards
│   └── admin/                    Admin tables
├── services/                     Domain logic
│   ├── dashboard.ts              Dashboard aggregator
│   ├── opportunities.ts          Read adapter
│   ├── pipeline/                 13-stage orchestrator + runner
│   ├── pain-points.service.ts    Stage 2
│   ├── clusters.service.ts       Stage 4
│   ├── validation.service.ts     Stage 6
│   ├── evidence.service.ts       Stage 8
│   ├── forecast.service.ts       Stage 9
│   ├── market-intelligence/      Stage 11
│   ├── startup-score/            Stage 12
│   ├── venture-report/           Stage 13
│   ├── investment-memo/          Stage 14
│   ├── investment-committee/     Stage 15
│   ├── reddit/                   Source collector
│   ├── research/                 Research agent (Sprint 62)
│   ├── venture-studio/           Sprint 63
│   ├── financial/                Sprint 64
│   ├── backtesting/              Sprint 59
│   ├── portfolio/                Sprint 60
│   ├── billing/                  Stripe subscriptions
│   ├── saved-opportunities/      User favorites
│   ├── watchlists/               Auto-monitoring lists
│   ├── alerts/                   Real-time alerts
│   ├── email/                    Resend + digest
│   ├── digests/                  Weekly digest
│   └── insights/                 AI Insight Generator
├── lib/
│   ├── auth/                     API + server guards
│   │   └── api-guard.ts          requireUserAPI / requireCronSecret
│   ├── ai/                       AI provider adapters
│   │   ├── base.provider.ts      Abstract base
│   │   ├── openai.provider.ts    NVIDIA nv-embedqa-e5-v5
│   │   ├── gemini.provider.ts    Stub
│   │   └── mock.provider.ts      Deterministic test double
│   ├── clustering/               Semantic Union-Find clustering
│   ├── scoring/                  Opportunity score weights
│   ├── exports/                  CSV / Markdown / PDF helpers
│   ├── db/repositories/          20+ repository classes
│   ├── supabase/                 Browser / server / service clients
│   ├── env.ts                    Public env (Zod)
│   └── env.service.ts            Service-role env (Zod)
├── types/                        TypeScript domain types
├── jobs/                         Cron handlers
└── test/                         Vitest tests (66+ test cases)
```

## Database tables (28+)

| Table | Purpose | Owner service |
|---|---|---|
| `sources` | Data source registry | `services/reddit/` |
| `raw_posts` | Ingested posts from all sources | `services/reddit/` |
| `pain_points` | Extracted pain points | `services/pain-points.service` |
| `pain_point_embeddings` | Vector embeddings (1024d NVIDIA) | `lib/clustering/` |
| `pain_clusters` | Clustered pain points | `services/clusters.service` |
| `opportunities` | Scored opportunities | `services/opportunities.ts` |
| `opportunity_validations` | AI 4-dim validation score | `services/validation.service` |
| `opportunity_evidence` | Market evidence | `services/evidence.service` |
| `opportunity_forecasts` | Growth / momentum forecast | `services/forecast.service` |
| `market_intelligence` | 6 external signal scores | `services/market-intelligence` |
| `startup_scores` | 7-dim VC score | `services/startup-score` |
| `venture_reports` | 17-section research report | `services/venture-report` |
| `investment_memos` | YC/Sequoia/a16z-style memo | `services/investment-memo` |
| `investment_committees` | 5-agent committee decision | `services/investment-committee` |
| `committee_votes` | Per-agent votes | `services/investment-committee` |
| `startup_ideas` | Generated startup concepts | `services/startup-ideas.service` |
| `opportunity_backtests` | Predicted vs actual scores | Sprint 59 |
| `portfolio_items` | User-tracked opportunities | Sprint 60 |
| `research_jobs` | Research agent jobs | Sprint 62 |
| `research_sources` | Per-source research results | Sprint 62 |
| `research_logs` | Job execution logs | Sprint 62 |
| `venture_projects` | Generated ventures | Sprint 63 |
| `venture_canvas` / `venture_gtm` / `venture_mvp` | Venture details | Sprint 63 |
| `financial_models` / `financial_projections` / `unit_economics` / `break_even_analysis` | Sprint 64 |
| `profiles` | User profiles (with `role` column for future admin gating) | — |
| `saved_opportunities` / `watchlists` / `alerts` / `weekly_digests` / `notification_settings` | User engagement | — |

## API surface

25 route handlers under `/api/*`. All user-facing routes are guarded
with `requireUserAPI()`; cron routes use `requireCronSecret()`. The
Stripe webhook uses Stripe signature verification instead.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/dashboard` | user | Metrics + recent opps + category trends |
| GET | `/api/search` | user | Full-text search |
| GET | `/api/filter` | user | Faceted filter |
| GET | `/api/opportunities` | user | List opportunities |
| GET | `/api/opportunities/[id]` | user | Opportunity detail |
| POST | `/api/pipeline` | user | Trigger full 13-stage pipeline |
| POST | `/api/pipeline/run` | user | Trigger legacy `runFullPipeline` |
| GET/POST | `/api/research/jobs` | user | Research agent (Sprint 62) |
| GET | `/api/committee/search` | user | Committee search |
| GET/POST | `/api/committee/[id]` | user | Committee detail + run |
| GET | `/api/committee/[id]/export` | user | Markdown / JSON export |
| GET/POST | `/api/backtests` | user | Backtest CRUD |
| GET | `/api/backtests/[id]/export` | user | CSV / JSON / PDF export |
| GET | `/api/investment-memos/search` | user | Memo search |
| GET | `/api/investment-memos/[id]/export` | user | Memo export |
| GET | `/api/venture-score/[opportunityId]` | user | Venture score detail |
| POST | `/api/venture-score/batch` | user | Batch venture score (admin-only recommended) |
| GET | `/api/portfolio/export` | user | Portfolio CSV / JSON export |
| GET | `/api/digests/pending-count` | user | Pending weekly digest count |
| POST | `/api/jobs/weekly-digest` | cron | Vercel Cron trigger |
| POST | `/api/stripe/checkout` / `cancel` / `portal` / `resume` | user | Billing flows |
| POST | `/api/stripe/webhook` | stripe-sig | Stripe webhook |

## Auth model

Three guards, all in `src/lib/auth/api-guard.ts`:

| Guard | Purpose | Returns |
|---|---|---|
| `requireUserAPI()` | Authenticated user routes | `{ ok: true, user }` or 401 |
| `optionalUserAPI()` | Personalization routes that also serve anonymous | `{ user } \| null` |
| `requireCronSecret(request)` | Vercel Cron callbacks | 401 / 503 / ok |

Auth flow:
1. User logs in via Supabase Auth → cookie set by `@supabase/ssr`
2. `getSupabaseServerClient()` reads cookie via `next/headers`
3. `requireUserAPI()` calls `supabase.auth.getUser()` (server-validated, not JWT decode)
4. Route handler branches on `guard.ok`

## CLI / pipeline runtime

`npm run pipeline` runs `tsx --env-file-if-exists=.env.local src/scripts/pipeline.ts`:

```
src/scripts/pipeline.ts → runPipelineWithTracking() →
  src/services/pipeline/orchestrator.service.ts →
    src/services/pipeline/runner.service.ts (13 stages)
```

The CLI never imports `next/headers` / `server-only` / `@/lib/supabase/server` —
verified by `npm run check:cli-imports` (an AST-level scanner added in Sprint 66
follow-up).

## Error handling

- All repositories throw `translateError(ENTITY, error)` from `lib/db/errors.ts`
- API routes catch and convert to NextResponse with status 4xx/5xx
- Pipeline stages log `[Stage N START/END]` for observability

## Observability (planned)

- Pipeline stage logging: ✓ already implemented
- Structured logger (Sentry/PostHog): Sprint 71 backlog
- Metrics dashboard: Sprint 71 backlog

## Open items

- **Sprint 69:** RLS audit on opportunities + raw_posts + pain_points
- **Sprint 70:** Admin-role gating for `/api/venture-score/batch`
  and `/admin/*` (currently relies on UI hiding, not server check)
- **Sprint 71:** Rate limiting + AI cost guard (per-user daily cap)
- **Sprint 71:** Observability — structured logging + error tracking