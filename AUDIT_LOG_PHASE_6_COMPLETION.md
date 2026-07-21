# Phase 6 — Audit Log Retention & Purge Utility

**Generated:** July 20, 2026  
**Status:** ✅ Complete  
**Reference:** AUDIT_LOG_COMPLETE_REPORT.md — Remaining Work: Retention utility

---

## Changes Made

### 3 New Files

| File | Purpose |
|------|---------|
| `src/app/api/admin/audit-logs/retention/route.ts` | Admin API — GET (preview/dry-run) + POST (execute purge) |
| `src/app/api/admin/cron/purge-audit-logs/route.ts` | Cron endpoint — scheduled automatic purge (follows existing cron pattern) |
| `src/lib/__tests__/audit-retention.test.ts` | 11 unit tests for the retention utility module |

### 0 Existing Files Modified

The existing `src/lib/audit-retention.ts` module was already complete from Phase 1+2 (Step 12). No changes needed.

---

## API Endpoints

### `GET /api/admin/audit-logs/retention` — Preview/Dry-run

Returns counts of archivable logs without deleting anything:
```json
{
  "normal": 50,
  "security": 10,
  "total": 60,
  "retentionDays": 365,
  "securityRetentionDays": 730
}
```

### `POST /api/admin/audit-logs/retention` — Execute Purge

Deletes logs beyond retention period. Returns:
```json
{
  "deleted": 120,
  "errors": 0,
  "retentionDays": 365
}
```

### `GET /api/admin/cron/purge-audit-logs` — Cron Trigger

Supports both:
- Vercel Cron: `Authorization: Bearer <CRON_SECRET>`
- Admin manual trigger: session auth via `withAdmin()`

### `POST /api/admin/cron/purge-audit-logs` — Manual Trigger

Admin session auth only.

---

## Retention Policy

| Category | Retention | Actions |
|----------|-----------|---------|
| Normal logs | 365 days | Content CRUD, exam activity, payments, etc. |
| Security logs | 730 days | Login, logout, failed login, password changes, permission/role changes, user ban/unban, user create/delete |

---

## Unit Tests (11 total)

| Test | What It Verifies |
|------|-----------------|
| `getRetentionCutoff` | Returns correct date 30 days in the past |
| `getRetentionCutoff` (default) | Uses default AUDIT_RETENTION_DAYS |
| `countArchivableLogs` (zero) | Returns 0/0/0 when no logs exist |
| `countArchivableLogs` (separate) | Counts normal and security logs independently |
| `countArchivableLogs` (filters) | Passes correct filter structure to DB |
| `SECURITY_AUDIT_ACTIONS` (has) | Contains all critical security actions |
| `SECURITY_AUDIT_ACTIONS` (not) | Excludes non-security actions |
| `purgeOldAuditLogs` (zero) | Returns 0/0 when nothing to purge |
| `purgeOldAuditLogs` (two-phase) | Calls deleteMany twice, sums totals |
| `purgeOldAuditLogs` (custom days) | Returns specified retentionDays |
| `purgeOldAuditLogs` (error) | Returns error count on DB failure |

---

## Verification Results

| Check | Result |
|-------|--------|
| ESLint | ✅ 0 errors, 0 warnings |
| Unit tests | ✅ 11/11 passed |
| Code review | ✅ Approved — no issues |

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Two-phase purge (normal → security) | Security logs get 2× retention; separate queries allow independent error handling |
| Cron route follows existing pattern | Consistent with `publish-scheduled` — supports both CRON_SECRET and admin auth |
| Dry-run via GET | Stateless preview — no side effects, can be safely called repeatedly |
| Reuse existing `audit-retention.ts` | Module was already complete from Phase 1+2; no changes needed |
| Retention constants referenced from module | API responses use `AUDIT_RETENTION_DAYS` / `AUDIT_SECURITY_RETENTION_DAYS` — stays in sync if config changes |

---

## Rollback

To revert: delete the 3 new files and the `__pycache__` / `.tsbuildinfo` caches if any.
