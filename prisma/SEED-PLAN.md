# Production Seed System — Plan

## 1. Audit Summary

| Metric | Value |
|--------|-------|
| Total Prisma models | **85** |
| Previously seeded (partial) | ~60 |
| Completely unseeded | **12** (blog 6, workflow 3, version history, contact, exam sessions) |
| Existing seed files | 9 files, ~5300 lines |
| Transaction support | **None** (zero files use `$transaction`) |
| Idempotency strategy | Inconsistent (find+create / upsert / count-check) |
| Prisma client sources | 3 different clients |
| Database | SQLite |
| Migration count | 5 (latest: Blog module) |

## 2. All 85 Prisma Models

All models listed in `prisma/schema.prisma` — fully cataloged with fields, relations, constraints, and soft-delete status in the companion `prisma/SEED-AUDIT.md` (sections 2 & 3).

## 3. Seed Plan

### Architecture: 24 modular seed files + 1 orchestrator

```
prisma/
├── seed.ts                        ← Entry point (orchestrator)
├── seed-db.ts                     ← Shared Prisma client (EXISTING — keep)
├── seed-super-admin.ts            ← Super admin utility (EXISTING — keep)
├── seed-data/
│   ├── 00-helpers.ts              ← Shared helpers (slugify, BN, randomDate, etc.)
│   ├── 01-hierarchy.seed.ts       ← ClassCategory, Subject, Chapter, Topic, Board, ExamYear, BoardYear
│   ├── 02-users.seed.ts           ← User (SA, admin, teacher, students, demo)
│   ├── 03-content-types.seed.ts   ← ContentType
│   ├── 04-permissions.seed.ts     ← Permission, RolePermission
│   ├── 05-navigation.seed.ts      ← Navigation
│   ├── 06-settings.seed.ts        ← SiteSetting
│   ├── 07-blog-categories.seed.ts ← BlogCategory, BlogTag, BlogSeries
│   ├── 08-teachers.seed.ts        ← TeacherModerator
│   ├── 09-lectures.seed.ts        ← Lecture, Resource
│   ├── 10-mcqs.seed.ts            ← MCQ
│   ├── 11-cqs.seed.ts             ← CQ
│   ├── 12-knowledge.seed.ts       ← KnowledgeQuestion
│   ├── 13-suggestions.seed.ts     ← Suggestion
│   ├── 14-exams.seed.ts           ← Exam, ExamQuestion, ExamSession, ExamResult
│   ├── 15-mcq-exam-packages.seed.ts ← MCQExamPackage, MCQExamSet, MCQExamSetQuestion
│   ├── 16-cq-exam-packages.seed.ts  ← CQExamPackage, CQExamSet, CQExamSetQuestion
│   ├── 17-bundles.seed.ts         ← ContentBundle, BundleItem
│   ├── 18-packages.seed.ts        ← ContentPackage, UserSubscription
│   ├── 19-homepage.seed.ts        ← Banner, FAQ, Testimonial, Notice, FeaturedContent
│   ├── 20-courses.seed.ts         ← Course, CourseLesson, LessonNote, LessonResource, LessonSchedule, LessonAssignment, AssignmentSubmission, LessonExam, CourseExamSchedule, LessonProgress, CourseEnrollment, CoursePurchase, Certificate
│   ├── 21-blog-posts.seed.ts      ← BlogPost, BlogPostTag, BlogRelatedPost
│   ├── 22-payments.seed.ts        ← Payment, MCQExamPackagePurchase, CQExamPackagePurchase
│   ├── 23-activity.seed.ts        ← Progress, Bookmark, Note, RecentlyViewed, UserFeedback, FeedbackMessage
│   ├── 24-notifications.seed.ts   ← Notification
│   ├── 25-analytics.seed.ts       ← AnalyticsEvent, AnalyticsSession, AnalyticsSearchQuery, AnalyticsAlert, AnalyticsReport
│   ├── 26-workflow.seed.ts        ← ContentWorkflow, WorkflowHistory, WorkflowComment
│   ├── 27-audit.seed.ts           ← AuditLog, ContentVersion
│   └── 28-contacts.seed.ts        ← ContactMessage
```

## 4. Dependency Graph

```
Level 0 (no deps)        → 01-hierarchy (Board, ExamYear)
Level 1 (Board/Year)     → 01-hierarchy (BoardYear)
Level 1 (standalone)     → 02-users, 03-content-types, 04-permissions, 05-navigation, 06-settings
Level 1 (blog meta)      → 07-blog-categories, 08-teachers
Level 2 (needs users)    → 04-permissions (RolePermission needs Permission + User role names)
Level 2 (needs hierarchy)→ 09-lectures, 10-mcqs, 11-cqs, 12-knowledge, 13-suggestions
Level 3 (needs content)  → 14-exams, 15-mcq-exam-packages, 16-cq-exam-packages
Level 3 (needs content)  → 17-bundles, 18-packages
Level 3 (marketing)      → 19-homepage
Level 4 (needs exams)    → 22-payments (purchases need packages)
Level 4 (needs courses)  → 20-courses
Level 4 (needs blog cats)→ 21-blog-posts
Level 5 (needs users+content) → 23-activity, 24-notifications, 25-analytics
Level 6 (needs content)  → 26-workflow, 27-audit, 28-contacts
```

### Execution Order

```
Phase 1 — Foundation (no deps)
  01-hierarchy.seed.ts
  02-users.seed.ts
  03-content-types.seed.ts
  04-permissions.seed.ts
  05-navigation.seed.ts
  06-settings.seed.ts
  07-blog-categories.seed.ts
  08-teachers.seed.ts

Phase 2 — Content (depends on hierarchy)
  09-lectures.seed.ts
  10-mcqs.seed.ts
  11-cqs.seed.ts
  12-knowledge.seed.ts
  13-suggestions.seed.ts

Phase 3 — Courses & Exams (depends on content)
  14-exams.seed.ts
  15-mcq-exam-packages.seed.ts
  16-cq-exam-packages.seed.ts
  17-bundles.seed.ts
  18-packages.seed.ts
  19-homepage.seed.ts
  20-courses.seed.ts

Phase 4 — Blog, Payments (depends on content + users)
  21-blog-posts.seed.ts
  22-payments.seed.ts

Phase 5 — Activity (depends on all above)
  23-activity.seed.ts
  24-notifications.seed.ts
  25-analytics.seed.ts

Phase 6 — Audit & Workflow (depends on all above)
  26-workflow.seed.ts
  27-audit.seed.ts
  28-contacts.seed.ts
```

## 5. Generated Row Counts

| Model | Minimum | Recommended | Notes |
|-------|---------|-------------|-------|
| **User** | 10 | 20 | 1SA, 2A, 2T, 12S, 3 demo |
| **ClassCategory** | 5 | 5 | 6-7-8-SSC-HSC |
| **Subject** | 30 | 40 | 6-10 per class |
| **Chapter** | 150 | 280 | 5-10 per subject |
| **Topic** | 200 | 400 | 1-3 per chapter |
| **Board** | 8 | 10 | All Bangladesh boards |
| **ExamYear** | 10 | 15 | 2010-2025 |
| **BoardYear** | 80 | 150 | All combos |
| **Lecture** | 150 | 280 | 1 per chapter |
| **Resource** | 150 | 280 | 1 per lecture |
| **MCQ** | 1500 | 4000 | 5-20 per chapter |
| **CQ** | 300 | 1000 | 2-5 per chapter |
| **KnowledgeQuestion** | 300 | 800 | 2-4 per chapter |
| **Suggestion** | 10 | 30 | Per class-subject combo |
| **Exam** | 10 | 30 | Mixed types |
| **ExamQuestion** | 100 | 500 | Links MCQs/CQs to exams |
| **ExamSession** | 5 | 15 | Demo student sessions |
| **ExamResult** | 10 | 30 | Demo results |
| **Payment** | 5 | 15 | Mix of statuses |
| **Notification** | 10 | 30 | Welcome + system |
| **AuditLog** | 5 | 15 | Sample entries |
| **ContentVersion** | 5 | 15 | Sample versions |
| **Permission** | 25 | 35 | All system permissions |
| **RolePermission** | 50 | 70 | SA + Admin mappings |
| **Navigation** | 15 | 20 | Header + Footer + Bottom |
| **SiteSetting** | 40 | 60 | All config keys |
| **ContentType** | 10 | 12 | All content types |
| **BlogCategory** | 5 | 8 | Education categories |
| **BlogTag** | 15 | 25 | Popular tags |
| **BlogSeries** | 3 | 5 | Blog series |
| **BlogPost** | 10 | 30 | Mixed statuses |
| **BlogPostTag** | 30 | 80 | Junction |
| **BlogRelatedPost** | 5 | 15 | Related links |
| **Banner** | 3 | 5 | Homepage banners |
| **FAQ** | 5 | 10 | Common questions |
| **Testimonial** | 3 | 8 | Student testimonials |
| **Notice** | 3 | 8 | Notices |
| **FeaturedContent** | 5 | 15 | Homepage featured |
| **ContentBundle** | 3 | 8 | Mixed bundles |
| **BundleItem** | 20 | 50 | Items in bundles |
| **ContentPackage** | 3 | 5 | Subscriptions |
| **UserSubscription** | 3 | 10 | Demo subscriptions |
| **MCQExamPackage** | 3 | 8 | Packages per class |
| **MCQExamSet** | 9 | 30 | 3 per package |
| **MCQExamSetQuestion** | 90 | 400 | Questions per set |
| **MCQExamSetResult** | 5 | 20 | Demo results |
| **MCQExamRetakeRequest** | 1 | 5 | Demo requests |
| **MCQExamPackagePurchase** | 3 | 10 | Demo purchases |
| **CQExamPackage** | 2 | 5 | Packages per class |
| **CQExamSet** | 4 | 15 | 2-3 per package |
| **CQExamSetQuestion** | 12 | 60 | Questions per set |
| **CQExamSubmission** | 3 | 10 | Demo submissions |
| **CQExamAnswer** | 12 | 50 | Answers per submission |
| **CQExamAnswerImage** | 5 | 20 | Demo images |
| **CQExamPackagePurchase** | 2 | 8 | Demo purchases |
| **CQExamRetakeRequest** | 1 | 5 | Demo requests |
| **TeacherModerator** | 4 | 10 | Teachers |
| **Course** | 3 | 8 | Courses per class |
| **CourseLesson** | 12 | 40 | 4-6 per course |
| **LessonNote** | 12 | 40 | 1 per lesson |
| **LessonResource** | 12 | 40 | 1 per lesson |
| **LessonSchedule** | 12 | 40 | 1 per lesson |
| **LessonAssignment** | 6 | 20 | 2 per course |
| **AssignmentSubmission** | 6 | 30 | Per student |
| **LessonExam** | 4 | 15 | Exam linkage |
| **CourseExamSchedule** | 3 | 10 | Schedule per course |
| **LessonProgress** | 10 | 40 | Per student |
| **CourseEnrollment** | 5 | 20 | Demo enrollments |
| **CoursePurchase** | 3 | 10 | Demo purchases |
| **Certificate** | 2 | 8 | Demo certs |
| **ContactMessage** | 3 | 8 | Sample contacts |
| **AnalyticsEvent** | 20 | 100 | Sample events |
| **AnalyticsSession** | 10 | 30 | Sample sessions |
| **AnalyticsSearchQuery** | 10 | 30 | Sample searches |
| **AnalyticsAlert** | 3 | 5 | Sample alerts |
| **AnalyticsReport** | 3 | 5 | Sample reports |
| **ContentWorkflow** | 3 | 10 | Workflow states |
| **WorkflowHistory** | 6 | 20 | Transitions |
| **WorkflowComment** | 3 | 10 | Comments |
| **Progress** | 30 | 100 | Per student |
| **Bookmark** | 10 | 30 | Per student |
| **Note** | 10 | 30 | Per student |
| **RecentlyViewed** | 15 | 50 | Per student |
| **UserFeedback** | 3 | 8 | Sample feedback |
| **FeedbackMessage** | 6 | 16 | Thread messages |

## 6. Data Quality Standards

### All Realistic Bengali Content
- **Class names**: Bengali (ষষ্ঠ শ্রেণী, সপ্তম শ্রেণী, SSC, HSC)
- **Subject names**: Real Bangladeshi curriculum subjects (পদার্থ বিজ্ঞান, রসায়ন, বাংলা, ইংরেজি, গণিত, ইতিহাস, ইত্যাদি)
- **Chapter names**: Real NCF-aligned chapter names
- **MCQ questions**: Real curriculum-based MCQs with 4 options and correct answers
- **CQ questions**: Board-pattern CQs with uddeepok (stem), 4 questions, 4 answers
- **Lecture content**: Rich HTML with real educational content
- **Blog posts**: Real educational articles
- **FAQ/Notices/Testimonials**: Realistic Bengali content

### Key Content Patterns
- MCQs are tagged with difficulty (EASY/MEDIUM/HARD)
- Content respects `isPremium` + `price` for premium gating
- All soft-delete models have `deletedAt: null` and `isActive: true`
- Exam results and progress reflect realistic patterns
- Payment records have realistic amounts and statuses

## 7. Idempotency Strategy

**Every single seed operation uses `upsert`** — no exceptions.

| Model | Upsert Key | Notes |
|-------|-----------|-------|
| All models with unique fields | `where: { uniqueField: value }` | Uses natural keys |
| Models without unique fields | `where: { id: predefined_cuid }` | Deterministic IDs |
| Junction tables | `upsert` with composite unique | BlogPostTag, BundleItem, etc. |

Benefits:
- Safe for multiple re-runs
- No duplicate checking logic needed
- Updates existing data if fields changed
- Works with nested creates

## 8. Transaction Strategy

```
seed.ts orchestration:

for each phase (1-6):
  await prisma.$transaction(async (tx) => {
    for each seed file in phase:
      await module.seed(tx)
  })
```

Each phase is wrapped in a transaction. If any seed file in a phase fails, the entire phase rolls back. Since each phase's data doesn't depend on later phases, partial completion is safe.

## 9. Models Intentionally Skipped

| Model | Reason |
|-------|--------|
| _(none)_ | All 85 models are seeded |

**Every model gets seed data.** None are skipped.

## 10. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Row count targets too high (4000 MCQs) | Medium | Generator functions create content lazily — only as many as needed |
| SQLite transaction size limit | Medium | Phased transactions limit per-transaction size |
| Upsert performance on large tables | Low | SQLite handles 1000s of upserts fine |
| Bengali content accuracy | Low | Content is reviewed by curriculum standards |
| Date-based fields reference the past | Low | All dates calculated relative to seed execution time |

## 11. Final Seed Coverage Score

**Target: 100%** — All 85 models seeded, all 12 previously-unseeded models covered.

| Category | Total Models | Previously Seeded | New Coverage |
|----------|-------------|-------------------|--------------|
| User System | 1 | 1 (partial) | 100% |
| Content Structure | 4 | 4 | 100% |
| Topic System | 1 | 1 | 100% |
| Knowledge | 1 | 1 | 100% |
| Lectures | 2 | 2 | 100% |
| MCQ System | 1 | 1 | 100% |
| CQ System | 1 | 1 | 100% |
| Exam System | 5 | 4 (missing ExamSession) | 100% |
| Progress & Bookmark | 6 | 6 | 100% |
| Payment | 1 | 1 | 100% |
| Notification | 1 | 1 | 100% |
| Audit/Version | 2 | 1 (missing ContentVersion) | 100% |
| Marketing | 4 | 4 | 100% |
| Suggestion | 1 | 1 | 100% |
| Reference Data | 3 | 3 | 100% |
| Content Types | 2 | 2 | 100% |
| Settings | 1 | 1 | 100% |
| Contact | 1 | 0 | 100% |
| Navigation | 1 | 1 | 100% |
| Bundles | 2 | 2 | 100% |
| Packages | 2 | 2 | 100% |
| MCQ Exam | 6 | 6 | 100% |
| CQ Exam | 9 | 9 | 100% |
| RBAC | 2 | 2 | 100% |
| Teachers | 1 | 1 | 100% |
| Courses | 14 | 14 | 100% |
| Analytics | 5 | 5 | 100% |
| Workflow | 3 | 0 | 100% |
| Blog | 6 | 0 | 100% |
| **Total** | **85** | **73** | **100%** |

## 12. File-by-File Specification

### `seed-data/00-helpers.ts`
Exports:
- `slugify(text: string): string` — Bengali-aware slug generation
- `BN(n: number): string` — Bengali numeral converter
- `randomDate(start: Date, end: Date): Date` — Random date in range
- `pick<T>(arr: T[]): T` — Random array pick
- `generateId(): string` — Deterministic ID generation for upsert
- `bengaliChapterNames` — Maps of class→subject→chapter names in Bengali
- `bengaliSubjectNames` — All subjects per class in Bengali
- `bengaliClassNames` — Class names in Bengali

### `seed-data/01-hierarchy.seed.ts`
Seed entities in strict order:
1. ClassCategory (5: class-6 through hsc)
2. Subject (30-40: varying per class)
3. Chapter (150-280: varying per subject)
4. Topic (200-400: varying per chapter)
5. Board (10: dhaka, rajshahi, etc. — with colors)
6. ExamYear (10-15: 2010-2025)
7. BoardYear (80-150: full cartesian)

Uses deterministic cuid-like IDs for all upsert keys.

### `seed-data/02-users.seed.ts`
Seeds:
- 1 SUPER_ADMIN: admin@sikkha.com (hashed password from env or default)
- 2 ADMIN: admin1@sikkha.com, admin2@sikkha.com
- 2 TEACHER/STAFF (lower privilege)
- 12 STUDENT accounts (varying classLevel, board)
- 3 DEMO accounts (demo1@, demo2@, demo3@)

All have: realistic names, phones, institutes, class levels, boards.

### `seed-data/03-content-types.seed.ts`
Seeds 12 ContentType records matching the app's content type system:
lecture, mcq, cq, board-mcq, board-cq, suggestion, exam, bundle, package, mcq-exam-package, cq-exam-package, knowledge

Each with Bengali labels, Lucide icon names, Tailwind colors, routes.

### `seed-data/04-permissions.seed.ts`
Seeds:
- 25-35 Permission records covering: payment.*, content.*, users.*, system.*, exam.*, blog.*, analytics.*, workflow.*
- 50-70 RolePermission records: all for SUPER_ADMIN, subset for ADMIN

### `seed-data/05-navigation.seed.ts`
Seeds:
- 8-10 Header navigation items (home, classes, exams, mcq, cq, lectures, blog, premium)
- 4-5 Footer navigation items (about, privacy, terms, contact)
- 5-6 BottomNav items (home, courses, exams, blog, profile)

### `seed-data/06-settings.seed.ts`
Seeds 40-60 SiteSetting records covering:
- SEO (site name, title, description, keywords, og-image)
- Homepage (hero title, tagline, features)
- Contact (email, phone, address)
- Social (facebook, youtube, whatsapp)
- Messages (welcome, registration, payment)
- Features (enable/disable flags)
- Appearance (primary color, logo)

### `seed-data/07-blog-categories.seed.ts`
Seeds:
- 5-8 BlogCategory (শিক্ষা টিপস, পরীক্ষা প্রস্তুতি, ক্যারিয়ার, ইত্যাদি)
- 15-25 BlogTag (গণিত, ইংরেজি, পদার্থবিজ্ঞান, ইত্যাদি)
- 3-5 BlogSeries (SSC প্রস্তুতি, HSC প্রস্তুতি, ইত্যাদি)

### `seed-data/08-teachers.seed.ts`
Seeds 4-10 TeacherModerator profiles with realistic names, titles, institutions.

### `seed-data/09-lectures.seed.ts`
Seeds 150-280 Lecture records:
- One per chapter
- Rich HTML content (Bengali educational text with headings, paragraphs, lists)
- Realistic durations (20-60 min)
- ~20% marked as premium with prices
- Each with 1 Resource (PDF reference)

### `seed-data/10-mcqs.seed.ts`
Seeds 1500-4000 MCQ records:
- Generated programmatically per chapter
- Realistic Bengali questions with 4 options
- Correct answers (A/B/C/D)
- Explanations for ~30% of MCQs
- Difficulty distribution: 30% EASY, 50% MEDIUM, 20% HARD
- ~15% premium with prices
- Tags for subject/chapter context

### `seed-data/11-cqs.seed.ts`
Seeds 300-1000 CQ records:
- 2-5 per chapter
- Real uddeepok (stem paragraph) in Bengali
- 4 questions with 4 answers each
- Difficulty distribution matched to curriculum level
- ~15% premium with prices

### `seed-data/12-knowledge.seed.ts`
Seeds 300-800 KnowledgeQuestion records:
- 2-4 per chapter
- Mix of 'knowledge' and 'comprehension' types
- Question + answer pairs
- Premium flag for ~10%

### `seed-data/13-suggestions.seed.ts`
Seeds 10-30 Suggestion records:
- Per class-subject combination for SSC and HSC
- Rich HTML content
- Optional chapter associations

### `seed-data/14-exams.seed.ts`
Seeds:
- 10-30 Exam records (MCQ, CQ, mixed)
- With ExamQuestion links to existing MCQs/CQs
- 5-15 ExamSession records for demo students
- 10-30 ExamResult records with realistic scores

### `seed-data/15-mcq-exam-packages.seed.ts`
Seeds:
- 3-8 MCQExamPackage records per class
- 9-30 MCQExamSet records (3 per package)
- 90-400 MCQExamSetQuestion records
- 5-20 MCQExamSetResult records
- 1-5 MCQExamRetakeRequest records
- 3-10 MCQExamPackagePurchase records

### `seed-data/16-cq-exam-packages.seed.ts`
Seeds:
- 2-5 CQExamPackage records
- 4-15 CQExamSet records
- 12-60 CQExamSetQuestion records
- 3-10 CQExamSubmission records
- 12-50 CQExamAnswer records
- 5-20 CQExamAnswerImage records
- 2-8 CQExamPackagePurchase records
- 1-5 CQExamRetakeRequest records

### `seed-data/17-bundles.seed.ts`
Seeds 3-8 ContentBundle records with BundleItem links to existing content.

### `seed-data/18-packages.seed.ts`
Seeds:
- 3-5 ContentPackage (মাসিক, ৬ মাসিক, বার্ষিক)
- 3-10 UserSubscription for demo students

### `seed-data/19-homepage.seed.ts`
Seeds:
- 3-5 Banner with realistic images, titles, CTAs
- 5-10 FAQ in Bengali
- 3-8 Testimonial from "students"
- 3-8 Notice (exam schedules, holiday notices)
- 5-15 FeaturedContent for homepage sections

### `seed-data/20-courses.seed.ts`
Seeds full course pipeline:
- 3-8 Course records
- 12-40 CourseLesson records
- LessonNotes, LessonResources, LessonSchedules
- LessonAssignments + AssignmentSubmissions
- CourseEnrollments + CoursePurchases
- Certificates for completed courses

### `seed-data/21-blog-posts.seed.ts`
Seeds:
- 10-30 BlogPost with rich HTML content, featured images, SEO metadata
- BlogPostTag junction records
- BlogRelatedPost links
- Mix of DRAFT/PUBLISHED status
- Author links to admin users
- Reading time calculation

### `seed-data/22-payments.seed.ts`
Seeds:
- 5-15 Payment records with various statuses
- MCQExamPackagePurchase records
- CQExamPackagePurchase records

### `seed-data/23-activity.seed.ts`
Seeds user interaction data:
- 30-100 Progress records
- 10-30 Bookmark records
- 10-30 Note records
- 15-50 RecentlyViewed records
- 3-8 UserFeedback with FeedbackMessage threads

### `seed-data/24-notifications.seed.ts`
Seeds 10-30 Notification records:
- Welcome messages for new users
- Exam result notifications
- Payment confirmation notifications
- System announcements

### `seed-data/25-analytics.seed.ts`
Seeds:
- 20-100 AnalyticsEvent (page views, exam starts, purchases)
- 10-30 AnalyticsSession
- 10-30 AnalyticsSearchQuery
- 3-5 AnalyticsAlert (threshold alerts)
- 3-5 AnalyticsReport (scheduled reports)

### `seed-data/26-workflow.seed.ts`
Seeds:
- 3-10 ContentWorkflow records (DRAFT→PUBLISHED paths)
- 6-20 WorkflowHistory (transition records)
- 3-10 WorkflowComment (review discussions)

### `seed-data/27-audit.seed.ts`
Seeds:
- 5-15 AuditLog (sample admin actions with SHA-256 hashes)
- 5-15 ContentVersion (sample content snapshots)

### `seed-data/28-contacts.seed.ts`
Seeds 3-8 ContactMessage records (mix of read/unread).
