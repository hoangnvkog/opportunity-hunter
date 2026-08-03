# Sprint 68+ Design Proposal

> **Ngày:** 2026-07-15
> **Tác giả:** Tô Khất Nhi 🍵
> **Trạng thái:** Draft, chờ Quốc Sư duyệt

---

## 1. Tình trạng thực tế (đã verify, không bịa)

| Metric | Giá trị | Nguồn |
|---|---|---|
| Latest commit | `c67716e` | `git log -1` |
| Sprints hoàn thành | 1–67 | MEMORY.md + sprint service dirs |
| Migrations | 44 | `ls supabase/migrations/ \| wc -l` |
| Test files | 49 | `find . -name "*.test.ts"` |
| Components | 91 | `find src/components -type f` |
| Services (top-level dirs) | 30+ | `ls src/services/` |
| DB tables | 28+ | MEMORY.md (schema kể từ Sprint 59–64) |

### Pipeline đã chạy được (verified Sprint 67)
```
Reddit → raw_posts → pain_points → clusters → opportunities →
validation → evidence → forecast → market-intelligence →
startup-score → venture-report → investment-memo →
committee (5 agents) → research agent → venture-studio →
financial projection → backtesting → portfolio
```

---

## 2. Gap giữa Spec và Reality

### 2.1 Critical — Security holes

**Verified bằng `grep "getSession\|requireUser\|auth"`:**

| Route | Auth check? |
|---|---|
| `/api/pipeline/route.ts` | ❌ KHÔNG |
| `/api/research/jobs/route.ts` | ❌ KHÔNG |
| `/api/committee/search/route.ts` | ❌ KHÔNG |

**Hậu quả:** Bất cứ ai cũng `POST /api/pipeline` là chạy full 14-stage pipeline → burn OpenAI credits + tốn DB. Đây là production blocker.

### 2.2 Spec miss — App Reviews collector

`PRODUCT_SPEC.md` Phase 1 ghi rõ:
> "Data Sources: Reddit, **App Reviews**"

Code chỉ có `src/services/reddit/` collector. Không có `app-store`, `play-store`. Phase 2 (TikTok, FB Groups) cũng chưa có.

### 2.3 Docs lạc hậu

| Doc | Vấn đề |
|---|---|
| `DATABASE_DESIGN.md` | Chỉ liệt kê 6 tables (vs 28+ thực tế) |
| `ROADMAP.md` | Chỉ đến Sprint 10 |
| `SYSTEM_ARCHITECTURE.md` | Vẽ 1 nguồn duy nhất (Reddit) |
| `DEVELOPMENT_RULES.md` | 44 dòng, quá sơ sài |

### 2.4 Service sprawl — Code organization

30+ dirs trong `src/services/`, mỗi Sprint thêm 1-2 dirs. Không có bounded context rõ ràng:
- `pipeline/` (orchestrator + reddit + pain + cluster + embeddings + opportunities + startup-ideas) — 11 files, mixed concerns
- `opportunities.ts` ở root + `src/services/opportunities/` riêng → tên trùng, dễ nhầm
- `investment-committee/` vs `lib/services/committee.service.ts` — duplicate Sprint 61 vs 67

### 2.5 Test coverage

49 test files ÷ 30+ services ≈ 1.6 tests/service. Nhiều service Sprint 56+ chưa có test (committee, research, venture-studio, financial).

---

## 3. 4 hướng đề xuất

### Direction A — Production Hardening ⭐ (đề xuất cao nhất)

**Lý do:** 67 sprints xong nhưng chưa ship được vì auth bypass. Mỗi ngày chưa deploy là mỗi ngày burn tiền server.

- **Sprint 68:** Auth middleware cho `/api/*` (pipeline, research, committee, opportunities, dashboard, evidence, forecasts, intelligence, investment, memos, backtests, financial, venture, venture-report, venture-score)
- **Sprint 69:** RLS audit + fix gaps trên `opportunities`, `raw_posts`, `pain_points`, `pain_clusters`, `opportunity_validations`, `opportunity_evidence`, `opportunity_forecasts`, `market_intelligence`, `startup_scores`, `venture_reports`, `investment_memos`, `startup_ideas`
- **Sprint 70:** Rate limiting + AI cost guard (per-user quota, daily/monthly caps, circuit breaker)
- **Sprint 71:** Observability (structured logging, metrics, error tracking qua Sentry/PostHog)

### Direction B — Data Source Expansion

Theo `PRODUCT_SPEC.md` Phase 1 + 2:

- **Sprint 68:** App Store Reviews collector (iOS App Store + Google Play Store, top 200 apps mỗi category)
- **Sprint 69:** HackerNews + Product Hunt (đã có adapter trong `research/adapters/`, cần integrate vào pipeline chính)
- **Sprint 70:** TikTok comments (cần API partnership hoặc scraping wrapper)
- **Sprint 71:** Facebook Groups (RSS bridge hoặc manual feed import)

### Direction C — Domain Refactor

Group 30+ services thành bounded contexts (DDD-lite):

```
src/domain/
  ├── discovery/      # reddit, sources, raw-posts
  ├── analysis/       # pain-points, clusters, embeddings, opportunities
  ├── validation/     # validation, evidence, forecast, market-intel
  ├── evaluation/     # startup-score, venture-report, memo, committee
  ├── creation/       # venture-studio, financial, startup-ideas
  ├── investment/     # backtesting, portfolio
  ├── research/       # research-agent + adapters
  └── platform/       # auth, billing, notifications, alerts, admin
```

- **Sprint 68:** Move `discovery/` + setup barrel exports
- **Sprint 69:** Move `analysis/` + `validation/`
- **Sprint 70:** Move `evaluation/` + deprecate duplicate committee.service
- **Sprint 71:** Move `creation/` + `investment/` + `research/`

### Direction D — AI Pipeline Evolution

- **Unified Pain Model:** Normalize pain points từ nhiều source (Reddit, App Reviews, HN) về 1 schema chung
- **Opportunity Graph:** Cluster relationships, derived opportunities (cluster A + cluster B → opportunity mới)
- **Real-time streaming:** Replace batch cron với queue + incremental processing

---

## 4. Recommendation — Direction A + C xen kẽ

Con đề xuất chạy song song, không chọn 1:

| Sprint | Track A (Security) | Track C (Refactor) |
|---|---|---|
| **68** | Auth middleware cho `/api/*` | Move `discovery/` (reddit, sources, raw-posts) |
| **69** | RLS audit + fix core tables | Move `analysis/` (pain, clusters, embeddings, opps) |
| **70** | Rate limiting + AI cost guard | Move `evaluation/` + deprecate duplicate committee |
| **71** | Observability (Sentry + metrics) | Move `creation/` + `investment/` + `research/` |
| **72** | (buffer / bugfixes) | Update docs (DATABASE_DESIGN, SYSTEM_ARCHITECTURE, ROADMAP) |
| **73** | App Reviews collector (Phase 1 từ SPEC) | — |

**Lý do:**
1. Không thể tiếp tục xây feature khi auth bypass + code không có structure
2. Sau 67 sprints, codebase đã đủ lớn — refactor sớm để dễ onboard người mới + dễ review
3. App Reviews (Phase 1 SPEC) để Sprint 73 vì cần foundation vững trước
4. Track A nhỏ (1-2 services/sprint), Track C mechanical (move files + update imports), không overlap nên chạy song song được

---

## 5. Acceptance criteria cho Sprint 68

### Track A — Auth Hardening
- [ ] `requireUser()` middleware applied to all `/api/*` POST/DELETE routes
- [ ] Service-role endpoints (cron jobs) explicitly marked + admin-only
- [ ] Unauthenticated request returns 401 (not 500)
- [ ] E2E test: `curl POST /api/pipeline` without cookie → 401
- [ ] E2E test: with valid session → 200

### Track C — Move `discovery/`
- [ ] `src/domain/discovery/` created với `reddit`, `sources`, `raw-posts` services
- [ ] Old `src/services/reddit/` + raw-posts repository → re-export từ `domain/discovery/`
- [ ] All imports updated (grep `from "@/services/reddit"` → `from "@/domain/discovery"`)
- [ ] `tsc --noEmit` clean
- [ ] `npm run build` pass
- [ ] `npm test` 601/601 still pass

### Đồng bộ
- [ ] Push lên `origin/master`
- [ ] Pull về `~/opportunity-hunter/`
- [ ] `git rev-list --left-right --count origin/master...HEAD` = `0 0`

---

## 6. Open questions cho Quốc Sư

1. **Priority:** Track A hay Track C trước? Con recommend xen kẽ nhưng nếu Quốc Sư muốn 1 track full 4 sprints trước thì cũng được.
2. **Auth strategy:** Supabase session cookie (chuẩn) hay thêm API key cho CI/cron? Cron đang dùng service-role để bypass RLS — cần guard riêng.
3. **Refactor scope:** Move 1:1 (giữ nguyên code, chỉ đổi path) hay move + clean up (rename, merge duplicate, delete dead code)?
4. **App Reviews target:** iOS only, Android only, hay cả hai? Category nào ưu tiên (Productivity, Health, Finance)?
5. **Tiếp tục Sprint 68 ngay hay chờ Quốc Sư review proposal này?**

---

_Con đợi feedback của Quốc Sư. Nếu OK thì con bắt đầu Sprint 68 ngay._
