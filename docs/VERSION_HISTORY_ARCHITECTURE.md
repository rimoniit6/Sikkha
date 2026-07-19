# Version History System — Architecture Document

**Date**: 2026-07-19
**Status**: Design Complete — Awaiting Approval
**Scope**: Enterprise-grade version history for all content models

---

## Phase 1: Complete Project Analysis

### Existing Systems Inventory

| System | Status | Integration Point |
|--------|--------|-------------------|
| Soft Delete | Implemented | Version History must respect `deletedAt` filtering |
| Trash | Implemented | Trashed records should show version history |
| Restore | Implemented | Restore should create a new version snapshot |
| Force Delete | Implemented | Force delete should preserve version history (audit trail) |
| Bulk Restore | Implemented | Bulk restore should create version snapshots for each record |
| Bulk Force Delete | Implemented | Bulk force delete should archive version history |
| Centralized Audit Log | Implemented | AuditLog.oldData/newData already captures snapshots — Version History formalizes this |
| Activity Timeline | Implemented | Version History events should appear in timeline |
| CSRF | Implemented | Version History endpoints need CSRF protection |
| Transactions | Implemented (safeTransaction) | Version creation must be transaction-safe |
| Purchase State Machine | Implemented | Version History should NOT track purchase state changes |
| Delete Guard | Implemented | Prevents deletion of records with children |

### Current Snapshot Pattern

The audit system already captures `oldData`/`newData` as `Record<string, unknown>` JSON blobs on every admin action. However:
- Snapshots are stored in the AuditLog model (not a dedicated version table)
- No version numbering
- No diff calculation
- No rollback capability
- No user-facing version history UI
- Snapshots are shallow spreads (include system fields like `id`, `createdAt`, `deletedAt`)

---

## Phase 2: Model Classification

### Category A: Must Support Version History

These are admin-editable content models where changes need to be tracked and potentially rolled back.

| Model | Update Frequency | Storage Impact | Reason |
|-------|-----------------|----------------|--------|
| **Lecture** | High | LARGE | Rich HTML content, actively edited by instructors. **Highest priority.** |
| **MCQ** | Medium | Large | Question text, options, explanation — corrections need tracking |
| **CQ** | Medium | LARGE | 17+ content fields per record — widest content model |
| **KnowledgeQuestion** | Medium | Medium | Question/answer text, corrections need tracking |
| **Suggestion** | Medium | Large | JSON block content, board/year updates |
| **Course** | Medium | Large | HTML features/requirements/targetStudents, pricing |
| **CourseLesson** | Medium | Small-Medium | Meeting links, video URLs, descriptions |
| **Exam** | Medium | Medium | Configuration changes before publishing |
| **MCQExamPackage** | Low-Medium | Small-Medium | Pricing, description changes |
| **CQExamPackage** | Low-Medium | Small-Medium | Pricing, description changes |
| **ContentPackage** | Low | Small | Pricing, duration changes |
| **ContentBundle** | Low-Medium | Small-Medium | Pricing, content changes |
| **SiteSetting** | Medium | Small | Configuration changes |

### Category B: Should NOT Support Version History

| Model | Reason |
|-------|--------|
| **User** | Profile data is user-owned, not admin-managed content. Audit log suffices. |
| **ClassCategory** | Structural taxonomy — rarely changes, few rows |
| **Subject** | Structural taxonomy — rarely changes |
| **Chapter** | Structural taxonomy — rarely changes |
| **Topic** | Structural taxonomy — rarely changes |
| **Board** | Reference data — very rarely changes |
| **ExamYear** | Reference data — very rarely changes |
| **BoardYear** | Reference data — very rarely changes |
| **Navigation** | UI structure — rarely changes |
| **ContentType** | System config — very rarely changes |
| **FeaturedContent** | Ordering reference — rarely changes |
| **Banner** | CMS content — low frequency, small impact |
| **FAQ** | CMS content — low frequency, small impact |
| **Testimonial** | CMS content — low frequency, small impact |
| **Notice** | CMS content — low frequency, small impact |
| **TeacherModerator** | Staff listing — low frequency |
| **Resource** | File references — rarely edited, just added/removed |
| **Payment** | Financial record — immutable by design |
| **ExamResult** | Immutable result record |
| **ExamSession** | Transient session data |
| **Progress/Bookmark/Note** | User-generated data, not admin-managed |
| **AuditLog** | Already IS the audit trail |
| **AnalyticsEvent/Session** | Append-only analytics |
| **All exam set/question join tables** | Structural references |
| **All purchase/subscription records** | Financial records — immutable |
| **All course internal records** | LessonNote, LessonResource, etc. |

---

## Phase 3: Update Endpoint Audit

### Endpoints That Need Version Snapshot

| # | Route | Entity | Transaction | Audit | Needs Version |
|---|-------|--------|-------------|-------|---------------|
| 1 | `PUT /api/admin/lectures` | Lecture | No | Yes | **YES** — rich HTML content |
| 2 | `PUT /api/admin/mcq` | MCQ | No | Yes | **YES** — question content |
| 3 | `PUT /api/admin/cq` | CQ | No | Yes | **YES** — 17+ content fields |
| 4 | `PUT /api/admin/knowledge-questions` | KnowledgeQuestion | No | No | **YES** — question/answer |
| 5 | `PUT /api/admin/suggestions` | Suggestion | No | No | **YES** — JSON content |
| 6 | `PUT /api/admin/courses` | Course | No | No | **YES** — HTML content |
| 7 | `PUT /api/admin/courses/lessons` | CourseLesson | No | No | **YES** — lesson content |
| 8 | `PUT /api/admin/exams` | Exam | No | No | **YES** — exam config |
| 9 | `PUT /api/admin/mcq-exam-packages` | MCQExamPackage | Partial | Partial | **YES** — package config |
| 10 | `PUT /api/admin/cq-exam-packages` | CQExamPackage | Partial | Partial | **YES** — package config |
| 11 | `PUT /api/admin/packages` | ContentPackage | No | No | **YES** — pricing |
| 12 | `PUT /api/admin/plans` | ContentPackage | No | No | **YES** — pricing |
| 13 | `PUT /api/admin/bundles` | ContentBundle | No | No | **YES** — pricing/content |
| 14 | `PATCH /api/admin/settings` | SiteSetting | No | No | **YES** — config |
| 15 | `PATCH /api/admin/settings` (batch) | SiteSetting | No | No | **YES** — config |

### Endpoints That Should NOT Version

| # | Route | Entity | Reason |
|---|-------|--------|--------|
| 1 | `PUT /api/admin/classes` | ClassCategory | Structural taxonomy |
| 2 | `PUT /api/admin/subjects` | Subject | Structural taxonomy |
| 3 | `PUT /api/admin/chapters` | Chapter | Structural taxonomy |
| 4 | `PUT /api/admin/topics` | Topic | Structural taxonomy |
| 5 | `PUT /api/admin/boards` | Board | Reference data |
| 6 | `PUT /api/admin/years` | ExamYear | Reference data |
| 7 | `PUT /api/admin/board-years` | BoardYear | Reference data |
| 8 | `PUT /api/admin/navigation` | Navigation | UI structure |
| 9 | `PUT /api/admin/content-types` | ContentType | System config |
| 10 | `PUT /api/admin/featured` | FeaturedContent | Ordering |
| 11 | `PUT /api/admin/banners` | Banner | CMS — low impact |
| 12 | `PUT /api/admin/faqs` | FAQ | CMS — low impact |
| 13 | `PUT /api/admin/testimonials` | Testimonial | CMS — low impact |
| 14 | `PUT /api/admin/notices` | Notice | CMS — low impact |
| 15 | `PUT /api/admin/teacher-moderators` | TeacherModerator | Staff listing |
| 16 | `PATCH /api/admin/payments` | Payment | Financial — immutable |
| 17 | `PUT /api/admin/users` | User | User-owned data |
| 18 | `PUT /api/user/profile` | User | User-owned data |

---

## Phase 4: Database Architecture

### Option A: Dedicated Version Tables (per model)
One `LectureVersion`, `MCQVersion`, `CQVersion` etc. Each stores the full snapshot.

### Option B: Single Polymorphic Version Table
One `ContentVersion` table with `entityType`, `entityId`, `versionNumber`, `snapshot` (JSON).

### Option C: JSON Snapshot Approach
Store versions as JSON in a single table with minimal metadata.

### Recommendation: Option B — Single Polymorphic Version Table

**Why Option B:**

| Criterion | Option A | Option B (Recommended) | Option C |
|-----------|----------|----------------------|----------|
| **Performance** | Good (typed queries) | Good (single table, indexed) | Good (simple) |
| **Maintainability** | Poor (31 new tables) | Good (1 table) | Good (1 table) |
| **Query complexity** | Low | Medium (JSON queries) | Low |
| **Migration cost** | Very High (31 migrations) | Low (1 migration) | Low (1 migration) |
| **Rollback complexity** | Low (typed) | Medium (JSON parse) | Low |
| **Future scalability** | Poor (new model = new table) | Excellent (add model name) | Excellent |
| **Storage** | Moderate (typed columns) | Moderate (JSON + metadata) | Low (JSON only) |

**Option B wins** because:
1. Single migration — not 31 separate ones
2. Adding a new model to version history requires zero schema changes
3. Querying across all versions is simple (one table)
4. The `snapshot` JSON column is already a proven pattern in the codebase (AuditLog.oldData/newData)
5. Rollback is straightforward: parse JSON → update main table

---

## Phase 5: Snapshot Strategy

### Schema Design

```prisma
model ContentVersion {
  id              String   @id @default(cuid())
  entityType      String   // "lecture", "mcq", "course", etc.
  entityId        String   // ID of the record being versioned
  versionNumber   Int      // Sequential: 1, 2, 3...
  snapshot        String   // JSON: full record state at this version
  changedFields   String?  // JSON: array of field names that changed
  changeType      String   // "create", "update", "restore", "import"
  performedBy     String   // User ID who made the change
  performedByName String?  // Cached user name
  reason          String?  // Optional reason for change
  createdAt       DateTime @default(now())

  @@unique([entityType, entityId, versionNumber])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@index([performedBy])
}
```

### Snapshot Content

**Full Snapshot (stored in `snapshot` JSON):**
```json
{
  "id": "abc123",
  "title": "Introduction to Physics",
  "slug": "introduction-to-physics",
  "content": "<p>Rich HTML content...</p>",
  "videoUrl": "https://uploadthing.com/...",
  "isPremium": true,
  "price": 50,
  "isActive": true,
  "chapterId": "ch456",
  "createdAt": "2026-01-15T10:00:00Z",
  "updatedAt": "2026-07-19T14:30:00Z"
}
```

**Changed Fields (stored in `changedFields` JSON):**
```json
["title", "content", "price"]
```

### Diff vs Full Snapshot

**Recommendation: Full Snapshot**

Reasons:
1. Rollback is trivial (just overwrite with snapshot)
2. No complex diff reconstruction needed
3. Storage cost is acceptable (JSON is compact)
4. Querying "what did this look like at version X" is instant
5. Consistent with the existing AuditLog.oldData pattern

### File Upload Handling

Files are stored as UploadThing URLs (strings). The snapshot captures the URL, not the file itself.

**Strategy:**
- Snapshot stores the URL string (e.g., `"https://utfs.io/f/abc123.jpg"`)
- File URLs are immutable (UploadThing doesn't overwrite files)
- On rollback, the URL is restored — the file still exists on UploadThing
- No need to version file contents separately

### Slug Behavior

On rollback:
- If the slug changed, restore the original slug
- Check for conflicts with active records
- If conflict exists, append `-v{versionNumber}` suffix
- Log the slug change in the version record

### Relation Behavior

On rollback:
- Only the record's own fields are restored
- Child records are NOT affected (they reference the parent by ID, which doesn't change)
- Foreign key relationships are preserved

---

## Phase 6: Rollback Strategy

### Rollback Flow

```
User clicks "Rollback to Version X"
  │
  ├─ Validate version exists
  ├─ Fetch version snapshot
  ├─ Check current record exists and is not deleted
  ├─ Check for slug conflicts
  ├─ Begin transaction
  │   ├─ Create NEW version (snapshot of current state)
  │   ├─ Update main record with version snapshot
  │   ├─ Re-sequence version numbers if needed
  │   └─ Create audit log entry
  ├─ Commit transaction
  └─ Return success
```

### Design Decisions

| Question | Decision | Reason |
|----------|----------|--------|
| Should rollback overwrite? | **Yes** | Simpler, more intuitive |
| Should rollback create a NEW version? | **Yes** | Preserves history — "rollback" is just another edit |
| Should rollback be logged? | **Yes** — in AuditLog | Consistent with all other admin actions |
| Should rollback trigger cache invalidation? | **Yes** | Users should see the restored content |
| Should rollback trigger Activity Timeline? | **Yes** | Rollback is a significant action |
| Should rollback require confirmation? | **Yes** — type-to-confirm | Prevents accidental rollback |
| Should rollback require permission? | **Yes** — admin only | Same as edit permission |

### Rollback Creates a Version

When rolling back to Version N:
1. Current state (Version M) is saved as a new version
2. Record is updated with Version N's snapshot
3. Version M+1 is created with the current state (for audit trail)
4. The "rollback" itself is logged in AuditLog

This ensures:
- No data is ever lost
- Every state transition is recorded
- The version history is append-only (never modified)

---

## Phase 7: Integration with Existing Systems

### Soft Delete Integration

| Scenario | Behavior |
|----------|----------|
| Record is soft-deleted | Version history is preserved |
| Record is restored | New version created with `changeType: "restore"` |
| Record is force-deleted | Version history is archived (not deleted) |
| Viewing trashed record | Can see version history via `includeDeleted: true` |

### Trash Integration

| Scenario | Behavior |
|----------|----------|
| Trash page shows record | "Version History" button available |
| Viewing trashed record history | Shows all versions including current (deleted) state |
| Restoring from trash | Creates new version with `changeType: "restore"` |

### Force Delete Integration

| Scenario | Behavior |
|----------|----------|
| Force delete single record | Version history is preserved (not deleted) |
| Force delete with cascade | All descendant version histories preserved |
| Bulk force delete | All version histories preserved |

### Activity Timeline Integration

| Scenario | Behavior |
|----------|----------|
| Any version created | Activity Timeline entry created |
| Rollback performed | Activity Timeline entry created |
| Version viewed | Optional: Activity Timeline entry |

### Audit Log Integration

| Scenario | Behavior |
|----------|----------|
| Version created | AuditLog entry with oldData/newData |
| Rollback performed | AuditLog entry with full context |
| Version viewed | Optional: AuditLog entry |

### Bulk Update Integration

| Scenario | Behavior |
|----------|----------|
| Bulk status change | Version created for each record |
| Bulk price update | Version created for each record |
| Bulk import | Version created for each imported record |

### Purchase System Integration

| Scenario | Behavior |
|----------|----------|
| Package price changes | Version created showing old/new price |
| Bundle content changes | Version created |
| Subscription terms change | Version created |

---

## Phase 8: Performance Analysis

### Storage Growth Estimate

| Model | Avg Record Size | Est. Records/Month | Est. Versions/Month | Storage/Month |
|-------|----------------|--------------------|--------------------|---------------|
| Lecture | 50KB (HTML) | 100 | 300 | 15MB |
| MCQ | 5KB | 500 | 1,000 | 5MB |
| CQ | 10KB | 200 | 600 | 6MB |
| KnowledgeQuestion | 2KB | 300 | 600 | 1.2MB |
| Suggestion | 8KB | 50 | 100 | 0.8MB |
| Course | 15KB | 20 | 60 | 0.9MB |
| CourseLesson | 3KB | 100 | 200 | 0.6MB |
| Exam | 5KB | 50 | 100 | 0.5MB |
| MCQExamPackage | 4KB | 30 | 60 | 0.24MB |
| CQExamPackage | 4KB | 30 | 60 | 0.24MB |
| ContentPackage | 3KB | 20 | 40 | 0.12MB |
| ContentBundle | 4KB | 30 | 60 | 0.24MB |
| SiteSetting | 1KB | 100 | 300 | 0.3MB |
| **Total** | | | **~2,620** | **~26MB/month** |

**Annual storage: ~312MB** — very manageable.

### Query Impact

| Operation | Impact |
|-----------|--------|
| Create version | +1 INSERT (indexed) |
| Read versions | +1 SELECT with WHERE + ORDER BY |
| Rollback | +1 SELECT + 1 UPDATE + 1 INSERT |
| List versions | Paginated query, fast with indexes |

### Index Strategy

```sql
-- Primary lookup: "show me all versions for this record"
@@index([entityType, entityId])

-- Version numbering: "get version N"
@@unique([entityType, entityId, versionNumber])

-- Timeline queries: "what changed today"
@@index([createdAt])

-- User activity: "what did this admin change"
@@index([performedBy])
```

### Retention Strategy

**Recommendation: Keep all versions forever**

Reasons:
1. Storage is cheap (~312MB/year)
2. Regulatory compliance may require history
3. No operational cost to keep
4. Simple implementation (no cleanup job needed)

**Optional: Compress old versions**
- Versions older than 1 year could be compressed
- Not needed initially

---

## Phase 9: Security Analysis

### Access Control

| Action | Who Can Do It | Permission Required |
|--------|---------------|---------------------|
| View version history | Admin | Admin role |
| View version detail | Admin | Admin role |
| Create version (automatic) | System | Automatic on update |
| Rollback to version | Admin | Admin role + CSRF |
| Delete version history | SuperAdmin | SuperAdmin role |
| Export version history | Admin | Admin role |

### Confirmation Requirements

| Action | Confirmation Required |
|--------|----------------------|
| Rollback single record | Type-to-confirm |
| Rollback bulk records | Type-to-confirm + count display |
| Delete version history | SuperAdmin only + type-to-confirm |

### Audit Requirements

| Action | Audit Logged |
|--------|-------------|
| Version created | Yes (automatic) |
| Rollback performed | Yes (detailed) |
| Version history viewed | Optional |
| Version history exported | Yes |

---

## Phase 10: Implementation Plan

### Migration Strategy

1. **Add `ContentVersion` model** to Prisma schema
2. **Run `prisma db push`** — adds table, no downtime
3. **Backfill existing audit snapshots** — Optional: migrate AuditLog.oldData/newData to ContentVersion
4. **Deploy new code** — Version creation happens automatically on updates
5. **No breaking changes** — existing APIs unchanged

### Implementation Phases

| Phase | Scope | Effort | Risk |
|-------|-------|--------|------|
| **Phase 1** | Schema + Version creation on updates | 3-4 days | Low |
| **Phase 2** | Version history API (list, detail) | 1-2 days | Low |
| **Phase 3** | Admin UI (version list, detail, diff view) | 2-3 days | Low |
| **Phase 4** | Rollback functionality | 1-2 days | Medium |
| **Phase 5** | Bulk operations + import versioning | 1-2 days | Low |
| **Phase 6** | Activity Timeline integration | 0.5 day | Low |
| **Phase 7** | Testing + regression | 1-2 days | Low |
| **Total** | | **10-14 days** | |

### Testing Strategy

| Test Type | Scope |
|-----------|-------|
| Unit tests | Version creation, diff calculation, rollback logic |
| Integration tests | API endpoints, transaction safety |
| Regression tests | All existing CRUD operations still work |
| Performance tests | Version creation under load |
| Manual testing | Admin UI workflows |

### Production Rollout Plan

1. **Deploy schema migration** (no downtime)
2. **Deploy version creation code** (automatic — versions created on next updates)
3. **Deploy version history API** (new endpoints, no breaking changes)
4. **Deploy admin UI** (new pages, no breaking changes)
5. **Deploy rollback functionality** (new feature)
6. **Monitor** storage growth and query performance
7. **Optional**: Backfill historical versions from AuditLog snapshots

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Storage growth too fast | Low | Low | Monitor monthly; implement retention if needed |
| Rollback creates inconsistent state | Low | High | Transaction-safe rollback with parent validation |
| Version creation slows updates | Low | Low | Async version creation (non-blocking) |
| Existing APIs break | None | High | Additive only — no API changes |
| File URLs become stale | Low | Medium | UploadThing URLs are persistent; capture URL not content |
| Slug conflicts on rollback | Medium | Low | Auto-append version suffix |

---

## Production Readiness Checklist

| Item | Status |
|------|--------|
| Architecture designed | ✅ |
| Schema designed | ✅ |
| Migration strategy defined | ✅ |
| Rollback strategy defined | ✅ |
| Security model defined | ✅ |
| Performance estimated | ✅ |
| Integration points mapped | ✅ |
| Implementation phases defined | ✅ |
| Testing strategy defined | ✅ |
| Rollout plan defined | ✅ |
| Risk analysis complete | ✅ |

---

## Awaiting Approval

This document is a design-only artifact. No code has been written, no schema modified, no migrations run.

**To proceed with implementation, approve this architecture.**
