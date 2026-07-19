# Bulk Force Delete System — Production Implementation

**Date**: 2026-07-19
**Status**: Production-Ready

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Trash Page                       │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Select       │  │ Force Delete │  │ Progress      │  │
│  │ Multiple     │  │ Button       │  │ Indicator     │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼────────────────┼───────────────────┼──────────┘
          │                │                   │
┌─────────▼────────────────▼───────────────────▼──────────┐
│                 POST /api/admin/trash                     │
│  action: "previewForceDelete" | "forceDelete"            │
│  ids: string[] (multiple)                                │
│  cascade: boolean (optional)                             │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              bulkPreviewForceDelete() / bulkForceDelete() │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Phase 1: Validate ALL records                     │   │
│  │   - Check each exists and is soft-deleted         │   │
│  │   - Check dependencies (active vs deleted)        │   │
│  │   - If ANY fails → ABORT, ROLLBACK ALL            │   │
│  │                                                   │   │
│  │ Phase 2: Sort by depth (deepest first)            │   │
│  │   - Avoid FK violations                           │   │
│  │                                                   │   │
│  │ Phase 3: Delete ALL validated records             │   │
│  │   - Delete deepest descendants first              │   │
│  │   - If cascade: recursive delete children         │   │
│  │   - Build audit trail                             │   │
│  │                                                   │   │
│  │ ALL inside ONE $transaction                       │   │
│  │ ANY failure → FULL ROLLBACK                       │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Audit Logging                               │
│  Bulk Entry:                                            │
│  - totalSelected, totalDeleted, cascadeMode             │
│  - startedAt, finishedAt, durationMs                    │
│  - models affected, IP, User Agent                      │
│                                                           │
│  Per-Record Entries:                                     │
│  - model, id, displayTitle                              │
│  - deletedAt, deletedBy                                 │
│  - forceDeletedBy, forceDeletedAt                       │
└─────────────────────────────────────────────────────────┘
```

---

## What Was Implemented

### 1. New `bulkForceDelete()` Function

**File**: `src/lib/soft-delete.ts`

**Key Features:**
- **Atomic transaction** — All records deleted in ONE `$transaction`
- **Two-phase approach** — Validate ALL first, then delete ALL
- **Depth-first ordering** — Deletes deepest descendants first to avoid FK violations
- **Full rollback** — Any failure rolls back everything
- **Cascade support** — Recursive delete of soft-deleted children
- **Comprehensive audit trail** — Per-record and summary entries

**Validation Phase:**
```
For each record:
  1. Check exists and is soft-deleted
  2. Check dependencies (active vs deleted children)
  3. If ANY fails → THROW → ROLLBACK ALL
```

**Delete Phase:**
```
Sort by depth (deepest first):
  1. resource (depth 4)
  2. lecture/mcq/cq/topic/knowledgeQuestion/suggestion (depth 3)
  3. chapter (depth 2)
  4. subject/courseLesson (depth 1)
  5. classCategory/course (depth 0)

For each record:
  1. If cascade: delete soft-deleted children first
  2. Record audit info
  3. Permanently delete
```

### 2. New `bulkPreviewForceDelete()` Function

**File**: `src/lib/soft-delete.ts`

Combines previews from multiple records into a merged summary:
- Total records selected
- Combined dependencies (merged by model)
- Total active records that would block deletion
- Total deleted records that would be removed

### 3. Enhanced Trash API

**File**: `src/app/api/admin/trash/route.ts`

**New Features:**
- `previewForceDelete` action now supports multiple records
- `forceDelete` action uses `bulkForceDelete()` for atomicity
- Duration tracking for operations
- Comprehensive audit logging

**Preview Response (multi-record):**
```json
{
  "success": true,
  "data": {
    "records": [{ "model": "subject", "id": "id1", "displayTitle": "Physics" }],
    "combinedDependencies": [
      { "model": "chapter", "label": "অধ্যায়", "totalCount": 88, "activeCount": 0, "deletedCount": 88 },
      { "model": "mcq", "label": "MCQ", "totalCount": 580, "activeCount": 0, "deletedCount": 580 }
    ],
    "totalRecords": 12,
    "totalDeleted": 668,
    "totalActive": 0
  }
}
```

### 4. Enhanced Admin Trash Page

**File**: `src/components/admin/AdminTrashPage.tsx`

**New Features:**
- **Combined preview** — Shows merged dependency tree for multiple records
- **Type-to-confirm** — Must type "DELETE" to enable button
- **Second confirmation** — Required for >100 records
- **Progress indicator** — Shows current/total during delete
- **Disabled controls** — Prevents duplicate submissions
- **Duration display** — Shows time taken after completion

---

## Dependency Flow

```
Bulk Force Delete: [Subject A, Subject B, Chapter C]
  │
  ├─ Validate ALL:
  │   ├─ Subject A: soft-deleted? ✓, active children? NO → ✓
  │   ├─ Subject B: soft-deleted? ✓, active children? NO → ✓
  │   └─ Chapter C: soft-deleted? ✓, active children? NO → ✓
  │
  ├─ Sort by depth:
  │   ├─ Chapter C (depth 2) — delete first
  │   ├─ Subject A (depth 1) — delete second
  │   └─ Subject B (depth 1) — delete third
  │
  ├─ Delete (cascade mode):
  │   ├─ Chapter C: delete MCQs, CQs, Lectures → delete Chapter
  │   ├─ Subject A: delete Chapters → delete Subject
  │   └─ Subject B: delete Chapters → delete Subject
  │
  └─ Total: 524 records permanently deleted
```

---

## Transaction Flow

```
BEGIN TRANSACTION
  │
  ├─ Phase 1: Validate ALL records
  │   ├─ Record 1: exists? deleted? active children? → ✓
  │   ├─ Record 2: exists? deleted? active children? → ✓
  │   ├─ Record 3: exists? deleted? active children? → ✗
  │   │   └─ THROW "active children exist" → ROLLBACK ALL
  │   └─ (Records 1-2 NOT deleted yet)
  │
  ├─ Phase 2: Sort by depth (deepest first)
  │
  ├─ Phase 3: Delete ALL validated records
  │   ├─ Record 1 (depth 3): DELETE → ✓
  │   ├─ Record 2 (depth 1): DELETE → ✓
  │   └─ If cascade: delete children recursively
  │
  ├─ Phase 4: Build audit trail
  │
  └─ COMMIT
      │
      └─ Return { deletedCount, cascadeCount, auditTrail }
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/soft-delete.ts` | Added `bulkForceDelete()` and `bulkPreviewForceDelete()` |
| `src/app/api/admin/trash/route.ts` | Updated to use bulk functions, added duration tracking |
| `src/components/admin/AdminTrashPage.tsx` | Added combined preview, type-to-confirm, second confirmation, progress |

---

## Verification Checklist

| # | Verification Item | Status |
|---|-------------------|--------|
| 1 | Single record force delete | **PASS** |
| 2 | Multiple record force delete | **PASS** |
| 3 | Combined preview (server-side) | **PASS** |
| 4 | Type-to-confirm ("DELETE") | **PASS** |
| 5 | Second confirmation for >100 records | **PASS** |
| 6 | Atomic transaction (rollback on failure) | **PASS** |
| 7 | Cascade force delete | **PASS** |
| 8 | Depth-first ordering | **PASS** |
| 9 | Progress indicator | **PASS** |
| 10 | Disable controls during delete | **PASS** |
| 11 | Comprehensive audit logging | **PASS** |
| 12 | Duration tracking | **PASS** |
| 13 | Requires withAdmin() | **PASS** |
| 14 | Requires withCsrf() | **PASS** |
| 15 | Regression: Trash, Restore, Bulk Restore, Dashboard, Search, Pagination, Counts | **PASS** |

---

## Performance Notes

| Aspect | Impact |
|--------|--------|
| Validation phase | 2-3 queries per record (indexed) |
| Depth sorting | Negligible (in-memory sort) |
| Delete phase | 1 DELETE per record |
| Transaction timeout | 120s for large bulk operations |
| Cascade delete | N recursive calls (N = deleted children) |

---

## Security Notes

- **Admin-only**: All operations require `withAdmin` auth
- **CSRF protected**: All POST operations require valid CSRF token
- **Type-to-confirm**: User must type "DELETE" to proceed
- **Second confirmation**: Required for >100 records
- **Audit logged**: Every bulk operation creates permanent audit entry
- **Atomic safety**: Full rollback on any failure — no partial delete

---

## Production Readiness

# **PASS**

- Atomic transaction for all records
- Combined preview from server
- Type-to-confirm safety
- Second confirmation for large operations
- Progress indicator
- Comprehensive audit with duration tracking
- Depth-first ordering for FK safety
- Admin-only access with CSRF
- Zero TypeScript errors
- Zero breaking changes
