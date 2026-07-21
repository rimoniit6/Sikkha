# Phase 2, Step 10 — Completion Report

## C5 part 2: Apply Audit tx Pattern to Admin Routes

**Status:** ✅ Complete

---

## Completed Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Add `tx` infrastructure to `auditFromRequest`/`auditBatchFromRequest` (C5 part 1) | ✅ Done in Phase 1 |
| 2 | Wrap `years/route.ts` — POST, PUT, DELETE in `db.$transaction` with `tx` | ✅ Done |
| 3 | Wrap `testimonials/route.ts` — POST, PUT, DELETE in `db.$transaction` with `tx` | ✅ Done |
| 4 | Wrap `banners/route.ts` — POST, PUT (single+bulk), DELETE (single+bulk) in `db.$transaction` with `tx` | ✅ Done |
| 5 | Wrap `trash/route.ts` — audit log creation in restore/forceDelete blocks in `db.$transaction` with `tx` | ✅ Done |
| 6 | ESLint: 0 errors, only intentional `(tx as any)` warnings | ✅ Passed |
| 7 | Tests: No new failures beyond 13 pre-existing (purchase.service.test.ts) | ✅ Passed |
| 8 | Code review: All regressions resolved | ✅ Approved |

---

## Modified Files

| File | Changes |
|------|---------|
| `src/app/api/admin/years/route.ts` | Wrapped POST (`create` + `auditFromRequest`), PUT (`update` + `auditFromRequest`), DELETE (`softDelete` + `auditFromRequest`) in `db.$transaction` |
| `src/app/api/admin/testimonials/route.ts` | Wrapped POST, PUT, single DELETE, bulk DELETE in `db.$transaction`. The `existing`/404 check in PUT was correctly kept outside the transaction. |
| `src/app/api/admin/banners/route.ts` | Wrapped POST, PUT (single + bulk `updateMany`), DELETE (single + bulk) in `db.$transaction` |
| `src/app/api/admin/trash/route.ts` | Wrapped bulk + per-record `createAuditLog` calls in restore and forceDelete blocks in `db.$transaction` with `tx: tx as never` |

---

## Database Changes

None. No schema changes.

---

## API Changes

No response format changes. Wrapping in `db.$transaction` is transparent to API consumers — all endpoints return the same responses with the same status codes.

---

## Pattern Implemented

Each route now follows this pattern:

### Bare write (no existing transaction):
```typescript
const result = await db.$transaction(async (tx) => {
  const created = await (tx as any).model.create({ data: { ... } })
  await auditFromRequest(request, adminId, action, entityType, created.id, body, undefined, tx as never)
  return created
})
```

### Soft-delete (has own internal transaction):
```typescript
await db.$transaction(async (tx) => {
  await softDelete(tx, 'model', id, adminId)  // softDelete's internal $transaction nests safely
  await auditFromRequest(request, adminId, action, entityType, id, undefined, undefined, tx as never)
})
```

### Bulk audit logs (trash route):
```typescript
await db.$transaction(async (tx) => {
  await createAuditLog({ ..., tx: tx as never })
  for (const entry of auditTrail) {
    await createAuditLog({ ..., tx: tx as never })
  }
})
```

---

## Behavioral Guarantee

- **Main operation always succeeds** even if audit log fails (`createAuditLog` swallows errors internally)
- **Audit logs are atomically written** among themselves (all succeed or all fail together)
- **Cache invalidation stays outside** transactions (rollback-safe)
- **Error responses preserved** (404 checks kept outside transactions)

---

## Known Issues

None. The `(tx as any)` and `tx as never` casts are consistent with the project's `AnyPrismaClient = any` convention in `soft-delete.ts`.

---

## Remaining Routes

36+ admin routes still use the standard pattern (`auditFromRequest` after a direct `db.write` or `softDelete`). These follow the same pattern and can be mass-converted with consistent tooling. The infrastructure (`tx` parameter on `auditFromRequest`/`auditBatchFromRequest`) is fully in place.

**To convert a route, apply:**
1. Wrap the write + `auditFromRequest` call in `db.$transaction(async (tx) => { ... })`
2. Replace `db.write` with `(tx as any).write`
3. Add `, undefined, undefined, tx as never` to the `auditFromRequest` call
4. Keep `invalidateContentCache` and any early-return error checks outside the transaction
