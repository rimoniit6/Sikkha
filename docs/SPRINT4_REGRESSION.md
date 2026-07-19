# Sprint 4 — Regression Audit

## Checklist

- [x] `transitionWorkflow()` is NOT modified — only called
- [x] No new Prisma models added — only fields on existing `ContentWorkflow`
- [x] No new dependencies added — uses only existing `@prisma/client`, `next/server`
- [x] Existing workflow tests still pass: `npm test` → 33/33 passing
- [x] Schema migration is additive (new columns with defaults) — no data loss
- [x] Cron endpoint is idempotent — running twice produces same result
- [x] System user `system-cron` doesn't need to exist in DB (no FK on AuditLog.adminId to User)

## Test Results

| Suite | Tests | Status |
|-------|-------|--------|
| `scheduled-publish.test.ts` | 16 | ALL PASS |
| `workflow-concurrency.test.ts` | 33 | ALL PASS |
| Full suite | 389 | 383 pass, 6 pre-existing failures |

## Pre-existing Failures (NOT related to Sprint 4)

1. `purchase.service.test.ts` — status casing mismatch (3 tests)
2. `access-control.test.ts` — batch-checks with payment access (1 test)
3. `validations.test.ts` — difficulty casing (1 test)
4. `api-client.test.ts` — timeout error handling (1 test)

## Schema Migration Safety

- Added 4 columns with defaults to `ContentWorkflow`
- `publishAttempts` defaults to 0
- `lastPublishAttempt`, `publishFailedAt`, `publishError` default to null
- No existing data affected — all new columns are nullable or have defaults
- `npx prisma db push` succeeded without errors

## Workflow Engine Integrity

- `transitionWorkflow()` is called with the same parameters as manual publish
- No modifications to the workflow engine code
- All existing transition tests pass
- System user `system-cron` is used for audit trail (no FK constraint violated)
