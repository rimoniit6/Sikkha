# Soft Delete Architecture

**Date**: 2026-07-19
**Status**: Design Complete — Ready for Implementation

---

## 1. Problem Statement

The codebase currently conflates two concepts:
- **`isActive: false`** — "hide from public" (visibility toggle)
- **No mechanism** — "permanently gone" (no recovery)

Admins cannot recover accidentally deleted content. There is no audit trail for deletions. The `delete-guard.ts` blocks deletion when children exist but provides no alternative.

---

## 2. Model Classification

### Category A: Soft Delete (31 models)

These models represent user-facing content, CMS entities, and purchasable items. Accidental deletion causes data loss with no recovery path.

| Group | Models | Reason |
|-------|--------|--------|
| **Content Hierarchy** | ClassCategory, Subject, Chapter, Topic | Deleting removes entire content branches |
| **Learning Content** | Lecture, Resource, MCQ, CQ, KnowledgeQuestion | Core educational content |
| **User Content** | Suggestion | User-facing suggestions |
| **Courses** | Course, CourseLesson | Purchasable course content |
| **CMS** | Banner, FAQ, Testimonial, Notice | Site content |
| **Navigation** | Navigation, ContentType, FeaturedContent | Site structure |
| **Commerce** | ContentBundle, ContentPackage | Purchasable packages |
| **Exam Packages** | MCQExamPackage, CQExamPackage | Purchasable exam access |
| **Staff** | TeacherModerator | Teacher profiles |
| **Taxonomy** | Board, ExamYear, BoardYear | Reference data |

### Category B: Never Soft Delete (24 models)

| Subcategory | Models | Reason |
|-------------|--------|--------|
| **Immutable Records** | AuditLog, Payment, ExamResult, MCQExamSetResult, CQExamSubmission, AssignmentSubmission, Certificate, CoursePurchase, MCQExamPackagePurchase, CQExamPackagePurchase | Historical records. Deleting would break financial auditing, grade history, and purchase proofs. |
| **User Data** | User, Progress, Bookmark, Note, RecentlyViewed, UserFeedback, FeedbackMessage, Notification, ContactMessage | User-owned data. Deletion = account cleanup, not archival. |
| **System/Structural** | SiteSetting, Permission, RolePermission, ExamQuestion, ExamSession, BundleItem, MCQExamSet, MCQExamSetQuestion, MCQExamRetakeRequest, CQExamSet, CQExamSetQuestion, CQExamRetakeRequest, CQExamAnswer, CQExamAnswerImage | Structural/join tables. Deleting = rebuilding structure, not archiving. |
| **Course Internal** | CourseExamSchedule, LessonExam, LessonAssignment, LessonSchedule, LessonProgress, LessonNote, LessonResource, CourseEnrollment | Course internals. Tied to active enrollments. |
| **Analytics** | AnalyticsEvent, AnalyticsSession, AnalyticsSearchQuery, AnalyticsAlert, AnalyticsReport | Append-only data. Never deleted. |

---

## 3. Architecture

### 3.1 Schema Fields

Every Category A model gets three new fields:

```prisma
deletedAt   DateTime?
deletedBy   String?
deleteReason String?
```

- `deletedAt` — When the record was soft-deleted. `null` = active.
- `deletedBy` — User ID of the admin who deleted it.
- `deleteReason` — Optional reason for the deletion.

### 3.2 Prisma Extension (Auto-Filter)

A query extension on `$allModels` automatically adds `deletedAt: null` to every `findMany`, `findFirst`, `findUnique`, and `count` query for Category A models. This means:

- **Zero query changes** across 386+ existing `isActive: true` queries
- **Transparent** to all existing code
- **Bypassable** when needed (admin trash view, restore operations)

Bypass mechanism: `{ includeDeleted: true }` in query args.

```typescript
// Existing code — automatically filtered
db.chapter.findMany({ where: { subjectId, isActive: true } })
// → adds deletedAt: null automatically

// Admin trash view — bypasses filter
db.chapter.findMany({ where: {}, includeDeleted: true })
// → returns all records including soft-deleted
```

### 3.3 Soft Delete Utility Layer

Three centralized functions in `src/lib/soft-delete.ts`:

```
softDelete(model, id, userId, reason?, options?)
restore(model, id, userId, options?)
forceDelete(model, id, userId, reason?)
```

All three operate inside `$transaction` for atomicity.

### 3.4 Cascade Strategy

**Default: BLOCK** (matches existing `delete-guard.ts` behavior)

```
DELETE Chapter → BLOCKED if lectures/mcqs/cqs exist
```

**Optional: CASCADE** (admin override with confirmation)

```
DELETE Chapter (cascade: true) →
  soft-delete all Lectures
  soft-delete all MCQs
  soft-delete all CQs
  soft-delete all KnowledgeQuestions
  soft-delete all Suggestions
  soft-delete all Topics
```

Cascade is depth-first: delete parent, then recursively delete all children.

### 3.5 Restore Strategy

Restoring a child requires its parent to be active. If parent is deleted:
1. Block restore with error: "Parent [X] is deleted. Restore it first."
2. Admin must restore parent first, then child.

Slug uniqueness on restore:
- If slug conflicts, append `-restored-{timestamp}`
- Log the slug change for admin awareness

---

## 4. Query Flow

```
Admin deletes Chapter (id: "abc")
  → softDelete("chapter", "abc", adminId, "Outdated content")
  → chapter.deletedAt = now, chapter.deletedBy = adminId
  → Children NOT deleted (BLOCK mode)
  → Public queries automatically exclude it (extension adds deletedAt: null)
  → Admin "Deleted" tab shows it
  → Admin can Restore or Force Delete

Admin restores Chapter (id: "abc")
  → restore("chapter", "abc", adminId)
  → chapter.deletedAt = null, chapter.deletedBy = null
  → Public queries now include it again
  → Children unaffected
```

---

## 5. Performance Impact

| Aspect | Impact | Mitigation |
|--------|--------|------------|
| Index on `deletedAt` | +1 composite index per model | Add `deletedAt` to existing `(isActive, ...)` indexes |
| Query overhead | +1 WHERE clause per query | Negligible (indexed DateTime comparison) |
| Storage | 3 extra columns per Category A model | ~50 bytes per record (negligible) |
| Migration | ~31 ALTER TABLE statements | SQLite: fast (no locking) |

---

## 6. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Existing queries break | Low | High | Extension is transparent; no query changes needed |
| Slug conflict on restore | Medium | Low | Auto-append timestamp suffix |
| Cascade deletes too much | Low | High | Default is BLOCK; cascade requires explicit flag |
| Admin confusion (isActive vs deletedAt) | Medium | Medium | Clear UI distinction: "Inactive" vs "Deleted" |
| Performance regression | Low | Low | Indexed; tested with production data volume |

---

## 7. Backward Compatibility

- **No breaking changes**: Existing API contracts unchanged
- **No downtime**: SQLite ALTER TABLE is instant
- **No query changes**: Extension handles filtering transparently
- **Existing `isActive` behavior preserved**: `isActive: false` still works as before
- **New `deletedAt` field is additive**: All existing records get `deletedAt = null`
