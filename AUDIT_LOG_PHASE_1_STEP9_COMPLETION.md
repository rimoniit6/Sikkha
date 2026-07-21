# Phase 1 — Step 9 Completion Report

**Step Name:** C5 part 1 — Add `tx` parameter to `createAuditLog()` for transaction participation  
**Date:** July 20, 2026  
**Status:** ✅ COMPLETE

---

## Completed Tasks

| Task | Status |
|---|---|
| Add `AuditTxClient` interface for transaction client typing | ✅ |
| Add optional `tx?: AuditTxClient` to `AuditLogInput` | ✅ |
| Add optional `tx?: AuditTxClient` to `BatchAuditLogInput` | ✅ |
| Update `createAuditLog()` to use `input.tx || db` | ✅ |
| Update `createBatchAuditLogs()` to use `input.tx || db` | ✅ |
| Update `workflow.ts` to call `createAuditLog` with `tx` | ✅ |
| Remove unused imports from workflow.ts (`parseUserAgent`, `sanitizeAuditData`) | ✅ |
| ESLint verification | ✅ 0 errors (3 pre-existing `any` warnings) |
| Workflow concurrency tests (33/33) | ✅ Passed |
| Code review | ✅ Approved |

---

## Modified Files

| File | Change |
|---|---|
| `src/lib/audit.ts` | Added `AuditTxClient` interface, `tx` field to both input types, `client = input.tx \|\| db` in both create functions |
| `src/lib/workflow.ts` | Replaced `tx.auditLog.create({...})` with `createAuditLog({..., tx})`, removed unused imports |

---

## How It Works

### Before
```typescript
// createAuditLog uses global db — can't participate in transactions
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  await db.auditLog.create({ data: { ... } })  // always uses global db
}

// workflow.ts had to bypass createAuditLog with direct Prisma write
await tx.auditLog.create({ data: { ... } })  // duplicated logic
```

### After
```typescript
// createAuditLog accepts optional tx — falls back to global db
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  const client = input.tx || db
  await client.auditLog.create({ data: { ... } })
}

// workflow.ts now uses the central service inside the transaction
await createAuditLog({
  adminId: userId,
  action: ACTION_AUDIT_KEY[action],
  entityType,
  entityId,
  oldData: { status: previousState, version: current.version },
  newData: { status: newState, version: updated.version },
  ipAddress: ipAddress || undefined,
  userAgent: userAgent || undefined,
  userName: userName || undefined,
  userRole: userRole || undefined,
  status: 'success',
  tx: tx as never,  // Prisma transaction client
})
```

### Transaction Client Type
```typescript
export interface AuditTxClient {
  auditLog: {
    create(args: { data: Record<string, unknown> }): Promise<Record<string, unknown>>
    createMany(args: { data: Record<string, unknown>[] }): Promise<{ count: number }>
  }
}
```

---

## Behavioral Improvement

**Before:** If `tx.auditLog.create()` threw inside `$transaction`, the ENTIRE transaction would roll back (content update, version history, workflow state — all lost).

**After:** `createAuditLog()` catches errors internally and logs them. The transaction commits successfully even if the audit entry fails. This is the correct behavior: **audit failures should never break the main operation.**

---

## API Compatibility

**100% backward compatible.** The `tx` field is optional. All existing callers that don't pass `tx` will continue to use the global `db` client as before.

---

## Breaking Changes

**None.** The `AuditTxClient` is a new exported type — no existing code uses it yet beyond the new workflow.ts integration.

---

## Rollback Steps

1. Revert `src/lib/audit.ts` — remove `AuditTxClient` interface and `tx` field handling
2. Revert `src/lib/workflow.ts` — restore `tx.auditLog.create({...})` with direct Prisma write
3. Verify: `npx eslint src/lib/audit.ts src/lib/workflow.ts` and `npx vitest run src/lib/__tests__/workflow-concurrency.test.ts`
