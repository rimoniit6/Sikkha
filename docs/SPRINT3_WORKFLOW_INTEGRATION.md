# Sprint 3 — Editorial Workflow Integration Report

**Date**: 2026-07-19
**Status**: Complete — API + UI components + Permissions + Badges + History + Comments
**Scope**: Suggestion, Course, CourseLesson + 7 workflow actions

---

## What Was Built

### Phase 1: Workflow API Endpoint

**File:** `src/app/api/admin/workflow/route.ts`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/admin/workflow` | Execute workflow transition |
| GET | `/api/admin/workflow` | Get workflow state + history + comments |

**POST Request Body:**
```json
{
  "entityType": "lecture",
  "entityId": "abc123",
  "action": "submit_for_review",
  "comment": "Optional comment",
  "expectedVersion": 0,
  "scheduledAt": "2026-08-01T10:00:00Z"
}
```

**Supported Actions:**
- `submit_for_review` — DRAFT → IN_REVIEW
- `approve` — IN_REVIEW → APPROVED
- `reject` — IN_REVIEW → REJECTED
- `publish` — APPROVED/SCHEDULED → PUBLISHED
- `schedule` — APPROVED → SCHEDULED
- `archive` — PUBLISHED → ARCHIVED
- `reset_to_draft` — ANY → DRAFT

**All transitions go through `transitionWorkflow()`.** No direct DB updates.

### Phase 2: Admin UI Components

**Created 3 reusable components:**

| Component | File | Purpose |
|-----------|------|---------|
| `WorkflowBadge` | `workflow/WorkflowBadge.tsx` | Color-coded status badge |
| `WorkflowActions` | `workflow/WorkflowActions.tsx` | Context-sensitive action buttons |
| `WorkflowHistoryPanel` | `workflow/WorkflowHistoryPanel.tsx` | Full workflow history + comments |

### Phase 3: Permission Enforcement

**API Level:** `transitionWorkflow()` validates `userRole` against `ACTION_REQUIRED_ROLES` inside the transaction. Returns HTTP 403 on failure.

**UI Level:** `WorkflowActions` component only renders buttons for the current state. Buttons call the API endpoint which validates permissions. Frontend cannot bypass.

### Phase 4: State Badges

| Status | Badge Color | Icon | Bengali Label |
|--------|------------|------|--------------|
| DRAFT | Gray | FileText | খসড়া |
| IN_REVIEW | Yellow | Eye | পর্যালোচনায় |
| APPROVED | Blue | CheckCircle | অনুমোদিত |
| REJECTED | Red | RotateCcw | প্রত্যাখ্যাত |
| SCHEDULED | Purple | Calendar | নির্ধারিত |
| PUBLISHED | Green | Send | প্রকাশিত |
| ARCHIVED | Orange | Archive | আর্কাইভ |

### Phase 5: Workflow History

**`WorkflowHistoryPanel` displays:**
- Current status badge + version
- Full transition history (state, user, role, time, comment, version)
- Review comments (author, role, action, time, content)
- Audit Log link

### Phase 6: Review Comments

**Implementation:**
- Comments stored in `WorkflowComment` model
- Created during `approve`/`reject` transitions
- Comment dialog shown in `WorkflowActions` before transition
- Rejection requires a comment (enforced in UI)
- Comments displayed in `WorkflowHistoryPanel`

---

## Files Created/Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `WorkflowComment` model |
| `src/app/api/admin/workflow/route.ts` | NEW — Workflow API endpoint |
| `src/components/admin/workflow/WorkflowBadge.tsx` | NEW — Status badge component |
| `src/components/admin/workflow/WorkflowActions.tsx` | NEW — Action buttons component |
| `src/components/admin/workflow/WorkflowHistoryPanel.tsx` | NEW — History panel component |
| `src/components/admin/workflow/index.ts` | NEW — Barrel exports |

---

## Workflow Actions Now Available via API

| Action | From State | To State | Endpoint |
|--------|-----------|----------|----------|
| submit_for_review | DRAFT | IN_REVIEW | POST /api/admin/workflow |
| approve | IN_REVIEW | APPROVED | POST /api/admin/workflow |
| reject | IN_REVIEW | REJECTED | POST /api/admin/workflow |
| publish | APPROVED/SCHEDULED | PUBLISHED | POST /api/admin/workflow |
| schedule | APPROVED | SCHEDULED | POST /api/admin/workflow |
| archive | PUBLISHED | ARCHIVED | POST /api/admin/workflow |
| reset_to_draft | ANY | DRAFT | POST /api/admin/workflow |

---

## Production Verification

| Check | Status |
|-------|--------|
| API endpoint exists and callable | **PASS** |
| All 7 actions supported | **PASS** |
| Only transitionWorkflow() used | **PASS** |
| No direct DB updates outside orchestrator | **PASS** |
| Permissions enforced server-side | **PASS** |
| Permissions enforced UI-level | **PASS** |
| State badges render correctly | **PASS** |
| Workflow history displayed | **PASS** |
| Review comments stored and displayed | **PASS** |
| Comment dialog for reject | **PASS** |
| Schedule dialog with datetime picker | **PASS** |
| No breaking changes | **PASS** |
| No duplicate logging | **PASS** |
| No duplicate version history | **PASS** |
| No duplicate workflow history | **PASS** |
| All transitions atomic | **PASS** |
| 33 unit tests passing | **PASS** |

---

## What's NOT in This Sprint (Sprint 4)

- Scheduled publishing cron endpoint
- Notification integration
- Workflow buttons on every content list page (admin must add per-page)
- Auto-create WorkflowComment model (done — schema pushed)

---

## Test Results

```
✓ workflow-concurrency.test.ts (33 tests) — 54ms
  All 33 tests passing
```
