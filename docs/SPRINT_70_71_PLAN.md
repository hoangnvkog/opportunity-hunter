# Sprint 70-71 — High Priority Tasks

> **Timeline:** 2 tuần (60 giờ)  
> **Objective:** Polish production với SEO, monitoring, RLS, và test coverage  
> **Owner:** Tô Khất Nhi 🍵  
> **Phase:** Phase 2 của Option C — Hybrid

---

## Overview

Sprint 70-71 là **Phase 2** của Option C. Production đã live sau Sprint 69, bây giờ polish với 4 HIGH priority tasks:

- **H1:** Apply RLS migration (users có thể đọc data)
- **H2:** SEO basics (Google indexing, social previews)
- **H3:** Error monitoring (Sentry integration)
- **H4:** Test coverage cho new services (Sprint 56+)

**Target:** Full production-grade quality sau 2 tuần.

---

## Sprint 70 (Week 2) — RLS + SEO

### H1. Apply RLS Migration (Priority: P0)

**Current state:**
- Migration `20260726000000_rls_audit_pipeline_tables.sql` đã viết ✅
- **NHƯNG:** Chưa commit + chưa apply
- Core tables (`opportunities`, `raw_posts`, `pain_points`, `pain_clusters`) chỉ có service_role policy
- Authenticated users KHÔNG ĐỌC ĐƯỢC → dashboard trống

**Impact:**
- Users login → dashboard empty (403 Forbidden)
- Service works via API routes (server-side) nhưng client components fail

**Tasks:**
1. Commit migration file
2. Test migration locally: `supabase db reset` → verify RLS policies applied
3. Apply to production: `supabase db push --linked` (or via Supabase dashboard)
4. Verify: authenticated user query `opportunities` table → returns data
5. Test edge cases: anonymous user → no access, wrong user → no cross-user leaks

**Files to change:**
- `supabase/migrations/20260726000000_rls_audit_pipeline_tables.sql` (commit)

**Commands:**
```bash
cd ~/opportunity-hunter  # or workspace copy

# 1. Commit migration
git add supabase/migrations/20260726000000_rls_audit_pipeline_tables.sql
git commit -m "feat(rls): apply Sprint 68 RLS audit for pipeline tables"
git push origin master

# 2. Test locally
supabase db reset
npm run dev
# Login → check dashboard → see opportunities

# 3. Apply to production
supabase db push --linked

# 4. Verify production
# Login to production app → check dashboard
```

**Verification queries:**
```sql
-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('opportunities', 'raw_posts', 'pain_points', 'pain_clusters');

-- Test as authenticated user (run via Supabase SQL Editor with RLS enabled)
SELECT COUNT(*) FROM opportunities;  -- should return > 0
```

**Estimate:** 1 hour  
**Verification:**
- [ ] Migration committed + pushed
- [ ] Local test: dashboard shows opportunities
- [ ] Production test: login → dashboard populated
- [ ] No RLS policy errors in logs

---

### H2. SEO Basics (Priority: P1)

**Current state:**
- ❌ Không có `robots.txt`
- ❌ Không có `sitemap.xml`
- ❌ Per-page metadata chỉ có root layout
- ❌ Không có OpenGraph images

**Solution:** Add Next.js 15 SEO features

**Tasks:**
1. Create `robots.ts` (allow all, disallow `/admin`)
2. Create `sitemap.ts` (dynamic sitemap from DB)
3. Add per-page `metadata` exports
4. Generate OpenGraph images (at least for homepage)
5. Add structured data (JSON-LD for Organization)
6. Test with Google Rich Results Test

**Files to create/change:**
- `src/app/robots.ts` (new)
- `src/app/sitemap.ts` (new)
- `src/app/opengraph-image.tsx` (new, or static PNG)
- `src/app/opportunities/[id]/page.tsx` (add metadata)
- `src/app/layout.tsx` (add JSON-LD)

**Implementation:**

```typescript
// src/app/robots.ts
import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/profile'],
      },
    ],
    sitemap: 'https://opportunityhunter.app/sitemap.xml',
  }
}
```

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next'
import { getSupabaseServiceClient } from '@/lib/supabase/service-client'

export default async function sitemap(): MetadataRoute.Sitemap {
  const supabase = getSupabaseServiceClient();
  
  // Fetch all public opportunities
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1000);

  const baseUrl = 'https://opportunityhunter.app';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/opportunities`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  const opportunityPages: MetadataRoute.Sitemap = (opportunities || []).map((opp) => ({
    url: `${baseUrl}/opportunities/${opp.id}`,
    lastModified: new Date(opp.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...opportunityPages];
}
```

```typescript
// src/app/opportunities/[id]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = getSupabaseServiceClient();
  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('title, description, market_size')
    .eq('id', params.id)
    .single();

  if (!opportunity) {
    return { title: 'Opportunity Not Found' };
  }

  return {
    title: `${opportunity.title} | Opportunity Hunter`,
    description: opportunity.description?.slice(0, 160),
    openGraph: {
      title: opportunity.title,
      description: opportunity.description?.slice(0, 160),
      type: 'article',
      url: `https://opportunityhunter.app/opportunities/${params.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: opportunity.title,
      description: opportunity.description?.slice(0, 160),
    },
  };
}
```

```typescript
// src/app/layout.tsx (add JSON-LD)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Opportunity Hunter',
    url: 'https://opportunityhunter.app',
    logo: 'https://opportunityhunter.app/logo.png',
    description: 'AI-powered platform discovering startup opportunities from pain points',
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**OpenGraph image (static approach):**
```bash
# Create OG image (1200x630 PNG)
# Place at: public/og-image.png

# Or dynamic via opengraph-image.tsx (Next.js 15 feature)
```

**Estimate:** 4 hours  
**Verification:**
- [ ] Visit `https://opportunityhunter.app/robots.txt` → see rules
- [ ] Visit `https://opportunityhunter.app/sitemap.xml` → see URLs
- [ ] Test OG preview: https://www.opengraph.xyz/ → paste URL → see card
- [ ] Google Rich Results Test: https://search.google.com/test/rich-results
- [ ] Submit sitemap to Google Search Console

---

## Sprint 71 (Week 3) — Monitoring + Tests

### H3. Sentry Integration (Priority: P0)

**Current state:**
- ❌ Không có error monitoring
- Production errors chỉ log vào Vercel → mất khi restart
- Không có alerting

**Solution:** Integrate Sentry for error tracking + performance monitoring

**Tasks:**
1. Create Sentry account (free tier: 5k errors/month)
2. Install `@sentry/nextjs`
3. Run Sentry wizard
4. Configure error sampling (100% errors, 10% transactions)
5. Add custom context (userId, opportunityId)
6. Test error capture (throw test error)
7. Set up alerts (Slack/Email for critical errors)

**Files to create/change:**
- `sentry.client.config.ts` (new)
- `sentry.server.config.ts` (new)
- `sentry.edge.config.ts` (new)
- `next.config.ts` (add Sentry plugin)
- `.env.example` (add `SENTRY_DSN`)

**Setup:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configuration:**
```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  debug: false,
  integrations: [
    Sentry.prismaIntegration(), // if using Prisma
  ],
});
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
  ],
});
```

**Custom context:**
```typescript
// In API routes
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
  const { user } = await requireUserAPI();
  
  Sentry.setUser({ id: user.id, email: user.email });
  Sentry.setContext("opportunity", { id: opportunityId });

  try {
    // ...
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}
```

**Test error:**
```typescript
// src/app/api/sentry-test/route.ts
export async function GET() {
  throw new Error("Sentry test error");
}
```

**Estimate:** 3 hours  
**Verification:**
- [ ] Deploy with Sentry config
- [ ] Visit `/api/sentry-test` → error appears in Sentry dashboard
- [ ] Check Sentry Issues tab → see error with context (userId, stack trace)
- [ ] Set up alert: Slack notification for new issues
- [ ] Monitor for 24h → no false positives

---

### H4. Test Coverage for New Services (Priority: P1)

**Current state:**
- 660 tests total ✅
- Services Sprint 56+ chỉ có 1-3 tests:
  - `services/investment-committee/` — 1 test file
  - `services/research/` — 0 tests
  - `services/venture-studio/` — 0 tests
  - `services/financial/` — 0 tests

**Solution:** Add comprehensive tests (happy path + errors + edge cases)

**Tasks:**
1. Write tests cho `committee.service.ts`:
   - Happy path: generate committee decision
   - Error: OpenAI API failure
   - Edge case: all agents reject
2. Write tests cho `research-agent.service.ts`:
   - Happy path: start research job
   - Error: invalid source
   - Edge case: concurrent jobs limit
3. Write tests cho `venture-studio.service.ts`:
   - Happy path: generate venture project
   - Error: missing opportunity data
   - Edge case: regenerate existing project
4. Write tests cho `financial.service.ts`:
   - Happy path: generate financial model
   - Error: invalid projections
   - Edge case: zero revenue scenario

**Files to create:**
- `__tests__/services/investment-committee/committee.service.test.ts`
- `__tests__/services/research/research-agent.service.test.ts`
- `__tests__/services/venture-studio/venture-studio.service.test.ts`
- `__tests__/services/financial/financial.service.test.ts`

**Test template:**
```typescript
// __tests__/services/investment-committee/committee.service.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CommitteeService } from "@/services/investment-committee/committee.service";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";

vi.mock("@/lib/supabase/service-client");
vi.mock("@/lib/ai/openai.provider");

describe("CommitteeService", () => {
  let service: CommitteeService;

  beforeEach(() => {
    service = new CommitteeService();
    vi.clearAllMocks();
  });

  describe("generateCommitteeDecision", () => {
    it("should generate decision with 5 agent votes", async () => {
      // Mock opportunity data
      const mockOpportunity = {
        id: "opp_123",
        title: "AI Code Review Tool",
        market_size: 1000000,
      };

      vi.mocked(getSupabaseServiceClient).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockOpportunity, error: null }),
          }),
        }),
      } as any);

      // Mock AI provider
      const mockAI = {
        generateCommitteeVote: vi.fn().mockResolvedValue({
          agent: "Market Analyst",
          vote: "BUY",
          confidence: 85,
          reasoning: "Strong market signals",
        }),
      };

      const result = await service.generateCommitteeDecision("opp_123", mockAI);

      expect(result.votes).toHaveLength(5);
      expect(result.finalDecision).toMatch(/BUY|WATCH|REJECT/);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it("should handle OpenAI API failure gracefully", async () => {
      const mockAI = {
        generateCommitteeVote: vi.fn().mockRejectedValue(new Error("API rate limit")),
      };

      await expect(
        service.generateCommitteeDecision("opp_123", mockAI)
      ).rejects.toThrow("API rate limit");
    });

    it("should aggregate votes correctly when all reject", async () => {
      const mockAI = {
        generateCommitteeVote: vi.fn().mockResolvedValue({
          vote: "REJECT",
          confidence: 90,
        }),
      };

      const result = await service.generateCommitteeDecision("opp_123", mockAI);

      expect(result.finalDecision).toBe("REJECT");
      expect(result.confidence).toBeGreaterThanOrEqual(80);
    });
  });
});
```

**Coverage targets:**
- Each service: ≥ 80% line coverage
- Happy path + at least 2 error cases + 1 edge case per method

**Estimate:** 12 hours (3h per service)  
**Verification:**
- [ ] `npm test -- services/investment-committee` → pass
- [ ] `npm test -- services/research` → pass
- [ ] `npm test -- services/venture-studio` → pass
- [ ] `npm test -- services/financial` → pass
- [ ] `npm run test:coverage` → check coverage report
- [ ] Total tests: 660 → 700+ (40+ new tests)

---

## Post-Sprint 70-71 Checklist

### Sprint 70 (Week 2)
- [ ] H1 (RLS) merged + applied to production
- [ ] H2 (SEO) merged + deployed
- [ ] `robots.txt` accessible
- [ ] `sitemap.xml` submitted to Google Search Console
- [ ] OG preview working on social platforms

### Sprint 71 (Week 3)
- [ ] H3 (Sentry) integrated + tested
- [ ] Sentry alerts configured (Slack/Email)
- [ ] H4 (Tests) written + passing
- [ ] Test coverage: 660 → 700+ tests
- [ ] All services have ≥ 3 test cases each

### Production Polish
- [ ] Zero errors in Sentry for 48h
- [ ] Google indexing 10+ pages (check Search Console)
- [ ] Dashboard loads < 2s (Vercel Analytics)
- [ ] All RLS policies working (no 403 errors)

---

## Success Criteria

Sprint 70-71 thành công khi:
1. ✅ H1-H4 hoàn thành + merged
2. ✅ Tests pass (700+ tests)
3. ✅ SEO: Google indexes pages, OG previews work
4. ✅ Monitoring: Sentry captures errors + alerts work
5. ✅ RLS: Authenticated users đọc được data
6. ✅ Production stable 7 ngày (no critical errors)

**Outcome:** Full production-grade quality, ready for scale.

---

## Timeline Estimate

| Task | Hours |
|---|---|
| **Sprint 70** | |
| H1. RLS migration | 1h |
| H2. SEO (robots + sitemap + metadata + OG) | 4h |
| Testing & verification | 3h |
| **Sprint 70 subtotal** | **8h** |
| | |
| **Sprint 71** | |
| H3. Sentry integration | 3h |
| H4. Test coverage (4 services) | 12h |
| Testing & verification | 5h |
| **Sprint 71 subtotal** | **20h** |
| | |
| **Buffer (debugging, polish)** | 32h |
| **Total Sprint 70-71** | **60 hours (2 weeks)** |

---

## Optional: MEDIUM Priority Tasks (Backlog)

Nếu còn thời gian hoặc sau Sprint 71:

### M1. next.config.ts Optimizations (2h)
- Image domains
- Compression
- Security headers
- Redirect rules

### M2. Cleanup Duplicate Committee Service (2h)
- Deprecate Sprint 61 version
- Keep Sprint 67 version
- Update imports

### M3. CI/CD Pipeline Enhancements (3h)
- Add build verification job
- Add type-check job
- Add lint job
- Add migration check

**Total MEDIUM:** 7 hours (optional, có thể làm sau Sprint 71)

---

## Combined Timeline (Sprint 69-71)

| Sprint | Focus | Hours | Week |
|---|---|---|---|
| Sprint 69 | CRITICAL fixes (C1-C8) | 40h | Week 1 |
| Sprint 70 | RLS + SEO (H1-H2) | 8h | Week 2 |
| Sprint 71 | Monitoring + Tests (H3-H4) | 20h | Week 2-3 |
| Buffer | Debug + polish | 48.5h | All |
| **TOTAL** | **Full Production-Ready** | **100h** | **2.5 weeks** |

---

## Final Deliverables

After Sprint 69-71 completion:
1. ✅ Production app live + stable
2. ✅ All CRITICAL + HIGH issues resolved
3. ✅ 700+ tests passing
4. ✅ SEO basics (indexed by Google)
5. ✅ Error monitoring (Sentry)
6. ✅ Comprehensive README
7. ✅ Health check endpoint
8. ✅ Rate limiting (10 req/hour)
9. ✅ Auth guards on all routes
10. ✅ Cron jobs running (weekly digest)

**Outcome:** Opportunity Hunter sẵn sàng scale với users.

---

_Plan này được tạo bởi Tô Khất Nhi 🍵 — 2026-08-06 05:43 UTC_
