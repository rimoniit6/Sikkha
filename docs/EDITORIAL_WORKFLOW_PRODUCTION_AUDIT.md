# Editorial Workflow — Production Integration Audit

**Date**: 2026-07-19
**Scope**: Complete audit of workflow state transitions across the entire application

---

## 1. API Routes Calling Real Workflow Actions — FAIL

### Real Workflow Actions Used in Production Routes

| Action | Production Route Callers | Status |
|--------|------------------------|--------|
| `submit_for_review` | **0** | **FAIL** |
| `approve` | **0** | **FAIL** |
| `reject` | **0** | **FAIL** |
| `publish` | **0** | **FAIL** |
| `schedule` | **0** | **FAIL** |
| `archive` | **0** | **FAIL** |
| `reset_to_draft` | **0** | **FAIL** |

**Every real workflow action is only tested in unit tests.** Zero production API endpoints call them.

The only action used in production is `update_content` (7 routes). This action does NOT change workflow state — it only increments the version counter.

---

## 2. Models With Only `update_content` — WARNING

| Model | PUT Endpoint | Action Used | Real Workflow? |
|-------|-------------|-------------|----------------|
| Lecture | `lectures/route.ts` PUT | `update_content` | NO |
| MCQ | `mcq/route.ts` PUT | `update_content` | NO |
| CQ | `cq/route.ts` PUT | `update_content` | NO |
| KnowledgeQuestion | `knowledge-questions/route.ts` PUT | `update_content` | NO |
| Suggestion | `suggestions/route.ts` PUT | `update_content` | NO |
| Course | `courses/route.ts` PUT | `update_content` | NO |
| CourseLesson | `courses/lessons/route.ts` PUT | `update_content` | NO |

**All 7 integrated models only perform `update_content`.** None trigger actual workflow state transitions.

### Models Not Yet Integrated (Still Use `createVersion()`)

| Model | PUT Endpoint | Uses Workflow? |
|-------|-------------|----------------|
| Exam | `exams/route.ts` PUT | NO |
| MCQExamPackage | `mcq-exam-packages/route.ts` PUT | NO |
| CQExamPackage | `cq-exam-packages/route.ts` PUT | NO |
| ContentBundle | `bundles/route.ts` PUT + `bundles/[id]/route.ts` PUT | NO |
| ContentPackage | `packages/route.ts` PUT + `plans/route.ts` PUT | NO |
| Notice | `notices/route.ts` PUT | NO |
| SiteSetting | `settings/route.ts` PUT | NO |

---

## 3. Admin UI Workflow Buttons — FAIL

### Current Admin UI

| Feature | Exists? | Details |
|---------|---------|---------|
| Version History page | YES | `AdminVersionHistoryPage.tsx` — shows versions, side-by-side compare, timeline view |
| Workflow Status Badge | NO | No component displays workflow state (DRAFT, IN_REVIEW, etc.) |
| Submit for Review button | NO | **MISSING** — No UI to transition DRAFT → IN_REVIEW |
| Approve button | NO | **MISSING** — No UI to transition IN_REVIEW → APPROVED |
| Reject button | NO | **MISSING** — No UI to transition IN_REVIEW → REJECTED |
| Publish button | NO | **MISSING** — No UI to transition APPROVED → PUBLISHED |
| Schedule button | NO | **MISSING** — No UI to transition APPROVED → SCHEDULED |
| Archive button | NO | **MISSING** — No UI to transition PUBLISHED → ARCHIVED |
| Reset to Draft button | NO | **MISSING** — No UI to reset any state to DRAFT |
| Workflow status on content list | NO | Content list pages show `isActive` toggle, not workflow status |
| Workflow history view | NO | No UI to view WorkflowHistory records |
| Review comments UI | NO | No UI to add review comments |
| Assignment UI | NO | No UI to assign reviewers/publishers |

### Missing Screens

1. **Workflow Status Badge Component** — Display current workflow state on every content card
2. **Content List Workflow Column** — Show workflow status in admin content tables
3. **Submit for Review Dialog** — Modal/page to submit content for review
4. **Review Panel** — Panel with Approve/Reject buttons and comment field
5. **Publish Controls** — Schedule or immediate publish button
6. **Archive Button** — Archive published content
7. **Workflow History Panel** — Show transition history per content item
8. **Content Detail Workflow Sidebar** — Full workflow controls on content edit page

---

## 4. Workflow Permissions Enforcement — WARNING

### Current State

Permissions are defined inside `workflow.ts`:

```typescript
const ACTION_REQUIRED_ROLES: Record<WorkflowAction, string[]> = {
  submit_for_review: ['ADMIN', 'SUPER_ADMIN'],
  approve: ['ADMIN', 'SUPER_ADMIN'],
  ...
  update_content: ['ADMIN', 'SUPER_ADMIN'],
}
```

`transitionWorkflow()` validates permissions at Step 3:
```typescript
if (!requiredRoles.includes(userRole || '')) {
  return { success: false, httpStatus: 403 }
}
```

**However:** Since no API endpoint calls real workflow actions, these permission checks are never executed in production. The permission system exists but is dormant.

**No API route validates workflow permissions.** The routes call `transitionWorkflow()` with `action: 'update_content'`, which requires `ADMIN` or `SUPER_ADMIN` — but the routes already have `withAdmin()` checks before calling `transitionWorkflow()`.

---

## 5. Activity Timeline Displays Workflow Transitions — WARNING

### Current State

- `transitionWorkflow()` creates an `auditLog.create()` entry for every transition
- The Activity Timeline reads from AuditLog
- **But no real workflow transitions happen in production** (only `update_content`)
- AuditLog entries are created for `CONTENT_UPDATE` actions (from `update_content`)
- These show up in the Activity Timeline as content updates, NOT as workflow transitions

**Activity Timeline shows content updates, but NOT workflow state transitions** (because no workflow transitions occur).

---

## 6. Version History Records Workflow Transitions — WARNING

### Current State

- `createVersion()` is called inside `transitionWorkflow()` for versionable models
- Version snapshots capture the state BEFORE the update
- **But `update_content` records `['status']` as changed fields** by default (from `changedFields || ['status']`)
- The actual field changes from the route's `changedFields` are passed correctly

**Version History DOES record content changes.** However, it does NOT record workflow state transitions (because no state transitions occur).

---

## 7. Rollback Restores Workflow State — FAIL

### Current State

- `rollbackVersion()` function exists in `version-history.ts`
- **No API endpoint exposes rollback**
- No Admin UI button triggers rollback
- `rollbackVersion()` is only tested in unit tests

**Rollback is implemented in the service layer but has no production API endpoint or UI.**

---

## 8. Scheduled Publishing Connected to Cron — FAIL

### Current State

- `workflow.ts` defines `scheduleWorkflow()` and `ACTION_TARGET_STATE['schedule'] = 'SCHEDULED'`
- ContentWorkflow model has `scheduledAt` field
- **No cron endpoint exists** (`src/app/api/admin/cron/` directory does not exist)
- No background job checks for scheduled publications
- No `setInterval` or `setTimeout` for auto-publish

**Scheduled publishing is not connected to any cron or background job.**

---

## 9. Notifications Triggered — FAIL

### Current State

- `transitionWorkflow()` does NOT create any notifications
- No notification logic exists in `workflow.ts`
- No notification references in any route handler
- The project has a Notification model but workflow transitions don't use it

**No notifications are triggered for any workflow transition.**

---

## 10. Workflow Transition Bypass Audit — PASS (No bypasses exist because no transitions exist)

### Analysis

Since no production endpoint calls real workflow actions (`submit_for_review`, `approve`, etc.), there are no bypasses to find.

For `update_content`:
| Side Effect | Bypassed? |
|-------------|-----------|
| Version History | NO — `createVersion()` inside transaction |
| Workflow History | NO — `workflowHistory.create()` inside transaction |
| Audit Log | NO — `auditLog.create()` inside transaction |
| Activity Timeline | NO — Derived from AuditLog |
| Optimistic Concurrency | NO — Version check before transaction |

**No side effects are bypassed for `update_content`.** But this is moot because no real workflow transitions exist.

---

## Integration Percentage

### Content Update Integration
**7/13 models** (Lecture, MCQ, CQ, KnowledgeQuestion, Suggestion, Course, CourseLesson)

Remaining: Exam, MCQExamPackage, CQExamPackage, ContentBundle, ContentPackage, Notice, SiteSetting

### Real Workflow Transition Integration
**0/7 actions** — No production endpoint calls any real workflow action

### Admin UI
**0/8 screens** — No workflow controls in Admin UI

### API (workflow endpoints)
**0/7 actions** — No endpoints for submit/approve/reject/publish/schedule/archive/reset

### Notifications
**0%** — No notification integration

### Scheduling
**0%** — No cron endpoint

### Rollback
**0%** — Service exists, no API/UI

---

## Overall Editorial Workflow Completion

| Category | Score | Status |
|----------|-------|--------|
| Content Update Integration | **7/13** | **54%** |
| Real Workflow Transitions | **0/7 actions** | **0%** |
| Admin UI Workflow Controls | **0/8 screens** | **0%** |
| API Workflow Endpoints | **0/7 actions** | **0%** |
| Notifications | **0%** | **0%** |
| Scheduling/Cron | **0%** | **0%** |
| Rollback UI | **0%** | **0%** |

### **Overall Editorial Workflow Completion: 8%**

**The engine is built and tested. The integration is 54% for content updates. The actual workflow lifecycle (state transitions, approvals, publishing, notifications, scheduling) is 0% integrated into production.**
