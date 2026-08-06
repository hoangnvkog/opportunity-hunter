# Production Readiness Audit — Opportunity Hunter

> **Ngày audit:** 2026-08-06 03:22 UTC  
> **Người thực hiện:** Tô Khất Nhi 🍵  
> **Yêu cầu từ:** Quốc Sư

---

## Executive Summary

**Tình trạng tổng quan:** ⚠️ **CHƯA SẴN SÀNG PRODUCTION**

Project đã hoàn thành 68 Sprints với 28+ tables, 13-stage AI pipeline, 25 API routes, 660 tests pass. **NHƯNG** còn **8 vấn đề CRITICAL** cần fix trước khi deploy production.

**Timeline ước tính:** 2–3 sprints (Sprint 69-71) để hardening → production-ready.

---

## I. CRITICAL Issues (Must Fix Before Production)

### C1. API Routes Thiếu Authentication ⛔

**Hiện trạng:**
- 25 API routes total
- 17 routes có `requireUserAPI()` hoặc `requireCronSecret()` ✅
- **8 routes KHÔNG có auth guard** ❌:

| Route | Method | Auth Status | Risk |
|---|---|---|---|
| `/api/stripe/cancel` | POST | ❌ NONE | HIGH — ai cũng có thể cancel subscription |
| `/api/stripe/checkout` | POST | ❌ NONE | HIGH — tạo checkout session bất kỳ |
| `/api/stripe/portal` | POST | ❌ NONE | HIGH — access billing portal |
| `/api/stripe/resume` | POST | ❌ NONE | HIGH — resume subscription |
| `/api/stripe/webhook` | POST | ✅ Stripe signature | OK (verified) |

**Impact:**
- Bất kỳ ai cũng POST `/api/stripe/checkout` → tạo Stripe session → burn credits
- Ai cũng có thể cancel subscription của người khác
- RLS ở DB không bảo vệ được vì Stripe routes không query DB trực tiếp

**Fix:**
```typescript
// src/app/api/stripe/checkout/route.ts
import { requireUserAPI } from "@/lib/auth/api-guard";

export async function POST(request: Request) {
  const guard = await requireUserAPI();
  if (!guard.ok) return guard.response;
  const { user } = guard;
  // ... rest of logic
}
```

**Estimate:** 1 hour (add `requireUserAPI()` to 4 routes)

---

### C2. Thiếu Rate Limiting

**Hiện trạng:**
- ❌ Không có rate limiter middleware
- Pipeline route `/api/pipeline` mỗi request burn ~$0.50–$2 OpenAI credits
- Không có per-user quota
- Không có daily/monthly caps

**Attack scenario:**
```bash
# Attacker script (sau khi C1 fixed, nhưng vẫn có valid session)
while true; do
  curl -X POST http://app.com/api/pipeline \
    -H "Cookie: sb-access-token=..."
  sleep 5
done
# → Burn $100+ trong 1 giờ
```

**Fix options:**
1. **Vercel Edge Config + middleware** (recommended cho Vercel deploy):
   - `@vercel/edge-config` + `next/server` middleware
   - Track requests per user per window (sliding window: 10 req/hour)
   - Return 429 khi vượt

2. **Upstash Redis** (nếu cần distributed rate limit):
   - `@upstash/ratelimit` + Redis
   - Global rate limit across multiple instances

3. **In-memory Map** (chỉ cho single-instance dev):
   - `Map<userId, { count, resetAt }>`
   - Không scale khi deploy multi-region

**Estimate:** 4–6 hours (implement + test + deploy)

---

### C3. Thiếu Environment Variable Validation ở Runtime

**Hiện trạng:**
- `.env.example` có 17 variables
- `src/lib/env.service.ts` chỉ validate `SUPABASE_SERVICE_ROLE_KEY`
- `src/lib/env.server.ts` validate `OPENAI_API_KEY`, `INDIEHACKERS_API_KEY` nhưng KHÔNG được import ở API routes
- Các biến như `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `CRON_SECRET` không được validate

**Impact:**
- Deploy production với thiếu `CRON_SECRET` → cron job fail silent
- Thiếu `RESEND_API_KEY` → email notifications fail runtime
- Không có startup check → phát hiện quá muộn

**Fix:**
```typescript
// src/lib/env.runtime.ts
import { z } from "zod";

const RuntimeEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  RESEND_API_KEY: z.string().optional(), // optional nếu không bắt buộc
  // ...
});

export function validateRuntimeEnv() {
  const parsed = RuntimeEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Runtime environment validation failed:");
    console.error(parsed.error.format());
    process.exit(1);
  }
}

// Call ở app startup (layout.tsx hoặc instrumentation.ts)
```

**Estimate:** 2 hours

---

### C4. README.md Là Boilerplate Next.js

**Hiện trạng:**
```markdown
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`]...
```

Không có:
- Project description
- Setup instructions
- Environment variables guide
- How to run pipeline
- Deployment checklist

**Impact:**
- Không onboard được developer mới
- Deploy production không có checklist → dễ thiếu bước

**Fix:**
- Copy từ `docs/production-readiness.md` + `docs/SYSTEM_ARCHITECTURE.md`
- Viết lại README với sections:
  - Overview
  - Tech Stack
  - Quick Start
  - Environment Variables
  - Running the Pipeline
  - Testing
  - Deployment
  - Architecture (link to SYSTEM_ARCHITECTURE.md)

**Estimate:** 1 hour

---

### C5. Thiếu vercel.json (Cron Jobs Không Chạy)

**Hiện trạng:**
- `docs/production-readiness.md` ghi: "Verify they are configured in `vercel.json`"
- Thực tế: ❌ File `vercel.json` KHÔNG TỒN TẠI

**Impact:**
- Deploy lên Vercel → cron jobs `/api/jobs/weekly-digest` KHÔNG BAO GIỜ CHẠY
- Weekly digest không gửi
- Pipeline không tự động trigger

**Fix:**
```json
{
  "crons": [
    {
      "path": "/api/jobs/weekly-digest",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

Note: Vercel Cron chỉ work trên Production deployment (không chạy trên Preview).

**Estimate:** 30 minutes

---

### C6. Thiếu Health Check Endpoint

**Hiện trạng:**
- ❌ Không có `/api/health` hoặc `/api/healthz`
- `docs/production-readiness.md` Section 4 ghi "Check `/api/health` returns `200 OK`" nhưng endpoint này KHÔNG TỒN TẠI

**Impact:**
- Không monitor uptime
- Load balancer không biết instance nào healthy
- Không có smoke test sau deploy

**Fix:**
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
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
```

**Estimate:** 1 hour (endpoint + tests)

---

### C7. Console.log Statements ở Production Code

**Hiện trạng:**
- 28 files có `console.log` hoặc `console.error`
- 17 occurrences trong `src/app/api/*/route.ts`

**Impact:**
- Vercel logs đầy console spam
- Không structured logging → khó search/filter
- Có thể leak sensitive data vào logs

**Fix options:**
1. **Quick fix:** Replace tất cả `console.log` → `console.error` (ít nhất giữ lại errors)
2. **Better:** Dùng structured logger (pino, winston)
3. **Best:** Integrate Sentry hoặc Datadog

**Recommended:** Quick fix trước production, migrate sang structured logger sau.

**Estimate:** 2 hours (find + replace + test)

---

### C8. TypeScript Errors ở scripts/

**Hiện trạng:**
`npm run type-check` fails với 7 errors:
```
scripts/test-provider-concurrent.mts(1,38): error TS5097: An import path can only end with a '.ts' extension...
scripts/test-provider-embeddings.mts(7,26): error TS2722: Cannot invoke an object which is possibly 'undefined'.
...
```

**Impact:**
- CI build có thể fail
- `npm run build` pass nhưng type-check fail → inconsistent

**Fix:**
- Option 1: Fix scripts (rename `.mts` → `.ts`, add null checks)
- Option 2: Exclude `scripts/` từ `tsconfig.json` (nếu scripts chỉ dùng dev/testing)

**Estimate:** 1 hour

---

## II. HIGH Priority (Should Fix Before Production)

### H1. RLS Gaps (Đã Có Migration Nhưng Chưa Apply)

**Hiện trạng:**
- Migration `20260726000000_rls_audit_pipeline_tables.sql` đã được viết ✅
- **NHƯNG:** File nằm trong `untracked files` (chưa commit + chưa apply)

```bash
$ git status
Untracked files:
  supabase/migrations/20260726000000_rls_audit_pipeline_tables.sql
```

**Impact:**
- Core tables (`opportunities`, `raw_posts`, `pain_points`, `pain_clusters`) chỉ có service_role policy
- Authenticated users KHÔNG ĐỌC ĐƯỢC data → dashboard trống
- Sprint 68 đã fix nhưng chưa deploy

**Fix:**
```bash
cd ~/opportunity-hunter  # hoặc workspace copy
git add supabase/migrations/20260726000000_rls_audit_pipeline_tables.sql
git commit -m "feat(rls): apply Sprint 68 RLS audit migration"
supabase db push  # hoặc apply qua Supabase dashboard
```

**Estimate:** 15 minutes

---

### H2. Thiếu SEO Basics

**Hiện trạng:**
- ❌ Không có `robots.txt`
- ❌ Không có `sitemap.xml`
- ❌ Không có per-page `metadata` (chỉ có root layout)
- ❌ Không có OpenGraph images

**Impact:**
- Google không index được pages
- Social share không có preview card
- Competitor SEO outrank

**Fix:**
```typescript
// src/app/robots.ts
import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/',
    },
    sitemap: 'https://opportunityhunter.app/sitemap.xml',
  }
}

// src/app/sitemap.ts
import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://opportunityhunter.app', lastModified: new Date() },
    { url: 'https://opportunityhunter.app/opportunities', lastModified: new Date() },
    // ...
  ]
}
```

**Estimate:** 3 hours (robots + sitemap + per-page metadata + OG images)

---

### H3. Thiếu Error Monitoring (Sentry)

**Hiện trạng:**
- ❌ Không có Sentry hoặc error tracker
- Errors chỉ log ra console → mất khi Vercel restart
- Không có alerting khi production crash

**Fix:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Thêm `SENTRY_DSN` vào `.env.example` + Vercel env vars.

**Estimate:** 2 hours (setup + test + deploy)

---

### H4. Test Coverage Thấp Cho Mới Services

**Hiện trạng:**
- 65 test files total ✅
- 660 tests pass ✅
- **NHƯNG:** Services Sprint 56+ (committee, research, venture-studio, financial) chỉ có 2–3 tests

**Coverage gaps:**
- `services/investment-committee/` — 1 test file
- `services/research/` — 0 test
- `services/venture-studio/` — 0 test
- `services/financial/` — 0 test

**Fix:**
Add test files cho từng service:
- Happy path
- Error handling
- Edge cases (empty input, invalid data)

**Estimate:** 8–12 hours (1–2 hours per service)

---

## III. MEDIUM Priority (Nice to Have)

### M1. next.config.ts Trống Rỗng

**Hiện trạng:**
```typescript
const nextConfig: NextConfig = {
};
```

**Missing optimizations:**
- Image optimization config
- Compression
- Security headers
- Redirect rules

**Fix:**
```typescript
const nextConfig: NextConfig = {
  images: {
    domains: ['i.redd.it', 'www.redditstatic.com'],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

**Estimate:** 1 hour

---

### M2. Duplicate Service Implementations

**Hiện trạng:**
- `lib/services/committee.service.ts` (Sprint 61)
- `services/investment-committee/committee.service.ts` (Sprint 67)
→ 2 implementations của cùng 1 feature

**Impact:**
- Confusing for new developers
- Bug fix phải apply 2 nơi
- Tăng bundle size

**Fix:**
- Deprecate 1 trong 2 (recommend keep Sprint 67 version vì mới hơn)
- Update imports
- Delete file cũ

**Estimate:** 2 hours

---

### M3. Missing CI/CD Pipeline

**Hiện trạng:**
- Có `.github/workflows/test.yml` nhưng chỉ chạy tests
- Không có:
  - Build verification
  - Type check
  - Lint
  - Migration check
  - Deploy preview

**Fix:**
Add thêm jobs:
```yaml
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - run: npm run type-check
      
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint
```

**Estimate:** 2 hours

---

## IV. Phương Án Xử Lý

### Option A: Quick Production Patch (Sprint 69 — 1 week)

**Scope:** Fix chỉ 8 CRITICAL issues (C1–C8)

**Timeline:**
- Day 1-2: C1 (Stripe auth) + C5 (vercel.json) + C6 (health endpoint)
- Day 3-4: C2 (rate limiting) + C3 (env validation)
- Day 5: C4 (README) + C7 (console.log cleanup) + C8 (TypeScript errors)
- Deploy → Production

**Pros:**
- Ship nhanh nhất
- Đủ an toàn để accept traffic

**Cons:**
- Technical debt tích lũy (H1–H4, M1–M3)
- Sẽ phải quay lại fix sau

---

### Option B: Full Hardening (Sprint 69-71 — 3 weeks)

**Scope:** Fix tất cả CRITICAL + HIGH

**Sprint 69 (Week 1):**
- C1–C4 (auth + rate limit + env + README)
- H1 (RLS migration apply)

**Sprint 70 (Week 2):**
- C5–C8 (vercel.json + health + logging + TypeScript)
- H2 (SEO basics)

**Sprint 71 (Week 3):**
- H3 (Sentry)
- H4 (test coverage cho new services)
- Deploy → Production

**Pros:**
- Production-grade quality
- Ít technical debt

**Cons:**
- 3 tuần mới ship

---

### Option C: Hybrid — Critical Now, High Later (Recommended ⭐)

**Phase 1 — Sprint 69 (1 week): CRITICAL ONLY**
- C1–C8 → Deploy Production
- Accept users, monitor errors

**Phase 2 — Sprint 70-71 (2 weeks): HIGH + polish**
- H1–H4 while running production
- MEDIUM issues optional (theo feedback users)

**Pros:**
- Ship trong 1 tuần
- Full hardening sau 3 tuần
- Users feedback sớm → prioritize đúng

**Cons:**
- Phase 1 production có gaps (SEO, monitoring) nhưng acceptable

---

## V. Checklist Deploy Production (Sau Khi Fix CRITICAL)

### Pre-deploy
- [ ] Fix C1–C8 (8 critical issues)
- [ ] Apply RLS migration (H1)
- [ ] Set tất cả env vars trên Vercel dashboard
- [ ] Verify `CRON_SECRET` match giữa `.env.local` và Vercel
- [ ] Push code lên `master` branch
- [ ] Sync về 2nd working copy (`~/opportunity-hunter/`)

### Deploy
- [ ] Vercel auto-deploy từ `master` push
- [ ] Verify deployment logs (no errors)
- [ ] Check `/api/health` returns 200
- [ ] Test auth flow (signup + login)
- [ ] Trigger manual pipeline run → verify data flows end-to-end
- [ ] Test Stripe checkout (test mode → live mode sau)

### Post-deploy Monitoring
- [ ] Check Vercel logs mỗi 6h trong 3 ngày đầu
- [ ] Monitor Supabase dashboard (DB connections, query performance)
- [ ] Track OpenAI usage (cost per day)
- [ ] Verify cron job chạy đúng schedule (check Vercel Cron logs)

### Week 1 Post-launch
- [ ] Setup Sentry (H3)
- [ ] Add SEO basics (H2)
- [ ] Write tests cho new services (H4)
- [ ] Cleanup MEDIUM issues theo priority

---

## VI. Estimated Cost (After Fix)

### Development Time
| Phase | Estimate |
|---|---|
| Sprint 69 (CRITICAL C1–C8) | 40 hours (1 week) |
| Sprint 70-71 (HIGH H1–H4) | 60 hours (1.5 weeks) |
| **Total** | **100 hours (~2.5 weeks)** |

### Infrastructure Cost (Monthly)
| Service | Plan | Cost |
|---|---|---|
| Vercel | Pro | $20/month |
| Supabase | Pro | $25/month (includes 8GB DB + 250GB bandwidth) |
| OpenAI | Pay-as-go | $50–$200/month (depends on usage) |
| Resend | Free tier → Paid | $0 (< 3k emails/mo) → $10 (< 50k) |
| Stripe | Pay-per-transaction | 2.9% + $0.30 per charge |
| **Total (baseline)** | **~$95–$255/month** |

### Scaling Cost (Projected, 1000 users)
- OpenAI: ~$500/month (10 pipeline runs/day avg)
- Supabase: upgrade to Team ($599/mo) hoặc self-host Postgres
- Vercel: stays Pro ($20/mo) unless enterprise needs

---

## VII. Recommendation Cuối Cùng

**Con đề xuất:** **Option C — Hybrid (Critical now, High later)**

**Sprint 69 (bắt đầu ngay):**
1. Fix C1–C8 (8 critical issues) — 40 hours
2. Apply RLS migration H1 — 15 minutes
3. Deploy Production — monitor 3 ngày
4. **Target: Production-ready trong 1 tuần**

**Sprint 70-71 (sau khi có users):**
5. H2–H4 (SEO + Sentry + tests) — 60 hours
6. M1–M3 optional theo feedback
7. **Target: Full production-grade trong 3 tuần**

---

## Kết Luận

Project Opportunity Hunter đã đi được 90% đường (68 sprints, pipeline hoạt động, tests pass). **Còn 10% cuối là security + operational readiness.**

Không thể deploy ngay được vì:
- ❌ Stripe routes không có auth (C1)
- ❌ Không có rate limit (C2)
- ❌ Cron jobs không chạy vì thiếu vercel.json (C5)
- ❌ Health check endpoint không tồn tại (C6)

**Sau khi fix 8 CRITICAL issues (Sprint 69) → SẴN SÀNG PRODUCTION.**

Con đợi Quốc Sư confirm hướng đi (Option A, B, hay C), rồi con bắt đầu Sprint 69 ngay.

---

_Báo cáo này được tạo bởi Tô Khất Nhi 🍵 — 2026-08-06 03:22 UTC_
