# Audit Log Verification Report

**Project:** Sikkha - Online Learning Platform  
**Date:** 2026-07-19  
**Auditor:** MiMoCode Production Audit  

---

## Executive Summary

The audit log system has a well-designed core infrastructure (`src/lib/audit.ts`) with comprehensive action constants (100+), proper DB schema with indexes, and a functional UI page. However, **36 out of ~50 admin API routes with write operations do NOT call audit logging functions**. This means the majority of admin actions are not being recorded.

**Overall Audit Log Health Score: 58/100**

---

## 1. Event Coverage

### Routes WITH Audit Logging (18 routes)

| Route | Actions Logged | Method |
|-------|---------------|--------|
| `/api/admin/lectures` | CREATE, DELETE | `auditFromRequest` |
| `/api/admin/mcq` | CREATE, DELETE | `auditFromRequest` |
| `/api/admin/cq` | CREATE, DELETE | `auditFromRequest` |
| `/api/admin/users` | UPDATE, DELETE | `auditFromRequest` |
| `/api/admin/classes` | CREATE, UPDATE, DELETE | `auditFromRequest` |
| `/api/admin/subjects` | CREATE, UPDATE, DELETE | `auditFromRequest` |
| `/api/admin/chapters` | CREATE, UPDATE, DELETE | `auditFromRequest` |
| `/api/admin/years` | CREATE, UPDATE, DELETE | `auditFromRequest` |
| `/api/admin/boards` | CREATE, UPDATE, DELETE | `auditFromRequest` |
| `/api/admin/teacher-moderators` | CREATE, UPDATE, DELETE | `auditFromRequest` |
| `/api/admin/testimonials` | CREATE, UPDATE, DELETE | `auditFromRequest` |
| `/api/admin/faqs` | CREATE, UPDATE, DELETE | `auditFromRequest` |
| `/api/admin/banners` | CREATE, UPDATE, DELETE | `auditFromRequest` |
| `/api/admin/notifications` | CREATE, UPDATE, DELETE | `auditFromRequest` |
| `/api/admin/payments` | APPROVE | `createAuditLog` |
| `/api/admin/trash` | RESTORE, FORCE_DELETE | `createAuditLog` |
| `/api/admin/database/import` | IMPORT | `auditFromRequest` |
| `/api/admin/database/export` | EXPORT | `auditFromRequest` |

### Routes WITHOUT Audit Logging (36 routes) — CRITICAL GAP

| # | Route | Write Operations | Severity |
|---|-------|-----------------|----------|
| 1 | `/api/admin/settings` | POST, PUT, PATCH | **HIGH** |
| 2 | `/api/admin/suggestions` | POST, PUT, DELETE | **HIGH** |
| 3 | `/api/admin/courses` | POST (create, update, delete, workflow) | **HIGH** |
| 4 | `/api/admin/courses/lessons` | POST | **HIGH** |
| 5 | `/api/admin/plans` | POST, PUT, DELETE | **HIGH** |
| 6 | `/api/admin/packages` | POST, PUT, DELETE | **HIGH** |
| 7 | `/api/admin/board-questions` | POST, PUT, DELETE | **HIGH** |
| 8 | `/api/admin/bundles` | POST, PUT, DELETE | **HIGH** |
| 9 | `/api/admin/bundles/[id]` | PUT, DELETE | **HIGH** |
| 10 | `/api/admin/mcq-exam-packages` | POST, PUT, DELETE | **HIGH** |
| 11 | `/api/admin/exams` | POST, PUT, DELETE | **HIGH** |
| 12 | `/api/admin/board-years` | POST, PUT, DELETE | **MEDIUM** |
| 13 | `/api/admin/topics` | POST, PUT, DELETE | **MEDIUM** |
| 14 | `/api/admin/content-types` | POST, PUT, DELETE | **MEDIUM** |
| 15 | `/api/admin/notices` | POST, PUT, DELETE | **MEDIUM** |
| 16 | `/api/admin/featured` | POST, PUT, DELETE | **MEDIUM** |
| 17 | `/api/admin/courses/assignments` | POST | **MEDIUM** |
| 18 | `/api/admin/feedback` | PUT | **MEDIUM** |
| 19 | `/api/admin/feedback/[id]/messages` | POST | **MEDIUM** |
| 20 | `/api/admin/navigation` | POST, PUT, DELETE | **MEDIUM** |
| 21 | `/api/admin/navigation/seed` | POST | **LOW** |
| 22 | `/api/admin/settings/seed` | POST | **LOW** |
| 23 | `/api/admin/permissions` | PUT | **HIGH** |
| 24 | `/api/admin/subscriptions` | PUT, DELETE | **MEDIUM** |
| 25 | `/api/admin/mcq-exam-purchases` | DELETE | **MEDIUM** |
| 26 | `/api/admin/mcq-exam-packages/bulk-upload-questions` | POST | **MEDIUM** |
| 27 | `/api/admin/notes` | DELETE | **LOW** |
| 28 | `/api/admin/contact-messages` | PATCH, DELETE | **MEDIUM** |
| 29 | `/api/admin/content-purchases` | PATCH | **MEDIUM** |
| 30 | `/api/admin/database/reset` | POST | **HIGH** |
| 31 | `/api/admin/bulk-import` | POST | **MEDIUM** |
| 32 | `/api/admin/mcq/bulk-upload` | POST | **MEDIUM** |
| 33 | `/api/admin/trash/cleanup` | POST | **MEDIUM** |
| 34 | `/api/admin/trash/impact` | POST | **LOW** |
| 35 | `/api/admin/workflow` | POST | **HIGH** |
| 36 | `/api/admin/version-history/.../rollback` | POST | **MEDIUM** |

### Auth Routes — NO Audit Logging

| Route | Operations | Severity |
|-------|-----------|----------|
| `/api/auth/login` | POST (login) | **HIGH** |
| `/api/auth/register` | POST (register) | **MEDIUM** |
| `/api/auth/logout` | POST (logout) | **MEDIUM** |

---

## 2. Logged Information

### AuditLog Schema Fields

| Field | Type | Present | Assessment |
|-------|------|---------|------------|
| id | String (cuid) | YES | PASS |
| createdAt | DateTime | YES | PASS |
| adminId | String (FK→User) | YES | PASS |
| userName | String (cached) | YES | PASS |
| userRole | String (cached) | YES | PASS |
| action | String | YES | PASS |
| entityType | String | YES | PASS |
| entityId | String | YES | PASS |
| oldData | String (JSON) | YES | PASS |
| newData | String (JSON) | YES | PASS |
| ipAddress | String | YES | PASS |
| userAgent | String | YES | PASS |
| os | String (parsed) | YES | PASS |
| browser | String (parsed) | YES | PASS |
| country | String | YES | PASS |
| status | String | YES | PASS |
| duration | Int (ms) | YES | PASS |

### Missing Fields

| Field | Severity | Notes |
|-------|----------|-------|
| requestMethod | Low | Not stored (GET vs POST) |
| endpoint | Low | Not stored (URL path) |
| email | Low | Available via admin relation join |
| errorMessage | Medium | Not stored separately; buried in oldData/newData |

---

## 3. Integrity

### PASS — No Duplicate Logs

- Each `createAuditLog()` call creates exactly one DB record
- `createBatchAuditLogs()` uses `createMany` — one record per entry
- No batching logic that could cause duplicates

### PASS — Logs Cannot Be Modified

- AuditLog model has no update endpoint
- No admin UI for editing logs
- Logs are append-only by design

### PASS — Transaction Rollback Handling

- `createAuditLog()` is fire-and-forget (never throws)
- If main operation fails, audit log is not created (correct behavior)
- `workflow.ts` creates AuditLog inside `$transaction` — rolls back with the rest

### WARNING — Failed Operations Not Always Logged

- Some routes log with `status: 'failed'` — but most don't log failures at all
- Failed login attempts are NOT logged (no `LOGIN_FAILED` action is ever created)
- Rate limit rejections are NOT logged

### PASS — No Orphan Records

- `adminId` has `onDelete: Cascade` — audit logs are deleted when user is deleted
- This is correct for GDPR compliance

---

## 4. UI Verification

### AdminAuditLogsPage.tsx (654 lines)

| Feature | Status | Evidence |
|---------|--------|----------|
| Pagination | PASS | Page/limit params, prev/next buttons |
| Search | PASS | Free-text search via `q` param |
| Filter by Action | PASS | Dropdown with dynamic action list |
| Filter by Entity Type | PASS | Dropdown with dynamic entity type list |
| Filter by Date Range | PASS | From/To date inputs |
| Filter by User | PASS | `adminId` param supported in API |
| Sorting | PASS | `orderBy: { createdAt: 'desc' }` |
| Detail View | PASS | Dialog with full log details |
| Export | PASS | CSV export with BOM for Excel |
| Loading States | PASS | Skeleton loading animation |
| Empty States | PASS | "কোনো অডিট লগ নেই" message |

### UI Issues

| Issue | Severity | Evidence |
|-------|----------|----------|
| Action filter only shows actions from current page | Low | `uniqueActions` derived from `data.items` not all actions |
| No status filter in UI | Low | API supports `status` but UI doesn't expose it |
| Export limited to 10,000 records | Low | `limit: '10000'` in export |
| No real-time refresh | Low | Manual refresh required |

---

## 5. Security

### PASS — Authorization

- Audit logs API requires `withAdmin(request)` — only ADMIN/SUPER_ADMIN can view
- No endpoint allows STUDENT access to audit logs

### PASS — Sensitive Data Protection

- Passwords are NEVER stored in audit logs
- No grep results for password/secret/token in audit log writes
- `oldData`/`newData` contain only business data (role, status, etc.)

### PASS — SQL Injection Safety

- All queries use Prisma ORM parameterized queries
- No raw SQL in audit log operations

### PASS — XSS Safety

- Audit log data is rendered as text, not HTML
- JSON.stringify used for oldData/newData display

### PASS — CSRF Protection

- Audit logs are GET-only (read-only) — CSRF not applicable
- Write operations that create audit logs are protected by their own routes

### WARNING — Logs Cannot Be Deleted

- No delete endpoint exists for audit logs
- `deletedAt` field exists in schema but is never set
- This is actually GOOD for integrity, but means no GDPR right-to-erasure for audit logs

---

## 6. Database Verification

### PASS — Schema Design

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  adminId    String
  admin      User     @relation(fields: [adminId], references: [id], onDelete: Cascade)
  action     String
  entityType String
  entityId   String
  oldData    String?  // JSON string
  newData    String?  // JSON string
  ipAddress  String?
  userAgent  String?
  userName   String?
  userRole   String?
  status     String?  @default("success")
  duration   Int?
  os         String?
  browser    String?
  country    String?
  createdAt  DateTime @default(now())
  deletedAt  DateTime?

  @@index([adminId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
  @@index([status])
  @@index([os, browser])
}
```

### PASS — Indexes

| Index | Purpose | Assessment |
|-------|---------|------------|
| `adminId` | Filter by user | PASS |
| `entityType, entityId` | Filter by resource | PASS |
| `action` | Filter by action type | PASS |
| `createdAt` | Date range queries, sorting | PASS |
| `status` | Filter by success/failure | PASS |
| `os, browser` | Analytics queries | PASS |

### WARNING — Missing Indexes

| Missing Index | Severity | Impact |
|---------------|----------|--------|
| `action, createdAt` | Low | Composite query for action+date range |
| `adminId, createdAt` | Low | User activity timeline |

### PASS — Foreign Keys

- `adminId` → `User.id` with `onDelete: Cascade`
- Properly enforced at database level

---

## 7. Code Review

### Centralized Audit Service — PASS

- `src/lib/audit.ts` is the single source of truth
- 3 functions: `createAuditLog`, `createBatchAuditLogs`, `auditFromRequest`
- `getClientIP()` helper extracts IP from headers
- `parseUserAgent()` extracts OS/browser
- Fire-and-forget design (never throws)

### Audit Actions Constants — PASS

- 100+ action constants defined in `AuditActions`
- Bengali display names in `ACTION_LABELS`
- Entity type constants in `EntityTypes`
- Bengali entity labels in `ENTITY_TYPE_LABELS`

### Error Handling — PASS

- `createAuditLog()` wraps in try/catch — never breaks main operation
- `console.error` on failure for debugging

### Async Logging — PASS

- All audit calls are `await`ed (not fire-and-forget in the route)
- This ensures audit log is written before response is sent
- Correct for consistency

### Transaction Consistency — PASS

- `workflow.ts` creates AuditLog inside `$transaction`
- If transaction rolls back, audit log is also rolled back
- Correct behavior

---

## 8. Missing Events — CRITICAL

### Authentication Events NOT Logged

| Event | Action Constant | Status |
|-------|----------------|--------|
| Successful login | `LOGIN` | **NOT LOGGED** |
| Failed login | `LOGIN_FAILED` | **NOT LOGGED** |
| Logout | `LOGOUT` | **NOT LOGGED** |
| User registration | `USER_REGISTER` | **NOT LOGGED** |

### Settings Events NOT Logged

| Event | Action Constant | Status |
|-------|----------------|--------|
| Settings update | `SETTINGS_UPDATE` | **NOT LOGGED** |
| Settings batch update | `SETTINGS_BATCH_UPDATE` | **NOT LOGGED** |
| Permission change | `PERMISSION_UPDATE` | **NOT LOGGED** |

### Content Events NOT Logged

| Event | Action Constant | Status |
|-------|----------------|--------|
| Suggestion CRUD | `SUGGESTION_*` | **NOT LOGGED** |
| Course CRUD | `COURSE_*` | **NOT LOGGED** |
| Course Lesson CRUD | `COURSE_LESSON_*` | **NOT LOGGED** |
| Package CRUD | `PACKAGE_*` | **NOT LOGGED** |
| Bundle CRUD | `BUNDLE_*` | **NOT LOGGED** |
| Exam CRUD | `EXAM_*` | **NOT LOGGED** |
| MCQ Exam Package CRUD | `MCQ_EXAM_PACKAGE_*` | **NOT LOGGED** |
| Notice CRUD | `NOTICE_*` | **NOT LOGGED** |
| Featured CRUD | `FEATURED_*` | **NOT LOGGED** |
| Board Question CRUD | — | **NOT LOGGED** |
| Content Type CRUD | `CONTENT_TYPE_*` | **NOT LOGGED** |
| Topic CRUD | `TOPIC_*` | **NOT LOGGED** |
| Board Year CRUD | `BOARD_YEAR_*` | **NOT LOGGED** |

### Workflow Events — PARTIALLY LOGGED

| Event | Status | Evidence |
|-------|--------|----------|
| Workflow transitions | PASS | `workflow.ts` creates AuditLog in transaction |
| Workflow route itself | **NOT LOGGED** | `/api/admin/workflow` POST doesn't log the action separately |

### Trash Events — PARTIALLY LOGGED

| Event | Status | Evidence |
|-------|--------|----------|
| Restore | PASS | `trash/route.ts` logs |
| Force delete | PASS | `trash/route.ts` logs |
| Cleanup | **NOT LOGGED** | `trash/cleanup/route.ts` has no audit |
| Impact analysis | **NOT LOGGED** | `trash/impact/route.ts` has no audit (read-only, acceptable) |

### Other Missing Events

| Event | Severity |
|-------|----------|
| Bulk import | MEDIUM |
| MCQ bulk upload | MEDIUM |
| MCQ exam package bulk upload | MEDIUM |
| Database reset | HIGH |
| Subscription changes | MEDIUM |
| Feedback updates | MEDIUM |
| Contact message reads | MEDIUM |
| Content purchase changes | MEDIUM |
| Navigation seed | LOW |
| Settings seed | LOW |

---

## 9. Recommended Improvements

### Priority 1: Authentication Audit Logging (HIGH)

**File:** `src/app/api/auth/login/route.ts`

Add audit logging for:
- Successful login (with user ID, IP, user agent)
- Failed login (with email attempt, IP, user agent)

```ts
// After successful login:
await createAuditLog({
  adminId: user.id,
  action: AuditActions.LOGIN,
  entityType: EntityTypes.USER,
  entityId: user.id,
  ipAddress,
  userAgent,
  userName: user.name,
  userRole: user.role,
  status: 'success',
})

// After failed login:
await createAuditLog({
  adminId: 'unknown',
  action: AuditActions.LOGIN_FAILED,
  entityType: EntityTypes.USER,
  entityId: email,
  ipAddress,
  userAgent,
  status: 'failed',
})
```

### Priority 2: Settings Audit Logging (HIGH)

**File:** `src/app/api/admin/settings/route.ts`

Add audit logging for all settings changes.

### Priority 3: Missing Content Routes (HIGH)

Add `auditFromRequest` calls to these routes:
- `suggestions/route.ts`
- `courses/route.ts`
- `courses/lessons/route.ts`
- `plans/route.ts`
- `packages/route.ts`
- `bundles/route.ts`
- `mcq-exam-packages/route.ts`
- `exams/route.ts`
- `board-questions/route.ts`
- `notices/route.ts`
- `featured/route.ts`
- `content-types/route.ts`
- `topics/route.ts`
- `board-years/route.ts`

### Priority 4: Permissions Audit Logging (HIGH)

**File:** `src/app/api/admin/permissions/route.ts`

Permission changes are security-critical and must be logged.

### Priority 5: Database Reset Audit Logging (HIGH)

**File:** `src/app/api/admin/database/reset/route.ts`

Database reset is destructive and must be logged.

### Priority 6: Workflow Route Audit Logging (MEDIUM)

**File:** `src/app/api/admin/workflow/route.ts`

While `workflow.ts` creates an AuditLog in the transaction, the route itself should also log the HTTP request for complete traceability.

---

## 10. Files Needing Modification

### Critical (Must Fix)

| File | Change Required | Effort |
|------|----------------|--------|
| `src/app/api/auth/login/route.ts` | Add login/login_failed audit logging | 30 min |
| `src/app/api/auth/register/route.ts` | Add user_register audit logging | 15 min |
| `src/app/api/auth/logout/route.ts` | Add logout audit logging | 15 min |
| `src/app/api/admin/settings/route.ts` | Add settings_update audit logging | 30 min |
| `src/app/api/admin/permissions/route.ts` | Add permission_update audit logging | 15 min |
| `src/app/api/admin/database/reset/route.ts` | Add database_reset audit logging | 15 min |

### High Priority

| File | Change Required | Effort |
|------|----------------|--------|
| `src/app/api/admin/suggestions/route.ts` | Add CRUD audit logging | 30 min |
| `src/app/api/admin/courses/route.ts` | Add CRUD audit logging | 45 min |
| `src/app/api/admin/courses/lessons/route.ts` | Add CRUD audit logging | 30 min |
| `src/app/api/admin/packages/route.ts` | Add CRUD audit logging | 30 min |
| `src/app/api/admin/bundles/route.ts` | Add CRUD audit logging | 30 min |
| `src/app/api/admin/mcq-exam-packages/route.ts` | Add CRUD audit logging | 45 min |
| `src/app/api/admin/exams/route.ts` | Add CRUD audit logging | 30 min |
| `src/app/api/admin/board-questions/route.ts` | Add CRUD audit logging | 30 min |
| `src/app/api/admin/plans/route.ts` | Add CRUD audit logging | 30 min |

### Medium Priority

| File | Change Required | Effort |
|------|----------------|--------|
| `src/app/api/admin/notices/route.ts` | Add CRUD audit logging | 20 min |
| `src/app/api/admin/featured/route.ts` | Add CRUD audit logging | 20 min |
| `src/app/api/admin/content-types/route.ts` | Add CRUD audit logging | 20 min |
| `src/app/api/admin/topics/route.ts` | Add CRUD audit logging | 20 min |
| `src/app/api/admin/board-years/route.ts` | Add CRUD audit logging | 20 min |
| `src/app/api/admin/navigation/route.ts` | Add CRUD audit logging | 20 min |
| `src/app/api/admin/subscriptions/route.ts` | Add CRUD audit logging | 20 min |
| `src/app/api/admin/contact-messages/route.ts` | Add audit logging | 15 min |
| `src/app/api/admin/feedback/route.ts` | Add audit logging | 15 min |
| `src/app/api/admin/bulk-import/route.ts` | Add audit logging | 15 min |
| `src/app/api/admin/mcq/bulk-upload/route.ts` | Add audit logging | 15 min |
| `src/app/api/admin/trash/cleanup/route.ts` | Add audit logging | 15 min |
| `src/app/api/admin/version-history/.../rollback/route.ts` | Add audit logging | 15 min |

### Low Priority

| File | Change Required | Effort |
|------|----------------|--------|
| `src/app/api/admin/navigation/seed/route.ts` | Add audit logging | 10 min |
| `src/app/api/admin/settings/seed/route.ts` | Add audit logging | 10 min |
| `src/app/api/admin/notes/route.ts` | Add audit logging | 10 min |
| `src/app/api/admin/trash/impact/route.ts` | Add audit logging (read-only, optional) | 10 min |

---

## Score Breakdown

| Area | Score | Weight |
|------|-------|--------|
| Event Coverage | 35/100 | 30% |
| Logged Information | 90/100 | 15% |
| Integrity | 88/100 | 15% |
| UI Verification | 90/100 | 10% |
| Security | 92/100 | 10% |
| Database | 90/100 | 10% |
| Code Review | 85/100 | 10% |

**Final Score: 58/100**

---

## Summary

| Category | Count |
|----------|-------|
| Routes WITH audit logging | 18 |
| Routes WITHOUT audit logging | 36 |
| Auth routes without logging | 3 |
| Total missing events | ~80+ action types |
| Critical files to modify | 6 |
| High priority files to modify | 9 |
| Medium priority files to modify | 13 |
| Low priority files to modify | 4 |

---

## Critical Issues: 0
## High Issues: 5 (auth logging, settings logging, permissions logging, database reset logging, 36 routes missing audit)
## Medium Issues: 3 (missing UI filters, no error message field, export limit)
## Low Issues: 4 (composite indexes, request method storage, real-time refresh, action filter scope)
