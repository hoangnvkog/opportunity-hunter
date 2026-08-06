# Sprint 69 — Production Critical Fixes

> **Timeline:** 1 tuần (40 giờ)  
> **Objective:** Fix 8 CRITICAL issues để deploy Production  
> **Owner:** Tô Khất Nhi 🍵  
> **Approved by:** Quốc Sư (Option C — Hybrid)

---

## Overview

Sprint 69 là **Phase 1** của Option C — Hybrid approach. Mục tiêu: fix tất cả 8 CRITICAL issues (C1–C8) để project sẵn sàng deploy Production.

**Sau Sprint 69:**
- ✅ API routes có auth guard
- ✅ Rate limiting bảo vệ AI cost abuse
- ✅ Environment validation ngăn deploy fail silent
- ✅ README onboarding rõ ràng
- ✅ Cron jobs chạy trên Vercel
- ✅ Health check endpoint cho monitoring
- ✅ Production logs sạch (no console.log spam)
- ✅ TypeScript errors fixed

**Deploy target:** Cuối Sprint 69 (Day 5)

---

## Task Breakdown

### C1. Fix Stripe Routes Authentication (Priority: P0)

**Current state:**
- 4 Stripe routes KHÔNG có auth guard:
  - `/api/stripe/cancel` — POST cancel subscription
  - `/api/stripe/checkout` — POST create checkout session
  - `/api/stripe/portal` — POST access billing portal
  - `/api/stripe/resume` — POST resume subscription

**Risk:** Bất kỳ ai cũng có thể call → burn credits, cancel subscriptions

**Tasks:**
1. Add `requireUserAPI()` guard vào 4 routes
2. Extract `userId` từ session → pass vào Stripe metadata
3. Verify `user.id` match với `customerId` trước khi action
4. Write tests cho auth rejection (401 khi no session)

**Files to change:**
- `src/app/api/stripe/cancel/route.ts`
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/app/api/stripe/resume/route.ts`
- `__tests__/api/stripe/*.test.ts` (add auth tests)

**Implementation:**
```typescript
// src/app/api/stripe/checkout/route.ts
import { requireUserAPI } from "@/lib/auth/api-guard";

export async function POST(request: Request) {
  const guard = await requireUserAPI();
  if (!guard.ok) return guard.response;
  const { user } = guard;

  const body = await request.json();
  const { priceId } = body;

  // Create Stripe checkout session with user.id in metadata
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    metadata: { userId: user.id },
    line_items: [{ price: priceId, quantity: 1 }],
    // ...
  });

  return NextResponse.json({ url: session.url });
}
```

**Tests:**
```typescript
// __tests__/api/stripe/checkout.test.ts
describe("POST /api/stripe/checkout", () => {
  it("should return 401 when not authenticated", async () => {
    const response = await POST(new Request("http://localhost/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ priceId: "price_123" }),
    }));
    expect(response.status).toBe(401);
  });

  it("should create checkout session for authenticated user", async () => {
    // mock requireUserAPI() → { ok: true, user: { id: "user_123" } }
    // ...
    expect(response.status).toBe(200);
  });
});
```

**Estimate:** 3 hours  
**Verification:**
- [ ] Run `npm test -- api/stripe` → all pass
- [ ] Manual test: curl without cookie → 401
- [ ] Manual test: curl with valid session → 200

---

### C2. Implement Rate Limiting (Priority: P0)

**Current state:**
- ❌ Không có rate limiter
- Pipeline route `/api/pipeline` mỗi request burn ~$0.50–$2 OpenAI
- Attack scenario: 100 requests/hour = $200 burn

**Solution:** Vercel Edge Config + middleware (sliding window: 10 req/hour per user)

**Tasks:**
1. Install `@vercel/edge-config`
2. Tạo Edge Config trên Vercel dashboard (name: `rate-limits`)
3. Viết middleware `src/middleware.ts` với rate limiter
4. Track requests per `userId` (authenticated) hoặc per `ip` (anonymous)
5. Return 429 khi vượt quota
6. Add `X-RateLimit-*` headers (Limit, Remaining, Reset)
7. Write tests

**Files to create/change:**
- `src/middleware.ts` (new)
- `src/lib/rate-limit.ts` (new — helper functions)
- `package.json` (add `@vercel/edge-config`)
- `.env.example` (add `EDGE_CONFIG`)
- `__tests__/middleware/rate-limit.test.ts` (new)

**Implementation:**
```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  // Only rate-limit expensive routes
  if (!request.nextUrl.pathname.startsWith("/api/pipeline")) {
    return NextResponse.next();
  }

  const identifier = request.headers.get("x-user-id") || request.ip || "anonymous";
  const { success, limit, remaining, reset } = await rateLimit(identifier);

  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": reset.toString(),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", reset.toString());
  return response;
}

export const config = {
  matcher: "/api/pipeline/:path*",
};
```

```typescript
// src/lib/rate-limit.ts
import { get } from "@vercel/edge-config";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 10;

// In-memory store (single instance, ephemeral)
const store = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(identifier: string) {
  const now = Date.now();
  const record = store.get(identifier);

  if (!record || now > record.resetAt) {
    // New window
    store.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { success: true, limit: MAX_REQUESTS, remaining: MAX_REQUESTS - 1, reset: now + WINDOW_MS };
  }

  if (record.count >= MAX_REQUESTS) {
    return { success: false, limit: MAX_REQUESTS, remaining: 0, reset: record.resetAt };
  }

  record.count += 1;
  store.set(identifier, record);
  return { success: true, limit: MAX_REQUESTS, remaining: MAX_REQUESTS - record.count, reset: record.resetAt };
}
```

**Note:** In-memory store works cho single Vercel instance. Nếu scale multi-region → migrate sang Upstash Redis sau.

**Estimate:** 6 hours  
**Verification:**
- [ ] Deploy to Vercel Preview
- [ ] Test: 10 requests within 1 hour → OK
- [ ] Test: 11th request → 429
- [ ] Test: Wait 1 hour → counter reset

---

### C3. Runtime Environment Validation (Priority: P0)

**Current state:**
- `.env.example` có 17 variables nhưng không validate runtime
- Thiếu `CRON_SECRET` → cron job fail silent
- Thiếu `STRIPE_SECRET_KEY` → checkout crash

**Solution:** Zod schema validation ở app startup

**Tasks:**
1. Tạo `src/lib/env.runtime.ts` với Zod schema
2. Validate tất cả required env vars
3. Call `validateRuntimeEnv()` trong `instrumentation.ts` (Next.js 15+ hook)
4. Fallback: call trong root `layout.tsx` nếu instrumentation không work
5. Add informative error messages
6. Update `.env.example` với comments

**Files to create/change:**
- `src/lib/env.runtime.ts` (new)
- `src/instrumentation.ts` (new, hoặc update existing)
- `.env.example` (add comments)

**Implementation:**
```typescript
// src/lib/env.runtime.ts
import { z } from "zod";

const RuntimeEnvSchema = z.object({
  // Database
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AI
  OPENAI_API_KEY: z.string().startsWith("sk-"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),

  // Cron
  CRON_SECRET: z.string().min(32, "CRON_SECRET must be at least 32 chars for security"),

  // Email (optional)
  RESEND_API_KEY: z.string().optional(),

  // Reddit
  REDDIT_CLIENT_ID: z.string().min(1),
  REDDIT_CLIENT_SECRET: z.string().min(1),
  REDDIT_USER_AGENT: z.string().min(1),

  // Optional
  INDIEHACKERS_API_KEY: z.string().optional(),
});

export function validateRuntimeEnv() {
  const parsed = RuntimeEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Runtime environment validation failed:");
    console.error("Missing or invalid environment variables:");
    
    const errors = parsed.error.format();
    Object.entries(errors).forEach(([key, value]) => {
      if (key !== "_errors" && value) {
        console.error(`  - ${key}: ${JSON.stringify(value)}`);
      }
    });

    console.error("\n💡 Hint: Check your .env.local file and compare with .env.example");
    process.exit(1);
  }

  console.log("✅ Runtime environment validation passed");
}
```

```typescript
// src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateRuntimeEnv } = await import("@/lib/env.runtime");
    validateRuntimeEnv();
  }
}
```

**Estimate:** 2 hours  
**Verification:**
- [ ] Remove `CRON_SECRET` from `.env.local` → `npm run dev` → crash with clear error
- [ ] Restore env var → `npm run dev` → "✅ Runtime environment validation passed"
- [ ] Deploy to Vercel Preview → verify logs show validation success

---

### C4. Rewrite README.md (Priority: P1)

**Current state:**
- README là boilerplate Next.js
- Không có setup instructions, env guide, architecture overview

**Solution:** Comprehensive README với 8 sections

**Tasks:**
1. Read existing docs (`SYSTEM_ARCHITECTURE.md`, `production-readiness.md`)
2. Write new README với structure:
   - Project Overview
   - Features
   - Tech Stack
   - Quick Start
   - Environment Variables
   - Running the Pipeline
   - Testing
   - Deployment
   - Architecture (link to docs/)
   - Contributing
3. Add badges (build status, test coverage, license)
4. Add screenshots (dashboard, opportunities page)

**Files to change:**
- `README.md`

**Template:**
```markdown
# Opportunity Hunter 🎯

AI-powered platform that discovers startup opportunities by analyzing pain points from Reddit, IH, HackerNews, and ProductHunt.

[![Tests](https://github.com/hoangnvkog/opportunity-hunter/workflows/test/badge.svg)](...)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](...)

## Features

- 🔍 **Multi-source Pain Detection** — Reddit, IndieHackers, HN, PH
- 🧠 **AI Clustering** — Group similar pain points
- 💡 **Opportunity Scoring** — Market size + demand + competition
- ✅ **AI Validation** — 4-dimension feasibility check
- 📊 **Market Evidence** — External signals (competitors, trends, TAM)
- 📈 **Forecast Engine** — Growth/momentum/pressure predictions
- 🏆 **Investment Scoring** — 7-dimension VC-grade evaluation
- 📄 **Venture Reports** — 17-section research reports
- 💰 **Investment Memos** — YC/Sequoia-style memos
- 🔔 **Alerts & Digests** — Weekly opportunities email

## Tech Stack

- **Frontend:** Next.js 16.2.7 (App Router), React, Tailwind v4, shadcn/ui
- **Backend:** Next.js API Routes, Server Actions
- **Database:** Supabase (PostgreSQL + RLS)
- **AI:** OpenAI GPT-4, NVIDIA embeddings
- **Payments:** Stripe
- **Email:** Resend
- **Deployment:** Vercel
- **Testing:** Vitest (660 tests)

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (via Supabase)
- OpenAI API key
- Stripe account (for payments)

### Installation

1. Clone the repo:
```bash
git clone https://github.com/hoangnvkog/opportunity-hunter.git
cd opportunity-hunter
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Fill in `.env.local` (see Environment Variables section)

5. Run migrations:
```bash
npx supabase db push
```

6. Start dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for full list. Required vars:

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret) | `eyJhbG...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `CRON_SECRET` | Secret for cron auth | Generate via `openssl rand -hex 32` |

## Running the Pipeline

The AI pipeline has 13 stages: Collect → Detect Pain → Cluster → Score → Validate → Evidence → Forecast → Intelligence → Investment Score → Venture Report → Investment Memo.

Run full pipeline:
```bash
npm run pipeline
```

Run specific stage:
```bash
tsx scripts/run-pipeline.ts --stage=pain-detection
```

## Testing

Run all tests:
```bash
npm test
```

Run specific test file:
```bash
npm test -- opportunities
```

Coverage report:
```bash
npm run test:coverage
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel dashboard
3. Add environment variables (all from `.env.local`)
4. Deploy

Cron jobs auto-run via `vercel.json` config.

### Manual

```bash
npm run build
npm start
```

## Architecture

See [SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md) for full details.

```
Reddit/IH/HN/PH → Collector → Raw Posts → Pain Detection → Clusters
                                                             ↓
Startup Ideas ← Investment Memo ← Venture Report ← Investment Score
```

## Contributing

PRs welcome! Please:
1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Write tests
4. Run `npm test` + `npm run type-check` + `npm run lint`
5. Commit (`git commit -m 'feat: amazing feature'`)
6. Push (`git push origin feature/amazing`)
7. Open PR

## License

MIT © 2026 Opportunity Hunter
```

**Estimate:** 2 hours  
**Verification:**
- [ ] Read through README start to finish → clear & actionable
- [ ] Follow Quick Start steps trên fresh clone → works
- [ ] Check all links (docs/, GitHub Actions badge) → no 404

---

### C5. Add vercel.json for Cron Jobs (Priority: P0)

**Current state:**
- Cron route `/api/jobs/weekly-digest` tồn tại
- **NHƯNG:** File `vercel.json` không tồn tại → cron không chạy trên Vercel

**Solution:** Tạo `vercel.json` với cron config

**Tasks:**
1. Tạo `vercel.json`
2. Add cron job cho weekly digest (every Monday 9am UTC)
3. Add security headers (optional but recommended)
4. Deploy to Vercel Preview → verify cron appears in dashboard

**Files to create:**
- `vercel.json` (new)

**Implementation:**
```json
{
  "crons": [
    {
      "path": "/api/jobs/weekly-digest",
      "schedule": "0 9 * * 1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

**Note:** Vercel Cron chỉ chạy trên Production deployment (không chạy Preview). Để test, deploy Production hoặc dùng manual trigger.

**Estimate:** 30 minutes  
**Verification:**
- [ ] Push `vercel.json` to GitHub
- [ ] Deploy to Vercel Production
- [ ] Check Vercel Dashboard → Cron Jobs tab → see "weekly-digest" schedule
- [ ] Wait for next Monday 9am UTC → check logs
- [ ] Manual test: trigger via Vercel dashboard "Run Now" button

---

### C6. Create Health Check Endpoint (Priority: P0)

**Current state:**
- `docs/production-readiness.md` references `/api/health` endpoint
- **NHƯNG:** Endpoint không tồn tại

**Solution:** Tạo `/api/health` với DB connection check

**Tasks:**
1. Tạo `src/app/api/health/route.ts`
2. Test Supabase connection (query `sources` table)
3. Return JSON với status + timestamp + service statuses
4. Return 503 nếu DB down
5. Write tests

**Files to create:**
- `src/app/api/health/route.ts` (new)
- `__tests__/api/health.test.ts` (new)

**Implementation:**
```typescript
// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";

export async function GET() {
  try {
    // Test DB connection
    const supabase = getSupabaseServiceClient();
    const { error } = await supabase.from("sources").select("id").limit(1);

    if (error) throw error;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: "up",
        app: "up",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        services: {
          database: "down",
          app: "up",
        },
      },
      { status: 503 }
    );
  }
}
```

**Tests:**
```typescript
// __tests__/api/health.test.ts
import { GET } from "@/app/api/health/route";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";

vi.mock("@/lib/supabase/service-client");

describe("GET /api/health", () => {
  it("should return 200 when database is healthy", async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    } as any);

    const response = await GET();
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.status).toBe("ok");
    expect(json.services.database).toBe("up");
  });

  it("should return 503 when database is down", async () => {
    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ error: new Error("Connection failed") }),
        }),
      }),
    } as any);

    const response = await GET();
    expect(response.status).toBe(503);

    const json = await response.json();
    expect(json.status).toBe("error");
    expect(json.services.database).toBe("down");
  });
});
```

**Estimate:** 1 hour  
**Verification:**
- [ ] Run `npm test -- api/health` → pass
- [ ] `curl http://localhost:3000/api/health` → 200 OK
- [ ] Stop Supabase → curl → 503
- [ ] Deploy Production → uptime monitor (UptimeRobot) pings `/api/health` every 5 minutes

---

### C7. Clean Up console.log Statements (Priority: P1)

**Current state:**
- 28 files có `console.log` hoặc `console.error`
- 17 occurrences trong API routes → Vercel logs spam

**Solution:** Replace với structured logger (hoặc quick fix: remove tất cả)

**Tasks:**
1. Scan all files: `grep -r "console.log" src/`
2. Option A (quick): Delete tất cả `console.log`, giữ `console.error` cho errors
3. Option B (better): Replace với `logger.info()` / `logger.error()` (thêm `pino` package)
4. Keep `console.error` trong catch blocks (acceptable cho production)
5. Add ESLint rule `no-console` warn (không block build)

**Files to change:**
- 28 files (list từ grep output)
- `.eslintrc.json` (add rule)

**Quick Fix (Option A):**
```bash
# Remove all console.log
find src/ -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i '/console\.log/d'

# Keep console.error (for actual errors)
# Manual review: ensure errors are logged
```

**Better Fix (Option B):**
```typescript
// src/lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport: process.env.NODE_ENV !== "production" 
    ? { target: "pino-pretty" } 
    : undefined,
});
```

```typescript
// Usage in API routes
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  logger.info("Pipeline triggered");
  // ...
  logger.error({ error }, "Pipeline failed");
}
```

**Estimate:** 2 hours (Option A) | 4 hours (Option B)  
**Recommendation:** Option A cho Sprint 69 (quick fix), Option B cho Sprint 70  
**Verification:**
- [ ] `grep -r "console.log" src/` → no results (except comments)
- [ ] Deploy Production → Vercel logs sạch, không spam

---

### C8. Fix TypeScript Errors in scripts/ (Priority: P1)

**Current state:**
`npm run type-check` fails với 7 errors trong `scripts/`:
```
scripts/test-provider-concurrent.mts(1,38): error TS5097: An import path can only end with a '.ts' extension...
scripts/test-provider-embeddings.mts(7,26): error TS2722: Cannot invoke an object which is possibly 'undefined'.
```

**Solution:** Fix imports + add null checks

**Tasks:**
1. Rename `.mts` files → `.ts` (if needed)
2. Fix import paths (remove `.ts` extension)
3. Add null checks cho possibly undefined
4. Option: Exclude `scripts/` từ `tsconfig.json` nếu không critical
5. Verify `npm run type-check` pass

**Files to change:**
- `scripts/test-provider-concurrent.mts`
- `scripts/test-provider-embeddings.mts`
- (+ others from type-check output)
- `tsconfig.json` (optional: add exclude)

**Fix examples:**
```typescript
// Before
import { something } from "./lib/something.ts";  // ❌
const result = possiblyUndefined();  // ❌

// After
import { something } from "./lib/something";  // ✅
const result = possiblyUndefined?.() ?? fallback;  // ✅
```

**tsconfig.json (option to exclude):**
```json
{
  "exclude": ["node_modules", "scripts/**/*"]
}
```

**Estimate:** 1 hour  
**Verification:**
- [ ] `npm run type-check` → no errors
- [ ] `npm run build` → success
- [ ] CI build pass

---

## Post-Sprint 69 Checklist

### Code Quality
- [ ] All 8 CRITICAL fixes merged to `master`
- [ ] Tests pass (660+ tests)
- [ ] Type-check pass
- [ ] Lint pass
- [ ] Build pass

### Environment Setup
- [ ] All env vars set on Vercel dashboard
- [ ] `CRON_SECRET` matches between local + Vercel
- [ ] Stripe keys (test mode → production mode)
- [ ] OpenAI billing limits set ($100/month cap)

### Pre-deploy
- [ ] Sync 2 working copies (`~/.openclaw/workspace/your/opportunity-hunter/` ↔ `~/opportunity-hunter/`)
- [ ] Git push to `master`
- [ ] Vercel auto-deploy triggered

### Deploy Verification
- [ ] Deployment logs clean (no errors)
- [ ] `/api/health` returns 200
- [ ] Auth flow works (signup + login)
- [ ] Stripe checkout test transaction
- [ ] Manual pipeline trigger → data flows end-to-end
- [ ] Cron job scheduled (check Vercel dashboard)

### Post-deploy Monitoring (First 72 hours)
- [ ] Check Vercel logs every 6 hours
- [ ] Monitor Supabase dashboard (connections, queries)
- [ ] Track OpenAI usage (cost per day)
- [ ] User signup → verify email sent
- [ ] First pipeline run → verify opportunities created

---

## Success Criteria

Sprint 69 thành công khi:
1. ✅ Tất cả 8 CRITICAL issues fixed + merged
2. ✅ Tests pass (660+)
3. ✅ Type-check + lint pass
4. ✅ Deployed to Vercel Production
5. ✅ `/api/health` returns 200
6. ✅ Auth flow works end-to-end
7. ✅ Pipeline runs successfully (manual trigger)
8. ✅ No errors trong Vercel logs sau 24h

**Outcome:** Production-ready, accepting users, monitoring errors.

---

## Timeline Estimate

| Task | Hours |
|---|---|
| C1. Stripe auth | 3h |
| C2. Rate limiting | 6h |
| C3. Env validation | 2h |
| C4. README rewrite | 2h |
| C5. vercel.json | 0.5h |
| C6. Health endpoint | 1h |
| C7. console.log cleanup | 2h |
| C8. TypeScript fixes | 1h |
| **Testing & verification** | 4h |
| **Deploy + monitoring** | 2h |
| **Buffer** | 16.5h |
| **Total** | **40 hours (1 week)** |

---

## Next Steps After Sprint 69

→ **Sprint 70-71:** HIGH priority tasks (H1–H4)
- H1: Apply RLS migration
- H2: SEO basics (robots.txt, sitemap, metadata)
- H3: Sentry integration
- H4: Test coverage cho new services

See `SPRINT_70_71_PLAN.md` for details.

---

_Plan này được tạo bởi Tô Khất Nhi 🍵 — 2026-08-06 05:40 UTC_
