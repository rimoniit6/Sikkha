# Course Feature — Complete Architecture Audit

**Date:** 2025-07-14  
**Scope:** Admin Panel Course Management UI + full Course system  
**Project:** Sikkhs (শিক্ষা বাংলা)  
**Status:** READ‑ONLY — no files modified

---

## 1. Executive Summary

The Course feature is a **Learning Management System (LMS) module** added as a new domain alongside the existing Chapter/Lecture/MCQ/CQ content system. It provides:

- **Paid and free courses** purchased individually (not tied to subscriptions)
- **Structured curriculum**: Courses → Lessons (LIVE or RECORDED)
- **Lesson sub-features**: Assignments, Notes, Resources, Exams, Schedule slots
- **Course-level exam calendar** (independent of lessons) linking to MCQ/CQ exam packages
- **Enrollment & purchase tracking** with access control via a central resolver
- **Lesson progress tracking** (per-lesson completion)
- **Student-facing views**: Overview, Syllabus, Routine, Notes tabs
- **Admin-facing views**: 8-tab detail view (Overview, Lessons, Syllabus, Exam Calendar, Assignments, Students, Analytics, Settings)

The Course feature lives in `src/features/course/` as a **self-contained feature block** (admin + student portions), keeping it isolated from older content systems. The database schema at `prisma/schema.prisma` has **72 total models** with 14 new Course-specific models.

---

## 2. Folder Structure

```
prisma/
  schema.prisma                   # 72 models including Course system (lines 1191-1457)

src/
  services/api/
    course.service.ts             # Student/public-facing API client
    course-admin.service.ts       # Admin API client

  lib/
    course-access-resolver.ts     # Central access decision logic
    access-control.ts             # Content-level access control
    db.ts                         # Prisma client (fixed to use DATABASE_URL)
    auth.ts                       # Role-based auth (SUPER_ADMIN, ADMIN, STUDENT)
    validations.ts                # Zod schemas (used for auth/payment, NOT for courses)

  features/course/
    types.ts                      # Shared TypeScript interfaces

    admin/
      CourseAdminContainer.tsx    # Root admin page component
      hooks/
        use-courses.ts            # List/delete viewMode hook
        use-course-detail.ts      # Detail view tab hook with race guard
      components/
        CourseList.tsx            # Admin course list table
        CourseDetailTabs.tsx      # Tabbed detail layout
        CreateCourseDialog.tsx    # Simple title/slug/description creation dialog
        LessonEditorSheet.tsx     # Lesson editing sheet
        LessonsTab.tsx            # Lesson list with CRUD
        SyllabusTab.tsx           # Admin syllabus view
        ExamCalendarTab.tsx       # Admin exam calendar
        AssignmentsTab.tsx        # Assignment CRUD
        StudentsTab.tsx           # Student listing + enrollment
        AnalyticsTab.tsx          # Course stats overview
        SettingsTab.tsx           # Course settings (status, price, etc.)
        StudentProgressDialog.tsx # Per-student progress detail

    student/
      hooks/
        use-student-course-detail.ts  # Student-facing course data hook
      components/
        StudentOverviewTab.tsx        # HTML-rendered course description
        StudentSyllabusTab.tsx        # Lesson list with progress toggle
        StudentRoutineTab.tsx         # Schedule/routine view
        StudentNotesTab.tsx           # Course notes list/viewer

  app/api/
    courses/
      route.ts                    # Public/list/detail/syllabus/listAssignments
      enroll/route.ts             # POST self-enrollment (free vs paid)
      purchase/route.ts           # POST purchase + GET purchases
      progress/route.ts           # GET/POST lesson progress
      assignments/route.ts        # GET list, POST submit, POST update
      featured/route.ts           # GET featured courses
      syllabus/sync/route.ts      # POST sync syllabus

    admin/courses/
      route.ts                    # Admin: list/detail/students/syllabus/analytics/CUD
      lessons/route.ts            # Admin: lesson CRUD + reorder + duplicate + notes/resources/schedules
      assignments/route.ts        # Admin: assignment/submission management

  components/course/
    CourseListPage.tsx            # Public student-facing course list page

  app/
    courses/page.tsx              # Public course listing route
    admin/courses/page.tsx        # Admin page (just throws to <AdminShell />)
```

---

## 3. Architecture Diagram (text)

```
┌─────────────────────────────────────────────────┐
│                   NEXT.JS APP                    │
│  (Client-side routing via Zustand useRouterStore)│
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────┐  ┌───────────────────────────┐  │
│  │  Public   │  │        Admin              │  │
│  │  /courses │  │     /admin/courses        │  │
│  └─────┬─────┘  └──────────┬────────────────┘  │
│        │                  │                     │
│  ┌─────▼──────────────────▼─────────────────┐  │
│  │      course.service.ts                    │  │
│  │      courseAdminService.ts                │  │
│  └─────┬──────────────────────┬──────────────┘  │
│        │                      │                  │
│  ┌─────▼──────────────────────▼──────────────┐  │
│  │  GET /api/courses                          │  │
│  │  POST /api/courses/enroll                   │  │
│  │  POST /api/courses/purchase                 │  │
│  │  GET/POST /api/courses/progress             │  │
│  │  GET/POST /api/courses/assignments           │  │
│  │  GET /api/courses/featured                  │  │
│  │  GET /api/courses/:id/syllabus              │  │
│  │  POST /api/courses/syllabus/sync            │  │
│  └─────────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────────┐  │
│  │  GET/POST /api/admin/courses                 │  │
│  │  GET/POST /api/admin/courses/lessons         │  │
│  │  GET/POST /api/admin/courses/assignments     │  │
│  └─────────────────────────────────────────────┘  │
│                        │                        │
│  ┌─────────────────────▼─────────────────────┐  │
│  │     course-access-resolver.ts              │  │
│  │     access-control.ts                      │  │
│  │     auth.ts                                │  │
│  └─────────────────────┬─────────────────────┘  │
│                        │                        │
│  ┌─────────────────────▼─────────────────────┐  │
│  │              PrismaClient                   │  │
│  │         (src/lib/db.ts)                    │  │
│  └─────────────────────┬─────────────────────┘  │
│                        │                        │
│  ┌─────────────────────▼─────────────────────┐  │
│  │               SQLite (custom.db)            │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 4. Course Feature Inventory

### 4.1 Database Tables (Course-specific)

| Model | Purpose | Status |
|-------|---------|--------|
| `Course` | Main course entity (title, slug, thumbnail, price, status, classId, subjectId) | ✅ Implemented |
| `CourseLesson` | Lessons within a course (type: LIVE/RECORDED, video URLs, order) | ✅ Implemented |
| `LessonNote` | Notes attached to a lesson (richtext, PDF, link) | ✅ Implemented |
| `LessonResource` | Resources attached to a lesson (file, link) | ✅ Implemented |
| `CourseExamSchedule` | Course-level exam calendar (MCQ/CQ, dates, times) | ✅ Implemented |
| `LessonExam` | Legacy lesson-level exam reference (deprecated, kept for backward compat) | ✅ Legacy |
| `LessonAssignment` | Assignments on a lesson | ✅ Implemented |
| `AssignmentSubmission` | Student assignment submissions | ✅ Implemented |
| `LessonSchedule` | Scheduled date/time for a live lesson | ✅ Implemented |
| `LessonProgress` | Per-user per-lesson completion tracking | ✅ Implemented |
| `CourseEnrollment` | User enrollment in a course (FREE/PAID/GRANTED, status ACTIVE/COMPLETED/CANCELLED) | ✅ Implemented |
| `CoursePurchase` | Purchase record linking user+course+payment | ✅ Implemented |

### 4.2 Public-facing Features

| Feature | Entry Page | Component | API | Database |
|---------|-----------|-----------|-----|---------|
| Course Listing | `/courses` | `CourseListPage.tsx` | `GET /api/courses?action=list` | `Course` table + `ClassCategory`/`Subject` |
| Course Detail | Navigated via router | StudentOverviewTab + StudentSyllabusTab + StudentRoutineTab + StudentNotesTab | `GET /api/courses?action=detail&slug=...` | `Course`, `CourseLesson`, `LessonSchedule` |
| Course Syllabus | Inside detail page | `StudentSyllabusTab.tsx` | `GET /api/courses?action=syllabus&courseId=...` | `CourseLesson`, `CourseExamSchedule`, `LessonExam` |
| Course Progress Toggle | Inside syllabus | Progress toggle buttons | `POST /api/courses/progress` | `LessonProgress` |
| Enrollment (free courses) | Inside detail page | `handleEnroll()` in student hook | `POST /api/courses/enroll` | `CourseEnrollment` |
| Purchase (premium courses) | Payment flow | Navigate to `/payment` | `POST /api/courses/purchase` | `CoursePurchase`, `Payment` |
| Assignment Submission | Inside detail page | Assignment card | `GET/POST /api/courses/assignments` | `LessonAssignment`, `AssignmentSubmission` |
| Featured Courses | Not publicly visible yet | — | `GET /api/courses/featured` | `FeaturedContent` |
| Purchase History | User dashboard | — | `GET /api/courses/purchase` | `CoursePurchase` |

### 4.3 Admin-facing Features

| Feature | Entry Page | Component | API | Database |
|---------|-----------|-----------|-----|---------|
| Course List | Admin → Courses | `CourseList.tsx` | `GET /api/admin/courses?action=list` | `Course` |
| Create Course | Dialog from list | `CreateCourseDialog.tsx` | `POST /api/admin/courses?action=create` | `Course` |
| Update Course Settings | Settings tab | `SettingsTab.tsx` | `POST /api/admin/courses?action=update` | `Course` fields |
| Delete Course | From list | (inline in CourseList) | `POST /api/admin/courses?action=delete` | Cascade delete |
| Lesson CRUD | Lessons tab | `LessonsTab.tsx`, `LessonEditorSheet.tsx` | `GET/POST /api/admin/courses/lessons` | `CourseLesson`, `LessonNote`, `LessonResource`, `LessonSchedule` |
| Reorder Lessons | Drag handle | `LessonsTab.tsx` | `POST /api/admin/courses/lessons?action=reorder` | `CourseLesson.displayOrder` |
| Duplicate Lesson | Context action | `LessonsTab.tsx` | `POST /api/admin/courses/lessons?action=duplicate` | `CourseLesson` + children |
| Syllabus View | Syllabus tab | `SyllabusTab.tsx` | `GET /api/admin/courses?action=syllabus` | `CourseLesson`, `CourseExamSchedule`, `LessonExam` |
| Exam Schedule CRUD | Exam Calendar tab | `ExamCalendarTab.tsx` | Multiple actions on `POST /api/admin/courses` | `CourseExamSchedule` |
| Auto-fill Exam Schedules | Exam Calendar tab | `ExamCalendarTab.tsx` | `POST /api/admin/courses?action=add-exam-schedules-from-package` | `CourseExamSchedule`, `MCQExamSet`, `CQExamSet` |
| Assignments | Assignments tab | `AssignmentsTab.tsx` | Multiple actions on `POST /api/admin/courses/lessons` | `LessonAssignment`, `AssignmentSubmission` |
| Student List | Students tab | `StudentsTab.tsx` | `GET /api/admin/courses?action=students` | `CoursePurchase`, `CourseEnrollment` |
| Individual Student Progress | Students tab → dialog | `StudentProgressDialog.tsx` | `GET /api/admin/courses?action=student-progress` | `LessonProgress`, `CourseEnrollment`, `AssignmentSubmission`, `MCQExamSetResult`, `CQExamSubmission` |
| Course Analytics | Analytics tab | `AnalyticsTab.tsx` | `GET /api/admin/courses?action=analytics` | `CoursePurchase`, `CourseEnrollment`, `CourseLesson` |
| Public Syllabus Sync | Scheduled sync | `/api/courses/syllabus/sync` | `POST /api/courses/syllabus/sync` | `CourseLesson`, `CourseExamSchedule` |

### 4.4 Permissions

| Action | Required Role | Implementation |
|--------|--------------|----------------|
| Admin course list/create/update/delete | `ADMIN` or `SUPER_ADMIN` | `withAdmin(request)` in route handler |
| Lesson CRUD | `ADMIN` or `SUPER_ADMIN` | `withAdmin(request)` |
| Create/update suggestions (not course) | `ADMIN` or `SUPER_ADMIN` | `withAdmin(request)` |
| Update payment records | `ADMIN` or `SUPER_ADMIN` | `withAdmin(request)` |
| SUPER_ADMIN role assignment | `SUPER_ADMIN` only | Checked in POST body |
| Public course list | Anyone (no auth) | `withAuth` not used |
| Public course detail | Optional auth | `withAuth` attempted, userId optional |
| Self-enrollment | Authenticated user | `withAuth(request)` |
| Course purchase | Authenticated user | `withAuth(request)` + payment verification |
| Progress update | Authenticated + has access | `withAuth(request)` + `resolveCourseAccess()` |
| Assignment submission | Authenticated + has access | `withAuth(request)` |
| Admin exam results listing | `ADMIN` or `SUPER_ADMIN` | `requireAdmin(request)` |

---

## 5. User Flow Diagrams

### 5.1 Admin: Course Creation Flow

```
Admin Dashboard
  → Navigate to "কোর্স" sidebar link
  → CourseList.tsx renders
    → Click "নতুন কোর্স" button
      → CreateCourseDialog.tsx opens
        → Admin enters: Title, Slug, Description
        → POST /api/admin/courses?action=create
          → Prisma: db.course.create()
          → Course created with status=DRAFT
        → Dialog closes, course appears in list
```

### 5.2 Admin: Course Editing Flow (One Course)

```
CourseList → Click course card
  → viewMode changes to 'detail'
    → CourseDetailTabs opens (8 tabs)
```

### 5.3 Admin: Course Editing — Lessons Tab Flow

```
LessonsTab (fetches via courseAdminService.listLessons)
  → Displays lesson list with: title, type badge, actions
  → "নতুন পাঠ" opens LessonEditorSheet.tsx (slide-over)
    → Admin fills: Title, Description, Type (LIVE/RECORDED)
    → LIVE fields: meetingLink, meetingId, platform, password
    → RECORDED fields: videoUrl, previewVideo, duration
    → Within sheet: Secondary panels/sections
      - Sabbuls (Notes): CRUD list + add form
      - Resources: CRUD list + add form
      - Schedule: Add date/time slots
    → Submit: POST lesson data + notes/resources in single nested Prisma create
  → Actions per lesson: Edit, Delete, Duplicate, Reorder arrows
```

### 5.4 Admin: Exam Calendar Flow

```
ExamCalendarTab fetches admin course syllabus
  → Shows dual sources: LessonExam (legacy) + CourseExamSchedule (new)
  → "এক্সাম শিডিউল যোগ" action:
    1. Select package (MCQExamPackage or CQExamPackage)
    2. Enter date, start time, end time
    3. POST add-exam-schedule
  → "প্যাকেজ থেকে শিডিউল" action:
    1. Select MCQ/CQ package
    2. POST add-exam-schedules-from-package
       → Reads all MCQExamSet or CQExamSet in package
       → Creates one CourseExamSchedule per set
```

### 5.5 Public: Course Browse & Enrollment Flow

```
/courses page (CourseListPage.tsx)
  → Fetches: GET /api/courses?action=list (only status=PUBLISHED)
  → Class filter buttons
  → Course cards with: thumbnail, title, teacher, price, lesson count

Course Detail (StudentOverviewTab via useStudentCourseDetail)
  → GET /api/courses?action=detail&slug=:slug
  → Backend: checks access via getUserCourseAccessMap()
    - Strips video URLs, meeting links if no access
    - Returns hasAccess, enrollment, progress
  → Frontend renders:
    ↓
    If NO access:
      → "এনরোল করুন" button (free) or "কিনুন" button (premium → navigates to /payment)
      → Syllabus shows locked state
    If HAS access:
      → Syllabus shows full content
      → Progress toggle buttons enabled
      → Exam calendar shows
```

### 5.5 Public: Assignment Submission Flow

```
Student sees assignments in CourseAssignments (fetched via courseService)
  → GET /api/courses/assignments?action=list&courseId=X
  → For each assignment: shows submission status
    → Submit: POST action=submit (creates AssignmentSubmission)
    → Update: POST action=update-submission (only if not graded)
```

### 5.6 Admin: Student Progress Detail Flow

```
StudentsTab → shows purchasers + enrollments (deduplicated)
  → Click student row → StudentProgressDialog.tsx
    → GET /api/admin/courses?action=student-progress&courseId=X&userId=Y
    → Returns:
      - User info
      - Enrollment status/type
      - Per-lesson progress map
      - Overall percentage
      - Breakdown by category (lessons, assignments, MCQ exams, CQ exams)
```

---

## 6. Database Structure

### 6.1 Course-Specific Models

**Course** (`schema.prisma` lines 1193-1241)
```
fields: id, title, slug(unique), description, thumbnail,
        isPremium(Boolean, false), price(Float, 0), originalPrice(Float, 0),
        status(String, "DRAFT"), teacherName,
        features(HTML?), requirements(HTML?), targetStudents(HTML?),
        hasCertificate(Boolean, false), duration(Int?), language(?), difficulty(?),
        classId(FK), subjectId(FK),
        createdAt, updatedAt
indexes: [status], [classId, subjectId]
relations: classCategory(ClassCategory), subject(Subject), lessons(CourseLesson[]),
           examSchedules(CourseExamSchedule[]), purchases(CoursePurchase[]),
           enrollments(CourseEnrollment[])
```

**CourseLesson** (lines 1245-1278)
```
fields: id, courseId(FK, onDelete=Cascade), title, description(?),
        lessonType(String: LIVE | RECORDED),
        [LIVE]: meetingLink, meetingId, platform, password
        [RECORDED]: videoUrl, previewVideo, duration(Int)
        displayOrder(Int, 0), createdAt, updatedAt
indexes: [courseId, displayOrder]
relations: exams(LessonExam[]), assignments(LessonAssignment[]),
           schedules(LessonSchedule[]), notes(LessonNote[]),
           resources(LessonResource[])
```

**LessonNote** (lines 1280-1294)
```
fields: id, lessonId(FK, onDelete=Cascade), title, type(String: richtext|pdf|link),
        content(?), fileUrl(?), link(?), displayOrder(Int, 0)
indexes: [lessonId, displayOrder]
```

**LessonResource** (lines 1296-1309) — similar structure

**CourseExamSchedule** (lines 1313-1330) — Course-level exam calendar
```
fields: id, courseId(FK, onDelete=Cascade),
        examType(String: MCQ | CQ), packageId(String),
        examDate(DateTime), startTime(String), endTime(String),
        autoFilledFromPackage(Boolean, false), overrideAllowed(Boolean, true),
        createdAt, updatedAt
indexes: [courseId], [courseId, examDate], [examType, packageId]
```

**LessonExam** (lines 1334-1346) — DEPRECATED legacy

**LessonAssignment** (lines 1350-1364)
```
fields: id, lessonId(FK, Cascade), title, description(?),
        deadline(DateTime?), attachment(String?), displayOrder(Int, 0)
relations: submissions(AssignmentSubmission[])
```

**AssignmentSubmission** (lines 1367-1387)
```
fields: id, assignmentId(FK, Cascade), userId(FK, Cascade),
        content(String?), fileUrls(String? — comma-separated),
        status(String: submitted | graded), marks(Float?), feedback(String?),
        gradedBy(String?), gradedAt(DateTime?), submittedAt, createdAt, updatedAt
indexes: [assignmentId, userId] (unique), [assignmentId], [userId]
```

**LessonSchedule** (lines 1391-1403)
```
fields: id, lessonId(FK, Cascade), date(DateTime?), startTime(?), endTime(?)
indexes: [lessonId] (unique), [date]
```

**LessonProgress** (lines 1407-1422)
```
fields: id, userId(FK, Cascade), enrollmentId(? FK), lessonId(FK),
        courseId(FK — redundant but used), completed(Boolean, false),
        completedAt(DateTime?), createdAt, updatedAt
indexes: [userId, lessonId] (unique), [userId, courseId], [userId, completed], [enrollmentId]
```

**CourseEnrollment** (lines 1424-1440)
```
fields: id, userId(FK, Cascade), courseId(FK, Cascade),
        status(String: ACTIVE | COMPLETED | CANCELLED), type(String: FREE | PAID | GRANTED),
        enrolledAt, completedAt(?), deletedAt(?)
indexes: [userId, courseId] (unique), [userId], [courseId], [status]
```

**CoursePurchase** (lines 1442-1457)
```
fields: id, userId(FK, Cascade), courseId(FK, Cascade),
        paymentId(FK to Payment, nullable), purchasedAt, isActive(Boolean, true),
        deletedAt(?)
indexes: [userId, courseId] (unique), [userId], [courseId]
```

### 6.2 Key Related Models

**Payment** (lines 479-512) — connects to CoursePurchase via `paymentId`

**ContentBundle, ContentPackage** — Existing monetization system (separate from Course)

**MCQExamPackage, MCQExamSet, MCQExamSetQuestion** — Exam packages linked via `CourseExamSchedule.packageId`

**CQExamPackage, CQExamSet, CQExamSetQuestion** — Exam packages linked via `CourseExamSchedule.packageId`

### 6.3 Constraints & Patterns

- **Soft deletes**: `CoursePurchase.deletedAt`, `CourseEnrollment.deletedAt`, `ExamResult.deletedAt` — but COURSE itself has no soft delete; admin uses explicit cascade delete
- **No enum types**: All enums stored as strings (SQLite compatibility)
- **HTML fields**: `Course.features`, `Course.requirements`, `Course.targetStudents`, `Lecture.content` — sanitized via middleware extension
- **Design patterns**: `isPremium` + `price` for paid vs free; `status: DRAFT | PUBLISHED` for publication; `isActive` for soft enable/disable

---

## 7. API Inventory

### 7.1 Public Course APIs

| Method | URL | Auth | Actions | Purpose |
|--------|-----|------|---------|---------|
| GET | `/api/courses` | None | `list`, `detail`, `syllabus`, `listAssignments` | Public course browsing |
| POST | `/api/courses/enroll` | Yes | Single action | Self-enroll in course |
| POST | `/api/courses/purchase` | Yes | Single action | Create purchase record |
| GET | `/api/courses/purchase` | Yes | Single action | List user's purchases |
| GET | `/api/courses/progress` | Yes | Single action | Get user's lesson progress |
| POST | `/api/courses/progress` | Yes | Single action | Toggle lesson progress |
| GET | `/api/courses/featured` | Varies | Single action | Featured courses |
| POST | `/api/courses/syllabus/sync` | — | Single action | Sync public syllabus |

### 7.2 Admin Course APIs

| Method | URL | Auth | Actions | Purpose |
|--------|-----|------|---------|---------|
| GET | `/api/admin/courses` | Admin | `list`, `detail`, `students`, `syllabus`, `analytics`, `student-progress` | Admin course management |
| POST | `/api/admin/courses` | Admin + CSRF | `create`, `update`, `delete`, `add-exam-schedule`, `add-exam-schedules-from-package`, `update-exam-schedule`, `remove-exam-schedule` | Admin course mutations |
| GET | `/api/admin/courses/lessons` | Admin | Single action (list) | List course lessons |
| POST | `/api/admin/courses/lessons` | Admin | `create`, `update`, `delete`, `reorder`, `duplicate`, `add-assignment`, `remove-assignment`, `add-note`, `remove-note`, `add-resource`, `remove-resource`, `add-schedule`, `remove-schedule` | Lesson CRUD + sub-resources |
| GET | `/api/admin/courses/assignments` | Admin | Single action (list) | List all assignments in course |
| GET | `/api/courses/assignments` | Auth | `list`, `detail` | Student view + |
| POST | `/api/courses/assignments` | Auth | `submit`, `update-submission` | Student assignment actions |

### 7.3 API Issues

- **No Zod validation** on course admin/student APIs — all validation is manual (presence checks). No schema enforcement at the API layer.
- **`GET /api/courses/progress`** spawns 5 parallel queries + 4 more — risk of N+1 on progress summary for heavily-used courses
- **`GET /api/admin/courses?action=syllabus`** and **`/api/courses?syllabus`** duplicate the same logic — both should share a single resolver
- **`GET /api/courses`** page size default=20 (public) vs default=50 (admin) — intentional but undiscoverable

---

## 8. Component Tree

### 8.1 Admin Course Components

```
AdminLayout.tsx
  └── AdminPages['admin-courses']
        └── @/features/course/admin/CourseAdminContainer.tsx
              ├── CourseList.tsx
              │     ├── Search Input
              │     ├── Status Select
              │     ├── Course Cards (thumbnail, title, price, badge, actions)
              │     ├── Pagination controls
              │     ├── Delete Confirm Dialog
              │     └── Create Course Dialog
              ├── CourseDetailTabs.tsx
              │     ├── Tab header (8 tabs)
              │     ├── OverviewTab.tsx
              │     ├── LessonsTab.tsx
              │     │     └── LessonEditorSheet.tsx (slide-over)
              │     │           ├── Lesson fields form
              │     │           ├── Live fields (URLs, platform, password)
              │     │           ├── Notes section (add/remove/list)
              │     │           ├── Resources section (add/remove/list)
              │     │           └── Schedule section
              │     ├── SyllabusTab.tsx
              │     ├── ExamCalendarTab.tsx
              │     ├── AssignmentsTab.tsx
              │     ├── StudentsTab.tsx
              │     │     └── StudentProgressDialog.tsx
              │     ├── AnalyticsTab.tsx
              │     └── SettingsTab.tsx
              └── CreateCourseDialog.tsx
```

### 8.2 Public/Student Components

```
AppShell + CourseListPage.tsx   (/courses)
  └── Course cards grid

AppShell + StudentCourseDetail (via router navigate)
  └── useStudentCourseDetail hook
        ├── Tabs: overview | curriculum | syllabus | routine | notes
        ├── StudentOverviewTab.tsx (HTML content cards)
        ├── StudentCurriculumTab.tsx (content list + progress toggle)
        ├── StudentSyllabusTab.tsx (lesson table + exam calendar)
        │     └── Day-grouped lessons, progress toggle, lock icons
        ├── StudentRoutineTab.tsx
        └── StudentNotesTab.tsx
```

---

## 9. State Management

| Layer | Mechanism | Details |
|-------|-----------|---------|
| **Global routing** | Zustand `useRouterStore` | `currentRoute`, `navigate()`, `goBack()`, `updateParams()` |
| **Auth state** | Zustand `useAuthStore` | `user`, `login()`, `logout()`, `isLoading` |
| **Admin list state** | React local state + `useCourses()` hook | `courses[]`, `page`, `search`, `filterStatus`, `viewMode`, `editId`, `deleteTarget` |
| **Admin detail state** | `useCourseDetail()` hook | `course`, `activeTab`, `loading`, `saving` (all local useState) |
| **Student detail state** | `useStudentCourseDetail()` hook | `course`, `hasAccess`, `enrollment`, `progress`, `syllabusRows`, `examCalendar`, `pendingPayment` |
| **Content cache** | `globalForPrisma` pattern | Single PrismaClient instance orded via global |
| **URL parameters** | `useRouteParams()` from router store | Derived from Zustand nav state, not React Router |
| **Server state** | Native fetch (no TanStack Query) | Manual loading/error/refetch in each hook |

### State Management Concerns

- **No TanStack Query/SWR**: Every hook manually manages loading/saving/error states. Re-fetching after mutations is boilerplate-heavy (`fetchDetail(true)`).
- **Race condition protection**: `createRaceGuard()` utility used in course hooks — good pattern
- **Nopersistent cache**: When returning to course list, data is re-fetched. No stale-time optimization
- **Zustand as URL source of truth**: The custom router store drives navigation; this is non-standard but consistent

---

## 10. Business Rules

### 10.1 Course Creation & Publishing

1. Admin creates course with **title + slug + description** minimum
2. `slug` must be unique (enforced via unique DB constraint + API check)
3. Course initializes with `status = "DRAFT"`
4. `isPremium` defaults to `false` but admin sets via Settings tab
5. Admin sets:
   - `price` (for premium courses)
   - `originalPrice` (for showing strikethrough discount pricing)
   - `classId` and `subjectId` (links to existing hierarchy)
   - `teacherName`, `duration`, `language`, `difficulty`
   - HTML descriptions: `features`, `requirements`, `targetStudents`
   - `hasCertificate` toggle

### 10.2 Lesson Management

1. Admin creates lesson with **title + lessonType** minimum
2. `lessonType` is `LIVE` or `RECORDED` (no enum — string comparison)
3. LIVE lessons require: `meetingLink`, `meetingId`, optional `platform`, `password`
4. RECORDED lessons require: `videoUrl`, optional `previewVideo`, `duration`
5. Lessons ordered by `displayOrder` integer
6. Admin can reorder via drag handle API (`POST action=reorder` with ordered lesson IDs)
7. Admin can duplicate lesson (copies notes, resources, assignments, schedules)
8. Notes: 3 types — `richtext`, `pdf`, `link`
9. Resources: 2 types — `file`, `link`
10. Schedule: one schedule per lesson (`LessonSchedule` has `@@unique([lessonId])`)

### 10.3 Exam Scheduling

1. Two exam type values: `MCQ` or `CQ`
2. Exam scheduled via `CourseExamSchedule` — course-level (not lesson-level)
3. Legacy `LessonExam` model exists but is deprecated — `CourseExamSchedule` is the canonical model
4. `autoFilledFromPackage` flag: true when auto-generated from MCQ/CQ exam sets; when false, manual entry
5. `overrideAllowed` flag: when false, manual override of auto-filled schedule is blocked
6. Exam packages live in `MCQExamPackage` / `CQExamPackage` models (separate domain)
7. Course syllabus API reconciles both `LessonExam` (legacy) + `CourseExamSchedule` entries

### 10.4 Access Control Rules

```
Priority order (highest → lowest):
1. COURSE is PUBLISHED (otherwise: no access for anyone)
2. Course is FREE:
   → If user has ACTIVE enrollment → ACCESS GRANTED
   → Otherwise → NO ACCESS (but UI shows enroll button)
3. Course is PREMIUM:
   → If active CoursePurchase exists → ACCESS GRANTED (source: 'purchase')
   → If active CourseEnrollment exists → ACCESS GRANTED (source: 'enrollment')
   → Otherwise → NO ACCESS
```

**Access resolver file**: `src/lib/course-access-resolver.ts`

**Content stripping**: For detail API without purchase, the API nulls out: `videoUrl`, `previewVideo`, `meetingLink`, `meetingId`, `password`

### 10.5 Purchase Rules

1. Premium course → requires `paymentId` in purchase POST
2. Payment must be `APPROVED` and belong to authenticated user
3. Payment's `contentType` must be `course` and `contentId` match course
4. `CoursePurchase` is idempotent — `upsert` on `[userId, courseId]` unique key
5. Once purchased, `isActive = true` by default; no re-purchase without admin override

### 10.6 Enrollment Rules

1. Free course → any authenticated user can self-enroll
2. Premium course → requires prior approved purchase first
3. Enrollment created with type `FREE` or `PAID` based on course.price
4. Duplicate enrollment prevented via unique constraint `[userId, courseId]`
5. Returns `alreadyEnrolled: true` flag

### 10.7 Progress Rules

1. Progress is per-lesson, stored in `LessonProgress`
2. Unique per `[userId, lessonId]`
3. Also has `courseId` field for faster queries
4. `completed` boolean; `completedAt` timestamp only when completed=true
5. Activity-based overall progress includes: lessons + assignments + MCQ exams + CQ exams
6. Admin and student views use slightly different progress calculations

### 10.8 Assignment Submission Rules

1. Student can submit once (`unique [assignmentId, userId]` prevents re-submission)
2. Student can update submission if status is NOT `graded`
3. Admin can grade (set `status = 'graded'`, `marks`, `feedback`, `gradedBy`, `gradedAt`)
4. `fileUrls` is comma-separated string — no normalized attachment table

### 10.9 Balloon Policy on Published Courses

- A `PUBLISHED` course with `isPremium=false` and no payment required can be enrolled by anyone
- Published course with `isPremium=true` requires purchase (via Payment system)
- Draft courses are only visible to admins via admin API (filters by no status or empty in some places)

---

## 11. UI Audit

### 11.1 Admin Navigation

```
Sidebar (AdminLayout.tsx):
  μL (মূল): Dashboard, Users, Teachers/Moderators
  CONTENT: Content, Hierarchy, Bulk Import, Content Types, Featured Content
  QUESTIONS: MCQ Management, CQ Management, Short Questions, Board Questions
  EDUCATION: Lectures, Notices, Suggestions, Notes, FAQ
  EXAMS: Exams, Bundles, Packages, Courses, MCQ Exam Packages, CQ Exam Packages
  RESULTS: Exam Results, MCQ Purchases, Content Purchases, Subscriptions
  FINANCIAL: Payments
  CMS: Banners, Notifications, Testimonials, Feedback
  SETTINGS: Settings
  ANALYTICS: Analytics (single entry with 18 sub-tabs)
```

**Problem**: "Courses" is under "EXAMS" group with icon `BookOpen` — same icon as "Lectures" (also BookOpen). Confusing admin navigation.

### 11.2 Admin Course List Page (CourseList.tsx)

```
Search bar + Status filter dropdown
Card grid:
  - Thumbnail image
  - Title
  - Class + Subject badges (small)
  - Lesson count
  - Premium badge (crown icon)
  - Price display
  - Action buttons: Edit →, Delete (icon)
Pagination at bottom
Delete confirmation dialog
Create button top-right corner
```

### 11.3 Admin Course Detail — Tab Structure

```
[Back button] Course Title /admin/courses/{id}
Tabs:
  Overview      (BookOpen icon)    → Course settings + HTML preview
  Lessons       (Layers icon)      → Lesson list + sheet drawer
  Syllabus      (Table2 icon)      → Schedule + exam calendar table
  Exams         (CalendarClock)    → Exam calendar visualization
  Assignments   (PenSquare)        → Assignment CRUD
  Students      (Users)            → Enrolled/purchased students
  Analytics     (BarChart3)        → Stats cards
  Settings      (Settings)         → Edit all course fields
```

### 11.4 Admin UI Issues

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Missing thumbnail upload | Medium | SettingsTab | Thumbnail is text URL field; no file uploader |
| Primitive create dialog | Medium | CreateCourseDialog | Only title + slug + description — no class, subject, premium, price at creation time |
| `viewMode='form'` is dead | Low | CourseAdminContainer | The `form` viewMode renders `<div>Form</div>` — never implemented |
| Lesson editor is a sheet | Medium | LessonEditorSheet | Reviews are slide-over dialogs, making complex multi-field editing cramped on small screens |
| Assignment grading not visible in admin | HIGH | AssignmentsTab | No UI for admin to grade submissions (grade marks, set status, add feedback) |
| No bulk actions in CourseList | Low | CourseList.tsx | Can't bulk-delete or bulk-update status |
| No export/import for courses | Low | — | Unlike MCQ/CQ bulk import, no CSV import for courses |
| No visual exam calendar | Medium | ExamCalendarTab | Displays dates as text rows, not a visual calendar component |
| Analytics is basic | Low | AnalyticsTab | Only 4 stat cards, no charts, no drill-down, no date range filter |

### 11.5 Public UI Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| No public course search | Medium | Only class filter, not full-text search |
| No course review/rating system | Medium | No ratings or reviews on courses |
| No certificate display | Low | `hasCertificate` flag in DB but no cert generation UI |
| Student notes tab is empty | Low | `StudentNotesTab.tsx` shows placeholder "কোনো নোট নেই" |
| Curriculum tabs overlap | Low | Both `CurriculumTab.tsx` and `SyllabusTab.tsx` show lesson list — redundant |
| No course progress persistence across sessions | Low | Progress is saved but not displayed on dashboard |
| Missing featured content integration | Medium | `/api/courses/featured` exists but is not used in any public page |

---

## 12. Security Audit

| Control | Status | Finding |
|---------|--------|---------|
| Authentication | ✅ | `withAuth` used on all mutation + sensitive read endpoints |
| Authorization | ✅ | `withAdmin` on all admin endpoints; `requireAdmin` vs `requireSuperAdmin` used correctly |
| CSRF protection | ⚠️ | `withCsrf` only used on some POST admin endpoints (e.g., `/api/admin/courses` POST is ✓), but NOT on public enrollment/purchase endpoints |
| Input validation | ❌ | No Zod schemas for any Course/Assignment API — only presence checks |
| SQL injection | ✅ | Prisma ORM parameterizes all queries |
| XSS | ⚠️ | `dangerouslySetInnerHTML` used for `features`, `requirements`, `targetStudents`, `Lecture.content` — HTML sanitization middleware exists but should be audited |
| Broken access control | ✅ | `resolveCourseAccess()` returns 403 for denied users; sensitive fields stripped from response |
| Data leakage | ⚠️ | Admin `syllabus` endpoint returns ALL notes and resources for a course — verified |
| Content type spoofing | ⚠️ | Payment verification checks `contentType === 'course'` — good |
| Rate limiting | ❌ | No rate limiting on any course API endpoints (enroll, purchase, progress toggle) |
| Admin RBAC | ⚠️ | RBAC permission model exists (`Permission`, `RolePermission` models) but **NOT used** for course endpoints — all ADMINs have full access |
| Assignment file upload | ❌ | `AssignmentSubmission.fileUrls` is comma-separated strings, not normalized — no upload validation |

---

## 13. Performance Audit

| Issue | Severity | Details |
|-------|----------|---------|
| Parallel query explosion in progress API | High | `GET /api/courses/progress` fires 5+ parallel Prisma queries; acceptable but should be cached |
| Duplicate syllabus logic | Medium | `GET /api/courses?syllabus` and `GET /api/admin/courses?syllabus` repeat identical logic (lesson mapping, exam calendar) |
| N+1 in enrollments list | Medium | `students` action does 2 queries then map-filter; fine for small N but unbounded |
| Missing pagination on assignments | Low | `GET /api/courses/assignments` returns ALL assignments for a course |
| No optimistic updates | Medium | Progress toggle toggles optimistically but re-fetches full breakdown each time |
| Large HTML blobs | Low | Course features/requirements HTML strings fetched with every course detail |
| No CDN caching headers | Low | Course images (thumbnails) served without cache-control |
| Missing index on AssignmentSubmission | Low | Composite `[assignmentId, userId]` exists but `[userId]` query path for student's history is not optimized |
| Prisma client logging in production | Low | `db.ts` enables `['error', 'warn']` in prod but the client is re-created per serverless invocation |

---

## 14. Technical Debt

1. **Duplicate syllabus logic** between public and admin API (~50 lines of identical code)
2. **No Zod schemas** for course APIs — validation is ad-hoc
3. **`CourseLesson.schedules`** is unique per lesson but `LessonSchedule` model allows only 1 record — dead normalization
4. **`LessonExam` model is "deprecated"** but still in schema and still queried in syllabus (dual-source)
5. **`CoursePurchase` and `CourseEnrollment` are somewhat redundant** — ticket: some courses use one or the other, access resolver checks both
6. **`AssignmentSubmission.fileUrls`** is a comma-separated string, not a proper attachment table
7. **`CourseLesson.courseId` AND `LessonProgress.courseId`** is redundant — `courseId` can be derived from lesson→course, but denormalized for query speed. Not necessarily debt, just a tradeoff
8. **`CourseAdminContainer` has dead `viewMode='form'`** state path
9. **Race guard pattern** used in some hooks but nowhere else — inconsistent
10. **No course-testing infrastructure** — no tests found for course APIs or components

---

## 15. Missing Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Admin: thumbnail upload | HIGH | Currently text URL field only |
| Admin: comprehensive course creation dialog | HIGH | Title/slug/description only; class/subject/price/premium all in Settings tab afterwards |
| Admin: assignment grading UI | HIGH | No admin grading view exists |
| Admin: course preview | MEDIUM | Can't preview as student from admin |
| Admin: course duplication | MEDIUM | Current duplicate only copies a lesson, not the whole course |
| Admin: bulk course actions | MEDIUM | No bulk publish, bulk delete, bulk status change |
| Admin: course CSV import | MEDIUM | Unlike MCQ/CQ, no bulk-import pathway |
| Admin: date-range analytics filters | LOW | Fixed stats, no time range |
| Admin: course curriculum export | LOW | No export to PDF/CSV |
| Public: course search | MEDIUM | Only class filter exists |
| Public: course reviews/ratings | LOW | No ratings or reviews on courses |
| Public: course certificates | MEDIUM | `hasCertificate` exists but no cert generation UI |
| Public: course recommendations | LOW | No "related courses" |
| Public: course progress dashboard | MEDIUM | Progress data exists but not surfaced in user dashboard |
| Public: featured course integration | MEDIUM | Featured API exists but unused in frontend |
| Public: course completion certificate | MEDIUM | `Course.hasCertificate` flag but no cert template or generation |
| Both: URL-based course routing | MEDIUM | Single CourseDetailPage via slug-router; no `/courses/[slug]` route file |
| Both: course reviews and ratings | LOW | No models/APIs exist |
| Both: instructor/course author management | LOW | `teacherName` is a text field, not a user relation |
| Both: course prerequisites | LOW | `requirements` field is HTML, not a prerequisite check system |
| Both: course tags | LOW | No tag/category system for courses |
| Both: course discount codes | LOW | `originalPrice` exists but no coupon/promo code system |

---

## 16. Bugs Found (Non-critical)

1. **Dead `viewMode='form'` path** in `CourseAdminContainer.tsx:47-51` — renders `<div>Form</div>`, unreachable
2. **Duplicate icon** in sidebar: `BookOpen` used for both "লেকচার" and "কোর্স" — `AdminLayout.tsx:167,175`
3. **Syllabus API duplication** — `GET /api/courses?syllabus` and `GET /api/admin/courses?syllabus` have identical logic (could drift)
4. **`totalResources: 0` hardcoded** in analytics summary — `AdminCourseAdminService.ts:172` returns `totalResources: 0` always
5. **`CourseLesson.schedules` unique constraint** creates impossible downstream state: lesson-date mapping should allow multiple occurrence dates
6. **Course list page loads before metadata** — `CourseListPage.tsx:20` accesses `metadata` synchronously but fetch may not be done
7. **No CSRF on public mutation endpoints** — `POST /api/courses/enroll`, `POST /api/courses/purchase` — Session-based CSRF mitigation
8. **Progress API date calculation has N+1 risk** — per-lesson `_count.assignments` triggers subquery on large courses
9. **Assignment submission re-open exploit** — `update-submission` endpoint doesn't check if user is the original submitter (implicit by FK, but logic should verify)
10. **Course slug generation strips non-Latin chars** — `generateSlug()` in `CreateCourseDialog.tsx:25` removes Bengali characters since `/[^a-z0-9]+/g` strips them; Bengali slugs will produce empty strings like `বাংলা-কোর্স` → `-`

---

## 17. Risks During Redesign

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Breaking `resolveCourseAccess()` rules | Medium | HIGH | This is the single access control gate used by all course APIs |
| Breaking existing admin workflows | Medium | HIGH | Admin UI is used daily; careful UX preservation |
| Changing course-detail data shape | Medium | HIGH | Multiple hooks + components depend on exact response shapes |
| RBAC integration not wired up | Low | MEDIUM | RBAC models exist but no permission check infrastructure for courses |
| Performance regression on progress page | Medium | MEDIUM | Progress API has many parallel queries |
| Lost Zustand navigation contract | Low | MEDIUM | Custom router store has implicit contracts |
| JavaScript slugs for Bangla titles | HIGH | HIGH | `generateSlug()` strips Bengali chars causing empty slugs |
| Syllabus API divergence | Low | MEDIUM | Public + admin syllabus endpoints duplicate logic |
| Assignment workflow changes | Low | MEDIUM | Submission flow must remain backward-compatible |

---

## 18. Things That MUST NOT Change

1. **Database schema** — 72 models, many with FK relationships to `Payment`, `User`, `Chapter`, `MCQExamPackage`, `CQExamPackage`. DROP/CREATE changes break all related data.

2. **`resolveCourseAccess()`** — Single source of truth for ALL access decisions. Admin, teacher, and student views all depend on it.

3. **`CoursePurchase.userId + courseId` unique constraint** — Idempotency guarantee, used in both public and admin purchase flows.

4. **`LessonProgress.userId + lessonId` unique constraint** — Progress undo/redo relies on this.

5. **Payment contentType = `'course'`** — Payment table is shared across all content types (MCQ, CQ, bundle, course, subscription). Hardcoded strings in resolver.

6. **Course slugs are used in navigation** — `navigate('courses')` → `routeToUrl('courses')` and other slug-based lookups.

7. **Admin action-based routing pattern** — `GET ?action=list|detail|...` and `POST ?action=create|update|...` is used consistently across ALL admin endpoints.

8. **`CourseExamSchedule` data model** — Both MCQ and CQ exam packages are stored in the same table with `examType` discriminator.

9. **The dual exam source pattern** — `CourseExamSchedule` (new) + `LessonExam` (legacy) both contribute to syllabus calendar. Must maintain until migration plan exists.

10. **`AssignmentSubmission.fileUrls` format** — Comma-separated strings. Changing this breaks all existing submissions.

---

## 19. Recommended New Admin UI Structure

Current: 8 tabs in a tab-based layout. This works but is long and dense.

Recommended redesign (high-level):

```
┌─────────────────────────────────────────────────────────────┐
│ COURSE DETAIL — "বাংলা ১"            ← Edit Course ← Save   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Tab strip: Overview | Content | Exams | Students | Settings]│
│                                                              │
│  ┌─ Overview ─────────────────────────────────────────────┐ │
│  │  Thumbnail upload  |  Class/Subject badges             │ │
│  │  Price card (৳299 original ৳499) | Premium toggle      │ │
│  │  Description (rich text)                               │ │
│  │  Features (rich text list)  |  Requirements            │ │
│  │  Target students (rich text)                           │ │
│  │  Teacher name | Duration | Language | Difficulty       │ │
│  │  Certificate toggle | Status badge                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ Content ──────────────────────────────────────────────┐ │
│  │  [+ Add Lesson]   [Import from Chapter ▼]              │ │
│  │  ┌─────────────────────────────────────┐               │ │
│  │  │ 1. [▶] ইন্ট্রো ডemocrazy    │ LIVE │ ⋮ │              │ │
│  │  │    🔗 meet: abc123 | Thu 14:00-15:00  ▼       │  │ │
│  │  │    📝 3 notes | 📎 1 resource               │  │ │
│  │  └─────────────────────────────────────┘               │ │
│  │  ┌─────────────────────────────────────┐               │ │
│  │  │ 2. [▶] ভিডিও লেকচার ১ │ RECORDED | ⋮ │              │ │
│  │  │    ▶ Preview  | 32:10           ▼            │  │ │
│  │  └─────────────────────────────────────┘               │ │
│  │  [+ Add Lesson]                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ Exams & Assignments ────────────────────────────────┐  │
│  │  ┌─ Lessons with Assignments ─┐  ┌─ Exam Calendar ─┐ │  │
│  │  │ Lesson 1: "HW 1" due ...   │  │ Jun 15 MCQ Test │  │
│  │  │ Lesson 2: "Project" 3 sub  │  │ Jun 22 CQ Exam  │  │
│  │  └────────────────────────────┘  └─────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Students ───────────────────────────────────────────┐  │
│  │    Stats: 45 enrolled | 12 purchased | ৳3,600 revenue │  │
│  │    [Search] [Filter: enrolled | purchased]             │  │
│  │    ┌────────────────────────────────────────────────┐ │  │
│  │    │ Name | Status | Source | Progress ▸ | Actions │ │  │
│  │    │ Rahul Ahmed | ACTIVE | purchase | 85% | View  │ │  │
│  │    │ Fatema K.   | ACTIVE | enroll   | 60% | View  │ │  │
│  │    └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

Key UI improvements:
- **One upload component** at top for thumbnail (replaces text field)
- **Collapsible lesson cards** — inline expansion for sub-content (notes, resources, schedule) instead of separate editor sheet
- **Combined Exams + Assignments tab** — since both are lesson-level content, group them
- **Student list with inline progress bars** — drill-down on click to `StudentProgressDialog`
- **Settings tab simplified** — move to first tab as Overview
- **Remove dead form viewMode path**

---

## 20. Step-by-Step Redesign Roadmap

**Phase 1 — Foundation (Non-UI)**
1. Extract shared syllabus logic into `lib/course-syllabus.ts` shared between public and admin
2. Add Zod schemas for Course and CourseLesson API payloads
3. Fix `generateSlug()` to preserve Bengali characters: `val.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')`
4. Migrate `LessonExam` references to `CourseExamSchedule` (deprecation path)

**Phase 2 — Admin List Page**
5. Redesign `CourseList.tsx`:
   - Add thumbnail image display (currently missing)
   - Reorganize course card: thumbnail | title + subtitle | stats | premium badge | action buttons
   - Improve delete flow: inline confirmation instead of separate dialog
   - Status toggle (draft/published) as quick action

**Phase 3 — Detailed Admin View**
6. Redesign `CourseDetailTabs.tsx` to 5 tabs (overview/content/exams-assignments/students/analytics)
7. Replace `LessonEditorSheet.tsx` (slide-over) with inline lesson card expansion
8. Redesign `CreateCourseDialog.tsx` to include: class, subject, thumbnail upload, premium toggle, price, status at creation time
9. Add assignment grading UI in `AssignmentsTab.tsx`

**Phase 4 — Public Course Pages**
10. Add `/courses/[slug]` dynamic route (currently loaded via custom router only)
11. Enhance `CourseListPage.tsx` with full-text search
12. Add featured courses carousel on homepage
13. Add progress dashboard in user dashboard
14. Set up certificate generation (PDF) for completed courses

**Phase 5 — Integration & Polish**
15. Wire up RBAC for course permissions (Permission model)
16. Add rate limiting to enrollment/purchase/progress endpoints
17. Add course bulk-import (CSV)
18. Add course duplication (whole course copy)
19. Remove legacy `LessonExam` model after migration
20. Add automated tests for Course API layer

---

## 21. Estimated Complexity

| Component | Complexity | Time |
|-----------|-----------|------|
| Admin Course List Redesign | LOW | 1-2 days |
| Admin Detail Tabs Restructure | MEDIUM | 2-3 days |
| Lesson Editor Sheet → Inline Expansion | HIGH | 3-5 days |
| Settings Tab → Overview Tab | MEDIUM | 1-2 days |
| Assignment Grading UI | HIGH | 3-4 days |
| Thumbnail Upload | LOW | 0.5 days |
| Create Dialog Enhancement | LOW | 1 day |
| Public Course Search | MEDIUM | 1-2 days |
| Dynamic `/courses/[slug]` Route | LOW | 0.5 days |
| Progress Dashboard | MEDIUM | 2 days |
| Syllabus Logic Extraction | MEDIUM | 1-2 days |
| Zod Schema Refactor | LOW | 1 day |
| Fix Bengali slug generation | LOW | 0.5 days |
| RBAC Wiring | HIGH (cross-cutting) | 3-5 days |
| Certificate Generation | MEDIUM | 2-3 days |
| Course Bulk Import | MEDIUM | 2-3 days |
| Analytics Enhancement | MEDIUM | 2-3 days |

**Total estimated: 25-35 engineering days** for full redesign.

---

## 22. Files That Will Need Modification

(Read-only: these files exist and form the modification surface area)

**Schema:**
- `prisma/schema.prisma` — may need existing Model adjustments for tag, review, certificate features

**Admin UI:**
- `src/features/course/admin/CourseAdminContainer.tsx`
- `src/features/course/admin/components/CourseList.tsx`
- `src/features/course/admin/components/CourseDetailTabs.tsx` (tab restructure)
- `src/features/course/admin/components/CreateCourseDialog.tsx`
- `src/features/course/admin/components/LessonEditorSheet.tsx` (→ inline expansion)
- `src/features/course/admin/components/LessonsTab.tsx`
- `src/features/course/admin/components/SyllabusTab.tsx`
- `src/features/course/admin/components/ExamCalendarTab.tsx`
- `src/features/course/admin/components/AssignmentsTab.tsx` (→ add grading UI)
- `src/features/course/admin/components/StudentsTab.tsx`
- `src/features/course/admin/components/StudentsTab.tsx`
- `src/features/course/admin/components/StudentProgressDialog.tsx`
- `src/features/course/admin/components/AnalyticsTab.tsx`
- `src/features/course/admin/components/SettingsTab.tsx`
- `src/features/course/admin/hooks/use-courses.ts`
- `src/features/course/admin/hooks/use-course-detail.ts`

**Public UI:**
- `src/components/course/CourseListPage.tsx`
- `src/features/course/student/hooks/use-student-course-detail.ts`
- `src/features/course/student/components/StudentOverviewTab.tsx`
- `src/features/course/student/components/StudentSyllabusTab.tsx`
- `src/features/course/student/components/StudentRoutineTab.tsx`
- `src/features/course/student/components/StudentCurriculumTab.tsx`
- `src/features/course/student/components/StudentNotesTab.tsx`
- `src/app/courses/page.tsx`

**API:**
- `src/app/api/courses/route.ts`
- `src/app/api/courses/enroll/route.ts`
- `src/app/api/courses/purchase/route.ts`
- `src/app/api/courses/progress/route.ts`
- `src/app/api/courses/assignments/route.ts`
- `src/app/api/courses/featured/route.ts`
- `src/app/api/admin/courses/route.ts`
- `src/app/api/admin/courses/lessons/route.ts`
- `src/app/api/admin/courses/assignments/route.ts`

**Shared Services:**
- `src/services/api/course.service.ts`
- `src/services/api/course-admin.service.ts`
- `src/features/course/types.ts`
- `src/lib/course-access-resolver.ts`
- `src/lib/validations.ts`

---

## 23. Files That Must Remain Untouched

These files have **indirect but critical usage** across the app and must not change their public contract:

| File | Why | Contract Risk |
|------|-----|---------------|
| `src/lib/db.ts` | Prisma singleton — entire app depends on it | Don't change dbUrl resolution (already fixed) |
| `src/lib/auth.ts` | Auth result struct consumed by Proxy.ts + all API routes | Don't change AuthResult shape |
| `src/store/router.ts` | All admin + public navigation driven by this | Don't change RoutePath union or navigate() signature |
| `src/lib/urls.ts` | URL generation/parsing — used by router, navigation-loader, shell | Don't change route definitions |
| `src/lib/access-control.ts` | Content access controls for legacy Chapter/Lecture/MCQ/CQ — NOT course | Only touch if needed |
| `src/proxy.ts` | Next.js proxy/rewrite layer | Don't change proxy routes |
| `prisma/seed-all.ts` | Seed data — 28 table population | Don't change unless adding seed data |
| `src/components/admin/AdminLayout.tsx` | Sidebar navigation structure | Add sidebar items but don't break AdminPages mapping |
| `src/lib/api-client.ts` | Central axios-like wrapper | Don't change request/response interceptor structure |
| `src/lib/errors.ts` | Central error handling | Don't change AppError class hierarchy |
| `src/app/[...slug]/page.tsx` | Client-side router shell | Don't change rendering contract |

---

## 24. Suggested Migration Strategy

### Approach: Incremental component swap (client-side first, then backend)

**Week 1-2: Infrastructure**
- Extract shared syllabus logic into utility
- Add Zod schemas for all Course API endpoints
- Fix `generateSlug()` for Bengali support
- Build `CourseThumbnailUpload` component (reusable)
- Create unified `CourseCard` component (shared admin + public)

**Week 3-4: Admin List + Create**
- Deploy improved `CourseList.tsx` UX behind a feature flag
- Deploy enhanced `CreateCourseDialog.tsx`
- Run in parallel alongside existing view

**Week 5-6: Admin Detail Tabs**
- Reorganize tabs: Overview, Content, Exams+Assignments, Students, Analytics
- Convert `LessonEditorSheet.tsx` to inline expansion (can be done incrementally: lessons expand first, sub-items next)

**Week 7-8: Public Course Pages**
- Add `/courses/[slug]` dynamic route
- Add search bar to CourseListPage
- Add featured courses to homepage

**Week 9-10: Advanced Features**
- Assignment grading UI
- Certificate generation
- Course analytics enhancement (date filters, charts)
- Course bulk-import

**Rollout Strategy:**
1. Feature flag for new admin UI (opt-in per admin)
2. A/B test course list page performance metrics
3. Keep old API endpoints backward-compatible (don't break existing clients)
4. Gradual migration of public pages with `CourseListPage` → dynamic routes

---

## 25. Final Readiness Score

| Area | Score (1-10) | Notes |
|------|-------------|-------|
| Database Design | 8 | Well-structured with appropriate indexes and relations; `LessonExam` dual-source needs cleanup |
| API Completeness | 8 | All CRUD operations + advanced features exist; missing validation |
| Frontend Architecture | 7 | Clean separation public/admin; Zustand routing works but is unusual |
| Admin UX | 5 | Functional but fragmented (8 tabs, cramped lesson editor, missing thumbnail upload) |
| Public UX | 6 | Course listing works but lacks search, progress dashboard |
| Security | 6 | Auth and access control are solid; missing CSRF on public mtuations, no input validation, no RBAC enforcement |
| Performance | 6 | Parallel queries used correctly; some N+1 risk; no caching |
| Maintainability | 6 | Duplicate syllabus logic, no tests, no Zod schemas |
| Business Logic Correctness | 8 | Access resolver is well-designed and complete |
| Extensibility | 7 | Feature is isolated; adding tags/ratings/reviews would be straightforward |

**Overall Readiness: 6.8 / 10** — The Course feature is **feature-complete and functional** but has notable UX gaps, missing validation, technical debt (duplicate logic, dead code, legacy model), and no automated test coverage. Ready for admin UI redesign with the condition that `resolveCourseAccess()` and all database schemas are preserved.

---

**SPECIAL NOTE**: The recent turbochunk/chunk errors you experienced earlier are now explained — `AdminLayout.tsx:93` lazy-loads `@/features/course/admin/CourseAdminContainer` and it ties into the `AnimatePresence` with `viewMode` state. The 8-tab structure with AnimatePresence is heavy, and combined with the circular dependency (`router.ts` ↔ `urls.ts`) may contribute to the ChunkLoadError you saw in Turbopack. The fix for that circular dependency has already been applied, but a redesign that simplifies the tab structure would further reduce chunk complexity.
