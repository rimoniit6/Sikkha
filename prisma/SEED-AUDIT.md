# Seed Data Audit Report

> **Generated**: 2026-07-21
> **Scope**: Full Prisma schema audit across all seed files
> **Total models**: 85

---

## 1. Executive Summary

The project has **9 seed-related files** totaling ~5300 lines of seed code, spread across `prisma/` (6 files), `src/lib/` (1 file), and `scripts/` (2 files). Of the **85 Prisma models**, **12 models have zero seed coverage**, and another **10-15 models have partial/inadequate coverage**. None of the seed scripts use transactions. There is significant overlap (multiple files seeding the same models) and coordination gaps (different files using different Prisma client instances).

**Key problems:**
- No unified seed entry point (6 competing seed files)
- No transaction support anywhere — partial failures leave inconsistent state
- 12 models completely unseeded (blog, content versioning, workflow, contact, exam sessions)
- Board count inconsistencies (seed.ts=10, seed-all.ts=9)
- Each seed file creates its own approach to idempotency
- No environment-aware seeding (prod vs dev)

---

## 2. Model Classification

### SYSTEM (infrastructure) — 19 models
Configuration, permissions, navigation, site settings, analytics, audit
| # | Model | Purpose |
|---|-------|---------|
| 1 | Permission | RBAC permission definitions |
| 2 | RolePermission | Role-to-permission mappings |
| 3 | Navigation | Header/footer/bottom nav items |
| 4 | SiteSetting | Key-value site configuration |
| 5 | ContentType | Content type definitions for UI |
| 6 | ContentVersion | Version history snapshots |
| 7 | AuditLog | Admin action audit trail |
| 8 | AnalyticsEvent | Raw event tracking |
| 9 | AnalyticsSession | User session tracking |
| 10 | AnalyticsSearchQuery | Search query logging |
| 11 | AnalyticsAlert | Metric threshold alerts |
| 12 | AnalyticsReport | Scheduled report configs |
| 13 | ContentWorkflow | Editorial workflow states |
| 14 | WorkflowHistory | Workflow state transitions |
| 15 | WorkflowComment | Workflow discussions |
| 16 | Board | Education board definitions |
| 17 | ExamYear | Published exam years |
| 18 | BoardYear | Board-year mappings |
| 19 | TeacherModerator | Teacher/moderator profiles |

### CONTENT (core educational) — 22 models
Classes, subjects, chapters, lectures, questions, courses, bundles
| # | Model | Purpose |
|---|-------|---------|
| 20 | ClassCategory | Educational class levels (6-10/HSC) |
| 21 | Subject | Subjects within each class |
| 22 | Chapter | Chapters within each subject |
| 23 | Topic | Topics within each chapter |
| 24 | Lecture | Rich HTML/video lectures |
| 25 | Resource | Lecture resources (PDF/image/link) |
| 26 | MCQ | Multiple choice questions |
| 27 | CQ | Creative questions (4 sub-questions) |
| 28 | KnowledgeQuestion | Knowledge/comprehension Q&A |
| 29 | Suggestion | Exam suggestion articles |
| 30 | ContentBundle | Bundle of mixed content items |
| 31 | BundleItem | Items within a bundle |
| 32 | ContentPackage | Time-based subscription packages |
| 33 | UserSubscription | Active user subscriptions |
| 34 | MCQExamPackage | MCQ exam package (paid sets) |
| 35 | MCQExamSet | Individual exam set within package |
| 36 | MCQExamSetQuestion | MCQ assigned to exam set |
| 37 | CQExamPackage | CQ exam package (paid sets) |
| 38 | CQExamSet | Individual CQ set within package |
| 39 | CQExamSetQuestion | CQ assigned to exam set |
| 40 | Course | Full course (lessons + exams) |
| 41 | CourseLesson | Lesson within a course |

### PROMOTIONAL (marketing/UI) — 8 models
Homepage, banners, testimonials, notices, FAQs
| # | Model | Purpose |
|---|-------|---------|
| 42 | Banner | Homepage banners |
| 43 | FAQ | Frequently asked questions |
| 44 | Testimonial | Student testimonials |
| 45 | Notice | Notice board announcements |
| 46 | FeaturedContent | Homepage featured items |
| 47 | BlogCategory | Blog post categories |
| 48 | BlogTag | Blog post tags |
| 49 | BlogSeries | Blog post series |

### USER (identity & activity) — 15 models
Users, progress, bookmarks, feedback, certificates
| # | Model | Purpose |
|---|-------|---------|
| 50 | User | User accounts (admin/student) |
| 51 | Progress | Learning progress tracking |
| 52 | Bookmark | Saved/favorited content |
| 53 | Note | User notes on content |
| 54 | RecentlyViewed | Recently accessed content |
| 55 | UserFeedback | User feedback submissions |
| 56 | FeedbackMessage | Feedback conversation thread |
| 57 | ContactMessage | Site contact form messages |
| 58 | Certificate | Course completion certificates |
| 59 | CourseEnrollment | Course enrollment records |
| 60 | CoursePurchase | Course purchase records |
| 61 | LessonProgress | Per-lesson completion tracking |
| 62 | LessonAssignment | Lesson assignments |
| 63 | AssignmentSubmission | Assignment submissions |
| 64 | LessonSchedule | Lesson schedule/timing |

### TRANSACTIONAL (payments & exams) — 21 models
Payments, exam results, submissions, retake requests
| # | Model | Purpose |
|---|-------|---------|
| 65 | Payment | Payment records |
| 66 | Exam | Custom exam definitions |
| 67 | ExamQuestion | Questions in an exam |
| 68 | ExamResult | Exam attempt results |
| 69 | ExamSession | Active exam sessions |
| 70 | MCQExamSetResult | MCQ exam set results |
| 71 | MCQExamPackagePurchase | MCQ package purchases |
| 72 | MCQExamRetakeRequest | MCQ exam retake requests |
| 73 | CQExamPackagePurchase | CQ package purchases |
| 74 | CQExamSubmission | CQ exam submissions |
| 75 | CQExamAnswer | CQ answer per question slot |
| 76 | CQExamAnswerImage | CQ answer image uploads |
| 77 | CQExamRetakeRequest | CQ exam retake requests |
| 78 | CourseExamSchedule | Course exam schedules |
| 79 | LessonExam | Lesson-exam linkage (deprecated) |
| 80 | LessonNote | Lesson note materials |
| 81 | LessonResource | Lesson resource materials |
| 82 | LessonProgress | Lesson completion tracking |
| 83 | LessonAssignment | Lesson assignment definitions |
| 84 | AssignmentSubmission | Student assignment submissions |
| 85 | Certificate | Course completion certificates |

### BLOG (standalone module) — 6 models
| # | Model | Purpose |
|---|-------|---------|
| 86 | BlogCategory | Blog post categories |
| 87 | BlogTag | Blog post tags |
| 88 | BlogPost | Blog posts (SEO + content) |
| 89 | BlogPostTag | Blog post-tag junction |
| 90 | BlogRelatedPost | Related post links |
| 91 | BlogSeries | Blog post series |

---

## 3. Seed Dependency Graph

```
LEVEL 0 (no dependencies)
├── ClassCategory
├── Board
├── ExamYear
├── ContentType
├── SiteSetting
├── Navigation
├── Permission

LEVEL 1 (depends on Level 0)
├── Subject → ClassCategory
├── BoardYear → Board, ExamYear
├── RolePermission → Permission
├── BlogCategory
├── BlogTag
├── BlogSeries
├── TeacherModerator
├── AnalyticsAlert
├── AnalyticsReport
├── ContactMessage

LEVEL 2 (depends on Levels 0-1)
├── Chapter → Subject
├── Topic → Chapter
├── KnowledgeQuestion → Chapter
├── Suggestion → Chapter (optional)
├── ContentPackage
├── Banner
├── FAQ
├── Testimonial
├── Notice

LEVEL 3 (depends on Levels 0-2)
├── Lecture → Chapter
├── Resource → Lecture
├── MCQ → Chapter
├── CQ → Chapter

LEVEL 4 (depends on Levels 0-3)
├── ContentBundle
├── BundleItem → ContentBundle + MCQ/CQ/Lecture/etc.
├── MCQExamPackage → ClassCategory
├── MCQExamSet → MCQExamPackage
├── MCQExamSetQuestion → MCQExamSet + MCQ
├── CQExamPackage → ClassCategory
├── CQExamSet → CQExamPackage
├── CQExamSetQuestion → CQExamSet + CQ
├── Exam → User (creator, optional)
├── ExamQuestion → Exam + MCQ/CQ
├── Course → ClassCategory, Subject
├── CourseLesson → Course
├── LessonNote → CourseLesson
├── LessonResource → CourseLesson
├── LessonSchedule → CourseLesson
├── LessonAssignment → CourseLesson
├── LessonExam → CourseLesson + MCQ/CQ exam packages
├── CourseExamSchedule → Course + MCQ/CQ packages
├── FeaturedContent → any content type

LEVEL 5 (depends on Levels 0-4 + Users)
├── User (self-contained, depends on nothing)
├── Payment → User
├── UserFeedback → User
├── FeedbackMessage → UserFeedback + User
├── Progress → User + content (Lecture/MCQ/CQ)
├── Bookmark → User + content
├── Note → User + content
├── RecentlyViewed → User + content
├── ExamSession → User + Exam
├── ExamResult → User + Exam

LEVEL 6 (depends on Levels 0-5)
├── UserSubscription → User + ContentPackage
├── MCQExamSetResult → User + MCQExamSet
├── MCQExamPackagePurchase → User + MCQExamPackage + Payment
├── MCQExamRetakeRequest → User + MCQExamSet
├── CQExamPackagePurchase → User + CQExamPackage + Payment
├── CQExamSubmission → User + CQExamSet
├── CQExamAnswer → CQExamSubmission + CQExamSetQuestion
├── CQExamAnswerImage → CQExamAnswer
├── CQExamRetakeRequest → User + CQExamSet
├── CourseEnrollment → User + Course
├── CoursePurchase → User + Course + Payment
├── Certificate → User + Course + CourseEnrollment
├── AssignmentSubmission → User + LessonAssignment
├── LessonProgress → User + Lesson + Course
├── AuditLog → User (admin, optional)
├── AnalyticsEvent → User (optional)
├── AnalyticsSession → User (optional)
├── AnalyticsSearchQuery → User (optional)

LEVEL 7 (versioning & workflow — depends on any entity)
├── ContentVersion → any entity (by entityType + entityId)
├── ContentWorkflow → any entity
├── WorkflowHistory → any entity
├── WorkflowComment → any entity

LEVEL 8 (blog — depends on Users + Blog models)
├── BlogPost → User (author, optional) + BlogCategory + BlogSeries
├── BlogPostTag → BlogPost + BlogTag
├── BlogRelatedPost → BlogPost + BlogPost
```

---

## 4. Existing Seed Coverage Matrix

| Model | seed.ts | seed-all.ts | seed-missing.ts | seed-comprehensive.ts | seed-content.ts | seed-bundles.ts | seed-nav.ts | Coverage |
|-------|---------|-------------|-----------------|----------------------|-----------------|-----------------|-------------|----------|
| User | ✅ | ✅ | – | – | – | – | – | **2 files** |
| ClassCategory | ✅ | ✅ | – | – | – | – | – | **2 files** |
| Subject | ✅ | ✅ | – | – | – | – | – | **2 files** |
| Chapter | ✅ | ✅ | – | – | – | – | – | **2 files** |
| Topic | ✅ | – | ✅ | ✅ | – | – | – | **3 files** |
| Board | ✅ | ✅ | – | – | – | – | – | **2 files** |
| ExamYear | ✅ | ✅ | – | – | – | – | – | **2 files** |
| BoardYear | ✅ | ✅ | – | ✅ | ✅ | – | – | **4 files** |
| MCQ | ✅ | ✅ | – | ✅ | – | – | – | **3 files** |
| CQ | ✅ | ✅ | – | ✅ | ✅ | – | – | **4 files** |
| Lecture | ✅ | ✅ | – | ✅ | – | – | – | **3 files** |
| Resource | ✅ | ✅ | – | ✅ | – | – | – | **3 files** |
| KnowledgeQuestion | – | ✅ | – | ✅ | – | – | – | **2 files** |
| ContentType | ✅ | ✅ | – | ✅ | – | – | – | **3 files** |
| Banner | ✅ | ✅ | – | ✅ | – | – | – | **3 files** |
| FAQ | ✅ | ✅ | – | ✅ | – | – | – | **3 files** |
| Testimonial | ✅ | ✅ | – | ✅ | – | – | – | **3 files** |
| Notice | ✅ | ✅ | – | ✅ | – | – | – | **3 files** |
| Suggestion | ✅ | – | ✅ | ✅ | – | – | – | **3 files** |
| ContentBundle | ✅ | – | – | ✅ | ✅ | ✅ | – | **4 files** |
| BundleItem | ✅ | – | – | – | ✅ | ✅ | – | **3 files** |
| ContentPackage | ✅ | ✅ | – | ✅ | ✅ | – | – | **4 files** |
| UserSubscription | – | ✅ | – | ✅ | – | – | – | **2 files** |
| Navigation | ✅ | ✅ | – | ✅ | – | – | ✅ | **4 files** |
| SiteSetting | ✅ | ✅ | – | ✅ | – | – | – | **3 files** |
| FeaturedContent | ✅ | ✅ | – | ✅ | – | – | – | **3 files** |
| Permission | – | ✅ | – | ✅ | – | – | – | **2 files** |
| RolePermission | – | ✅ | – | – | – | – | – | **1 file** |
| TeacherModerator | – | ✅ | – | – | ✅ | – | – | **2 files** |
| MCQExamPackage | ✅ | – | ✅ | ✅ | ✅ | – | – | **4 files** |
| MCQExamSet | ✅ | – | ✅ | ✅ | ✅ | – | – | **4 files** |
| MCQExamSetQuestion | ✅ | – | ✅ | ✅ | ✅ | – | – | **4 files** |
| CQExamPackage | – | – | ✅ | ✅ | ✅ | – | – | **3 files** |
| CQExamSet | – | – | ✅ | ✅ | ✅ | – | – | **3 files** |
| CQExamSetQuestion | – | – | ✅ | ✅ | ✅ | – | – | **3 files** |
| Exam | – | – | ✅ | ✅ | ✅ | – | – | **3 files** |
| ExamQuestion | – | – | ✅ | ✅ | ✅ | – | – | **3 files** |
| ExamResult | – | – | ✅ | – | – | – | – | **1 file** |
| ExamSession | – | – | – | – | – | – | – | **❌** |
| Progress | – | – | ✅ | – | – | – | – | **1 file** |
| Bookmark | – | – | ✅ | – | – | – | – | **1 file** |
| Note | – | – | ✅ | – | – | – | – | **1 file** |
| RecentlyViewed | – | – | ✅ | – | – | – | – | **1 file** |
| UserFeedback | – | – | ✅ | – | – | – | – | **1 file** |
| FeedbackMessage | – | – | ✅ | – | – | – | – | **1 file** |
| ContactMessage | – | – | – | – | – | – | – | **❌** |
| Payment | – | ✅ | – | – | – | – | – | **1 file** |
| Notification | – | ✅ | – | – | – | – | – | **1 file** |
| AuditLog | – | ✅ | – | – | – | – | – | **1 file** |
| ContentVersion | – | – | – | – | – | – | – | **❌** |
| ContentWorkflow | – | – | – | – | – | – | – | **❌** |
| WorkflowHistory | – | – | – | – | – | – | – | **❌** |
| WorkflowComment | – | – | – | – | – | – | – | **❌** |
| BlogCategory | – | – | – | – | – | – | – | **❌** |
| BlogTag | – | – | – | – | – | – | – | **❌** |
| BlogPost | – | – | – | – | – | – | – | **❌** |
| BlogPostTag | – | – | – | – | – | – | – | **❌** |
| BlogRelatedPost | – | – | – | – | – | – | – | **❌** |
| BlogSeries | – | – | – | – | – | – | – | **❌** |
| Course | – | – | ✅ | ✅ | – | – | – | **2 files** |
| CourseLesson | – | – | ✅ | ✅ | – | – | – | **2 files** |
| CourseEnrollment | – | – | ✅ | ✅ | – | – | – | **2 files** |
| CoursePurchase | – | – | ✅ | – | – | – | – | **1 file** |
| CourseExamSchedule | – | – | ✅ | – | – | – | – | **1 file** |
| LessonNote | – | – | ✅ | – | – | – | – | **1 file** |
| LessonResource | – | – | ✅ | – | – | – | – | **1 file** |
| LessonSchedule | – | – | ✅ | – | – | – | – | **1 file** |
| LessonAssignment | – | – | ✅ | – | – | – | – | **1 file** |
| AssignmentSubmission | – | – | ✅ | – | – | – | – | **1 file** |
| LessonProgress | – | – | ✅ | – | – | – | – | **1 file** |
| LessonExam | – | – | ✅ | – | – | – | – | **1 file** |
| Certificate | – | – | – | ✅ | – | – | – | **1 file** |
| AnalyticsEvent | – | – | ✅ | ✅ | – | – | – | **2 files** |
| AnalyticsSession | – | – | ✅ | – | – | – | – | **1 file** |
| AnalyticsSearchQuery | – | – | ✅ | – | – | – | – | **1 file** |
| AnalyticsAlert | – | – | ✅ | – | – | – | – | **1 file** |
| AnalyticsReport | – | – | ✅ | – | – | – | – | **1 file** |
| MCQExamSetResult | – | – | ✅ | – | – | – | – | **1 file** |
| MCQExamPackagePurchase | – | – | ✅ | – | – | – | – | **1 file** |
| MCQExamRetakeRequest | – | – | ✅ | – | – | – | – | **1 file** |
| CQExamPackagePurchase | – | – | ✅ | – | – | – | – | **1 file** |
| CQExamSubmission | – | – | ✅ | – | – | – | – | **1 file** |
| CQExamAnswer | – | – | ✅ | – | – | – | – | **1 file** |
| CQExamAnswerImage | – | – | ✅ | – | – | – | – | **1 file** |
| CQExamRetakeRequest | – | – | ✅ | – | – | – | – | **1 file** |

---

## 5. Completely Unseeded Models (12 models)

These models have **zero seed coverage** across all 9 seed files:

| Model | Impact | Estimated effort |
|-------|--------|-----------------|
| **BlogCategory** | Blog module broken without seed data | Low (5-10 categories) |
| **BlogTag** | Tags broken | Low (10-20 tags) |
| **BlogPost** | Blog posts don't exist | Medium (5-10 posts) |
| **BlogPostTag** | Junction table — auto-created with posts | None (follows posts) |
| **BlogRelatedPost** | Related post links missing | None (follows posts) |
| **BlogSeries** | Blog series feature unusable | Low (2-3 series) |
| **ContentVersion** | Version history empty — no snapshots created | Low (auto when content changes) |
| **ContentWorkflow** | Editorial workflow can't start | Medium |
| **WorkflowHistory** | No workflow history recorded | None (follows workflow) |
| **WorkflowComment** | Workflow discussions empty | None (follows workflow) |
| **ContactMessage** | No sample contact messages | Low (3-5 messages) |
| **ExamSession** | No active exam sessions for testing | Low (3-5 sessions) |

---

## 6. Data Quality Assessment

### Good: Real Bengali content
- `seed.ts` — SSC Physics MCQs/CQs with real Bengali text
- `seed-content.ts` — Board-pattern CQs with authentic Bengali content
- `seed-bundles.ts` — Bengali names/prices for real-looking bundles

### Acceptable: Template-generated
- `seed.ts` — Generic fillers for non-core chapters (e.g., `"${subjectName} এর ${chapterName} থেকে অধ্যায়ভিত্তিক MCQ"`)
- `seed-comprehensive.ts` — Programmatic generation using `BN()` and `slugify()`

### Poor: Random/placeholder data
- `seed-missing.ts` — Uses `randomDate()`, `pick()` for analytics data
- `seed(-missing).ts` — Generic names like "User 1", "User 2"

---

## 7. Idempotency Patterns

| Pattern | Files Using | Risk |
|---------|-------------|------|
| `findFirst { where: {slug/title} }` → skip if exists | seed.ts, seed-missing.ts, seed-content.ts | Low — safe re-run |
| `upsert` | seed-all.ts | Low — safest |
| `count()` → skip if >= threshold | seed-comprehensive.ts | Medium — won't fill new gaps after first run |
| `count()` → skip entirely if ANY exist | seed-bundles.ts | High — won't seed specific new bundles |
| None — direct `create` | seed-db.ts, seed-nav.ts | Low (single operation) |
| find → create/update with password verify | seed-super-admin.ts | Very low — sophisticated |

---

## 8. Recommended Row Counts

| Model | Min (CI) | Recommended (Dev) | Demo | Stress Test |
|-------|----------|-------------------|------|-------------|
| **User** | 4 (1SA+1A+2S) | 15 (1SA+2A+12S) | 50 (2SA+5A+43S) | 10000 |
| **ClassCategory** | 5 | 5 | 5 | 5 |
| **Subject** | 18 | 32 | 32 | 32 |
| **Chapter** | 40 | 85 | 85 | 85 |
| **Topic** | 40 | 120 | 250 | 500 |
| **Lecture** | 40 | 85 | 200 | 500 |
| **Resource** | 20 | 85 | 200 | 500 |
| **MCQ** | 80 | 250 | 2000 | 50000 |
| **CQ** | 12 | 50 | 500 | 10000 |
| **KnowledgeQuestion** | 40 | 170 | 500 | 1000 |
| **Board** | 8 | 10 | 10 | 10 |
| **ExamYear** | 5 | 10 | 10 | 10 |
| **BoardYear** | 40 | 100 | 100 | 100 |
| **ContentBundle** | 1 | 6 | 15 | 30 |
| **ContentPackage** | 2 | 3 | 5 | 10 |
| **UserSubscription** | 1 | 5 | 20 | 500 |
| **MCQExamPackage** | 1 | 5 | 10 | 20 |
| **MCQExamSet** | 2 | 15 | 50 | 200 |
| **CQExamPackage** | 1 | 5 | 10 | 20 |
| **CQExamSet** | 2 | 10 | 30 | 100 |
| **Exam** | 3 | 15 | 50 | 200 |
| **ExamResult** | 3 | 30 | 100 | 5000 |
| **ExamSession** | 3 | 10 | 50 | 500 |
| **Payment** | 2 | 10 | 30 | 1000 |
| **Course** | 1 | 5 | 10 | 20 |
| **CourseLesson** | 5 | 20 | 50 | 200 |
| **CourseEnrollment** | 2 | 10 | 30 | 1000 |
| **Certificate** | 1 | 5 | 15 | 500 |
| **BlogPost** | 0 | 5 | 20 | 100 |
| **BlogCategory** | 0 | 5 | 8 | 10 |
| **SiteSetting** | 20 | 50 | 50 | 50 |
| **Navigation** | 10 | 18 | 18 | 18 |
| **Permission** | 10 | 18 | 25 | 30 |
| **RolePermission** | 20 | 34 | 50 | 60 |
| **TeacherModerator** | 0 | 4 | 10 | 20 |
| **Banner** | 1 | 3 | 5 | 10 |
| **FAQ** | 3 | 6 | 10 | 20 |
| **Testimonial** | 2 | 5 | 8 | 20 |
| **Notice** | 1 | 5 | 10 | 30 |
| **FeaturedContent** | 2 | 6 | 15 | 30 |
| **Suggestion** | 2 | 8 | 20 | 50 |
| **ContactMessage** | 0 | 5 | 10 | 50 |
| **AnalyticsEvent** | 0 | 50 | 500 | 100000 |
| **AnalyticsSession** | 0 | 20 | 100 | 5000 |
| **AuditLog** | 0 | 5 | 50 | 1000 |

---

## 9. Seed File Size Comparison

| File | Lines | Size | Models Seeded |
|------|-------|------|---------------|
| `prisma/seed.ts` | 1843 | 109KB | ~27 |
| `prisma/seed-all.ts` | 735 | 73KB | ~29 |
| `prisma/seed-missing.ts` | 1122 | 47KB | ~40+ |
| `prisma/seed-comprehensive.ts` | 755 | 37KB | ~20+ |
| `prisma/seed-content.ts` | 620 | 28KB | ~12 |
| `prisma/seed-db.ts` | 15 | 421B | 0 (client init) |
| `src/lib/seed-super-admin.ts` | 75 | — | 1 |
| `scripts/seed-nav.ts` | 33 | — | 1 |
| `scripts/seed-bundles.ts` | 178 | — | 2 |

**Total**: ~5300 lines of seed code across 9 files

---

## 10. Transaction Coverage

| File | Uses $transaction | Risk |
|------|-------------------|------|
| seed.ts | ❌ | Partial seed on failure |
| seed-all.ts | ❌ | Partial seed on failure |
| seed-missing.ts | ❌ | Partial seed on failure |
| seed-comprehensive.ts | ❌ | Partial seed on failure |
| seed-content.ts | ❌ | Partial seed on failure |
| seed-db.ts | N/A | N/A |
| seed-super-admin.ts | ❌ | Low — single operation |
| seed-nav.ts | ❌ | Low — single operation |
| seed-bundles.ts | ❌ | Partial bundle creation |

**Verdict**: Zero transaction support anywhere. This is a critical gap — any seed that creates interdependent records (e.g., a bundle with items, an exam with questions) can leave orphaned data if it fails mid-way.

---

## 11. Idempotency Quality

| File | Mechanism | Quality |
|------|-----------|---------|
| seed.ts | `findFirst` + `create` per record | Good |
| seed-all.ts | `upsert` (system models) + `findFirst` + `create` | **Best** |
| seed-missing.ts | `findFirst` + `create` per record | Good |
| seed-comprehensive.ts | `count()` threshold check | Medium |
| seed-content.ts | `findFirst` + `create` | Good |
| seed-bundles.ts | `count() > 0` → skip all | **Poor** (all-or-nothing) |
| seed-super-admin.ts | find → verify password → create/update | **Excellent** |
| seed-nav.ts | `findFirst` + `createMany` | Good |

---

## 12. Prisma Client Inconsistency

| File | Prisma Client Source | Notes |
|------|---------------------|-------|
| seed.ts | `seed-db.ts` | Shared |
| seed-all.ts | `seed-db.ts` | Shared |
| seed-missing.ts | **Own** `new PrismaClient()` | Does NOT share seed-db.ts |
| seed-comprehensive.ts | `seed-db.ts` | Shared |
| seed-content.ts | `seed-db.ts` | Shared |
| seed-nav.ts | `src/lib/db` | App's shared client |
| seed-bundles.ts | `src/lib/db` | App's shared client |

**Problem**: `seed-missing.ts` creates its own PrismaClient — this means it doesn't benefit from the LibSQL adapter configuration in `seed-db.ts` and could behave differently.

---

## 13. Overlap & Conflict Risks

| Scenario | Risk | Details |
|----------|------|---------|
| seed.ts + seed-all.ts | Medium | Both seed same hierarchy with minor differences (10 vs 9 boards) |
| seed-missing.ts + seed-comprehensive.ts | High | Both seed topics, exams, packages — different quantities |
| Any seed + seed-bundles.ts | Medium | seed-bundles.ts skips ALL if ANY bundle exists |
| Any re-run without reset | Low-Medium | Idempotency mostly works, but upsert patterns may update differently |

---

## 14. Recommendations

### Critical (blocking)
1. **Consolidate into a single seed file** — The current 6-file sprawl guarantees inconsistency. One `seed.ts` that handles ALL models.
2. **Add transaction support** — Wrap all seed operations in `$transaction` to ensure atomicity.
3. **Seed all 12 unseeded models** — Blog module, ContentWorkflow, ContentVersion, ContactMessage, ExamSession.

### High priority
4. **Standardize on `upsert` for all seed operations** — Eliminate the find+create vs upsert vs count-check confusion.
5. **Use a single Prisma client** — All seed files should use `seed-db.ts`. Eliminate `seed-missing.ts`'s own client.
6. **Add environment-aware seeding** — `NODE_ENV=production` should skip demo data (user activity, analytics, feedback).

### Medium priority
7. **Board consistency** — Decide whether Teknaf is a board (seed.ts) or not (seed-all.ts) and make uniform.
8. **Improve seed-bundles.ts idempotency** — Check per-bundle slug, not global count.
9. **Remove duplicate package.json scripts** — Consolidate `seed:content`, `seed:missing` into one `seed` command.

### Low priority
10. **Add CI seed verification** — A test that runs the seed and checks all 85 models have >0 records.
11. **Add seed performance benchmarking** — Know how long each seed phase takes.
12. **Migrate `seed.ts`'s board MCQ and CQ arrays to `seed-content.ts` style** — Real Bengali content, not generic templates.

---

## 15. Proposed Unified Seed Structure

```
prisma/
├── seed.ts                    ← UNIFIED ENTRY POINT (package.json "seed" target)
├── seed-data/
│   ├── users.ts               ← Admin & student accounts
│   ├── hierarchy.ts           ← ClassCategory, Subject, Chapter, Topic
│   ├── boards.ts              ← Board, ExamYear, BoardYear
│   ├── lectures.ts            ← Lecture, Resource
│   ├── mcqs.ts                ← MCQ
│   ├── cqs.ts                 ← CQ
│   ├── knowledge.ts           ← KnowledgeQuestion
│   ├── suggestions.ts         ← Suggestion
│   ├── bundles.ts             ← ContentBundle, BundleItem
│   ├── packages.ts            ← ContentPackage, UserSubscription
│   ├── exam-packages.ts       ← MCQ/CQ ExamPackage, ExamSet, ExamSetQuestion
│   ├── exams.ts               ← Exam, ExamQuestion, ExamResult, ExamSession
│   ├── courses.ts             ← Course, CourseLesson, CourseEnrollment, etc.
│   ├── blog.ts                ← BlogCategory, BlogTag, BlogPost, BlogSeries
│   ├── system.ts              ← Permission, RolePermission, Navigation, SiteSetting, ContentType
│   ├── marketing.ts           ← Banner, FAQ, Testimonial, Notice, FeaturedContent
│   ├── workflow.ts            ← ContentWorkflow, ContentVersion
│   ├── analytics.ts           ← AnalyticsEvent, AnalyticsSession, AnalyticsSearchQuery
│   ├── activity.ts            ← Progress, Bookmark, Note, RecentlyViewed, Feedback
│   ├── payments.ts            ← Payment, purchases
│   └── contacts.ts            ← ContactMessage
├── seed-db.ts                 ← Shared PrismaClient
├── seed-super-admin.ts        ← Shared utility
└── seed.helpers.ts            ← Shared helpers (BN(), slugify(), randomDate(), etc.)
```

---

## 16. Existing Data Counts (per seed file)

| Category | seed.ts | seed-all.ts | seed-missing.ts | seed-comprehensive.ts | seed-content.ts |
|----------|---------|-------------|-----------------|----------------------|-----------------|
| Users | 5 | 5 | 0 | 0 | 0 |
| Classes | 5 | 5 | 0 | 0 | 0 |
| Subjects | 32 | 32 | 0 | 0 | 0 |
| Chapters | 80+ | 80+ | 0 | 0 | 0 |
| Topics | 30 | 0 | 20 | 240* | 0 |
| MCQs | 80+ | 40+ | 0 | 400* | 0 |
| CQs | 12 | 4 | 0 | 200* | 4 |
| Lectures | 100+ | 100+ | 0 | 80* | 0 |
| KB Questions | 0 | 40 | 0 | 160* | 0 |
| Exams | 0 | 0 | 6 | 96* | 1 |
| Courses | 0 | 0 | 1 | 5 | 0 |
| Analytics Events | 0 | 0 | 50 | 30 | 0 |
| Permissions | 0 | 18 | 0 | 4* | 0 |

`*` = conditional on gaps

---

## 17. Entry Point Flows

### Current (6 paths)
```
npm run seed:content    → prisma/seed-content.ts
npm run seed:missing    → prisma/seed-missing.ts
npm run create-super-admin → scripts/create-super-admin.ts
npx prisma db seed      → prisma/seed-all.ts (from prisma.seed in package.json)
node scripts/seed-nav.ts
node scripts/seed-bundles.ts
```

### Recommended (1 path)
```
npx prisma db seed      → prisma/seed.ts → orchestrates all modules
```

---

## 18. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Partial seed on crash | High | Medium | Add $transaction |
| Blog module broken | High | Certain | Add blog seed data |
| Duplicate content after multiple runs | Medium | High | Standardize on upsert |
| Board count inconsistency | Low | Medium | Consolidate to 1 source |
| Orphaned bundle items | Medium | Low | Use nested creates + transactions |
| Exam session testing impossible | Medium | Certain | Add ExamSession seed |
| Workflow feature non-functional | Low | Certain | Add ContentWorkflow seed |
| Version history feature broken | Low | Certain | Add ContentVersion seed |

---

## 19. ROT Analysis (Redundant, Outdated, Trivial)

### Redundant
- `prisma/seed.ts` and `prisma/seed-all.ts` overlap 90% — `seed-all.ts` is essentially `seed.ts` + extra models. Pick one.
- Topics are seeded in 3 files (seed.ts, seed-missing.ts, seed-comprehensive.ts) — should be in one place.
- BoardYear is seeded in 4 files.

### Outdated
- `seed.ts` inline super admin logic is now superseded by `seed-super-admin.ts`.
- `seed.ts` has `ClassCategory.update()` blocks at the end for fields that may no longer need migration.
- `seed.ts` creates a `teknaf` board that `seed-all.ts` omits.
- `seed-comprehensive.ts` mentions `FeatureFlag` model in a comment — model was removed from schema.

### Trivial
- `seed-db.ts` is correctly factored — keep as is.
- `seed-super-admin.ts` is well-factored and used correctly — keep.
- `seed-nav.ts` is a one-time migration script — could be incorporated into main seed.

---

## 20. Next Steps Summary

1. **Consolidate to one seed file** — Eliminate 5 redundant files
2. **Add 12 missing model seeds** — Blog, Workflow, Contact, Sessions
3. **Add transaction wrapping** — Prevent partial states
4. **Standardize on upsert** — Uniform idempotency
5. **Unify Prisma client** — All use seed-db.ts
6. **Add environment modes** — Skip demo data in production
7. **Move to seed-data/ directory** — Modular per-domain seed modules
8. **Add CI verification** — Test that seed produces expected data
