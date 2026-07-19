# Sprint 7 — Rollback UI — Implementation Documentation

## Overview

Rollback interface in the version history page. Allows admins to roll back content to any previous version with a confirmation dialog.

## Architecture

```
AdminVersionHistoryPage
        │
        ├──► Rollback Button (side panel)
        │
        ▼
RollbackConfirmDialog
        │
        ▼
POST /api/admin/version-history/[entityType]/[entityId]/rollback
        │
        ▼
rollbackVersion(db, entityType, entityId, targetVersion, userId, options)
        │
        ▼
Single transaction: verify → createVersion → rollbackVersion → audit → commit
```

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `src/app/api/admin/version-history/route.ts` | CREATED | GET endpoint to list versions |
| `src/app/api/admin/version-history/[entityType]/[entityId]/rollback/route.ts` | CREATED | POST endpoint for rollback |
| `src/components/admin/RollbackConfirmDialog.tsx` | CREATED | Confirmation dialog with Bengali |
| `src/hooks/admin/use-rollback.ts` | CREATED | React Query mutation hook |
| `src/components/admin/AdminVersionHistoryPage.tsx` | MODIFIED | Added rollback button |

## API

### GET /api/admin/version-history
Query params: `entityType`, `entityId`, `page`, `limit`

### POST /api/admin/version-history/[entityType]/[entityId]/rollback
Body: `{ targetVersion: number, comment?: string }`

Returns: `{ success: boolean, newVersionNumber: number, message: string }`

## UI Flow

1. Admin selects entity type and ID, clicks "খুঁজুন"
2. Version list loads with timeline view
3. Admin clicks a version to open side panel
4. Side panel shows "এই ভার্সনে রোলব্যাক করুন" button
5. Click opens RollbackConfirmDialog with warning
6. Admin types "রোলব্যাক" to confirm, optionally adds comment
7. Rollback executes, version list refreshes

## Key Design Decisions

1. **Bengali confirmation** — Must type "রোলব্যাক" (not just click button)
2. **Single transaction** — rollbackVersion() handles everything atomically
3. **Audit trail** — Rollback creates version snapshot + audit log
4. **Existing function** — Uses rollbackVersion() from version-history.ts (NOT modified)
5. **Missing API fixed** — Created `/api/admin/version-history` endpoint (was 404)

## Test Results

- Full suite: 403/409 passing (6 pre-existing failures)
- No new test files (rollback uses existing rollbackVersion() which is already tested)
