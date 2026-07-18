# PRICE_SYNC_ROOT_CAUSE_REPORT.md

## 1. Root Cause

**The `set-overview` API endpoint (used by the detail page) creates a NEW `NextResponse.json()` response WITHOUT `Cache-Control: no-store` headers.**

Even though the inner `handleDetail` function sets `no-store` on its response, the `handleSetOverview` function creates a brand-new response that discards those headers. The browser caches this uncached response, serving stale data on refresh.

---

## 2. Exact File

`src/app/api/mcq-exam-packages/route.ts`

## 3. Exact Function

`handleSetOverview` (line 1777)

## 4. Exact Line Number

Line 1790 — the `return NextResponse.json(...)` statement

**Before fix:**
```javascript
return NextResponse.json({
  success: detail.success,
  data: { package: detail.data?.package, purchased: detail.data?.purchased, ... },
})
// ❌ NO Cache-Control header — browser caches this response
```

**After fix:**
```javascript
const response = NextResponse.json({
  success: detail.success,
  data: { package: detail.data?.package, purchased: detail.data?.purchased, ... },
})
response.headers.set('Cache-Control', 'no-store')  // ✅
return response
```

---

## 5. Data Before

| Field | Value |
|---|---|
| Database `price` | 100 |
| Database `isPremium` | true |
| `handleDetail` response | price=100, isPremium=true, `Cache-Control: no-store` ✅ |
| `handleSetOverview` response | price=100, isPremium=true, **NO cache header** ❌ |
| Browser cache | Stores stale response (old price=0, isPremium=false) |
| UI badge | Shows "ফ্রি" (FREE) |

## 6. Data After Fix

| Field | Value |
|---|---|
| Database `price` | 100 |
| Database `isPremium` | true |
| `handleDetail` response | price=100, isPremium=true, `Cache-Control: no-store` ✅ |
| `handleSetOverview` response | price=100, isPremium=true, `Cache-Control: no-store` ✅ |
| Browser cache | Does NOT cache (no-store) |
| UI badge | Shows "৳১০০" (PREMIUM) ✅ |

---

## 7. Why Previous Fixes Did Not Solve It

| Fix | What It Fixed | What It Missed |
|---|---|---|
| `deriveIsPremium()` | Database stores correct `isPremium` | HTTP cache layer still serving stale data |
| `no-store` on list API | Browser doesn't cache list endpoint | Detail page uses `set-overview`, not list |
| `no-store` on detail API | Browser doesn't cache detail endpoint | Detail page actually uses `set-overview` endpoint |
| **This fix**: `no-store` on `set-overview` | Browser doesn't cache set-overview | ✅ Complete fix |

The detail page (`MCQExamPackageDetailPage.tsx` line 122) fetches from:
```
/api/mcq-exam-packages?action=set-overview&id=${packageId}
```

NOT from `?action=detail`. The `set-overview` endpoint composes `handleDetail` + `handleExamSetStatus` + `handleMyRetakeRequests` into a single response, but creates a NEW `NextResponse.json()` that discards the `no-store` header from `handleDetail`.

---

## 8. Smallest Safe Fix

One line added to `handleSetOverview`:

```javascript
response.headers.set('Cache-Control', 'no-store')
```

---

## 9. Regression Risk

**Minimal.** This only adds a cache header to an existing endpoint. No logic changes, no API contract changes, no database changes.

---

## 10. Similar Bugs Elsewhere

| Endpoint | Has `no-store` | Risk |
|---|---|---|
| `handleList` (list) | ✅ Yes | None |
| `handleDetail` (detail) | ✅ Yes | None |
| `handleSetOverview` | ✅ **Fixed** | None (this fix) |
| `handleTakeExam` | ❌ No | Low (exam data, not package display) |
| `handleSubmitExam` | ❌ No | Low (write operation) |
| `handleMyResults` | ❌ No | Low (user results, not package display) |
| `handleResultDetail` | ❌ No | Low (user results) |
| `handleCheckPurchase` | ❌ No | Low (purchase status only) |
| `handleWeaknessAnalysis` | ❌ No | Low (analysis only) |
| `handleLeaderboard` | ❌ No | Low (leaderboard only) |
| `handleExamSetStatus` | ❌ No | Low (set status only) |
| `handleCheckRetake` | ❌ No | Low (retake status only) |
| `handleMyRetakeRequests` | ❌ No | Low (retake requests only) |
| `handleRequestRetake` | ❌ No | Low (write operation) |

**Only `set-overview` affects the premium/free badge display** on the detail page. The other endpoints return data that doesn't directly affect the badge rendering.

---

## Complete Data Flow (Verified)

### Detail Page Flow
```
User loads /mcq-exam-package-detail
  → MCQExamPackageDetailPage mounts
  → fetchOverview() → fetch('/api/mcq-exam-packages?action=set-overview&id=xxx')
  → handleSetOverview()
    → handleDetail() → returns response with no-store ✅
    → handleExamSetStatus() → returns response
    → handleMyRetakeRequests() → returns response
    → creates NEW NextResponse.json() ← ❌ WAS missing no-store
    → NOW: response.headers.set('Cache-Control', 'no-store') ✅
  → Browser receives response → does NOT cache ✅
  → setPkgDetail(json.data.package) → pkgDetail.isPremium=true, pkgDetail.price=100 ✅
  → PackageInfoCard renders: pkgDetail.isPremium && pkgDetail.price > 0 → PREMIUM badge ✅
```

### List Page Flow
```
User loads /mcq-exam-package-list
  → MCQExamPackageListPage mounts
  → fetchPackages() → fetch('/api/mcq-exam-packages?action=list')
  → handleList() → returns response with no-store ✅
  → Browser receives response → does NOT cache ✅
  → setPackages(fetchedPackages) → pkg.isPremium=true, pkg.price=100 ✅
  → PackageCard renders: pkg.isPremium && pkg.price > 0 → PREMIUM badge ✅
```

---

*Report generated from end-to-end forensic debugging of the price sync issue.*
