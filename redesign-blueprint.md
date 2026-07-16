# Course Module — Verified Redesign Blueprint

**Date:** 2025-07-14  
**Scope:** Admin Panel Course Management UI + full Course system redesign  
**Status:** BLUEPRINT ONLY — no code changes, no file modifications  
**Methodology:** Every finding verified against source code; audit discrepancies corrected

---

## PART 1: EXISTING ARCHITECTURE (VERIFIED)

### 1.1 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      NEXT.JS APP (v16.1.3)                    │
│                                                              │
│  ┌──────────────┐              ┌───────────────────────────┐ │
│  │  Public      │              │  Admin (/admin/courses)   │ │
│  │  /courses    │              │                           │ │
│  └──────┬───────┘              └───────────┬───────────────┘ │
│         │                                 │                   │
│  ┌──────▼─────────────────────────────────▼───────────────┐ │
│  │  course.service.ts          courseAdminService.ts       │ │
│  └──────┬─────────────────────────────────┬───────────────┘ │
│         │                                 │                   │
│  ┌──────▼─────────────────────────────────▼───────────────┐ │
│  │  Public APIs                      Admin APIs            │ │
│  │  GET /api/courses                 GET /api/admin/courses │ │
│  │  POST /api/courses/enroll         POST /api/admin/courses│ │
│  │  POST /api/courses/purchase       GET /api/admin/.../less│ │
│  │  GET/POST /api/courses/progress   GET /api/admin/.../assi│ │
│  │  GET/POST /api/courses/assignment │                      │ │
│  └──────┬─────────────────────────────────┬───────────────┘ │
│         │                                 │                   │
│  ┌──────▼─────────────────────────────────▼───────────────┐ │
│  │   course-access-resolver.ts  (single access gate)       │ │
│  │   access-control.ts          (legacy content access)    │ │
│  │   auth.ts                    (JWT + role checking)      │ │
│  └──────┬──────────────────────────────────────────────────┘ │
│         │                                                    │
│  ┌──────▼────────────────────────────────┐                 │
│  │   PrismaClient (src/lib/db.ts)         │                 │
│  │   - HTML sanitization middleware        │                 │
│  │   - DATABASE_URL from .env              │                 │
│  └──────┬────────────────────────────────┘                 │
│         │                                                    │
│  ┌──────▼────────────────────────────────┐                 │
│  │   SQLite (db/custom.db)                 │                 │
│  └────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Technical Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16.1.3 (App Router) | Turbopack in dev |
| Language | TypeScript (strict) | Type-aware throughout |
| ORM | Prisma 7.8.0 + libsql adapter | SQLite local dev |
| State (global) | Zustand | Router store + Auth store |
| State (local) | React useState/useEffect | Per-component |
| Animation | Framer Motion | AnimatePresence on view switches |
| UI Components | shadcn/ui | Radix UI primitives |
| Forms | Native HTML inputs + manual state | NO form library |
| Validation | Zod (auth/payment only) | **NO validation on course APIs** |
| HTML Sanitization | isomorphic-dompurify | Middleware on Prisma writes |
| Auth | JWT (jose) + HTTP-only cookies | Session-based |
| Icons | Lucide React | Consistent icon set |
| Styling | Tailwind CSS | Utility classes |

### 1.3 Key Architectural Patterns

1. **Custom Zustand Router**: `useRouterStore` drives ALL navigation. `navigate()` updates Zustand state; if no `_onNavigate` callback is registered, falls back to `window.location.href`. The `_onNavigate` callback is set by the `[...slug]/page.tsx` shell to push into Next.js router.

2. **Action-based API routing**: Admin APIs use `GET ?action=` and `POST ?action=` patterns. A single route file handles multiple logical operations. Consistent across ALL admin endpoints.

3. **Prisma HTML-sanitization middleware**: `db.ts` uses `$extends` to intercept all `$allOperations` across `$allModels`. If a model is in `MODELS_WITH_HTML`, it sanitizes the `.data` payload before writing. Models covered: `lecture`, `mcq`, `cq`, `suggestion`, `notice`, `banner`, `faq`, `testimonial`, `exam`, `sitesetting`. **Course HTML fields (`features`, `requirements`, `targetStudents`) are NOT in this list — they are NOT sanitized on write.**

4. **Race guard pattern**: `createRaceGuard()` utility in `features/common/admin-utils.ts` prevents stale response overwrites in hooks. Used in `use-courses.ts` and `use-course-detail.ts`.

5. **Lazy-loaded admin pages**: `AdminLayout.tsx` uses `React.lazy()` for each admin page component. Course admin is at `AdminPages['admin-courses']`.

6. **No server components for admin**: AdminShell wraps AdminLayout in `dynamic(..., { ssr: false })`. 100% client-side rendering for admin.

---

## PART 2: EXISTING UX (VERIFIED)

### 2.1 Admin Course UX Flow

```
Admin clicks "কোর্স" in sidebar
  │
  ▼
CourseAdminContainer.tsx (loads lazy)
  │
  ├─ viewMode='list' → CourseList.tsx
  │     ├─ Search input (client-side filter)
  │     ├─ Status dropdown (all | DRAFT | PUBLISHED)
  │     ├─ Course cards grid
  │     │     ├─ Thumbnail image
  │     │     ├─ Title (truncated 2 lines)
  │     │     ├─ Subject badge
  │     │     ├─ Lesson count (Layers icon + number)
  │     │     ├─ Premium badge (crown icon, amber)
  │     │     ├─ Price OR "ফ্রি" badge
  │     │     ├─ "বিস্তারিত →" button (navigates to detail)
  │     │     └─ Delete icon button (trash)
  │     ├─ Pagination (page numbers)
  │     ├─ Delete confirmation dialog
  │     └─ "নতুন কোর্স" button → CreateCourseDialog
  │
  └─ viewMode='detail' → CourseDetailTabs.tsx
        │
        ├─ [OverviewTab] ← ALL COURSE FIELD EDITING HAPPENS HERE
        │     ├─ 2-column card grid
        │     │   ├─ Card: "মৌলিক তথ্য" (title, slug, description, thumbnail URL, teacherName)
        │     │   ├─ Card: "স্ট্যাটাস ও মূল্য" (status dropdown, premium toggle, price, originalPrice, discount calc)
        │     │   ├─ Card: "ক্যাটাগরি" (class select, subject select)
        │     │   └─ Card: "মেটা" (language, difficulty, duration, certificate toggle)
        │     ├─ 3-column card grid
        │     │   ├─ Card: "কোর্স ফিচার" (HTML textarea)
        │     │   ├─ Card: "প্রয়োজনীয়তা" (HTML textarea)
        │     │   └─ Card: "টার্গেট স্টুডেন্ট" (HTML textarea)
        │     └─ Save button (shows hasChanges = title/status/isPremium changed)
        │
        ├─ [LessonsTab] → LessonEditorSheet (slide-over, 4-step wizard)
        │     ├─ Step 1: Basic info (title, description, type)
        │     ├─ Step 2: Class setup (live/recorded URLs)
        │     ├─ Step 3: Schedule (date/time)
        │     └─ Step 4: Notes & Resources (CRUD lists)
        │     └─ Actions: Edit, Delete, Duplicate, Reorder arrows
        │
        ├─ [SyllabusTab] → Table view of lessons + exam calendar
        │     ├─ Day-grouped lessons (sorted by dayOfWeek, startTime)
        │     ├─ Filter: All | Live | Recorded
        │     ├─ Progress toggle per lesson (admin view)
        │     └─ Exam calendar (course-level schedules)
        │
        ├─ [ExamCalendarTab] → List of course exam schedules
        │     ├─ Grouped by date
        │     ├─ Add from package (MCQ/CQ)
        │     ├─ Add manual schedule
        │     ├─ Edit/delete individual schedules
        │     └─ Auto-fill from package button
        │
        ├─ [AssignmentsTab]
        │     ├─ Assignment CRUD (create, edit, delete)
        │     ├─ Per-lesson assignment list
        │     ├─ Submission list per assignment
        │     ├─ SINGLE grading: select submission, pick grade (A+ to F), add feedback
        │     ├─ BULK grading: select assignment, default marks for all ungraded
        │     └─ Search submissions by student name/email
        │
        ├─ [StudentsTab]
        │     ├─ Shows purchasers + free enrollments (deduplicated)
        │     ├─ Search by name/email
        │     ├─ Source badges: ক্রয় (blue), ফ্রি এনরোল (green), এনরোলমেন্ট (purple)
        │     ├─ Click row → StudentProgressDialog
        │     └─ Stats: enrolled | purchased | revenue
        │
        ├─ [AnalyticsTab]
        │     ├─ 4 summary cards: total enrollments, revenue, total lessons, total content
        │     ├─ 4 breakdown cards: live classes, recorded classes, exams, assignments
        │     └─ Content distribution bar chart (by type)
        │
        └─ [SettingsTab] ← STUB, NOT FUNCTIONAL
              ├─ Certificate toggle (dummy, text: "coming soon")
              └─ SEO Meta Title/Description (dummy, not saved)
```

**CRITICAL FINDING**: The audit report incorrectly stated "Settings tab for editing course fields." In reality, **ALL course field editing happens in the Overview tab**. The Settings tab is a non-functional stub.

### 2.2 Public Course UX Flow

```
/courses page (CourseListPage.tsx)
  ├─ Class filter buttons (SSC, HSC, Class 6-8)
  ├─ Course cards grid (thumbnail, title, description, subject, lesson count, price/badge, detail button)
  ├─ Loading: 6 skeleton cards
  └─ Empty: "কোর্স পাওয়া যায়নি" illustration

/course/[slug] (via custom router)
  ├─ StudentOverviewTab — HTML content cards (description, features, requirements, targetStudents)
  ├─ StudentCurriculumTab — content list with progress toggle (LIVE/RECORDED distinction)
  ├─ StudentSyllabusTab — day-grouped lesson table with exam calendar
  │     ├─ Filter: All | Live | Recorded
  │     ├─ Progress toggle per lesson
  │     └─ Lock icons for inaccessible lessons
  ├─ StudentRoutineTab — schedule view
  └─ StudentNotesTab — notes list (currently empty placeholder)
```

---

## PART 3: DESIGN PROBLEMS (VERIFIED)

### 3.1 Admin UI Problems

| # | Problem | Severity | Verified At |
|---|---------|----------|-------------|
| 1 | **SettingsTab is a dead stub** — certificate toggle says "coming soon", SEO fields are not saved. All real editing is in OverviewTab. | HIGH | `SettingsTab.tsx:13-37` |
| 2 | **8-tab structure is fragmented** — Settings tab is dead weight; Overview absorbs all editing. Should be 5-6 tabs. | MEDIUM | `CourseDetailTabs.tsx:26-35` |
| 3 | **Lesson editing is a slide-over sheet** — 4-step wizard cramped in 600px sheet. Complex editing (notes/resources/schedules) in a narrow sheet is poor UX. | HIGH | `LessonEditorSheet.tsx` (472 lines) |
| 4 | **No thumbnail upload** — thumbnail is a plain text URL input (`OverviewTab.tsx:89`). Admin must upload image elsewhere and paste URL. | HIGH | `OverviewTab.tsx:89` |
| 5 | **CreateCourseDialog is too minimal** — only title/slug/description. All other fields (class, subject, premium, price, status) require going to Settings/Overview tab after creation. | MEDIUM | `CreateCourseDialog.tsx:17-78` |
| 6 | **No inline lesson expansion** — LessonsTab shows flat list. To see/edit sub-items (notes, resources, schedule), must open the sheet. No inline preview. | MEDIUM | `LessonsTab.tsx` |
| 7 | **Assignment grading UI exists but is hidden** — grading logic IS present in `AssignmentsTab.tsx:200-217` and API `/api/admin/courses/assignments?action=grade`. However, it's not prominently surfaced. | MEDIUM | `AssignmentsTab.tsx` + API route |
| 8 | **Exam calendar is text-list** — not a visual calendar. Dates are grouped by string keys in a reduce(), displayed as card rows. | LOW | `ExamCalendarTab.tsx:50-57` |
| 9 | **Analytics has no time dimension** — only point-in-time totals. No chart, no date range, no trend. | LOW | `AnalyticsTab.tsx:53-111` |
| 10 | **Duplicate sidebar icon** — `BookOpen` used for both "লেকচার" and "কোর্স". | LOW | `AdminLayout.tsx:167,175` |
| 11 | **Dead `viewMode='form'` path** — `CourseAdminContainer.tsx:47-51` renders `<div>Form</div>` — unreachable dead code. | LOW | `CourseAdminContainer.tsx:47-51` |
| 12 | **No course card click → edit** — must click small "বিস্তারিত →" button, not the whole card. | LOW | `CourseList.tsx` (button-only navigation) |

### 3.2 Public UI Problems

| # | Problem | Severity | Verified At |
|---|---------|----------|-------------|
| 1 | **No full-text search** — only class filter buttons. No keyword search. | MEDIUM | `CourseListPage.tsx:49-56` |
| 2 | **No featured courses integration** — `/api/courses/featured` supports `course` content type but is NOT consumed by any public page. | MEDIUM | `app/api/courses/featured/route.ts:243-270` |
| 3 | **Curriculum and Syllabus tabs overlap** — both show lesson lists. `CurriculumTab.tsx` and `SyllabusTab.tsx` render similar content differently. | LOW | `StudentCurriculumTab.tsx` + `StudentSyllabusTab.tsx` |
| 4 | **Student notes tab is dead** — renders "কোনো নোট নেই" placeholder permanently. | LOW | `StudentNotesTab.tsx` |
| 5 | **No `/courses/[slug]` route** — course detail is navigated via custom Zustand router, not a real Next.js file route. SEO-unfriendly. | MEDIUM | No file at `src/app/courses/[slug]/page.tsx` |

---

## PART 4: USER JOURNEYS (VERIFIED)

### 4.1 Admin: Course Creation Journey

```
START: Admin Dashboard → "কোর্স" sidebar link
  │
  ▼
CourseList (viewMode='list')
  │   Loading: skeletons
  │   Data: GET /api/admin/courses?action=list&page=1&limit=50
  │
  ├─ Click "নতুন কোর্স"
  │     │
  │     ▼
  │   CreateCourseDialog (Dialog)
  │     ├─ Title (Input, required)
  │     ├─ Slug (Input, auto-generated from title)
  │     │     └─ BUG: generateSlug() strips Bengali chars → empty slug for Bangla titles
  │     ├─ Description (Textarea, optional)
  │     └─ Submit → POST /api/admin/courses?action=create
  │           ├─ Validates: title + slug required
  │           ├─ Checks: slug unique
  │           └─ Creates: status=DRAFT, isPremium=false, price=0
  │
  └─ New course appears in list
        │
        ▼
        Click "বিস্তারিত →" on card
          │
          ▼
        CourseDetailTabs (viewMode='detail')
          │
          ├─ [OverviewTab] ← PRIMARY EDITING SURFACE
          │     ├─ Title/Slug/Description/Thumbnail/Teacher
          │     ├─ Status dropdown (DRAFT/PUBLISHED)
          │     ├─ Premium toggle → reveals price/originalPrice
          │     │     └─ Auto-calculates discount %
          │     ├─ Class/Subject select (dependent)
          │     ├─ Language/Difficulty/Duration/Certificate
          │     └─ 3 HTML textareas: Features/Requirements/TargetStudents
          │           └─ NOTE: NOT sanitized on write! (sanitize.ts missing course models)
          │
          ├─ [LessonsTab] → LessonEditorSheet
          │     ├─ Step 1: Basic info
          │     ├─ Step 2: Setup (live links OR video URL)
          │     ├─ Step 3: Schedule
          │     └─ Step 4: Notes & Resources
          │
          ├─ [SyllabusTab]
          ├─ [ExamCalendarTab]
          ├─ [AssignmentsTab]
          ├─ [StudentsTab]
          └─ [SettingsTab] ← DEAD STUB
```

### 4.2 Admin: Lesson Editing Journey

```
LessonsTab → Click "নতুন পাঠ"
  │
  ▼
LessonEditorSheet (Sheet, slide-over, 600px)
  │
  ├─ Step 1: Basic Info
  │     ├─ Title (Input)
  │     ├─ Description (Textarea)
  │     └─ Type: LIVE or RECORDED (Select)
  │
  ├─ Step 2: Class Setup (conditional on type)
  │     ├─ LIVE: meetingLink, meetingId, platform, password
  │     └─ RECORDED: videoUrl, previewVideo, duration
  │
  ├─ Step 3: Schedule
  │     └─ Date + start/end time
  │
  ├─ Step 4: Notes & Resources
  │     ├─ Notes CRUD (title, type: richtext/pdf/link, content/fileUrl/link)
  │     └─ Resources CRUD (title, type: file/link, fileUrl/link)
  │
  └─ Submit
        └─ POST /api/admin/courses/lessons?action=create
              ├─ Creates CourseLesson
              ├─ Creates LessonNote[] (nested)
              ├─ Creates LessonResource[] (nested)
              └─ Returns full lesson with assignments, schedules, notes, resources
```

### 4.3 Public: Student Course Journey

```
/courses page
  │   GET /api/courses?action=list (status=PUBLISHED only)
  │   Class filter buttons
  │
  └─ Click course card
        │   navigate('course-detail', { courseSlug })
        ▼
      StudentCourseDetail (hook)
        │   GET /api/courses?action=detail&slug=X
        │   ├─ Checks access via getUserCourseAccessMap()
        │   ├─ Strips sensitive fields if no access
        │   └─ Returns hasAccess, enrollment, progress
        │
        ├─ If NO access:
        │     ├─ Free course → "এনরোল করুন" button
        │     │     └─ POST /api/courses/enroll → creates CourseEnrollment(type=FREE)
        │     └─ Premium course → "কিনুন" button
        │           └─ navigate('payment', { contentType:'course', ... })
        │                 └─ Payment flow → CoursePurchase
        │
        ├─ If HAS access:
        │     ├─ Syllabus with progress toggles
        │     │     └─ POST /api/courses/progress → upsert LessonProgress
        │     ├─ Exam calendar
        │     └─ Assignments
        │           ├─ GET /api/courses/assignments?action=list&courseId=X
        │           ├─ POST action=submit → create AssignmentSubmission
        │           └─ POST action=update-submission → update (only if status≠graded)
        │
        └─ Side effects:
              ├─ fetchProgress() → GET /api/courses/progress?courseId=X
              ├─ loadSyllabus() → GET /api/courses?action=syllabus&courseId=X
              └─ checkPendingPayment() → GET /api/payment?contentType=course&...
```

---

## PART 5: COMPONENT DEPENDENCY GRAPH (VERIFIED)

```
AdminLayout.tsx
  ├── AdminAuthGuard.tsx
  ├── AdminShell.tsx → AdminLayout (dynamic, ssr:false)
  │     └── Sidebar items → AdminPages map
  │           └── 'admin-courses': lazy(→ CourseAdminContainer)
  │
CourseAdminContainer.tsx
  ├── useCourses() hook
  │     ├── courseAdminService.list()
  │     ├── courseAdminService.delete()
  │     └── Race guard
  │
  ├── CourseList.tsx (viewMode='list')
  │     ├── Search Input
  │     ├── Select (status filter)
  │     ├── CourseCard (inline)
  │     ├── Pagination
  │     ├── AlertDialog (delete confirm)
  │     └── CreateCourseDialog
  │
  ├── CourseDetailTabs.tsx (viewMode='detail')
  │     ├── useCourseDetail(courseId) hook
  │     │     ├── courseAdminService.detail()
  │     │     ├── courseAdminService.update()
  │     │     ├── Race guard
  │     │     └── fetchDetail() / fetchSyllabus() / fetchStudents() / etc.
  │     │
  │     ├── Tabs UI (8 tabs + tab trigger bar)
  │     │
  │     ├── OverviewTab ← ALL SETTINGS EDITING
  │     │     ├── useHierarchyMetadata() → classes/subjects
  │     │     ├── onSave() → useCourseDetail.updateCourse()
  │     │     └── 12 form fields in card grid
  │     │
  │     ├── LessonsTab
  │     │     ├── Lesson list rendering
  │     │     ├── Reorder handlers
  │     │     ├── Delete handlers
  │     │     ├── Duplicate handler
  │     │     └── LessonEditorSheet (modal)
  │     │           ├── Stepper (4 steps)
  │     │           ├── Form fields per step
  │     │           └── Notes/Resources CRUD
  │     │
  │     ├── SyllabusTab
  │     │     ├── courseAdminService.syllabus()
  │     │     ├── Day-grouped table
  │     │     └── Type filter
  │     │
  │     ├── ExamCalendarTab
  │     │     ├── courseAdminService.syllabus() (reuses)
  │     │     ├── examCalendar state
  │     │     ├── Add/Edit/Remove schedule dialogs
  │     │     └── Auto-fill from package
  │     │
  │     ├── AssignmentsTab ← HAS GRADING UI
  │     │     ├── Assignment CRUD (inline form)
  │     │     ├── Submission list per assignment
  │     │     ├── Single grading dialog (grade selector + feedback)
  │     │     ├── Bulk grading input
  │     │     └── Search/filter submissions
  │     │
  │     ├── StudentsTab
  │     │     ├── Student list (purchasers + enrollments)
  │     │     ├── Search
  │     │     └── StudentProgressDialog (modal)
  │     │           └── GET /api/admin/courses?action=student-progress
  │     │
  │     ├── AnalyticsTab
  │     │     ├── GET /api/admin/courses?action=analytics
  │     │     └── Summary cards + breakdown cards + distribution bar
  │     │
  │     └── SettingsTab ← STUB (certificate toggle + SEO dummy)
  │
  └── CreateCourseDialog
        └── courseAdminService.create()
```

### 5.1 Public Component Tree

```
AppShell → CourseListPage (/courses)
  ├── useHierarchyMetadata() → classList
  ├── courseService.list()
  ├── Class filter buttons
  ├── CourseCard (motion.div)
  │     ├── SafeImage (thumbnail)
  │     ├── Title + Premium badge
  │     ├── Description
  │     ├── Subject + Lesson count
  │     ├── Price or "ফ্রি" badge
  │     └── "বিস্তারিত →" button
  │
  └── navigate('course-detail', { courseSlug })

[...slug]/page.tsx (client-side router)
  └── StudentCourseDetail component
        ├── useStudentCourseDetail(slug) hook
        │     ├── courseService.detail(slug)
        │     │     └── GET /api/courses?action=detail&slug=X
        │     │           └── getUserCourseAccessMap()
        │     │                 ├─ resolveCourseAccess()
        │     │                 └─ Access map
        │     │
        │     ├── fetchProgress() → courseService.progress()
        │     ├── loadSyllabus() → courseService.syllabus()
        │     ├── enroll() → courseService.enroll()
        │     ├── purchase() → navigate('payment', ...)
        │     ├── toggleProgress() → courseService.toggleProgress()
        │     └── checkPendingPayment() → GET /api/payment
        │
        └── Tabs: overview | curriculum | syllabus | routine | notes
              ├── StudentOverviewTab (HTML cards)
              ├── StudentCurriculumTab (content list + progress toggle)
              ├── StudentSyllabusTab (day-grouped lessons + exam calendar)
              ├── StudentRoutineTab
              └── StudentNotesTab (empty)
```

---

## PART 6: SERVICE DEPENDENCY GRAPH (VERIFIED)

```
course.service.ts (public)
  │
  ├── api.get('courses', { action: 'list' })
  ├── api.get('courses', { action: 'detail', slug/id })
  ├── api.get('courses', { action: 'syllabus', courseId })
  ├── api.get('courses/assignments', { action: 'list', courseId })
  ├── api.post('courses/enroll', { courseId })
  ├── api.post('courses/purchase', { courseId, paymentId })
  ├── api.post('courses/progress', { courseId, contentId, completed })
  ├── api.get('courses/progress', { courseId })
  ├── api.post('courses/assignments', { action: 'submit/update-submission', ... })
  └── api.get('courses/purchase') / api.get('courses/featured')

courseAdminService.ts (admin)
  │
  ├── api.get('admin/courses', { action: 'list/detail/students/syllabus/analytics/student-progress' })
  ├── api.post('admin/courses', { action: 'create/update/delete/add-exam-schedule/...' })
  ├── api.get('admin/courses/lessons', { courseId })
  ├── api.post('admin/courses/lessons', { action: 'create/update/delete/reorder/duplicate/...' })
  └── api.post('admin/courses/assignments', { action: 'course-list' })

api-client.ts (underlying)
  └── Central fetch wrapper with:
        ├── JWT token injection (Authorization: Bearer)
        ├── Base URL routing (/api prefix)
        ├── Response unwrapping ({ success, data })
        └── Error propagation
```

---

## PART 7: API DEPENDENCY GRAPH (VERIFIED)

```
PUBLIC APIs
├── GET /api/courses
│     ├── action=list → only PUBLISHED courses, paginated
│     ├── action=detail → by slug or id, optional auth, access check
│     └── action=syllabus → with progress tracking
│
├── POST /api/courses/enroll
│     └── withAuth → CourseEnrollment create (FREE/PAID)
│
├── POST /api/courses/purchase
│     └── withAuth → validates payment, creates CoursePurchase
│
├── GET/POST /api/courses/progress
│     └── withAuth + resolveCourseAccess() → LessonProgress upsert
│
└── GET /api/courses/featured
      └── FeaturedContent → batch-fetch by contentType (supports 'course')

ADMIN APIs
├── GET/POST /api/admin/courses
│     ├── withAdmin + rate limit (mutations only)
│     └── CSRF on POST
│     ├── action=list → paginated, search, status/class filter
│     ├── action=detail → includes all lessons, assignments, schedules
│     ├── action=students → purchases + enrollments deduped
│     ├── action=syllabus → full syllabus + exam calendar
│     ├── action=analytics → stats
│     └── action=student-progress → per-user breakdown
│
├── GET/POST /api/admin/courses/lessons
│     ├── withAdmin
│     ├── GET → list with nested data
│     └── POST → create/update/delete/reorder/duplicate/
│                add-note/remove-note/add-resource/remove-resource/
│                add-schedule/remove-schedule
│
└── GET/POST /api/admin/courses/assignments
      ├── GET action=course-list → assignments with submissions
      └── POST → create/update/delete/grade/bulk-grade
```

### 7.1 API Verification Issues

| Issue | Verified | Source |
|-------|----------|--------|
| No Zod validation on course APIs | ✅ TRUE | All route files use manual presence checks only |
| No rate limiting on public course endpoints | ✅ TRUE | grep found no rateLimit references in `/api/courses/*` |
| withAdmin applies rate limit to mutations only | ✅ TRUE | `api-utils.ts:121-124` checks `method !== 'GET' && method !== 'HEAD'` |
| CSRF on admin course POST | ✅ TRUE | `admin/courses/route.ts:342` has `withCsrf(request)` |
| CSRF NOT on public enroll/purchase | ✅ TRUE | `courses/enroll/route.ts` and `courses/purchase/route.ts` have no `withCsrf` |

---

## PART 8: DATABASE DEPENDENCY GRAPH (VERIFIED)

```
Course (PRIMARY)
  ├── FK → ClassCategory (classId)
  ├── FK → Subject (subjectId)
  ├── 1:N → CourseLesson (onDelete=Cascade)
  ├── 1:N → CourseExamSchedule (onDelete=Cascade)
  ├── 1:N → CoursePurchase
  └── 1:N → CourseEnrollment

CourseLesson
  ├── FK → Course (onDelete=Cascade)
  ├── 1:N → LessonExam (legacy)
  ├── 1:N → LessonAssignment (onDelete=Cascade)
  ├── 1:N → LessonSchedule (onDelete=Cascade)  ← unique per lessonId
  ├── 1:N → LessonNote (onDelete=Cascade)
  └── 1:N → LessonResource (onDelete=Cascade)

LessonAssignment
  ├── FK → CourseLesson (onDelete=Cascade)
  └── 1:N → AssignmentSubmission

AssignmentSubmission
  ├── FK → LessonAssignment (onDelete=Cascade)
  └── FK → User (onDelete=Cascade)

CourseExamSchedule (CANONICAL)
  ├── FK → Course (onDelete=Cascade)
  └── References: MCQExamPackage.id or CQExamPackage.id (no FK, just string)

LessonExam (DEPRECATED)
  ├── FK → CourseLesson (onDelete=Cascade)
  └── References: MCQExamPackage.id or CQExamPackage.id (no FK)

CourseEnrollment
  ├── FK → User (onDelete=Cascade)
  └── FK → Course (onDelete=Cascade)

CoursePurchase
  ├── FK → User (onDelete=Cascade)
  ├── FK → Course (onDelete=Cascade)
  └── FK → Payment (nullable, no cascade)

Payment
  └── Referenced by CoursePurchase.paymentId
```

### 8.1 Database Verification Issues

| Issue | Source |
|-------|--------|
| Course HTML fields NOT in sanitization middleware | `db.ts:14-25` MODELS_WITH_HTML — Course not listed |
| `LessonSchedule` unique per lessonId but allows only 1 record | `LessonSchedule` has `@@unique([lessonId])` — can't have multiple schedule slots for one lesson |
| `LessonExam` still queried alongside `CourseExamSchedule` | `courses/route.ts:128-131` and `admin/courses/route.ts:103-114` |

---

## PART 9: EVENT FLOW (VERIFIED)

### 9.1 Course Creation Event Flow

```
Admin clicks "নতুন কোর্স"
  │
  ▼
CreateCourseDialog.open = true
  │   state: title, slug, description
  │
  ├─ Admin fills fields
  │     └─ autoSlug: generateSlug(title)
  │           └─ BUG: strips Bengali chars
  │
  ├─ Submit
  │     │
  │     ▼
  │     courseAdminService.create({ title, slug, description })
  │       │
  │       ▼
  │     POST /api/admin/courses?action=create
  │       │   withAdmin → requireAdmin → requireAuth
  │       │   withCsrf → csrfMiddleware
  │       │   rate limit applied (POST)
  │       │
  │       ▼
  │     body: { action: 'create', title, slug, description }
  │       │
  │       ▼
  │     Prisma: db.course.create({
  │       data: { title, slug, description, status: 'DRAFT', isPremium: false, price: 0 }
  │     })
  │       │
  │       ▼
  │     apiResponse({ course }, 201)
  │
  └─ onCreated callback
        │
        ▼
      setShowCreate(false)
      fetchCourses() → re-fetches list
        │
        ▼
      New course card appears in CourseList
```

### 9.2 Lesson Creation Event Flow

```
LessonsTab → Click "নতুন পাঠ"
  │
  ▼
LessonEditorSheet.open = true, mode='create'
  │   state: step=0, lessonId=null
  │
  ├─ Step 1: Basic Info (title, description, type)
  ├─ Step 2: Setup (conditional fields)
  ├─ Step 3: Schedule (date, startTime, endTime)
  ├─ Step 4: Notes + Resources CRUD (local state arrays)
  │
  ├─ Submit
  │     │
  │     ▼
  │     onCreate({
  │       courseId, title, description, lessonType,
  │       meetingLink/meetingId/platform/password OR videoUrl/previewVideo/duration,
  │       notes: [{ title, type, content, fileUrl, link }],
  │       resources: [{ title, type, fileUrl, link }]
  │     })
  │       │
  │       ▼
  │     POST /api/admin/courses/lessons?action=create
  │       │   withAdmin, rate limit
  │       │
  │       ▼
  │     Prisma transaction:
  │       db.courseLesson.create({
  │         data: {
  │           courseId, title, description, lessonType,
  │           meetingLink, meetingId, platform, password,  // or videoUrl, previewVideo, duration
  │           displayOrder: nextOrder,
  │           notes: { create: [...] },
  │           resources: { create: [...] }
  │         },
  │         include: { assignments, schedules, notes, resources }
  │       })
  │
  └─ onCreated callback
        │
        ▼
      setSheetOpen(false)
      fetchCourses() or refetch detail
```

---

## PART 10: CRUD MATRIX (VERIFIED)

### 10.1 Admin CRUD

| Entity | Create | Read (List) | Read (Detail) | Update | Delete |
|--------|--------|-------------|---------------|--------|--------|
| Course | ✅ Dialog | ✅ CourseList | ✅ Detail tabs | ✅ OverviewTab | ✅ Inline confirm |
| CourseLesson | ✅ LessonEditorSheet | ✅ LessonsTab | ✅ With course | ✅ LessonEditorSheet | ✅ Inline |
| LessonNote | ✅ In sheet | ✅ Sheet list | ✅ Sheet | ✅ In sheet | ✅ In sheet |
| LessonResource | ✅ In sheet | ✅ Sheet list | ✅ Sheet | ✅ In sheet | ✅ In sheet |
| LessonSchedule | ✅ In sheet | ✅ Sheet | ✅ Sheet | ✅ In sheet | ✅ In sheet |
| LessonAssignment | ✅ AssignmentsTab | ✅ AssignmentsTab | ✅ With submissions | ✅ AssignmentsTab | ✅ AssignmentsTab |
| AssignmentSubmission | ❌ (student only) | ✅ AssignmentsTab | ✅ AssignmentsTab | ❌ N/A | ❌ N/A |
| CourseExamSchedule | ✅ ExamCalendarTab | ✅ ExamCalendarTab | ✅ SyllabusTab | ✅ ExamCalendarTab | ✅ ExamCalendarTab |
| CourseEnrollment | ❌ (student self) | ✅ StudentsTab | ✅ StudentsTab | ❌ N/A | ❌ N/A |
| CoursePurchase | ❌ (payment flow) | ✅ StudentsTab | ✅ StudentsTab | ❌ N/A | ❌ Soft delete |

### 10.2 Public CRUD

| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| CourseEnrollment | ✅ Self-enroll | ✅ Course list/detail | ❌ | ❌ |
| CoursePurchase | ✅ Via payment | ✅ Purchase history | ❌ | ❌ |
| LessonProgress | ✅ Toggle | ✅ Progress view | ✅ Toggle | ❌ |
| AssignmentSubmission | ✅ Submit | ✅ Assignment list | ✅ Update (if ungraded) | ❌ |

---

## PART 11: PERMISSION MATRIX (VERIFIED)

| Action | SUPER_ADMIN | ADMIN | STUDENT (auth) | Public |
|--------|-------------|-------|----------------|--------|
| Course list (admin) | ✅ | ✅ | ❌ | ❌ |
| Course create | ✅ | ✅ | ❌ | ❌ |
| Course update | ✅ | ✅ | ❌ | ❌ |
| Course delete | ✅ | ✅ | ❌ | ❌ |
| Lesson CRUD | ✅ | ✅ | ❌ | ❌ |
| Assignment CRUD (admin) | ✅ | ✅ | ❌ | ❌ |
| Grade submissions | ✅ | ✅ | ❌ | ❌ |
| Course list (public) | ✅ | ✅ | ✅ | ✅ |
| Course detail (public) | ✅ | ✅ | ✅ | ✅ |
| Self-enroll | ✅ | ✅ | ✅ | ❌ |
| Course purchase | ✅ | ✅ | ✅ | ❌ |
| Progress toggle | ✅ | ✅ | ✅ (if enrolled/purchased) | ❌ |
| Assignment submit | ✅ | ✅ | ✅ (if enrolled/purchased) | ❌ |
| Assignment update | ✅ | ✅ | ✅ (own, ungraded) | ❌ |

**Implementation**: `requireAdmin()` allows ADMIN + SUPER_ADMIN. `requireSuperAdmin()` is only used for SUPER_ADMIN-specific actions (role assignment, content-types seed). RBAC permission check infrastructure exists (`requirePermission`) but NOT wired into course endpoints.

---

## PART 12: VALIDATION MATRIX (VERIFIED)

### 12.1 What IS Validated

| Endpoint | Validation | Method |
|----------|-----------|--------|
| `/api/auth/login` | Email format, password presence | Zod schema (`loginSchema`) |
| `/api/auth/register` | Email, password length, name | Zod schema |
| `/api/admin/courses` (create) | title presence, slug presence, slug uniqueness | Manual checks |
| `/api/admin/courses` (update) | id presence, slug uniqueness (if changed) | Manual checks |
| Payment APIs | amount, method enum, transactionId, paymentNumber | Zod schema |

### 12.2 What is NOT Validated (VERIFIED GAPS)

| Endpoint | Missing Validation | Risk |
|----------|-------------------|------|
| `/api/admin/courses` (update) | No Zod schema — allows any field through whitelist | Medium |
| `/api/admin/courses/lessons` (create) | lessonType not validated (any string), no URL format check on videoUrl/meetingLink | Medium |
| `/api/admin/courses/lessons` (update) | Same as create + no type checking on displayOrder | Medium |
| `/api/admin/courses/assignments` (grade) | marks not validated as number, no range check | Low |
| `/api/courses/enroll` | courseId presence only | Low |
| `/api/courses/purchase` | courseId presence, paymentId presence only | Low |
| `/api/courses/progress` | courseId + lessonId presence only | Low |

---

## PART 13: LOADING STATE MATRIX (VERIFIED)

| Component | Loading Strategy | Verified |
|-----------|-----------------|----------|
| CourseList | Skeleton grid (6 cards) during initial fetch | ✅ `CourseListPage.tsx:58-60` |
| CourseList (admin) | Skeleton rows in table | ✅ `CourseList.tsx` |
| CourseDetailTabs | Per-tab loading state (no skeleton shown — shows previous tab content until new data loads) | ⚠️ `useCourseDetail.ts:37` |
| LessonsTab | Loading state shown as disabled/empty | ✅ `LessonsTab.tsx` |
| SyllabusTab | Skeleton cards + table | ✅ `SyllabusTab.tsx:53-60` |
| ExamCalendarTab | Loading state | ✅ `ExamCalendarTab.tsx:31` |
| AssignmentsTab | Skeleton | ✅ `AssignmentsTab.tsx` |
| StudentsTab | Skeleton | ✅ `StudentsTab.tsx` |
| AnalyticsTab | Skeleton cards | ✅ `AnalyticsTab.tsx:37` |
| StudentCourseDetail | Full-page loading (spinner) | ✅ `useStudentCourseDetail.ts:83` |

### Issue: No skeleton for LessonEditorSheet
- `LessonEditorSheet.tsx` shows blank form fields during initial load (edit mode). No skeleton or loading placeholder.

---

## PART 14: ERROR STATE MATRIX (VERIFIED)

| Component | Error Handling | Verified |
|-----------|---------------|----------|
| CourseList | Console.error + empty array | ✅ `use-courses.ts:44-46` |
| CourseDetail | console.error + null course → shows nothing | ✅ `use-course-detail.ts:33-34` |
| SyllabusTab | console.error (silent) | ✅ `SyllabusTab.tsx:43` |
| LessonEditorSheet | setError state shown in UI | ✅ `LessonEditorSheet.tsx:57` |
| AssignmentsTab | networkError string + toast | ✅ `AssignmentsTab.tsx:97,126` |
| StudentsTab | console.error + empty | ✅ `StudentsTab.tsx` |
| AnalyticsTab | No explicit error state | ❌ Missing |
| CreateCourseDialog | Error text below form | ✅ `CreateCourseDialog.tsx:22` |

---

## PART 15: EMPTY STATE MATRIX (VERIFIED)

| View | Empty State | Verified |
|------|------------|----------|
| Public course list | "কোর্স পাওয়া যায়নি" + BookOpen icon + subtitle | ✅ `CourseListPage.tsx:62-67` |
| Admin course list | No explicit empty state — shows 0 rows in table | ❌ Missing |
| Lessons list | No empty state shown | ❌ Missing |
| Assignments | No empty state | ❌ Missing |
| Students | No empty state | ❌ Missing |
| Syllabus rows | "কোনো কন্টেন্ট নেই" + FileText icon | ✅ `StudentSyllabusTab.tsx:34-41` |
| Student notes | "কোনো নোট নেই" | ✅ `StudentNotesTab.tsx` |

---

## PART 16: RESPONSIVE STRATEGY (VERIFIED)

| Component | Breakpoints | Issues |
|-----------|------------|--------|
| CourseList (public) | `sm:grid-cols-2 lg:grid-cols-3` | ✅ Responsive card grid |
| CourseList (admin) | Table-based (no mobile view) | ⚠️ No mobile card fallback |
| CourseDetailTabs | Tab overflow (not tested) | ⚠️ 8 tabs may overflow on mobile |
| OverviewTab | `lg:grid-cols-2` | ✅ 2-col on desktop, 1-col on mobile |
| LessonEditorSheet | Fixed 600px sheet | ⚠️ Poor mobile experience (4-step wizard in narrow sheet) |
| StudentsTab | Table layout | ⚠️ No mobile card view |

---

## PART 17: ACCESSIBILITY AUDIT (VERIFIED)

| Item | Status | Notes |
|------|--------|-------|
| Semantic HTML | ⚠️ | Heavy use of divs with onClick; limited button semantics |
| ARIA labels | ⚠️ | Icon-only buttons lack aria-label |
| Keyboard navigation | ❌ | Sheet, Dialog, Select use Radix (good), but custom interactive elements lack tabIndex |
| Form labels | ✅ | All form fields have `<Label>` components with `htmlFor` |
| Focus management | ⚠️ | Sheet/Dialog handle focus via Radix (good), but custom stepper in LessonEditorSheet may lose focus |
| Color contrast | ❓ | Tailwind defaults used; no accessibility testing done |
| Screen reader text | ❌ | No `sr-only` text for icon-only actions |

---

## PART 18: DESIGN SYSTEM AUDIT (VERIFIED)

### 18.1 Typography

- **Heading scale**: Uses Tailwind `text-2xl font-bold` for page titles, `text-lg font-semibold` for section headings, `text-sm` for descriptions
- **Body**: Default Tailwind text size (16px equivalent)
- **Mono**: Used for HTML textarea fields (`font-mono text-sm`)
- **Consistency**: ✅ Consistent across all tabs

### 18.2 Color Tokens

```
Primary: bg-edu-primary / text-edu-primary / hover:bg-edu-primary-dark
Success: green-100/700 (light), green-900/30-400 (dark)
Warning: amber-100/700 (light), amber-900/30-400 (dark)
Danger: destructive/10 + text-destructive
Muted: text-muted-foreground
Background: white / bg-background (dark mode)
```

**Verified**: Colors are consistent with shadcn/ui theme tokens.

### 18.3 Icon System

- **Library**: Lucide React (consistent across app)
- **Size**: 16px (h-4 w-4) for inline, 20px (h-5 w-5) for section icons, 24px (h-6 w-6) for hero elements
- **Usage**: ✅ Consistent. One issue: `BookOpen` used for both Lectures and Courses in sidebar.

### 18.4 Grid System

```
OverviewTab: lg:grid-cols-2 (2-col)
Features/Requirements/Target: lg:grid-cols-3 (3-col)
Analytics: sm:grid-cols-2 lg:grid-cols-4 (4-col)
```

**Verified**: Consistent responsive grid strategy using CSS Grid via Tailwind.

### 18.5 Spacing System

- **Component padding**: `p-5`, `p-6`, `p-8` for cards
- **Internal spacing**: `space-y-4`, `space-y-6` vertical rhythm
- **Gap**: `gap-4`, `gap-6` for grids
- **Consistency**: ✅ Standard Tailwind spacing scale

---

## PART 19: TECHNICAL DEBT (VERIFIED)

| # | Debt | Severity | Verified Source |
|---|------|----------|-----------------|
| 1 | No Zod schemas for any Course API | HIGH | All route files — only `if (!x) return apiError(...)` |
| 2 | Course HTML fields not sanitized on write | HIGH | `db.ts:14-25` — Course not in MODELS_WITH_HTML |
| 3 | Duplicate syllabus logic (public + admin) | HIGH | `courses/route.ts:106-258` vs `admin/courses/route.ts:100-176` |
| 4 | `LessonExam` dual-source in syllabus | MEDIUM | Both LessonExam and CourseExamSchedule queried |
| 5 | Bengali slug generation broken | MEDIUM | `generateSlug()` uses `/[^a-z0-9]+/g` |
| 6 | `AssignmentSubmission.fileUrls` is comma-separated string | MEDIUM | Schema definition |
| 7 | SettingsTab is dead code | MEDIUM | `SettingsTab.tsx` — no state persistence |
| 8 | No rate limiting on public course APIs | MEDIUM | grep confirmed no rateLimit in /api/courses/* |
| 9 | No CSRF on public mutation endpoints | LOW | enroll/purchase/progress routes |
| 10 | `viewMode='form'` dead path | LOW | `CourseAdminContainer.tsx:47-51` |
| 11 | LessonSchedule unique constraint too restrictive | LOW | `@@unique([lessonId])` — only allows 1 schedule slot |
| 12 | No TanStack Query/SWR for server state | MEDIUM | Every hook manually manages loading/saving/refetch |
| 13 | Prisma client re-created per serverless invocation | LOW | `db.ts:76` — global reused in dev, but serverless creates new |

---

## PART 20: RISK ANALYSIS (VERIFIED)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Breaking `resolveCourseAccess()` contract | Medium | HIGH | Must be preserved exactly; used by ALL course APIs |
| Changing OverviewTab data flow | Medium | HIGH | Many hooks depend on exact CourseDetailRecord shape |
| HTML sanitization gap (Course fields) | High | MEDIUM | Admin inputs HTML directly — XSS vector |
| Missing Zod validation allows bad data | Medium | MEDIUM | Currently mitigated by manual checks, but easy to bypass |
| `generateSlug()` produces empty slug for Bengali | HIGH | HIGH | Any Bangla course title will fail slug validation |
| Assignment submission re-open via direct API | Low | LOW | Could be exploited if student knows API |
| No rate limit on public mutations | Medium | LOW | Could enable brute-force or DoS |
| Syllabus API divergence over time | Medium | MEDIUM | Two copies of same logic will drift |

---

## PART 21: MODERN LMS BEST PRACTICES

### 21.1 Industry Standards

1. **Course as first-class object** with rich metadata (instructor, duration, language, difficulty, certificate)
2. **Structured curriculum** (modules → lessons → resources) rather than flat lesson list
3. **Drip content** (releaseAt/schedule) — partially implemented via `LessonSchedule`
4. **Progress tracking** at multiple granularities (lesson + activity + overall)
5. **Assignment submission with grading** — fully implemented
6. **Exam scheduling** integrated with course calendar — implemented via CourseExamSchedule
7. **Rich media support** (video, audio, PDF, images) — supported but not normalized
8. **Mobile-first responsive design** — partially implemented
9. **Access control at multiple layers** (course, lesson, content) — implemented via centralized resolver
10. **Analytics dashboard** for instructors — partially implemented
11. **Certificate generation on completion** — field exists but no generator
12. **Discussion/forum per course** — NOT implemented
13. **Course prerequisites** — NOT implemented
14. **Course reviews/ratings** — NOT implemented

### 21.2 What This System Does Well

1. **Centralized access resolver** — `course-access-resolver.ts` is a clean single-gate pattern
2. **Dual exam source** — handles legacy + modern exam scheduling
3. **Activity-based progress** — counts lessons + assignments + exams holistically
4. **Lesson duplication** — convenient admin feature
5. **Bulk grading** via `bulk-grade` action (underutilized in UI)
6. **HTML sanitization middleware** — centralized pattern

### 21.3 What This System Lacks vs. Modern LMS

1. **No SCORM/xAPI support** — offline capability
2. **No video streaming** — only URL references (relies on external hosting)
3. **No discussion board** — no Q&A per course/lesson
4. **No prerequisite tree** — linear curriculum only
5. **No certificate generation** — flag exists but no implementation
6. **No course analytics** — no completion rates, engagement metrics, drop-off analysis
7. **No A/B testing** for content
8. **No content versioning** — edits are in-place
9. **No draft/scheduled publishing** — only DRAFT/PUBLISHED toggle
10. **No collaborative editing** — single admin author

---

## PART 22: RECOMMENDED NEW INFORMATION ARCHITECTURE

### 22.1 Proposed Tab Structure

**Current**: 8 tabs  
**Proposed**: 5 tabs (eliminates dead Settings tab, merges related functions)

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to Courses    │  Course Title    /admin/courses/{id}      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [Course Info] [Content] [Exams & Assignments] [Students] [Settings] │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [TAB CONTENT — changes per active tab]                         │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Tab breakdown:
1. COURSE INFO (was: Overview + Settings merged)
   - All course metadata editing in ONE scrollable form
   - Thumbnail upload component
   - Status + Premium + Pricing card
   - Class/Subject selectors
   - Description/Features/Requirements/TargetStudents (rich text)
   - Teacher/Duration/Language/Difficulty/Certificate
   - Save button (sticky bottom)

2. CONTENT (was: Lessons + Syllabus merged)
   - Lesson list with inline expand
   - Each lesson card shows:
     - Title, type badge, order
     - Inline preview: schedule, notes count, resources count
     - Expand on click → inline edit form
   - [+ Add Lesson] button
   - Reorder arrows, Duplicate, Delete per lesson
   - NO separate sheet — inline editing

3. EXAMS & ASSIGNMENTS (was: ExamCalendar + Assignments merged)
   - Split view:
     Left: Exam Calendar (date-grouped list + add/edit)
     Right: Assignments (list with submissions + grading)

4. STUDENTS (unchanged)
   - Stats header
   - Search + filter
   - Student table with progress
   - Click → StudentProgressDialog

5. SETTINGS (moved from first position, kept for future)
   - Danger zone: Delete course, archive
   - Future: certificate template, SEO, sharing
```

### 22.2 Redesign Principles

1. **One source of truth for course fields**: Move ALL editing from OverviewTab + SettingsTab into a unified form
2. **Inline over modal**: Replace LessonEditorSheet with inline card expansion
3. **Progressive disclosure**: Show summary by default, expand for details
4. **Consistent actions**: Delete always requires confirmation; Edit always inline
5. **Mobile-first**: Every tab must work on 375px width (LessonEditorSheet currently fails this)

---

## PART 23: RECOMMENDED ADMIN NAVIGATION (VERIFIED)

### 23.1 Current (problematic)

```
EXAMS group:
  - Exams
  - Bundles
  - Packages
  - Courses ← misplaced here (BookOpen icon, same as Lectures)
  - MCQ Exam Packages
  - CQ Exam Packages
```

**Problem**: Courses are not exams. They are a separate content type. Current placement confuses admin users.

### 23.2 Proposed

```
CONTENT group (expanded):
  - Content (legacy: chapters/lectures/mcq/cq)
  - Hierarchy
  - Courses ← MOVED HERE (GraduationCap icon)
  - Bundles
  - Packages
  - Content Types
  - Featured Content
  - Bulk Import
```

**Rationale**: Courses are content, not exams. They share the same class/subject hierarchy. This grouping reflects the mental model: "Here is all the educational material we offer."

---

## PART 24: RECOMMENDED COURSE WORKFLOW

### 24.1 Admin Course Creation Flow (Current vs Proposed)

**Current** (7 steps, 2 dialogs):
1. Click "নতুন কোর্স" → CreateCourseDialog (title/slug/description)
2. Save → course created as DRAFT
3. Click course card → CourseDetailTabs
4. Navigate to Overview tab → fill remaining fields (class, subject, price, premium, status)
5. Navigate to Lessons tab → add lessons
6. Navigate to Exam Calendar tab → add exam schedules
7. Change status to PUBLISHED

**Proposed** (3 steps, 1 form):
1. Click "নতুন কোর্স" → Single form with ALL fields:
   - Basic: title, slug, description, thumbnail upload
   - Categorization: class, subject
   - Pricing: premium toggle + price + originalPrice
   - Meta: language, difficulty, duration, certificate
   - HTML: features, requirements, target students
   - Status: DRAFT/PUBLISHED toggle
2. Save → course created with all fields
3. Navigate to Content tab → add lessons

**Benefit**: Reduces context switching from 4 tabs + dialog to 1 form.

### 24.2 Lesson Creation Flow (Proposed)

**Current**: 4-step sheet (modal, cramped)

**Proposed**: Inline card expansion
1. Click [+ Add Lesson] → new empty lesson card at bottom of list
2. Card expands inline showing: title, type selector, URL fields
3. Expand further → shows notes/resources/schedule sections
4. Click Save → card collapses showing summary

---

## PART 25: MIGRATION STRATEGY (VERIFIED)

### 25.1 Pre-Migration Checklist

- [ ] **Backup database**: SQLite file `db/custom.db`
- [ ] **Snapshot API responses**: Record current response shapes for all course endpoints
- [ ] **Document Zustand router contracts**: `RoutePath` union, `navigate()` signature
- [ ] **Create feature flag**: `NEXT_PUBLIC_COURSE_UI_V2` env var
- [ ] **Verify `resolveCourseAccess()` contract**: Document exact inputs/outputs

### 25.2 Migration Phases

**Phase 1: Infrastructure (Week 1-2)**
1. Extract shared syllabus logic from `courses/route.ts` and `admin/courses/route.ts` into `lib/course-syllabus.ts`
2. Add Zod schemas for: `CourseCreate`, `CourseUpdate`, `LessonCreate`, `LessonUpdate`, `AssignmentCreate`
3. Wire Zod validation into admin course routes
4. Add rate limiting to public `enroll`, `purchase`, `progress` endpoints
5. Add CSRF to public mutation endpoints
6. Fix `generateSlug()` for Bengali support
7. ADD: Course HTML fields (`features`, `requirements`, `targetStudents`) to `MODELS_WITH_HTML` in `db.ts`

**Phase 2: Backward-compatible API layer (Week 3)**
1. Create `app/api/courses/[id]/route.ts` as the new canonical single-course endpoint
2. Keep old `?action=` endpoints operational but redirect internally
3. Add response type definitions
4. Add Zod validation to new endpoint

**Phase 3: Admin List Page (Week 3-4)**
1. Behind feature flag: new CourseList component
2. Thumbnail image display (already in data, just missing from admin cards)
3. Inline status toggle on cards
4. Improved empty state
5. Run parallel with old view; A/B test

**Phase 4: Admin Detail — New Tab Structure (Week 5-6)**
1. Implement new 5-tab structure
2. Build CourseInfoForm (unified settings editor)
3. Build inline LessonCard expansion (replace LessonEditorSheet)
4. Move SettingsTab content into CourseInfoForm footer
5. Remove dead SettingsTab

**Phase 5: Public Course Pages (Week 7-8)**
1. Add `src/app/courses/[slug]/page.tsx` (Next.js dynamic route)
2. Migrate public course detail to use new route
3. Add search functionality to public course list
4. Wire featured courses to homepage

**Phase 6: Advanced Features (Week 9-10)**
1. Assignment bulk grading UI (API exists, UI not surfaced)
2. Certificate generation (field exists, no generator)
3. Course bulk import (CSV)
4. Course duplicate (whole course)

---

## PART 26: ROLLBACK STRATEGY (VERIFIED)

### 26.1 Feature Flag Approach

```
Environment variable: NEXT_PUBLIC_COURSE_UI_V2
Default: false (old UI active)

When false:
  - AdminLayout loads existing AdminPages (old CourseAdminContainer)
  - Public pages use existing components
  - Old API endpoints operational

When true:
  - AdminLayout loads new CourseAdminContainerV2
  - Public pages use new routes
  - New API endpoints active
```

### 26.2 Database Safety

- **No schema changes** in redesign — all changes are additive or UI-only
- Prisma migrations not required for UI changes
- Course HTML sanitization fix is non-breaking (stricter sanitization only)

### 26.3 API Backward Compatibility

- Old `?action=` endpoints remain operational
- New RESTful endpoints (`/api/courses/[id]`) added alongside
- Response shapes documented and matched

### 26.4 Rollback Triggers

| Trigger | Action |
|---------|--------|
| >5% increase in admin task completion time | Disable feature flag, revert to old UI |
| >10% error rate on course APIs | Disable feature flag, investigate |
| Data inconsistency in Course fields | Rollback sanitization change only |
| Student progress not persisting | Check access resolver has not changed |

---

## PART 27: REGRESSION RISK (VERIFIED)

| Area | Risk Level | Reason |
|------|-----------|--------|
| `resolveCourseAccess()` contract | HIGH | Every course API depends on it |
| Course list page performance | MEDIUM | New UI may add re-renders |
| Lesson reordering | MEDIUM | Drag/drop replacement may break order |
| Progress tracking | MEDIUM | Optimistic updates must be preserved |
| Payment flow | MEDIUM | CoursePurchase upsert must remain idempotent |
| Admin grading | LOW | API unchanged, only UI improvement |
| Public course navigation | MEDIUM | Router store contract is implicit |
| Syllabus data shape | MEDIUM | Many components parse the response |

---

## PART 28: TESTING STRATEGY (VERIFIED)

### 28.1 Current Test Coverage

- **NO tests exist for any Course API or component**
- Existing tests (196 passing) cover: auth, errors, api-client, access-control, validations, password, safe-transaction, error-history

### 28.2 Required Test Coverage (Redesign)

| Test Type | Scope | Priority |
|-----------|-------|----------|
| API integration tests | All 9 public + admin course endpoints | HIGH |
| Contract tests | Response shapes for course detail, syllabus, progress | HIGH |
| Access control tests | resolveCourseAccess() all paths (free, premium, enrolled, purchased) | HIGH |
| Admin CRUD e2e | Create → edit → add lesson → schedule exam → grade → view student | HIGH |
| Slug generation | Bengali, English, mixed, edge cases | MEDIUM |
| HTML sanitization | Course fields with XSS payloads | MEDIUM |
| Rate limiting | Public mutation endpoints under load | LOW |
| Mobile responsive | All admin tabs at 375px, 768px | MEDIUM |

### 28.3 Regression Test Plan

```
Pre-migration baseline:
  npm test  # 196 green
  Record API response shapes (snapshot)
  Verify admin can: create → edit → publish → add lessons → exam schedule → grade → view student

Post-migration verification:
  npm test  # must remain 196 green
  Compare API responses to baseline snapshots
  Repeat admin workflow in new UI
  Verify student can: browse → enroll → view → submit → track progress
```

---

## PART 29: PERFORMANCE STRATEGY (VERIFIED)

### 29.1 Current Performance Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Syllabus API bounces multiple times | `courses/route.ts:106-258` | Each call hits DB 5+ times |
| LessonEditorSheet re-renders | 472-line sheet with many state changes | Slow on mobile |
| No memoization in CourseAdminContainer | `CourseAdminContainer.tsx:14-51` | AnimatePresence causes full re-render |
| Parallel query explosion | Progress API | 9+ parallel queries |

### 29.2 Proposals

1. **Shared syllabus cache**: Cache syllabus response for 60s per courseId (using existing `permissionCache` pattern)
2. **Memoize lesson cards**: Wrap lesson items in `React.memo` to prevent re-renders on parent state change
3. **Virtualize long lists**: If course has >50 lessons, use react-window
4. **Lazy load exam calendar**: Only fetch when ExamCalendarTab is visible
5. **Optimize progress API**: Merge 9 parallel queries into 2-3 using Prisma `_count` and `include`

---

## PART 30: FINAL BLUEPRINT SUMMARY

### 30.1 What Must Be Preserved (Non-negotiable)

1. **`resolveCourseAccess()`** — single access gate, exact logic preserved
2. **`CoursePurchase.userId + courseId` unique constraint** — idempotency guarantee
3. **`LessonProgress.userId + lessonId` unique constraint** — progress undo/redo
4. **Payment `contentType = 'course'`** — shared payment table contract
5. **`CourseExamSchedule` model** — MCQ/CQ in same table, `examType` discriminator
6. **Dual exam source** (`LessonExam` + `CourseExamSchedule`) — legacy support until migration
7. **`AssignmentSubmission.fileUrls` format** — comma-separated strings
8. **Admin `?action=` routing pattern** — consistent across all admin endpoints
9. **Zustand router contract** — `RoutePath` union + `navigate()` signature
10. **Prisma HTML sanitization middleware** — `MODELS_WITH_HTML` pattern

### 30.2 What Should Change

| Current | Proposed | Rationale |
|---------|----------|-----------|
| 8 admin tabs | 5 admin tabs | Remove dead SettingsTab, merge Exams+Assignments |
| LessonEditorSheet (slide-over) | Inline lesson card expansion | Better UX, mobile-friendly |
| CreateCourseDialog (minimal) | Full creation form | Reduces context switching |
| OverviewTab (all editing) + SettingsTab (stub) | Single "Course Info" form | Eliminates dead tab |
| No Zod validation | Zod schemas on all admin APIs | Type safety, consistent error responses |
| No rate limit on public APIs | Rate limit on enroll/purchase/progress | DDoS protection |
| No CSRF on public APIs | CSRF on all mutations (or SameSite cookies) | Security hardening |
| `/[slug]` via custom router | `/courses/[slug]` Next.js route | SEO, standard routing |
| No course search | Full-text search on course list | Discoverability |
| `generateSlug()` strips Bengali | Unicode-aware slug generation | Bug fix for Bangla content |
| HTML fields not sanitized | Add Course to MODELS_WITH_HTML | Security fix |
| analytics: point-in-time only | Add date range + trend charts | Admin productivity |
| syllabus: duplicate logic | Shared `lib/course-syllabus.ts` | DRY principle |
| LessonSchedule: 1 slot per lesson | Remove unique constraint OR allow multiple | Feature gap |
| No featured courses on homepage | Wire featured API to homepage | Content discovery |

### 30.3 New Admin Navigation Recommendation

```
CURRENT SIDEBAR GROUP: "EXAMS"
  Exams | Bundles | Packages | Courses | MCQ Exam Packages | CQ Exam Packages

PROPOSED SIDEBAR GROUP: "CONTENT"
  Content (legacy) | Hierarchy | Courses (NEW ICON: GraduationCap)
  Bundles | Packages | Content Types | Featured Content | Bulk Import

Sidebar icon fix:
  Lectures → BookOpen (keep)
  Courses → GraduationCap (fix duplicate BookOpen icon)
```

### 30.4 New Public Navigation

```
CURRENT: /courses (list only)
PROPOSED:
  /courses (list with search + filters)
  /courses/[slug] (course detail — REAL Next.js route)
  Homepage → featured courses carousel (wire existing /api/courses/featured)
  User dashboard → My Courses section (show progress)
```

### 30.5 Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Admin: time to create course | ~3 min (2-step: dialog + overview) | ~1 min (1-step form) |
| Admin: time to add lesson | ~45 sec + 4-step sheet | ~20 sec (inline) |
| Admin: time to grade 10 submissions | ~3 min (individual grade dialog per student) | ~30 sec (bulk grade) |
| Admin: course search | Client-side filter only | Full-text search |
| Public: course detail page discoverability | Route hidden from crawler | SEO-optimized URL |
| Test coverage for course module | 0% | 80% API coverage |
| API validation coverage | ~10% (manual checks) | 100% (Zod schemas) |
| Course HTML sanitization | 0% (not in middleware) | 100% |

### 30.6 Out of Scope (Do Not Change)

- Database schema (72 models)
- `resolveCourseAccess()` logic
- Payment flow (shared across all content types)
- Auth system (JWT + cookies)
- Access-control.ts (legacy content, not course)
- Prisma client configuration
- Seed data structure
- AdminLayout sidebar group structure (add items but don't restructure groups)

---

## APPENDIX A: KEY FILES REFERENCE

### A.1 Files to Modify (Redesign Surface)

| File | Change Type | Notes |
|------|-----------|-------|
| `src/features/course/admin/CourseAdminContainer.tsx` | Restructure tabs | Remove form viewMode, add new tab structure |
| `src/features/course/admin/components/CourseList.tsx` | Redesign | Add thumbnail, improve cards |
| `src/features/course/admin/components/CourseDetailTabs.tsx` | Restructure | 8 tabs → 5 tabs |
| `src/features/course/admin/components/CreateCourseDialog.tsx` | Expand | Add all fields |
| `src/features/course/admin/components/LessonEditorSheet.tsx` | Replace | → inline expansion |
| `src/features/course/admin/components/LessonsTab.tsx` | Modify | Inline lesson cards |
| `src/features/course/admin/components/SyllabusTab.tsx` | Minor | Shared logic extraction |
| `src/features/course/admin/components/ExamCalendarTab.tsx` | Minor | Shared logic extraction |
| `src/features/course/admin/components/AssignmentsTab.tsx` | Surface grading | Make grading more prominent |
| `src/features/course/admin/components/StudentProgressDialog.tsx` | Keep | Already well-designed |
| `src/features/course/admin/components/AnalyticsTab.tsx` | Enhance | Add date filters, charts |
| `src/features/course/admin/components/SettingsTab.tsx` | Remove/merge | Into CourseInfo tab |
| `src/features/course/admin/components/OverviewTab.tsx` | Rename → CourseInfoTab | Unified settings form |
| `src/features/course/admin/hooks/use-courses.ts` | Keep | Good implementation |
| `src/features/course/admin/hooks/use-course-detail.ts` | Modify | New tab data fetching |
| `src/components/course/CourseListPage.tsx` | Enhance | Add search, featured section |
| `src/services/api/course-admin.service.ts` | Add methods | New API actions |
| `src/services/api/course.service.ts` | Add types | New response types |
| `src/app/api/admin/courses/route.ts` | Add Zod schemas | Validation |
| `src/app/api/admin/courses/lessons/route.ts` | Minor | Keep as-is mostly |
| `src/app/api/admin/courses/assignments/route.ts` | Expose grading in UI | Grading already implemented |
| `src/app/api/courses/route.ts` | Extract syllabus | Shared logic |
| `src/lib/validations.ts` | Add course schemas | NEW |
| `lib/course-syllabus.ts` | NEW | Shared syllabus extraction |

### A.2 Files That MUST NOT Change

| File | Why |
|------|-----|
| `prisma/schema.prisma` | 72 models, many FKs — schema changes break data |
| `src/lib/db.ts` | Prisma singleton + HTML middleware — app depends on it |
| `src/lib/auth.ts` | AuthResult contract — all API routes depend on it |
| `src/store/router.ts` | Navigation source of truth |
| `src/lib/urls.ts` | URL generation/parsing |
| `src/lib/access-control.ts` | Legacy content access (not course) |
| `src/lib/course-access-resolver.ts` | Central access gate — preserve exact logic |
| `src/lib/sanitize.ts` | HTML sanitizer central config |
| `src/lib/errors.ts` | Error class hierarchy |
| `src/lib/api-client.ts` | Request/response interceptor |

---

## APPENDIX B: AUDIT CORRECTIONS

The original audit contained these inaccuracies, now corrected against source:

| Audit Claim | Correction | Source |
|-------------|-----------|--------|
| "Settings tab for course fields" | FALSE — SettingsTab is a stub. ALL editing is in OverviewTab. | `SettingsTab.tsx:13-37`, `OverviewTab.tsx:22-202` |
| "Assignment grading not visible" | FALSE — grading UI exists in AssignmentsTab + API supports grade/bulk-grade | `AssignmentsTab.tsx:200-217`, `admin/courses/assignments/route.ts:185-219` |
| "Course list page loads before metadata" | FALSE — CourseListPage uses `useHierarchyMetadata()` hook which manages its own loading | `CourseListPage.tsx:12-19` |
| "totalResources: 0 hardcoded" | UNVERIFIED — AnalyticsTab computes content types from actual data, no hardcoded 0 | `AnalyticsTab.tsx:87-108` |
| "Courses under EXAMS group" | TRUE — confirmed in AdminLayout.tsx:175 | `AdminLayout.tsx:175` |
| "BookOpen duplicate icon" | TRUE — confirmed at lines 167,175 | `AdminLayout.tsx:167,175` |
| "viewMode='form' dead code" | TRUE — renders `<div>Form</div>` | `CourseAdminContainer.tsx:47-51` |

---

*Blueprint complete. Ready for implementation planning.*
