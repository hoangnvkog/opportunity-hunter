# Test Report — 2026-07-06

## Tổng quan

| Hạng mục | Kết quả |
|----------|---------|
| Build | ✅ Pass (exit 0) |
| Test suite | ✅ 48/48 files pass, 601/601 tests pass |
| Dev server | ⚠️ Chạy trên port **3001** (3000 bị chiếm) |

---

## 1. Routes — Kết quả test

### ✅ Trang chính (200 OK)
| Route | Ghi chú |
|-------|---------|
| `/` | Dashboard trang chủ |
| `/dashboard` | Dashboard chính (200, nhưng data rỗng) |
| `/opportunities` | Danh sách opportunities (200, data rỗng) |
| `/login` | Đăng nhập |
| `/signup` | Đăng ký |

### ⚠️ Protected Routes (307 → /login)
Các trang này redirect về `/login` vì chưa đăng nhập — **đúng hành vi** (middleware kiểm tra auth):
- `/saved`, `/watchlists`, `/alerts`, `/digests`, `/profile`, `/pricing`, `/settings/billing`

### ❌ Routes bị lỗi 500

#### Lỗi A: `getSupabaseBrowserClient()` gọi trên server
- **Affected:** `/insights`
- **Root cause:** `UserMenu` (client component) gọi `getSupabaseBrowserClient()` nhưng Next.js SSR render nó trên server
- **Fix:** `UserMenu` cần dùng `getSupabaseServerClient()` khi render trên server, hoặc chuyển sang dynamic import với `ssr: false`

#### Lỗi B: Lucide icons truyền từ Server → Client components
- **Affected:** `/admin`, `/admin/analytics`, `/admin/memos`, `/admin/revenue`
- **Root cause:** Server components truyền `icon={Users}` (Lucide function) vào `MetricCard` ("use client"). Next.js 16 cấm truyền functions từ server sang client.
- **Fix:** Chuyển `MetricCard` thành server component, hoặc dùng string-based icon mapping (truyền tên icon, render trong client)

#### Lỗi C: Bảng Supabase chưa tồn tại trên database live
- **Affected:** `/admin/backtesting`, `/admin/evidence`, `/admin/forecasts`, `/admin/intelligence`, `/admin/investment`, `/admin/memos`
- **Missing tables:** `opportunity_backtests`, `opportunity_evidence`, `opportunity_forecasts`, `market_intelligence`, `startup_scores`, `investment_memos`, `venture_reports`
- **Root cause:** Migrations tồn tại trong `supabase/migrations/` nhưng chưa được apply lên database production
- **Fix:** Chạy `supabase db reset` hoặc apply migrations thủ công

---

## 2. API Routes

| Status | Route | Ghi chú |
|--------|-------|---------|
| ✅ 200 | `/api/dashboard` | Data rỗng (chưa có opportunities) |
| ✅ 200 | `/api/opportunities` | `[]` |
| ✅ 200 | `/api/committee/search` | `{"ok":true,"data":[],"count":0}` |
| ✅ 200 | `/api/research/jobs` | `{"ok":true,"data":[],"count":0}` |
| ✅ 200 | `/api/digests/pending-count` | `{"count":0}` |
| ❌ 500 | `/api/opportunities/1` | "Failed to fetch opportunity" (bảng missing) |
| ❌ 500 | `/api/investment-memos/search` | "Failed to search investment memos" |
| ❌ 500 | `/api/backtests` | "Failed to fetch backtests" |
| 🔒 401 | `/api/portfolio/export` | Unauthorized (cần auth) |
| ⚠️ 405 | `/api/pipeline` | Method not allowed (POST only) |

---

## 3. Test Suite

```
Test Files:  48 passed (48)
Tests:      601 passed (601)
Duration:   ~3.5s
```

**Kết quả: 100% pass.** Không có test failures.

---

## 4. Reddit Ingestion

```
Reddit fetch failed: 403 Blocked
Reddit unavailable — returning empty result
```

Reddit API bị chặn (403). Không có data mới. Đây là nguyên nhân chính khiến dashboard rỗng.

---

## 5. Tổng kết các vấn đề cần xử lý

### 🔴 Critical (blocking user-facing features)
1. **Bảng Supabase chưa apply** — 7 bảng migrations chưa chạy lên database → 6 admin pages + nhiều API routes bị 500
2. **UserMenu SSR error** — `/insights` page bị 500 vì `getSupabaseBrowserClient()` gọi trên server

### 🟡 Medium
3. **Lucide icons truyền server→client** — 4 admin pages bị 500 do `MetricCard` nhận function props
4. **Reddit 403** — Không ingest được data mới → dashboard rỗng
5. **Port 3000 bị chiếm** — Dev server chạy trên 3001 (không phải lỗi code, nhưng bất tiện)

### 🟢 Low / Already known
6. **Test suite pass hoàn toàn** — Không có vấn đề gì
7. **Build pass** — Không có lỗi compile
8. **Protected routes redirect đúng** — 307 → /login là hành vi đúng

---

## 6. Khuyến nghị

1. **Apply migrations:** `supabase db reset` hoặc manual apply cho 7 bảng missing
2. **Fix UserMenu:** Dùng `getSupabaseServerClient()` hoặc `dynamic(() => ..., { ssr: false })`
3. **Fix MetricCard:** Chuyển icon prop sang string-based approach
4. **Reddit alternative:** Xem xét dùng Reddit RSS hoặc API khác thay vì Reddit API trực tiếp (bị rate-limit/block)
5. **Kill process trên port 3000:** `lsof -ti:3000 | xargs kill` để dùng port mặc định
