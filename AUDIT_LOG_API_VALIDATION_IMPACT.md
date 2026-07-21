# Audit Log API — Validation Impact Summary

**Endpoint:** `GET /api/admin/audit-logs`  
**Purpose:** Analysis before implementing Step 3 (Zod validation)  
**Date:** July 20, 2026  
**Status:** Analysis only — no code changes

---

## 1. All Query Parameters

### Detail Mode (`?id=...`)

| Param | Source | Description |
|---|---|---|
| `id` | URL query | Single audit log ID. When present, returns one log (ignores all other params). |

### List Mode (all other params)

| Param | Source | Type | Used By | Description |
|---|---|---|---|---|
| `page` | URL query | `string` → `number` | UI, API | Page number (1-based). Validated by `parsePaginationParams`. |
| `limit` | URL query | `string` → `number` | UI, API, **Export** | Items per page. UI sends 20, Export sends 10000. Clamped to [1, 100] by `parsePaginationParams`. |
| `q` | URL query | `string` | UI | Free-text search across action/entityType/entityId. |
| `action` | URL query | `string` | UI | Exact action filter. |
| `adminId` | URL query | `string` | **API only** (no UI) | Admin/user filter. |
| `entityType` | URL query | `string` | UI | Entity type filter. |
| `from` | URL query | `string` (date) | UI | Date range start. Passed to `new Date(from)`. |
| `to` | URL query | `string` (date) | UI | Date range end. Passed to `new Date(to)`. |

---

## 2. Current Validation State

| Param | Current Validation | What Actually Happens With Bad Input |
|---|---|---|
| `id` | **None** | Any string sent to `db.auditLog.findUnique({ where: { id } })`. Invalid cuid → query returns null → 404. **No crash risk.** |
| `page` | `parsePaginationParams` | `Math.max(1, parseInt('abc') || 1) → 1`. Invalid strings silently default to 1. |
| `limit` | `parsePaginationParams` | `Math.min(100, Math.max(1, parseInt('abc') || 20)) → 20`. Invalid strings silently default to 20. **Export sends 10000 → clamped to 100.** |
| `q` | **None** | `.trim()` applied. Any string passed to Prisma `contains`. **No validation risk** — it's free text. |
| `action` | **None** | `.trim()` applied. Empty string after trim → falsy → skipped. **No validation risk.** |
| `adminId` | **None** | `.trim()` applied. Any string passed to Prisma `where.adminId`. |
| `entityType` | **None** | `.trim()` applied. Same as action. |
| `from` | **None** | `new Date('not-a-date')` produces `Invalid Date`. Prisma receives `{ gte: Invalid Date }`. **Prisma may throw or produce unexpected results.** |
| `to` | **None** | Same as `from`. |

### Current Risks

1. **`from`/`to` with invalid dates:** `new Date('xyz')` produces `Invalid Date` which, when sent to Prisma, may throw an unhandled error (caught by `handleApiError` → returns 500). This is the only parameter that can cause a 500 error.
2. **`limit` export edge case:** Export sends `limit=10000` which `parsePaginationParams` clamps to 100. **Export only exports 100 logs** — this is a pre-existing bug (only 100 exported, not the full dataset). The UI's export function is broken at scale.

---

## 3. UI Usage Patterns

### Normal list fetch (from `AdminAuditLogsPage.tsx`)

```typescript
const params = new URLSearchParams({
  page: String(page),     // e.g., "1", "2", "3"
  limit: '20',             // hardcoded
})
if (search) params.set('q', search)                // free text
if (actionFilter !== 'all') params.set('action', actionFilter)  // known action string
if (entityTypeFilter !== 'all') params.set('entityType', entityTypeFilter)  // known entity string
if (dateFrom) params.set('from', dateFrom)         // YYYY-MM-DD (from <input type="date">)
if (dateTo) params.set('to', dateTo)               // YYYY-MM-DD (from <input type="date">)
```

### Export fetch

```typescript
const params = new URLSearchParams({ limit: '10000' })
// ... same optional params ...
```

**Key observations:**
- `page` and `limit` are always sent as strings from `Number.toString()` — they're always valid integers
- `from`/`to` come from `<input type="date">` which produces `YYYY-MM-DD` — valid ISO 8601 date
- No other client or third-party integration sends requests to this endpoint (it's admin-only)

---

## 4. Proposed Zod Schema

```typescript
import { z } from 'zod'

const auditLogListSchema = z.object({
  // Detail mode — optional
  id: z.string().min(1).optional(),

  // Pagination — validated by parsePaginationParams, but Zod adds safety
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(10000).default(20),

  // Free-text search — any string, length limited
  q: z.string().max(200).optional(),

  // Filters — non-empty strings
  action: z.string().min(1).optional(),
  adminId: z.string().min(1).optional(),
  entityType: z.string().min(1).optional(),

  // Dates — ISO 8601 date strings (lenient — any string parseable by new Date)
  from: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'from must be a valid date string',
  }).optional(),
  to: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'to must be a valid date string',
  }).optional(),
})

// Schema for the detail view — only `id` is required
const auditLogDetailSchema = z.object({
  id: z.string().min(1, 'id is required'),
})
```

---

## 5. Validation Impact Analysis

| Parameter | Current Behavior | Zod Behavior | Breaking? |
|---|---|---|---|
| `id` | Any string → 404 if not found | Any non-empty string → same | **NO** |
| `page` | `'abc'` → defaults to 1 | `z.coerce.number()` → `'abc'` → `NaN` → Zod rejects with 422 | **MINOR BREAKING** — but `'abc'` would never come from the UI |
| `limit` | `'abc'` → defaults to 20 | `z.coerce.number()` → `'abc'` → Zod rejects | **MINOR BREAKING** — but `'abc'` would never come from the UI |
| `limit` | Export sends 10000 → clamped to 100 (BROKEN) | `z.coerce.number().max(10000)` → accepts 10000 | **BACKWARD COMPATIBLE** — and fixes the export bug |
| `q` | Any string → passed to Prisma `.contains` | `.max(200)` → strings > 200 chars rejected | **MINOR BREAKING** — but search strings > 200 chars are impractical |
| `action` | `''` (empty) → skipped | `.min(1).optional()` → empty string → Zod rejects | **MINOR BREAKING** — but `''` is equivalent to "not provided" |
| `adminId` | `''` (empty) → skipped | `.min(1).optional()` → same | **NO** |
| `entityType` | `''` (empty) → skipped | `.min(1).optional()` → same | **NO** |
| `from` | `'xyz'` → `Invalid Date` → Prisma error → 500 | `Date.parse('xyz')` → `NaN` → Zod rejects with 422 | **IMPROVEMENT** — replaces 500 error with 422 |
| `to` | `'xyz'` → `Invalid Date` → Prisma error → 500 | Same as `from` | **IMPROVEMENT** |

### Breaking Change Summary

**No breaking changes to valid requests. Only invalid requests that previously had different behavior change:**

| Change | Risk | Mitigation |
|---|---|---|
| `page`/`limit` with non-numeric strings → 422 instead of silent default | **LOW** — UI never sends non-numeric strings | No action needed |
| `q` > 200 chars → 422 instead of passing through | **LOW** — UI search is free-text input, unlikely to exceed 200 | Set limit to 500 for safety |
| `action`/`adminId`/`entityType` with empty string → 422 instead of silently skipped | **LOW** — UI doesn't send empty strings for these (it omits the param entirely) | No action needed |
| `from`/`to` with invalid dates → 422 instead of 500 | **IMPROVEMENT** — better error handling | No action needed |
| `limit` > 100 → accepted (up to 10000) instead of clamped to 100 | **BACKWARD COMPATIBLE** — fixes export bug | This is actually an improvement that fixes the export |

---

## 6. Export Edge Case

**Current bug:** Export sends `limit=10000` but `parsePaginationParams` clamps to 100. Only 100 logs are exported.

**Fix with Zod:** `limit: z.coerce.number().int().min(1).max(10000).default(20)` — but we must NOT apply `parsePaginationParams` AFTER Zod validation, otherwise the clamp still happens.

**Recommended approach:** Zod validates that `limit` is a number between 1 and 10000, then `parsePaginationParams` no longer clamps to 100 for the export. **But** `parsePaginationParams` is a shared utility used by other routes. Change the audit-logs route to handle limit directly after Zod validation instead of using `parsePaginationParams`.

**Alternative:** Keep `parsePaginationParams` as-is (safe for all other routes) and override the audit-logs route to use a higher max limit.

---

## 7. Implementation Recommendation

### Safe Zod Schema for Audit Logs API

```typescript
import { z } from 'zod'

const auditLogQuerySchema = z.object({
  id: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(10000).default(20),
  q: z.string().max(500).optional(),
  action: z.string().optional(),  // No min(1) — allow empty string to be filtered elsewhere
  adminId: z.string().optional(),
  entityType: z.string().optional(),
  from: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: 'Invalid date format for "from"',
  }).optional(),
  to: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: 'Invalid date format for "to"',
  }).optional(),
})
```

### Integration Plan

1. Replace manual parameter parsing with `auditLogQuerySchema.parse(Object.fromEntries(searchParams))`
2. Keep `parsePaginationParams` for the `page`/`limit` clamping — OR validate in Zod and extract manually
3. For `from`/`to`: after validation, the values are guaranteed to be parseable dates — use them directly
4. Remove `limit` max-clamping in this route (let Zod handle it with max 10000)

### Rollback

Remove the Zod schema and restore manual parsing. The Zod import leaves no traces when removed.

---

**End of Validation Impact Summary**
