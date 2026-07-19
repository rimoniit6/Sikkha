# Soft Delete Migration Guide

**Date**: 2026-07-19
**Status**: Migration Complete (schema + extension)

---

## Migration Steps

### Step 1: Schema Migration (DONE)

```bash
npx prisma db push
```

**Result:** All 31 Category A models now have `deletedAt`, `deletedBy`, `deleteReason` columns.
**Downtime:** None (SQLite ALTER TABLE is instant)
**Rollback:** Remove the three fields from schema.prisma and run `prisma db push` again.

### Step 2: Generate Prisma Client (DONE)

```bash
npx prisma generate
```

**Result:** TypeScript types updated with new fields.

### Step 3: Verify Extension (DONE)

The `src/lib/db.ts` extension automatically filters soft-deleted records. No code changes needed for existing queries.

### Step 4: API Migration (NOT YET DONE)

Each admin DELETE endpoint needs to be updated to use `softDelete()` instead of `db.*.delete()`.

**Pattern:**
```typescript
// Before:
await db.chapter.delete({ where: { id } })

// After:
import { softDelete } from '@/lib/soft-delete'
await softDelete(db, 'chapter', id, auth.user.id, reason)
```

**Files to update (31 models × 1 route each = ~31 files):**
- `src/app/api/admin/classes/route.ts`
- `src/app/api/admin/subjects/route.ts`
- `src/app/api/admin/chapters/route.ts`
- `src/app/api/admin/topics/route.ts`
- `src/app/api/admin/lectures/route.ts`
- `src/app/api/admin/mcq/route.ts`
- `src/app/api/admin/cq/route.ts`
- `src/app/api/admin/knowledge-questions/route.ts`
- `src/app/api/admin/suggestions/route.ts`
- `src/app/api/admin/courses/route.ts`
- `src/app/api/admin/banners/route.ts`
- `src/app/api/admin/faqs/route.ts`
- `src/app/api/admin/testimonials/route.ts`
- `src/app/api/admin/notices/route.ts`
- `src/app/api/admin/navigation/route.ts`
- `src/app/api/admin/content-types/route.ts`
- `src/app/api/admin/featured/route.ts`
- `src/app/api/admin/bundles/route.ts`
- `src/app/api/admin/packages/route.ts`
- `src/app/api/admin/mcq-exam-packages/route.ts`
- `src/app/api/admin/cq-exam-packages/route.ts`
- `src/app/api/admin/teacher-moderators/route.ts`
- `src/app/api/admin/boards/route.ts`
- `src/app/api/admin/years/route.ts`
- `src/app/api/admin/board-years/route.ts`
- `src/app/api/admin/exams/route.ts`
- `src/app/api/admin/subscriptions/route.ts`
- `src/app/api/admin/mcq-exam-purchases/route.ts`
- `src/app/api/admin/notes/route.ts`

### Step 5: Admin UI (NOT YET DONE)

Add to each admin page:
- "Deleted" filter tab
- Restore button
- Permanent delete button
- Delete reason modal

---

## Rollback Plan

If soft delete needs to be removed:

1. Remove `deletedAt`, `deletedBy`, `deleteReason` from schema.prisma
2. Run `npx prisma db push`
3. Remove `src/lib/soft-delete.ts`
4. Revert `src/lib/db.ts` to remove the soft delete extension
5. Revert any API routes that were changed to use `softDelete()`

**Data impact:** All `deletedAt` values are lost. Records that were soft-deleted become permanently invisible unless `isActive` was also toggled.

---

## Production Readiness Checklist

- [x] Schema migration complete
- [x] Prisma client generated
- [x] Auto-filter extension working
- [x] TypeScript compiles cleanly
- [x] Database synced
- [ ] API routes updated to use softDelete()
- [ ] Admin UI trash view
- [ ] Restore API endpoints
- [ ] Force delete API endpoints
- [ ] Cascade behavior tested
- [ ] Slug conflict resolution tested
- [ ] Performance benchmarked
