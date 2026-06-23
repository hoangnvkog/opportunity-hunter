# Production Readiness — Opportunity Hunter

This document covers everything needed to deploy, monitor, and recover Opportunity Hunter in production.

---

## Environment Variables

All variables are defined in `.env.example`. Copy to `.env.local` and fill in real values.

### Required

| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key (bypasses RLS) | Supabase Dashboard → Settings → API |

### Optional — Data Sources

| Variable | Description |
|---|---|
| `SUPABASE_DB_URL` | Direct Postgres connection string for CLI/migrations |
| `PRODUCT_HUNT_TOKEN` | Product Hunt Developer Token |
| `TWITTER_BEARER_TOKEN` | Twitter/X API Bearer Token |
| `INDIEHACKERS_API_KEY` | IndieHackers unofficial RSS feed key |

### Optional — Email (Resend)

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `EMAIL_FROM` | Sender email address (e.g. `noreply@opportunityhunter.app`) |

### Optional — Payments (Stripe)

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `PRICE_FREE` | Stripe Price ID for Free plan |
| `PRICE_PRO` | Stripe Price ID for Pro plan |
| `PRICE_TEAM` | Stripe Price ID for Team plan |

### AI Provider

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key (set via Vercel dashboard or `.env.local`) |

---

## Deployment Steps

### 1. Supabase Setup

1. Create a Supabase project at <https://app.supabase.com>
2. Run migrations: `supabase db push` (or use the CI migration pipeline)
3. Enable Row Level Security (RLS) — all tables have policies by default
4. Seed initial data (optional): `npm run db:seed`
5. Copy `SUPABASE_URL`, `ANON_KEY`, and `SERVICE_ROLE_KEY` from Dashboard → Settings → API

### 2. Vercel Deployment

1. Connect the GitHub repo to Vercel
2. Set environment variables in Vercel Dashboard → Settings → Environment Variables (all variables from above)
3. Framework preset: **Next.js**
4. Build command: `npm run build` (Vercel auto-detects)
5. Output directory: `.next` (auto-detected)
6. Deploy — Vercel auto-deploys on push to `master`

### 3. Cron Jobs

Pipeline cron jobs run as Vercel Cron Functions. Verify they are configured in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/reddit", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/pipeline", "schedule": "0 2 * * *" }
  ]
}
```

### 4. Post-Deployment Verification

- [ ] Visit the app URL and confirm the landing page loads
- [ ] Log in with a test account — verify Supabase Auth works
- [ ] Check `/api/health` returns `200 OK`
- [ ] Trigger a manual pipeline run and verify data flows end-to-end
- [ ] Verify Stripe checkout works (use test mode)

---

## Backup Strategy

### Sup