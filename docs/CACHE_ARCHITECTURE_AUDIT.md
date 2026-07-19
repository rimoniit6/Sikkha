# Production Cache Architecture Audit

**Project:** Sikkha - Online Learning Platform  
**Date:** 2026-07-19  

---

## Cache Architecture Score: 74/100

---

## Executive Summary

The caching architecture uses a multi-layer approach: React Query (client), in-memory caches (server), HTTP cache headers (CDN/browser), and content version counters (invalidation). The system is functional but has gaps: several public APIs lack cache headers, some in-memory caches have no TTL, and the config API runs on every request despite rarely changing.

**Caching Layers Found:**

| Layer | Technology | Status |
|-------|-----------|--------|
| Client | React Query (5min staleTime) | PASS |
| Server In-Memory | Map-based with TTL | PARTIAL |
| HTTP Cache | Cache-Control headers | PARTIAL |
| CDN Cache | CDN-Cache-Control headers | PARTIAL |
| Browser Cache | s-maxage + stale-while-revalidate | PARTIAL |
| Cache Invalidation | Content version counters | PASS |

---

## Cache Inventory

### In-Memory Caches (Server-Side)

| Cache | Location | TTL | Invalidation | Assessment |
|-------|----------|-----|-------------|------------|
| Permission Cache | `auth.ts:81-107` | 60s | `invalidatePermissionCache()` | PASS |
| CSRF Setting Cache | `csrf.ts:25-79` | 30s | `invalidateCsrfCache()` | PASS |
| Rate Limit Cache | `rate-limit.ts:9-33` | 5min | Auto-refresh | PASS |
| Hierarchy Labels | `hierarchy-labels.ts:6-67` | 5min | `invalidateServerHierarchyCache()` | PASS |
| Content Version | `cache-invalidate.ts:1-32` | Infinite | Increment counter | WARNING |
| Suggestion Cache | `suggestion-cache.ts:1-13` | Infinite | Never invalidated | WARNING |
| Notice Cache | `notice-cache.ts:1-35` | Infinite | Never invalidated | WARNING |
| Analytics Cache | `analytics-cache.ts:1-65` | Configurable | `invalidate()` / `invalidateAll()` | PASS |
| MathML Cache | `mathml-service.ts:32-56` | Infinite (500 max) | `clearMathCache()` | PASS |
| JWT Secret Cache | `auth/jwt.ts:93-99` | Infinite | Never changes | PASS |

### HTTP Cache Headers (Public APIs)

| API Route | Cache Header | TTL | Assessment |
|-----------|-------------|-----|------------|
| `/api/classes` | `public, s-maxage=300, stale-while-revalidate=600` | 5min | PASS |
| `/api/navigation` | `cacheHeaders.public.long` (1h) | 1hr | PASS |
| `/api/faqs` | `cacheHeaders.public.long` (1h) | 1hr | PASS |
| `/api/testimonials` | `cacheHeaders.public.long` (1h) | 1hr | PASS |
| `/api/boards` | `cacheHeaders.public.long` (1h) | 1hr | PASS |
| `/api/years` | `cacheHeaders.public.long` (1h) | 1hr | PASS |
| `/api/banners` | `cacheHeaders.public.short` (30s) | 30s | PASS |
| `/api/notices` | `cacheHeaders.public.medium` (5min) | 5min | PASS |
| `/api/stats` | `cacheHeaders.public.medium` (5min) | 5min | PASS |
| `/api/hierarchy/metadata` | `cacheHeaders.public.long` (1h) | 1hr | PASS |
| `/api/config` | **NO CACHE HEADERS** | None | **FAIL** |
| `/api/mcq` | **NO CACHE HEADERS** | None | WARNING |
| `/api/cq` | **NO CACHE HEADERS** | None | WARNING |
| `/api/lectures` | **NO CACHE HEADERS** | None | WARNING |
| `/api/subjects` | **NO CACHE HEADERS** | None | WARNING |
| `/api/chapters` | **NO CACHE HEADERS** | None | WARNING |

### React Query Configuration

```typescript
// QueryProvider.tsx
defaultOptions: {
  queries: {
    staleTime: 5 * 60 * 1000,      // 5 minutes
    gcTime: 10 * 60 * 1000,        // 10 minutes
    refetchOnWindowFocus: false,     // No refetch on focus
    retry: failureCount < 2,         // Retry twice on 5xx
  },
}
```

**Assessment:** PASS — reasonable defaults for an educational platform.

---

## Detailed Findings

### CRITICAL: Config API runs on every page load with no cache

**File:** `src/app/api/config/route.ts:17`

```typescript
export const dynamic = 'force-dynamic'  // ← Every request hits the database
```

The config API fetches ALL SiteSetting rows from the database on every request. This is called on every page load via `fetchSiteConfig()` in the root layout.

**Impact:** Every page load → 1 database query for all settings. With 100 settings, that's ~50KB of data transferred.

**Fix:** Add `cacheHeaders.public.medium` (5min) or use server-side in-memory cache.

---

### HIGH: Suggestion and Notice caches have no TTL

**File:** `src/lib/suggestion-cache.ts:5-13`

```typescript
let suggestionsCache: SuggestionCacheItem[] = []

export function setSuggestionsCache<T extends SuggestionCacheItem>(suggestions: T[]) {
  suggestionsCache = suggestions  // ← Never expires
}
```

Same issue in `notice-cache.ts:21-33`. These caches grow indefinitely and never refresh.

**Impact:** If admin updates suggestions/notices, the stale cache persists until server restart.

**Fix:** Add TTL or explicit invalidation on admin writes.

---

### HIGH: Public content APIs (MCQ, CQ, Lecture) lack cache headers

**File:** `src/app/api/mcq/route.ts:280-289`

```typescript
return NextResponse.json({
  success: true,
  data: { questions },
  pagination: { ... },
})  // ← No Cache-Control header
```

MCQ, CQ, and Lecture listing endpoints return data without any cache headers. CDN and browser will not cache these responses.

**Impact:** Every user request hits the database. No CDN caching for frequently accessed content.

**Fix:** Add `cacheHeaders.public.short` (30s) or `cacheHeaders.public.medium` (5min) for published content.

---

### MEDIUM: Content version cache never expires

**File:** `src/lib/cache-invalidate.ts:1-16`

```typescript
const store = new Map<string, number>()  // ← No TTL, no size limit

export async function invalidateContentCache(contentType: CacheableContent): Promise<void> {
  const key = `${CONTENT_VERSION_PREFIX}${contentType}`
  store.set(key, (store.get(key) ?? 0) + 1)
}
```

The version counter increments forever. While this is correct for invalidation, the Map itself never cleans up old entries.

**Impact:** Negligible — only 17 entries max. But no memory pressure concern.

---

### MEDIUM: No ETag support on any API

None of the API routes implement ETag headers. This means browsers cannot cache responses efficiently — they must re-download unchanged data.

**Impact:** Wasted bandwidth for unchanged content.

**Fix:** Add `ETag` headers based on content hash or version counter.

---

### MEDIUM: Analytics cache has no size limit

**File:** `src/lib/analytics-cache.ts:19-21`

```typescript
class AnalyticsQueryCache {
  private store = new Map<string, CacheEntry<unknown>>()  // ← No size limit
```

While TTL prevents stale data, the cache could grow unbounded if many unique keys are used.

**Impact:** Low — analytics queries use predictable keys. But no safety limit.

**Fix:** Add max size (e.g., 100 entries) with LRU eviction.

---

### LOW: MathML cache uses LRU but has no persistence

**File:** `src/lib/mathml-service.ts:32-56`

The MathML cache has a 500-entry max with LRU eviction, which is good. But it's per-process and doesn't persist across serverless invocations.

**Impact:** Low — MathML rendering is fast enough to recompute.

---

## Cache Invalidation Analysis

### Invalidation Chain

```
Admin writes content
  → invalidateContentCache('mcq')     // Increments version counter
  → Content API returns X-Content-Version header
  → React Query refetches when version changes
```

### Invalidation Coverage

| Content Type | Admin Route Invalidates | Public API Uses Version | Assessment |
|-------------|----------------------|------------------------|------------|
| MCQ | YES | NO (no cache headers) | WARNING |
| CQ | YES | NO (no cache headers) | WARNING |
| Lecture | YES | NO (no cache headers) | WARNING |
| Suggestion | YES | NO | WARNING |
| Notice | YES | YES (5min cache) | PASS |
| Banner | YES | YES (30s cache) | PASS |
| FAQ | YES | YES (1h cache) | PASS |
| Testimonial | YES | YES (1h cache) | PASS |
| Navigation | YES | YES (1h cache) | PASS |
| Settings | YES | NO (force-dynamic) | WARNING |
| Class | YES | YES (5min cache) | PASS |
| Subject | YES | NO (no public API) | N/A |
| Chapter | YES | NO (no public API) | N/A |

---

## Stale Data Risk Assessment

| Scenario | Risk | Mitigation |
|----------|------|------------|
| Admin edits MCQ → user sees stale | MEDIUM | React Query staleTime 5min |
| Admin edits banner → user sees stale | LOW | Banner cache 30s |
| Admin edits settings → config stale | HIGH | Config API force-dynamic, no cache |
| Admin edits navigation → stale | LOW | Navigation cache 1h |
| Admin changes permissions → stale | LOW | Permission cache 60s |
| Admin changes CSRF setting → stale | LOW | CSRF cache 30s |

---

## Cache Stampede Risk

| Cache | Stampede Risk | Assessment |
|-------|--------------|------------|
| Config API | HIGH | Every page load hits DB |
| Classes API | MEDIUM | 5min cache, stale-while-revalidate |
| MCQ/CQ/Lecture | HIGH | No cache headers, every request hits DB |
| Analytics | LOW | TTL-based, concurrent requests share cache |

---

## Memory Leak Assessment

| Cache | Leak Risk | Assessment |
|-------|-----------|------------|
| Content Version Map | NONE | Only 17 entries |
| Permission Cache | NONE | Reset on TTL |
| CSRF Cache | NONE | Single entry |
| Rate Limit Map | LOW | Cleanup interval runs every 60s |
| Suggestion Cache | LOW | Never cleared, but small |
| Notice Cache | LOW | Never cleared, but small |
| Analytics Cache | LOW | No size limit, but TTL-based |
| MathML Cache | NONE | LRU with 500 max |

---

## Redis Opportunities

| Data | Current | Redis Benefit | Priority |
|------|---------|--------------|----------|
| Config Settings | DB query per request | Eliminate DB hit on every page load | HIGH |
| Permission Cache | In-memory per process | Shared across instances | MEDIUM |
| Rate Limiting | In-memory per process | Distributed rate limiting | HIGH |
| Content Version | In-memory per process | Shared across instances | MEDIUM |
| Analytics Cache | In-memory per process | Shared across instances | LOW |
| CSRF Setting | In-memory per process | Shared across instances | LOW |

---

## Files Requiring Optimization

| Priority | File | Issue | Fix |
|----------|------|-------|-----|
| HIGH | `src/app/api/config/route.ts` | No cache headers, force-dynamic | Add `cacheHeaders.public.medium` |
| HIGH | `src/app/api/mcq/route.ts` | No cache headers on public content | Add `cacheHeaders.public.short` |
| HIGH | `src/app/api/cq/route.ts` | No cache headers on public content | Add `cacheHeaders.public.short` |
| HIGH | `src/app/api/lectures/route.ts` | No cache headers on public content | Add `cacheHeaders.public.short` |
| MEDIUM | `src/lib/suggestion-cache.ts` | No TTL, never invalidated | Add TTL or invalidation |
| MEDIUM | `src/lib/notice-cache.ts` | No TTL, never invalidated | Add TTL or invalidation |
| MEDIUM | `src/lib/analytics-cache.ts` | No size limit | Add max size with LRU |
| LOW | All API routes | No ETag support | Add ETag headers |

---

## Summary

| Area | Score | Notes |
|------|-------|-------|
| React Query Config | 90/100 | Good defaults, proper retry logic |
| HTTP Cache Headers | 70/100 | Some public APIs missing headers |
| In-Memory Caches | 75/100 | Most have TTL, some don't |
| Cache Invalidation | 85/100 | Version counter pattern works well |
| Stale Data Protection | 70/100 | Config API is the biggest gap |
| Memory Safety | 90/100 | No leaks detected |
| Redis Readiness | 60/100 | All caches are in-memory, no Redis |
| ETag Support | 30/100 | Not implemented anywhere |

**Overall: 74/100**

The caching architecture is functional for a small-to-medium traffic educational platform. The main improvements needed are adding cache headers to public content APIs and the config endpoint, and implementing ETag support for efficient browser caching.
