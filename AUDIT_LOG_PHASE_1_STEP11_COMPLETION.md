# Phase 1 — Step 11 Completion Report

**Step Name:** H1 — Fix Workflow Module Audit Logging  
**Date:** July 20, 2026  
**Status:** ✅ COMPLETE

---

## Completed Tasks

| Task | Status |
|---|---|
| Fix `ACTION_AUDIT_KEY` to use `AuditActions` values instead of raw key-name strings | ✅ |
| Apply `sanitizeAuditData()` on oldData/newData for consistency with central audit service | ✅ |
| Import `AuditActions` from `@/lib/audit` and `sanitizeAuditData` from `./audit-pii` | ✅ |
| ESLint verification | ✅ 0 errors (3 pre-existing `any` warnings) |
| Workflow concurrency tests pass (33/33) | ✅ Passed |
| Code review | ✅ Approved |

---

## Modified Files

| File | Change |
|---|---|
| `src/lib/workflow.ts` | Added imports, fixed `ACTION_AUDIT_KEY` values, applied `sanitizeAuditData` |

---

## Bug Fix: Wrong Action Values

### Before
```typescript
const ACTION_AUDIT_KEY: Record<WorkflowAction, string> = {
  submit_for_review: 'WORKFLOW_SUBMIT_FOR_REVIEW',  // WRONG
  approve: 'WORKFLOW_APPROVE',                      // WRONG
  publish: 'WORKFLOW_PUBLISH',                      // WRONG
  update_content: 'CONTENT_UPDATE',                 // WRONG
  // ...
}
```

The stored action values were uppercase key-name strings (`'WORKFLOW_APPROVE'`) instead of the lowercase values (`'workflow_approve'`) used by the rest of the audit system. This meant:
- Workflow audit logs were invisible in the admin UI (no Bengali label matched)
- Filtering by action type didn't work for workflow events
- The data was inconsistent with all other audit log entries

### After
```typescript
const ACTION_AUDIT_KEY: Record<WorkflowAction, string> = {
  submit_for_review: AuditActions.WORKFLOW_SUBMIT_FOR_REVIEW,  // 'workflow_submit_for_review'
  approve: AuditActions.WORKFLOW_APPROVE,                      // 'workflow_approve'
  publish: AuditActions.WORKFLOW_PUBLISH,                      // 'workflow_publish'
  update_content: AuditActions.CONTENT_UPDATE,                  // 'content_update'
  // ...
}
```

Now consistent with the central `AuditActions` enum and the `ACTION_LABELS` display names.

---

## Database Changes

**None.** No schema or migration changes. Existing audit log records with the old action values are unaffected (they remain as-is with the old strings; new entries will use the correct values).

---

## Breaking Changes

**None.** The fix only affects new audit log entries. Old entries with `'WORKFLOW_APPROVE'` style values remain in the database unchanged.

---

## Remaining Work

The workflow module still uses `tx.auditLog.create()` directly (inside `$transaction`) rather than the central `createAuditLog()` service. This is because `createAuditLog()` uses the global `db` client and cannot participate in a transaction. Adding a `tx` parameter to `createAuditLog()` is a separate step (C5).

---

## Rollback Steps

1. Revert `src/lib/workflow.ts` — restore `ACTION_AUDIT_KEY` to original raw strings and remove imports
2. Verify: `npx eslint src/lib/workflow.ts` and `npx vitest run src/lib/__tests__/workflow-concurrency.test.ts`
