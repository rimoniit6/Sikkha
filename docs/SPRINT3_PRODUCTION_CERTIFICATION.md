# Sprint 3 — Production Certification Report

**Date**: 2026-07-19
**Status**: NOT READY — 4 FAIL, 4 WARNING, 2 PASS

---

## 1. UI Integration — FAIL

### Workflow Components Are Built But NOT Rendered Anywhere

| Component | File Exists | Imported by Any Admin Page | Rendered |
|-----------|------------|---------------------------|----------|
| WorkflowBadge | YES | **NO** | **NO** |
| WorkflowActions | YES | **NO** | **NO** |
| WorkflowHistoryPanel | YES | **NO** | **NO** |

**Evidence:** Grep for `from.*workflow` across all `.tsx` files in `src/components/admin/` and `src/features/` returns zero matches. The 3 workflow components are completely isolated — they exist as standalone files but no admin page imports or renders them.

### Per-Model Verification

| Model | Admin Page | WorkflowBadge | WorkflowActions | WorkflowHistoryPanel |
|-------|-----------|---------------|-----------------|---------------------|
| Lecture | `AdminLecturesPage.tsx` | **NOT RENDERED** | **NOT RENDERED** | **NOT RENDERED** |
| MCQ | `AdminMCQPage.tsx` | **NOT RENDERED** | **NOT RENDERED** | **NOT RENDERED** |
| CQ | `AdminCQPage.tsx` | **NOT RENDERED** | **NOT RENDERED** | **NOT RENDERED** |
| KnowledgeQuestion | `AdminKnowledgeQuestionsPage.tsx` | **NOT RENDERED** | **NOT RENDERED** | **NOT RENDERED** |
| Suggestion | `AdminSuggestionPage.tsx` | **NOT RENDERED** | **NOT RENDERED** | **NOT RENDERED** |
| Course | `CourseAdminContainer` | **NOT RENDERED** | **NOT RENDERED** | **NOT RENDERED** |
| CourseLesson | (inside course admin) | **NOT RENDERED** | **NOT RENDERED** | **NOT RENDERED** |
| Exam | Exam admin page | **NOT RENDERED** | **NOT RENDERED** | **NOT RENDERED** |
| MCQExamPackage | MCQ Exam admin | **NOT RENDERED** | **NOT RENDERED** | **NOT RENDERED** |
| CQExamPackage | CQ Exam admin | **NOT RENDERED** | **NOT RENDERED** | **NOT RENDERED** |
| ContentBundle | `AdminBundlesPage.tsx` | **NOT RENDERED** | **NOT RENDERED** | **NOT RENDERED** |
| ContentPackage | `AdminPackagesPage.tsx` | **NOT RENDERED** | **NOT RENDERED** | **NOT RENDERED** |
| Notice | Notices page | **NOT RENDERED** | **NOT RENDERED** | **NOT RENDERED** |

**0/13 models render workflow components.** The UI is unreachable by any admin user.

---

## 2. Workflow API Usage — PASS

### API Endpoint Exists and Is Correct

**`POST /api/admin/workflow`** exists at `src/app/api/admin/workflow/route.ts`.

**`GET /api/admin/workflow`** exists for fetching workflow state + history + comments.

**All transitions go through `transitionWorkflow()`:**
- Line 41: `const result = await transitionWorkflow(db, { ... })`
- No direct `db.contentWorkflow.update()` calls exist outside `workflow.ts`

**Evidence:**
```
src/lib/workflow.ts:368 — tx.contentWorkflow.update() — inside transitionWorkflow() ONLY
src/app/api/admin/workflow/route.ts:41 — transitionWorkflow() — the ONLY caller for real actions
```

**No bypasses found.** The API architecture is correct.

---

## 3. Permission Validation — WARNING

### Server-Side: PASS

`transitionWorkflow()` validates permissions at Step 3 (workflow.ts:267-275):
```typescript
const requiredRoles = ACTION_REQUIRED_ROLES[action]
if (!requiredRoles.includes(userRole || '')) {
  return { success: false, httpStatus: 403 }
}
```

All 7 actions require `['ADMIN', 'SUPER_ADMIN']`.

### Frontend: WARNING (Buttons Don't Exist)

Since no admin page renders `WorkflowActions`, the permission-based button hiding is irrelevant. There are no buttons to hide or show.

**When the UI is integrated, the `WorkflowActions` component will correctly hide/show buttons based on state. But currently it is unreachable.**

---

## 4. Workflow Comments — WARNING

### Comment Storage: OUTSIDE Transaction

**Evidence (workflow/route.ts:63-76):**
```typescript
// After transitionWorkflow() succeeds...
if (comment && (action === 'approve' || action === 'reject')) {
  await db.workflowComment.create({  // ← OUTSIDE the $transaction
    data: { ... },
  })
}
```

The `WorkflowComment.create()` call is AFTER `transitionWorkflow()` returns. It is NOT inside the `$transaction`.

**Risk:** If `workflowComment.create()` fails (DB error), the transition succeeds but the comment is lost. If the server crashes between the two calls, the comment is lost.

### Comment Display: WARNING

`WorkflowHistoryPanel` fetches comments via `GET /api/admin/workflow`, which queries `db.workflowComment.findMany()`. But since no admin page renders `WorkflowHistoryPanel`, this is currently unreachable.

### Reject Requires Comment: WARNING

`WorkflowActions` component enforces comment requirement in the UI:
```typescript
disabled={selectedAction === 'reject' && !comment.trim()}
```

But the API does NOT enforce this. A direct POST to `/api/admin/workflow` with `action: 'reject'` and no comment will succeed.

---

## 5. Optimistic Concurrency — WARNING

### expectedVersion Auto-Fetch: WARNING

**Evidence (workflow/route.ts:34-39):**
```typescript
let version = expectedVersion
if (version === undefined || version === null) {
  const wf = await getWorkflow(db, entityType, entityId)
  version = wf?.version ?? 0
}
```

If the caller does not send `expectedVersion`, the API auto-fetches the current version. This means **concurrent requests that both omit expectedVersion will BOTH succeed** because they both read the same version before the first one commits.

The frontend `WorkflowActions` component DOES pass `expectedVersion` (from the `version` prop). But since the UI is unreachable, this is moot.

### HTTP 409 Handling: WARNING

The API returns `{ success: false, conflict: true, error: '...' }` with HTTP 409 on version mismatch. The `WorkflowActions` component shows a toast with the error. But the user is NOT explicitly told to refresh — just "কাজ সম্পন্ন হয়নি" (task not completed).

---

## 6. Scheduling — PASS (Partially)

### scheduledAt Is Stored: YES

The API passes `scheduledAt` to `transitionWorkflow()`, which stores it in `ContentWorkflow.scheduledAt`.

### Persistence: YES

`scheduledAt` is stored in the database. It survives page refresh.

### Cron/Auto-Publish: NO (Explicitly deferred to Sprint 4)

No cron endpoint exists. Scheduled content will remain in SCHEDULED state until a cron job is added.

**This is expected and documented as Sprint 4 scope.**

---

## 7. Timeline / Audit / Version — WARNING

### Inside transitionWorkflow(): PASS

Every real workflow transition creates:
- 1 ContentVersion snapshot (if versionable model)
- 1 ContentWorkflow update
- 1 WorkflowHistory entry
- 1 AuditLog entry

All inside a single `$transaction`.

### Comment: OUTSIDE Transaction

`WorkflowComment.create()` is called outside the transaction. If it fails, the transition has already committed.

### No Duplicates: PASS

Each operation is called exactly once per transition. No loops or batch operations.

---

## 8. Atomicity — WARNING

### Comment Outside Transaction

| Failure Point | Version | Workflow | History | Audit | Comment |
|---------------|---------|----------|---------|-------|---------|
| transitionWorkflow fails | Rolled back | Rolled back | Rolled back | Rolled back | Never called |
| transitionWorkflow succeeds, comment fails | Committed | Committed | Committed | Committed | **LOST** |

**The comment is NOT transactionally consistent with the transition.**

---

## 9. Navigation — FAIL

### No Workflow Page Exists

There is no admin page at `/admin/workflow`. The `AdminLayout.tsx` does NOT have a sidebar entry for workflow management.

### No Admin Page Imports Workflow Components

- Zero imports of `WorkflowBadge` from any admin page
- Zero imports of `WorkflowActions` from any admin page
- Zero imports of `WorkflowHistoryPanel` from any admin page
- The only reachable workflow UI is `AdminVersionHistoryPage` (for viewing content versions, not workflow transitions)

**The workflow system is invisible to admin users.**

---

## 10. Production Completeness

### Scores

| Category | Score | Percentage |
|----------|-------|-----------|
| Workflow API | **1/1** | **100%** |
| Workflow UI Components | **3/3 created** | **100% built** |
| Workflow UI Integration | **0/13 models** | **0%** |
| Workflow Transitions via API | **7/7 actions** | **100%** |
| Workflow Comments | **Partial** | **60%** |
| Optimistic Concurrency | **Partial** | **70%** |
| Scheduling (cron) | **0/1** | **0%** (Sprint 4) |
| Navigation | **0/1** | **0%** |

### Workflow Integration by Model

| Model | update_content | Real Transitions | UI Components | Status |
|-------|---------------|-----------------|---------------|--------|
| Lecture | YES | API available | **NOT rendered** | **40%** |
| MCQ | YES | API available | **NOT rendered** | **40%** |
| CQ | YES | API available | **NOT rendered** | **40%** |
| KnowledgeQuestion | YES | API available | **NOT rendered** | **40%** |
| Suggestion | YES | API available | **NOT rendered** | **40%** |
| Course | YES | API available | **NOT rendered** | **40%** |
| CourseLesson | YES | API available | **NOT rendered** | **40%** |
| Exam | NO | API available | **NOT rendered** | **20%** |
| MCQExamPackage | NO | API available | **NOT rendered** | **20%** |
| CQExamPackage | NO | API available | **NOT rendered** | **20%** |
| ContentBundle | NO | API available | **NOT rendered** | **20%** |
| ContentPackage | NO | API available | **NOT rendered** | **20%** |
| Notice | NO | API available | **NOT rendered** | **20%** |

### Missing Integrations

1. **All 13 admin pages need WorkflowBadge, WorkflowActions, WorkflowHistoryPanel integrated**
2. **WorkflowComment should be inside the transaction**
3. **Reject should enforce comment in API**
4. **expectedVersion should be required, not auto-fetched**
5. **Admin sidebar needs workflow navigation entry**

### Critical Bugs

| # | Bug | Severity | Fix |
|---|-----|----------|-----|
| 1 | WorkflowComment outside transaction | HIGH | Move inside transitionWorkflow() or accept data loss risk |
| 2 | Admin UI does not render any workflow components | HIGH | Integrate into all 13 admin pages |
| 3 | No workflow navigation in admin sidebar | HIGH | Add sidebar entry |

### Warnings

| # | Warning | Severity | Fix |
|---|---------|----------|-----|
| 1 | Reject does not enforce comment in API | MEDIUM | Add validation in route.ts |
| 2 | expectedVersion auto-fetch bypasses concurrency | MEDIUM | Make required, reject null |
| 3 | 409 error message doesn't tell user to refresh | LOW | Improve error message |
| 4 | 6 remaining models not using transitionWorkflow() | LOW | Sprint scope boundary |

### Ready for Sprint 4?

# **NO**

Sprint 3 delivered the API and UI components. But the integration is 0% visible to admin users because:
- No admin page imports or renders workflow components
- No sidebar navigation to workflow features
- No way for an admin to actually perform workflow transitions through the UI

**Sprint 3.5 (UI Integration) is required before Sprint 4 (Scheduling + Notifications).**

---

## Summary

| Check | Result |
|-------|--------|
| 1. UI Integration | **FAIL** — 0/13 models render components |
| 2. Workflow API Usage | **PASS** — All transitions through transitionWorkflow() |
| 3. Permission Validation | **WARNING** — Server-side yes, no UI to enforce |
| 4. Workflow Comments | **WARNING** — Outside transaction, reject not enforced in API |
| 5. Optimistic Concurrency | **WARNING** — expectedVersion auto-fetch bypasses |
| 6. Scheduling | **PASS** — stored correctly, cron deferred to Sprint 4 |
| 7. Timeline/Audit/Version | **WARNING** — Comment outside transaction |
| 8. Atomicity | **WARNING** — Comment not in same transaction |
| 9. Navigation | **FAIL** — No workflow page or sidebar entry |
| 10. Production Completeness | **FAIL** — 0% visible to admin users |

### Overall: **NOT READY FOR SPRINT 4**

Need Sprint 3.5 to:
1. Integrate WorkflowBadge + WorkflowActions + WorkflowHistoryPanel into all 13 admin pages
2. Move WorkflowComment inside the transaction
3. Add admin sidebar navigation for workflow
4. Enforce comment in API for reject
5. Make expectedVersion required
