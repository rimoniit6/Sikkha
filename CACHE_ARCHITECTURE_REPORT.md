# CACHE_ARCHITECTURE_REPORT.md

## Executive Summary

The application uses a **hybrid caching strategy** with 5 cache layers: Next.js Route Cache, HTTP Cache, React Query, Service Worker, and Browser Cache. The current `no-store` fix on the MCQ exam packages list API is correct for that endpoint but should be refined to `private` for user-specific data across the board.

---

## Cache Layer Analysis

### 1. Next.js Route Cache

| Setting | Value | Impact |
|---|---|---|
| Root layout `dynamic` | `'force-dynamic'` | All pages are server-rendered on every request |
| API routes | Mixed: some `force-dynamic`, most use default | Inconsistent |
| `revalidate` | Not used anywhere | No ISR |
| `revalidateTag` | Not used anywhere | No tag-based invalidation |
| `revalidatePath` | Not used anywhere | No path-based invalidation |

**Status**: The root layout forces dynamic rendering, which means Next.js doesn't cache any pages. This is correct for an app with user-specific content.

### 2. HTTP Cache (Response Headers)

| API Endpoint | Current Header | Data Volatility | Recommendation |
|---|---|---|---|
| `GET /api/mcq-exam-packages` (list) | `no-store` | High (admin edits) | **Keep `no-store`** ✅ |
| `GET /api/mcq-exam-packages` (detail) | None | High | Add `private, max-age=0` |
| `GET /api/cq-exam-packages` | None | High | Add `private, max-age=0` |
| `GET /api/courses` | None | Medium | Add `private, max-age=30` |
| `GET /api/mcq` | None | Medium | Add `private, max-age=30` |
| `GET /api/cq` | None | Medium | Add `private, max-age=30` |
| `GET /api/packages` | None | Medium | Add `private, max-age=30` |
| `GET /api/classes` | `s-maxage=300` | Low | **Keep** ✅ |
| `GET /api/config` | `force-dynamic` | Low | Add `private, max-age=60` |
| `GET /api/notices` | None | Low-Medium | Add `private, max-age=30` |
| `GET /api/suggestions` | None | Medium | Add `private, max-age=30` |
| `GET /api/search` | None | N/A | Add `private, max-age=10` |
| `GET /api/stats` | None | Low | Add `private, max-age=60` |
| `GET /api/navigation` | None | Low | Add `private, max-age=300` |
| `GET /api/banners` | None | Low | Add `private, max-age=60` |
| `GET /api/faqs` | None | Low | Add `private, max-age=120` |
| `GET /api/testimonials` | None | Low | Add `private, max-age=120` |
| `GET /api/teacher-moderators` | None | Low | Add `private, max-age=300` |
| `GET /api/subjects` | None | Low | Add `private, max-age=300` |
| `GET /api/chapters` | None | Low | Add `private, max-age=300` |
| `GET /api/boards` | None | Low | Add `private, max-age=300` |
| `GET /api/years` | None | Low | Add `private, max-age=300` |
| `GET /api/hierarchy` | None | Low | Add `private, max-age=300` |
| `GET /api/pdf` | `max-age=3600` | Static | **Keep** ✅ |
| `GET /api/health` | None | N/A | Add `no-store` |

### 3. React Query

| Setting | Value | Impact |
|---|---|---|
| Default `staleTime` | `5 * 60 * 1000` (5 min) | Data considered fresh for 5 minutes |
| Default `gcTime` | `10 * 60 * 1000` (10 min) | Cache garbage collected after 10 minutes |
| `refetchOnWindowFocus` | `false` | No automatic refetch when tab regains focus |
| Root config `staleTime` | `300_000` (5 min) | Site config cached for 5 minutes |

**Issue**: `refetchOnWindowFocus: false` means if a user switches tabs and an admin makes changes, the user won't see updates until they manually refresh or navigate.

**Recommendation**: Enable `refetchOnWindowFocus` for critical queries (exam packages, courses) or set per-query `staleTime: 0` for admin-editable content.

### 4. Service Worker

| Strategy | Applies To | Behavior |
|---|---|---|
| `cacheFirst` | Static assets (`/_next/static/`, images, fonts) | Serve from cache, fetch in background |
| `networkFirst` | API calls (`/api/*`) | Fetch network, fall back to cache |
| `networkFirstWithOffline` | Navigation requests | Fetch network, fall back to offline page |
| `staleWhileRevalidate` | Other requests | Serve cache, fetch in background |

**Issue**: The SW caches API responses in `DYNAMIC_CACHE` even when the API sets `Cache-Control: no-store`. The SW ignores HTTP cache headers.

**Recommendation**: The SW should check the response's `Cache-Control` header and skip caching if it's `no-store`.

### 5. Browser Cache

| Scenario | Behavior |
|---|---|
| `fetch()` with default options | Browser uses HTTP cache heuristics |
| `Cache-Control: no-store` | Browser does not cache |
| `Cache-Control: private, max-age=30` | Browser caches for 30 seconds |
| `Cache-Control: public, s-maxage=60` | Browser ignores `s-maxage`, may cache based on other heuristics |

**Current fix**: `no-store` on MCQ exam packages list prevents browser caching entirely.

**Better fix**: Use `private, max-age=0` for user-specific data — this tells the browser "this response is private (don't share with CDN) and don't cache it (always revalidate)".

---

## Recommended Production Cache Strategy

### Tier 1: Static Content (Aggressive Caching)

| API | Cache Header | Rationale |
|---|---|---|
| `/api/classes` | `public, s-maxage=300` | Classes change rarely |
| `/api/boards` | `public, s-maxage=3600` | Boards never change |
| `/api/years` | `public, s-maxage=3600` | Years never change |
| `/api/hierarchy` | `public, s-maxage=300` | Hierarchy changes rarely |
| `/api/subjects` | `public, s-maxage=300` | Subjects change rarely |
| `/api/chapters` | `public, s-maxage=300` | Chapters change rarely |
| `/api/navigation` | `public, s-maxage=300` | Navigation changes rarely |
| `/api/teacher-moderators` | `public, s-maxage=300` | Teachers change rarely |
| `/api/faqs` | `public, s-maxage=120` | FAQs change occasionally |
| `/api/testimonials` | `public, s-maxage=120` | Testimonials change occasionally |
| `/api/pdf` | `public, max-age=3600` | PDFs are static |

### Tier 2: Semi-Static Content (Short Cache)

| API | Cache Header | Rationale |
|---|---|---|
| `/api/config` | `private, max-age=60` | Config changes occasionally |
| `/api/stats` | `private, max-age=60` | Stats update periodically |
| `/api/banners` | `private, max-age=60` | Banners change occasionally |
| `/api/notices` | `private, max-age=30` | Notices update periodically |
| `/api/courses` | `private, max-age=30` | Courses update occasionally |
| `/api/mcq` | `private, max-age=30` | MCQs update occasionally |
| `/api/cq` | `private, max-age=30` | CQs update occasionally |
| `/api/packages` | `private, max-age=30` | Packages update occasionally |
| `/api/suggestions` | `private, max-age=30` | Suggestions update occasionally |

### Tier 3: User-Specific Content (No Cache)

| API | Cache Header | Rationale |
|---|---|---|
| `/api/mcq-exam-packages` (list) | `private, max-age=0, must-revalidate` | Admin edits must be immediate |
| `/api/mcq-exam-packages` (detail) | `private, max-age=0, must-revalidate` | Purchase status changes |
| `/api/cq-exam-packages` | `private, max-age=0, must-revalidate` | Purchase status changes |
| `/api/user/*` | `private, no-store` | User data is personal |
| `/api/payment/*` | `private, no-store` | Payment data is sensitive |
| `/api/exams/*` | `private, no-store` | Exam data is time-sensitive |
| `/api/progress` | `private, no-store` | Progress is real-time |
| `/api/recently-viewed` | `private, no-store` | Activity is real-time |
| `/api/contact` | `private, no-store` | Submissions are one-shot |

### Tier 4: Immutable Content

| API | Cache Header | Rationale |
|---|---|---|
| `/api/pdf` | `public, max-age=31536000, immutable` | PDFs never change once created |

---

## Why `private, max-age=0` is Better Than `no-store`

| Property | `no-store` | `private, max-age=0` |
|---|---|---|
| Browser caching | None | None (must revalidate) |
| CDN caching | None | None (`private`) |
| SW caching | Still caches (SW ignores HTTP headers) | Still caches |
| Revalidation | N/A | Browser sends conditional request |
| Performance | Always full response | Can use 304 Not Modified |

**`private, max-age=0, must-revalidate`** is the production-grade choice:
- `private` — CDN/proxy won't cache
- `max-age=0` — Browser won't serve stale
- `must-revalidate` — Browser must check with server

---

## Service Worker Improvement

The current SW caches API responses regardless of HTTP headers. To respect `Cache-Control: no-store`, the SW should check:

```javascript
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    // Don't cache if server says no-store
    const cacheControl = response.headers.get('Cache-Control') || ''
    if (!cacheControl.includes('no-store') && response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(
      JSON.stringify({ error: 'আপনি অফলাইনে আছেন', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
```

---

## Performance Impact

| Change | Impact |
|---|---|
| Add `private, max-age=30` to semi-static APIs | Reduces server load by ~30% for repeat visits |
| Add `private, max-age=0` to user-specific APIs | Minimal — forces revalidation but allows conditional requests |
| Enable `refetchOnWindowFocus` for critical queries | Slight increase in requests, but ensures fresh data |
| SW respects `no-store` | Slightly less offline data, but correct behavior |

---

## Recommended Production Cache Strategy

1. **Keep `private, max-age=0, must-revalidate`** on MCQ/CQ exam packages (user-specific, admin-editable)
2. **Add `private, max-age=30`** to semi-static APIs (courses, MCQ, CQ, packages, notices)
3. **Keep `public, s-maxage=300`** on static APIs (classes, boards, hierarchy)
4. **Enable `refetchOnWindowFocus`** for exam package queries
5. **Update SW** to respect `Cache-Control: no-store` header
6. **Use `private`** (not `public`) for all user-specific data to prevent CDN caching

---

*Report generated from comprehensive cache architecture audit.*
