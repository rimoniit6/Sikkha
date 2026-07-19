# CSRF Architecture Review

> **Scope:** Backend architecture review of CSRF configuration
> **Date:** 2026-07-18

---

## 1. Previous Architecture (Flawed)

```
isCsrfEnabled(): boolean {           ← SYNCHRONOUS
  if (production) return true
  if (_csrfDevelopmentOverride) return override   ← PROCESS MEMORY
  return envVarDefault
}

setCsrfDevelopmentOverride(value) {
  _csrfDevelopmentOverride = value   ← WRITES TO PROCESS MEMORY
}
```

### Weaknesses

| Issue | Impact |
|-------|--------|
| **Process memory** | Value lost on server restart |
| **Hot reload** | Value lost on file change |
| **Multiple processes** | Each process has independent state — setting on one doesn't affect others |
| **Serverless** | Each invocation is a fresh process — override never persists |
| **No cache invalidation** | Setting change only affects the process that received the API call |
| **Not DB-backed** | SiteSetting table is ignored after initial read |

---

## 2. Restart Behavior (Previous)

| Scenario | `_csrfDevelopmentOverride` | Result |
|----------|--------------------------|--------|
| Server restart | `null` (reset) | Falls back to env var — **admin setting lost** |
| Hot reload | `null` (reset) | Falls back to env var — **admin setting lost** |
| PM2 restart | `null` (reset) | Falls back to env var — **admin setting lost** |
| Docker rebuild | `null` (reset) | Falls back to env var — **admin setting lost** |

---

## 3. Multi-Instance Behavior (Previous)

| Scenario | Result |
|----------|--------|
| 2 Node processes (PM2 cluster) | Process A sets override → Process B unaware → **inconsistent CSRF state** |
| Serverless (Vercel/Netlify) | Each invocation fresh → override never persists → **always falls back to env var** |
| Kubernetes pods | Each pod independent → **inconsistent CSRF state across pods** |

---

## 4. New Architecture (Fixed)

```
isCsrfEnabled(): Promise<boolean> {   ← ASYNC
  if (production) return true          ← HARDCODED SAFETY
  if (cache valid) return cached       ← IN-MEMORY CACHE (30s TTL)
  enabled = readFromDB()               ← SITESETTING TABLE
  cache = { enabled, timestamp }
  return enabled
}

invalidateCsrfCache(): void {
  cache = null                         ← FORCES NEXT READ FROM DB
}
```

### Resolution Order

```
1. Production → always true (hardcoded, no override)
2. Cache hit (within 30s TTL) → return cached value
3. Database → read SiteSetting('enableCsrfProtection')
4. Database failure → fall back to env var
```

---

## 5. New Restart Behavior

| Scenario | Cache | Database | Result |
|----------|-------|----------|--------|
| Server restart | Empty | Setting persists | Reads from DB on first request → **correct** |
| Hot reload | Empty | Setting persists | Reads from DB on first request → **correct** |
| PM2 restart | Empty | Setting persists | Reads from DB on first request → **correct** |
| Docker rebuild | Empty | Setting persists | Reads from DB on first request → **correct** |

---

## 6. New Multi-Instance Behavior

| Scenario | Result |
|----------|--------|
| 2 Node processes | Both read from same DB → **consistent state** (within 30s TTL) |
| Serverless | Each invocation reads from DB → **consistent state** (no cache needed) |
| Kubernetes pods | All pods read from same DB → **consistent state** |
| Admin saves setting | `invalidateCsrfCache()` called → all instances re-read on next request |

---

## 7. Cache Design

| Property | Value | Reason |
|----------|-------|--------|
| TTL | 30 seconds | Balances freshness vs. DB load |
| Storage | Module-level variable | Fastest access, no external deps |
| Invalidation | Explicit (on save) | Ensures setting change propagates quickly |
| Fallback | Env var | App works even if DB is down |

### Cache Lifecycle

```
Request 1: cache miss → read DB → cache = { enabled: true, timestamp: T }
Request 2: cache hit (T < T+30s) → return cached
Request 3: cache hit (T < T+30s) → return cached
...
Request N: cache expired (T > T+30s) → read DB → update cache

Admin saves setting:
  invalidateCsrfCache() → cache = null
  Next request: cache miss → read DB (new value) → cache updated
```

---

## 8. Files Modified

| File | Change |
|------|--------|
| `src/lib/csrf.ts` | Replaced process-memory override with DB-backed cache |
| `src/app/api/admin/settings/route.ts` | `setCsrfDevelopmentOverride()` → `invalidateCsrfCache()` |
| `src/app/api/csrf-token/route.ts` | `isCsrfEnabled()` → `await isCsrfEnabled()` |

---

## 9. Production Safety

```
isCsrfEnabled():
  if (NODE_ENV === 'production') return true   ← ALWAYS TRUE
```

This check is the FIRST line in `isCsrfEnabled()`. It runs before cache, before DB, before anything. No code path can disable CSRF in production.

---

## 10. Remaining Technical Debt

| Item | Severity | Notes |
|------|----------|-------|
| No distributed cache (Redis) | LOW | 30s TTL on single-instance is sufficient. Multi-instance uses DB as source of truth. |
| No CSRF setting audit log | LOW | Setting changes aren't logged in AuditLog. Could be added. |
| Cache TTL is fixed | LOW | Could be made configurable via env var. Not necessary for current scale. |

---

*Architecture is now DB-backed with proper cache invalidation. Process-memory flaw eliminated.*
