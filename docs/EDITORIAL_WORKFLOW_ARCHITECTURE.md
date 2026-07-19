# Editorial Workflow — Architecture & Implementation Plan (Enhanced)

**Date**: 2026-07-19
**Status**: Architecture Complete — Awaiting Approval
**Scope**: Full editorial workflow with workflow history, reviewer assignment, approval policies, threaded comments, locking rules, rollback behavior, notification rules, and analytics

---

## 1. Executive Summary

This document defines an enterprise-grade Editorial Workflow system with:
- **WorkflowHistory** — append-only transition tracking separate from current state
- **Reviewer Assignment** — assigned reviewer, publisher, and team
- **Configurable Approval Policies** — single, dual, majority, or custom
- **Threaded Review Comments** — simple conversation threads
- **Workflow Locking** — who can edit in each state
- **Rollback Behavior** — defined state transitions on rollback
- **Published Version Reference** — link to exact ContentVersion that went live
- **Notification Rules** — who gets notified for each transition
- **Workflow Analytics** — review time, publish time, rejection rate, workload

---

## 2. Database Architecture

### 2.1 ContentWorkflow (Current State)

```prisma
model ContentWorkflow {
  id              String    @id @default(cuid())
  entityType      String
  entityId        String
  status          String    @default("DRAFT")
  previousStatus  String?
  submittedBy     String?
  submittedAt     DateTime?
  reviewedBy      String?
  reviewedAt      DateTime?
  reviewComment   String?
  approvedBy      String?
  approvedAt      DateTime?
  publishedBy     String?
  publishedAt     DateTime?
  scheduledAt     DateTime?
  unpublishedAt   DateTime?
  rejectedBy      String?
  rejectedAt      DateTime?
  rejectionReason String?
  archivedBy      String?
  archivedAt      DateTime?
  versionNumber   Int?
  metadata        String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([entityType, entityId])
  @@index([status])
  @@index([scheduledAt])
  @@index([entityType, status])
}
```

### 2.2 WorkflowHistory (NEW — Append-Only)

```prisma
model WorkflowHistory {
  id              String    @id @default(cuid())
  entityType      String
  entityId        String
  fromStatus      String?
  toStatus        String
  performedBy     String
  performedByName String?
  performedByRole String?
  comment         String?   // Review comment or rejection reason
  versionNumber   Int?      // Link to ContentVersion at time of transition
  ipAddress       String?
  userAgent       String?
  metadata        String?   // JSON for extra transition data
  createdAt       DateTime  @default(now())

  @@index([entityType, entityId])
  @@index([toStatus])
  @@index([performedBy])
  @@index([createdAt])
}
```

**Key Design:**
- **Append-only** — Never modified or deleted
- **Separate from ContentWorkflow** — Current state stays clean
- **Full audit trail** — Every transition recorded with who, when, why
- **Version link** — References the ContentVersion created during transition

### 2.3 WorkflowComment (NEW — Threaded Comments)

```prisma
model WorkflowComment {
  id              String    @id @default(cuid())
  entityType      String
  entityId        String
  parentId        String?   // For threading (null = top-level)
  authorId        String
  authorName      String?
  authorRole      String?
  content         String
  isResolved      Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([entityType, entityId])
  @@index([parentId])
  @@index([authorId])
}
```

**Key Design:**
- **Simple threading** — `parentId` links replies to parent comments
- **No unlimited nesting** — Only 2 levels deep (reviewer → author → reviewer)
- **Resolution tracking** — `isResolved` marks resolved threads
- **Author info cached** — `authorName` and `authorRole` for display

### 2.4 WorkflowAssignment (NEW — Reviewer/Publisher Assignment)

```prisma
model WorkflowAssignment {
  id              String    @id @default(cuid())
  entityType      String
  entityId        String
  role            String    // "reviewer", "publisher", "watcher"
  userId          String
  assignedBy      String?
  assignedAt      DateTime  @default(now())
  isActive        Boolean   @default(true)

  @@unique([entityType, entityId, role, userId])
  @@index([entityType, entityId])
  @@index([userId])
}
```

**Key Design:**
- **Multiple reviewers** — Same entity can have multiple reviewers
- **Role-based** — reviewer, publisher, watcher
- **Soft-assign** — `isActive` flag for temporary assignments
- **Audit trail** — `assignedBy` tracks who made the assignment

---

## 3. Workflow States

```
                    ┌─────────────┐
                    │    DRAFT    │
                    └──────┬──────┘
                           │ submit_for_review
                           ▼
                    ┌─────────────┐
              ┌─────│  IN_REVIEW  │─────┐
              │     └──────┬──────┘     │
              │            │            │
         approve      reject      cancel
              │            │            │
              ▼            ▼            ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │ APPROVED │  │ REJECTED │  │  DRAFT   │
       └────┬─────┘  └────┬─────┘  └──────────┘
            │              │
       schedule       resubmit
            │              │
            ▼              ▼
       ┌──────────┐  ┌──────────┐
       │SCHEDULED │  │  DRAFT   │
       └────┬─────┘  └──────────┘
            │
       auto_publish
            │
            ▼
       ┌──────────┐
       │PUBLISHED │◄──── unpublish
       └────┬─────┘      │
            │             │
       archive       unpublish
            │             │
            ▼             ▼
       ┌──────────┐  ┌──────────┐
       │ ARCHIVED │  │SCHEDULED │
       └──────────┘  └──────────┘
```

### State Definitions

| State | Label (BN) | Description | Visibility |
|-------|-----------|-------------|------------|
| `DRAFT` | খসড়া | Initial state, editable | Admin only |
| `IN_REVIEW` | পর্যালোচনায় | Submitted for review | Admin + Reviewer |
| `APPROVED` | অনুমোদিত | Approved by reviewer | Admin + Publisher |
| `SCHEDULED` | নির্ধারিত | Scheduled for future publish | Admin + Publisher |
| `PUBLISHED` | প্রকাশিত | Live on platform | Everyone |
| `ARCHIVED` | আর্কাইভ | Removed from visibility | Admin only |
| `REJECTED` | প্রত্যাখ্যাত | Rejected by reviewer | Admin + Author |

### Allowed Transitions

| From | To | Trigger |
|------|-----|---------|
| DRAFT | IN_REVIEW | submit_for_review |
| DRAFT | PUBLISHED | direct_publish (admin only) |
| IN_REVIEW | APPROVED | approve |
| IN_REVIEW | REJECTED | reject |
| IN_REVIEW | DRAFT | cancel |
| APPROVED | SCHEDULED | schedule |
| APPROVED | PUBLISHED | publish |
| APPROVED | DRAFT | reset_to_draft |
| SCHEDULED | PUBLISHED | auto_publish (cron) |
| SCHEDULED | DRAFT | cancel_schedule |
| PUBLISHED | ARCHIVED | archive |
| PUBLISHED | DRAFT | unpublish |
| REJECTED | DRAFT | resubmit |
| ARCHIVED | DRAFT | restore_from_archive |

---

## 4. Workflow Locking Rules

### Who Can Edit in Each State

| State | Author | Reviewer | Publisher | Admin | SuperAdmin |
|-------|--------|----------|-----------|-------|------------|
| **DRAFT** | ✓ Edit | — | — | ✓ Edit | ✓ Edit |
| **IN_REVIEW** | ✗ Lock | ✓ Comment | — | ✓ Force Edit | ✓ Force Edit |
| **APPROVED** | ✗ Lock | ✗ Lock | ✓ Comment | ✓ Force Edit | ✓ Force Edit |
| **SCHEDULED** | ✗ Lock | ✗ Lock | ✗ Lock | ✓ Force Edit | ✓ Force Edit |
| **PUBLISHED** | ✗ Lock | ✗ Lock | ✗ Lock | ✓ Force Edit | ✓ Force Edit |
| **ARCHIVED** | ✗ Lock | ✗ Lock | ✗ Lock | ✓ Force Edit | ✓ Force Edit |
| **REJECTED** | ✓ Edit | ✗ Lock | — | ✓ Force Edit | ✓ Force Edit |

**Locking Rules:**
- Content is **locked** when status ≠ DRAFT and ≠ REJECTED
- Author can only edit in DRAFT and REJECTED states
- Reviewer can only add comments in IN_REVIEW and APPROVED states
- Publisher can only add comments in APPROVED and SCHEDULED states
- Admin/SuperAdmin can force-edit in any state (with audit trail)
- Force-edit by Admin creates a special `admin_force_edit` transition

---

## 5. Rollback Behavior

### When Published Content is Rolled Back

| Rollback Target | New State | Reason |
|----------------|-----------|--------|
| Rollback to APPROVED | APPROVED | Content was approved before publish |
| Rollback to IN_REVIEW | IN_REVIEW | Content was in review before publish |
| Rollback to DRAFT | DRAFT | Content was draft before publish |
| Rollback to specific version | That version's state | Restores exact previous state |

**Key Rule:** Rollback restores the ContentVersion snapshot AND sets the workflow state to match the version's `changeType`:
- If the version was created during an "update" transition, restore to that transition's target state
- If the version was created during "create", restore to DRAFT
- If the version was created during "restore", restore to the state at restoration time

### Rollback Flow

```
Rollback Published Lecture to Version 5
  │
  ├─ Fetch Version 5 snapshot
  ├─ Check: What state was the record in at Version 5?
  │   └─ Version 5 was created during "update" from DRAFT → IN_REVIEW
  │   └─ New state: IN_REVIEW
  ├─ Restore snapshot fields to record
  ├─ Update ContentWorkflow.status = 'IN_REVIEW'
  ├─ Create rollback version (Version N+1)
  ├─ Create WorkflowHistory entry
  ├─ Create AuditLog entry
  └─ Invalidate cache
```

---

## 6. Published Version Reference

Every publish action must record which ContentVersion became live:

```prisma
model ContentWorkflow {
  ...
  publishedVersionId  String?   // FK to ContentVersion that went live
  ...
}
```

**On publish:**
1. Create ContentVersion snapshot (current state)
2. Update `ContentWorkflow.publishedVersionId = newVersion.id`
3. Set `status = 'PUBLISHED'`

**On unpublish:**
1. `publishedVersionId` is preserved (historical record)
2. Set `status = 'ARCHIVED'`

**On rollback:**
1. Restore snapshot from target version
2. Update `publishedVersionId` to null (no longer live)

---

## 7. Notification Rules

### Who Gets Notified for Each Transition

| Transition | Author | Reviewer | Publisher | Admin | Watcher |
|-----------|--------|----------|-----------|-------|---------|
| DRAFT → IN_REVIEW | — | ✓ Notify | — | ✓ Notify | — |
| IN_REVIEW → APPROVED | ✓ Notify | — | ✓ Notify | ✓ Notify | — |
| IN_REVIEW → REJECTED | ✓ Notify (with reason) | — | — | ✓ Notify | — |
| APPROVED → SCHEDULED | ✓ Notify | — | ✓ Notify | ✓ Notify | — |
| APPROVED → PUBLISHED | ✓ Notify | ✓ Notify | — | ✓ Notify | ✓ Notify |
| SCHEDULED → PUBLISHED (auto) | ✓ Notify | ✓ Notify | — | ✓ Notify | ✓ Notify |
| PUBLISHED → ARCHIVED | ✓ Notify | — | ✓ Notify | ✓ Notify | — |
| REJECTED → DRAFT | — | ✓ Notify | — | ✓ Notify | — |
| ARCHIVED → DRAFT | — | — | — | ✓ Notify | — |
| ANY → DRAFT (admin reset) | ✓ Notify | ✓ Notify | ✓ Notify | — | — |

**Notification Channels:**
- In-app notification (existing `Notification` model)
- Optional: Email notification (configurable per transition)

---

## 8. Configurable Approval Policies

### Policy Types

| Policy | Description | Use Case |
|--------|-------------|----------|
| `SINGLE_REVIEWER` | One reviewer approves | Simple content |
| `DUAL_REVIEWER` | Two reviewers must approve | Sensitive content |
| `REVIEWER_PUBLISHER` | Reviewer approves, Publisher publishes | Standard workflow |
| `MAJORITY_APPROVAL` | N of M reviewers must approve | Team decisions |

### Configuration

Stored in `SiteSetting`:
```
key: 'workflow_approval_policy'
value: 'SINGLE_REVIEWER' | 'DUAL_REVIEWER' | 'REVIEWER_PUBLISHER' | 'MAJORITY_APPROVAL'

key: 'workflow_required_reviewers'
value: '2' (for MAJORITY_APPROVAL)
```

### Policy Enforcement

```typescript
// In workflow transition handler
const policy = await getApprovalPolicy()

switch (policy) {
  case 'SINGLE_REVIEWER':
    // One approval → APPROVED
    break
  case 'DUAL_REVIEWER':
    // Two approvals needed → track in WorkflowAssignment
    break
  case 'REVIEWER_PUBLISHER':
    // Reviewer approves → Publisher publishes
    break
  case 'MAJORITY_APPROVAL':
    // N of M approvals needed
    break
}
```

---

## 9. Threaded Review Comments

### Structure

```
Reviewer A: "Please check the video URL"
  └─ Author: "Updated the URL"
      └─ Reviewer A: "Looks good, approved"
```

**Rules:**
- Top-level comments: Reviewer or Author
- Replies: Only to parent comment author
- No unlimited nesting (max 2 levels enforced in UI)
- `isResolved` marks resolved threads
- Comments are part of the workflow transition context

### Comment Flow

```
1. Reviewer submits review (IN_REVIEW → APPROVED)
2. Reviewer adds comment: "Content looks good"
3. Author replies: "Thanks, updated the video"
4. Reviewer replies: "Approved"
5. All comments linked to the transition
```

---

## 10. Workflow Analytics

### Metrics

| Metric | Calculation | Display |
|--------|-------------|---------|
| **Avg Review Time** | AVG(reviewedAt - submittedAt) for APPROVED transitions | Days |
| **Avg Publish Time** | AVG(publishedAt - approvedAt) for PUBLISHED transitions | Days |
| **Rejected Rate** | COUNT(REJECTED) / COUNT(IN_REVIEW) × 100 | Percentage |
| **Pending Rate** | COUNT(IN_REVIEW) / COUNT(ALL) × 100 | Percentage |
| **Reviewer Workload** | COUNT(transitions WHERE reviewer=X) grouped by reviewer | Count per reviewer |
| **Publisher Workload** | COUNT(transitions WHERE publisher=X) grouped by publisher | Count per publisher |
| **Content Pipeline** | COUNT by status | Bar chart |
| **Transition Velocity** | COUNT by day for each transition | Time series |

### Analytics Queries

```sql
-- Average review time
SELECT AVG(JULIANDAY(reviewedAt) - JULIANDAY(submittedAt)) as avg_days
FROM ContentWorkflow
WHERE status IN ('APPROVED', 'REJECTED')
AND submittedAt IS NOT NULL
AND reviewedAt IS NOT NULL;

-- Reviewer workload
SELECT performedByName, COUNT(*) as transition_count
FROM WorkflowHistory
WHERE toStatus = 'APPROVED'
GROUP BY performedBy
ORDER BY transition_count DESC;

-- Content pipeline
SELECT status, COUNT(*) as count
FROM ContentWorkflow
GROUP BY status;
```

---

## 11. Notification Rules (Detailed)

### Notification Template

```typescript
interface WorkflowNotification {
  entityType: string
  entityId: string
  entityTitle: string
  action: string
  fromStatus: string
  toStatus: string
  performedBy: string
  performedByName: string
  comment?: string
  link: string
}
```

### Notification Channels

| Channel | When | Recipients |
|---------|------|------------|
| **In-App** | Every transition | Configured per transition |
| **Email** | Optional | Configurable per transition |

### Notification Storage

Uses existing `Notification` model:
```
{
  userId: recipientId,
  title: "আপনার কন্টেন্ট পর্যালোচনার জন্য পাঠানো হয়েছে",
  message: "Lecture 'Physics' has been submitted for review",
  type: 'INFO',
  link: '/admin/lectures?id=abc123',
}
```

---

## 12. Workflow Analytics (Detailed)

### Dashboard Widgets

| Widget | Data | Visualization |
|--------|------|---------------|
| Content Pipeline | Count by status | Bar chart |
| Review Queue | Count where status=IN_REVIEW | Number + list |
| Pending Approval | Count where status=APPROVED | Number + list |
| Scheduled | Count where status=SCHEDULED | Number + list |
| Avg Review Time | AVG(reviewedAt - submittedAt) | Days |
| Rejected Rate | COUNT(REJECTED) / COUNT(ALL) | Percentage |
| Reviewer Workload | COUNT by reviewer | Bar chart |
| Publisher Workload | COUNT by publisher | Bar chart |
| Transition Velocity | COUNT by day | Time series |

### Analytics API

```
GET /api/admin/analytics/workflow
  ?metric=pipeline|review_time|rejection_rate|workload|velocity
  &from=2026-01-01
  &to=2026-07-19
  &entityType=lecture (optional)
```

---

## 13. Complete Database Model Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    ContentWorkflow                        │
│  id, entityType, entityId                                │
│  status, previousStatus                                  │
│  submittedBy/At, reviewedBy/At, approvedBy/At            │
│  publishedBy/At, publishedVersionId                      │
│  scheduledAt, unpublishedAt                              │
│  rejectedBy/At, rejectionReason                          │
│  archivedBy/At                                           │
│  reviewComment, metadata                                 │
│  createdAt, updatedAt                                    │
│  @@unique([entityType, entityId])                        │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│WorkflowHistory│ │WorkflowComment│ │WorkflowAssignment│
│              │ │              │ │              │
│ entityType   │ │ entityType   │ │ entityType   │
│ entityId     │ │ entityId     │ │ entityId     │
│ fromStatus   │ │ parentId     │ │ role         │
│ toStatus     │ │ authorId     │ │ userId       │
│ performedBy  │ │ content      │ │ assignedBy   │
│ comment      │ │ isResolved   │ │ isActive     │
│ versionNumber│ │ createdAt    │ │ assignedAt   │
│ createdAt    │ │ updatedAt    │ │              │
│              │ │              │ │              │
│ @@index      │ │ @@index      │ │ @@unique      │
│ (entityType, │ │ (entityType, │ │ (entityType, │
│  entityId)   │ │  entityId)   │ │  entityId,   │
│              │ │              │ │  role, userId)│
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 14. Sequence Diagram: Content Lifecycle

```
Author          Reviewer         Publisher        System
  │                │                │                │
  │──create──>     │                │                │
  │                │                │        [DRAFT]  │
  │                │                │                │
  │──submit_for_review──>           │                │
  │                │                │        [IN_REVIEW]
  │                │                │          │
  │                │                │     notify reviewer
  │                │                │          │
  │                │──approve──>    │                │
  │                │                │        [APPROVED]
  │                │                │          │
  │                │                │     notify author
  │                │                │          │
  │                │                │──publish──>     │
  │                │                │        [PUBLISHED]
  │                │                │          │
  │                │                │     notify all
  │                │                │          │
  │                │                │     version created
  │                │                │          │
  │                │                │     audit logged
  │                │                │          │
  │                │                │     activity timeline
```

---

## 15. Permission Matrix (Complete)

| Action | STUDENT | REVIEWER | PUBLISHER | ADMIN | SUPER_ADMIN |
|--------|---------|----------|-----------|-------|-------------|
| View DRAFT | — | — | — | ✓ | ✓ |
| View IN_REVIEW | — | ✓ | — | ✓ | ✓ |
| View APPROVED | — | — | ✓ | ✓ | ✓ |
| View PUBLISHED | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit DRAFT | ✓ | — | — | ✓ | ✓ |
| Edit IN_REVIEW | ✗ | ✗ | ✗ | ✓ | ✓ |
| Submit for Review | ✓ | — | — | ✓ | ✓ |
| Approve | — | ✓ | — | ✓ | ✓ |
| Reject | — | ✓ | — | ✓ | ✓ |
| Schedule | — | — | ✓ | ✓ | ✓ |
| Publish | — | — | ✓ | ✓ | ✓ |
| Archive | — | — | ✓ | ✓ | ✓ |
| Reset to Draft | — | — | — | ✓ | ✓ |
| Force Edit | — | — | — | ✓ | ✓ |
| Assign Reviewer | — | — | — | ✓ | ✓ |
| Add Comment | ✓ | ✓ | ✓ | ✓ | ✓ |
| View History | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Analytics | — | — | — | ✓ | ✓ |

---

## 16. Future Scalability

| Feature | Effort | Impact |
|---------|--------|--------|
| Custom workflow states | Medium | Add states via config, not schema |
| Webhook notifications | Low | Trigger external systems on transitions |
| Batch transitions | Low | Approve/reject multiple at once |
| Workflow templates | Medium | Pre-configured workflows per content type |
| SLA tracking | Medium | Alert when review time exceeds threshold |
| Audit export | Low | Export workflow history to CSV/JSON |
| Mobile approval | Low | Responsive approve/reject buttons |
| AI-assisted review | High | Auto-check content quality before review |

---

## 17. Implementation Phases

| Phase | Scope | Effort | Dependencies |
|-------|-------|--------|-------------|
| **Phase 1** | Schema + WorkflowHistory + WorkflowComment + WorkflowAssignment | 3-4 days | None |
| **Phase 2** | Workflow state machine + transitions + permissions | 4-5 days | Phase 1 |
| **Phase 3** | Version history integration + rollback behavior | 2-3 days | Phase 2 |
| **Phase 4** | Notification rules + Activity Timeline | 1-2 days | Phase 2 |
| **Phase 5** | Admin UI (status badges, transitions, review comments) | 5-6 days | Phase 2, 3 |
| **Phase 6** | Scheduling (cron endpoint + auto-publish) | 1-2 days | Phase 2 |
| **Phase 7** | Workflow analytics | 1-2 days | Phase 2 |
| **Phase 8** | Testing + regression | 2-3 days | All |
| **Total** | | **16-22 days** | |

---

## 18. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking existing status fields | Medium | High | Backfill; keep isActive as visibility layer |
| Permission conflicts | Low | Medium | New permissions additive; SUPER_ADMIN bypasses |
| Scheduling missed publishes | Low | Medium | Cron with retry; manual fallback |
| Performance with workflow queries | Low | Low | Index on [entityType, status] |
| Rollback complexity | Medium | Medium | Version history ensures rollback creates new version |
| Concurrent transitions | Low | Low | Database-level unique constraints |

---

## 19. Production Readiness

# **Architecture Complete — Awaiting Approval**

- WorkflowHistory: Append-only transition tracking
- Reviewer Assignment: Multi-reviewer support
- Approval Policies: Configurable (single/dual/majority)
- Threaded Comments: 2-level conversation threads
- Locking Rules: State-based edit restrictions
- Rollback Behavior: Defined state transitions
- Published Version Reference: ContentVersion link
- Notification Rules: Per-transition recipient config
- Workflow Analytics: 8 metrics defined
- Migration Plan: 8 phases, 16-22 days
- No code, no migrations, no schema changes yet
