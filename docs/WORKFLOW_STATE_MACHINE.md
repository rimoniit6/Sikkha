# Workflow State Machine — Implementation Report

**Date**: 2026-07-19
**Status**: Complete — Phase 2 Production-Ready
**Scope**: Centralized workflow state machine with optimistic concurrency

---

## What Was Implemented

### 1. Centralized `transitionWorkflow()` Function

Every workflow transition goes through ONE function. No duplicated logic.

**Validates:**
1. Entity exists
2. Transition is allowed
3. Permission (userRole in required roles)
4. Expected version matches
5. No previous state or version change on any failure

**Creates (on success only):**
- WorkflowHistory entry (atomic inside $transaction)
- AuditLog entry (fire-and-forget outside transaction)

**Creates (on failure):** Nothing.

---

### 2. Transition Response Format

```json
{
  "success": true,
  "previousState": "DRAFT",
  "newState": "IN_REVIEW",
  "version": 1,
  "transitionTime": 42,
  "performedBy": "user-123",
  "httpStatus": 200
}
```

**Error response:**
```json
{
  "success": false,
  "previousState": "DRAFT",
  "newState": null,
  "version": 0,
  "transitionTime": null,
  "performedBy": "user-123",
  "error": "Cannot transition from খসড়া to অনুমোদিত.",
  "httpStatus": 400
}
```

**Conflict response:**
```json
{
  "success": false,
  "previousState": "DRAFT",
  "newState": null,
  "version": 1,
  "transitionTime": null,
  "performedBy": "user-123",
  "conflict": true,
  "error": "This record has been modified by another administrator.",
  "httpStatus": 409
}
```

---

### 3. Workflow States

| State | Bengali Label |
|-------|--------------|
| DRAFT | খসড়া |
| IN_REVIEW | পর্যালোচনায় |
| APPROVED | অনুমোদিত |
| REJECTED | প্রত্যাখ্যাত |
| SCHEDULED | নির্ধারিত |
| PUBLISHED | প্রকাশিত |
| ARCHIVED | আর্কাইভ |

### 4. Allowed Transitions

| From | To |
|------|-----|
| DRAFT | IN_REVIEW, PUBLISHED |
| IN_REVIEW | APPROVED, REJECTED, DRAFT |
| APPROVED | PUBLISHED, SCHEDULED, DRAFT |
| SCHEDULED | PUBLISHED, DRAFT |
| PUBLISHED | ARCHIVED, DRAFT |
| ARCHIVED | DRAFT |
| REJECTED | DRAFT |

Admin can reset ANY state → DRAFT.

### 5. Action → Audit Key Mapping

| Action | Audit Key |
|--------|-----------|
| submit_for_review | WORKFLOW_SUBMIT_FOR_REVIEW |
| approve | WORKFLOW_APPROVE |
| reject | WORKFLOW_REJECT |
| publish | WORKFLOW_PUBLISH |
| schedule | WORKFLOW_SCHEDULE |
| archive | WORKFLOW_ARCHIVE |
| reset_to_draft | WORKFLOW_RESET_TO_DRAFT |

---

## Test Results (39/39 PASS)

### Valid Transitions (12 tests)
| Test | Status |
|------|--------|
| DRAFT → IN_REVIEW | ✓ |
| IN_REVIEW → APPROVED | ✓ |
| IN_REVIEW → REJECTED | ✓ |
| REJECTED → DRAFT (resubmit) | ✓ |
| APPROVED → PUBLISHED | ✓ |
| APPROVED → SCHEDULED | ✓ |
| SCHEDULED → PUBLISHED | ✓ |
| PUBLISHED → ARCHIVED | ✓ |
| ARCHIVED → DRAFT (restore) | ✓ |
| PUBLISHED → DRAFT (admin reset) | ✓ |
| Full lifecycle (5 steps) | ✓ |
| Transition time measured | ✓ |

### Invalid Transitions (7 tests)
| Test | Status |
|------|--------|
| IN_REVIEW → PUBLISHED (skip) | ✓ 400 |
| DRAFT → APPROVED (skip) | ✓ 400 |
| DRAFT → ARCHIVED | ✓ 400 |
| DRAFT → REJECTED | ✓ 400 |
| ARCHIVED → PUBLISHED | ✓ 400 |
| PUBLISHED → APPROVED | ✓ 400 |
| REJECTED → PUBLISHED | ✓ 400 |

### Permission Failures (6 tests)
| Test | Status |
|------|--------|
| STUDENT cannot submit | ✓ 403 |
| STUDENT cannot approve | ✓ 403 |
| STUDENT cannot publish | ✓ 403 |
| STUDENT cannot archive | ✓ 403 |
| Unknown role cannot reject | ✓ 403 |
| SUPER_ADMIN can do anything | ✓ |

### Conflict Failures (2 tests)
| Test | Status |
|------|--------|
| Stale version returns 409 | ✓ |
| Two concurrent: one succeeds, one conflict | ✓ |

### History/Audit Integration (6 tests)
| Test | Status |
|------|--------|
| Creates history on success | ✓ |
| No history on invalid transition | ✓ |
| No history on permission failure | ✓ |
| No history on conflict | ✓ |
| Calls auditFn on success | ✓ |
| No auditFn on failure | ✓ |

### Edge Cases (6 tests)
| Test | Status |
|------|--------|
| Missing entity returns 404 | ✓ |
| Version unchanged after invalid transition | ✓ |
| Version unchanged after permission failure | ✓ |
| isValidTransition valid (14 transitions) | ✓ |
| isValidTransition invalid (13 transitions) | ✓ |
| Full lifecycle completes | ✓ |

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/workflow.ts` | Centralized state machine with `transitionWorkflow()` |
| `src/lib/audit.ts` | Added 7 workflow audit action constants + Bengali labels |
| `src/lib/__tests__/workflow-concurrency.test.ts` | 39 tests (all passing) |
| `prisma/schema.prisma` | ContentWorkflow + WorkflowHistory models (from Phase 1) |

---

## Production Readiness

# **PASS**

- Centralized `transitionWorkflow()` — no duplicated logic
- Optimistic concurrency enforced on every transition
- WorkflowHistory created atomically on success
- AuditLog created fire-and-forget on success
- Nothing created on failure
- 39/39 tests passing
- Zero production TypeScript errors
- Standardized response format
- Bengali labels for all states and actions
