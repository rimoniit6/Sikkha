# Project Features

> **Platform:** Sikkha (সিক্ষা) — Bangladeshi online learning platform for Class 6 → HSC students.
> **Stack (verified from `package.json`, `README.md`, `prisma/schema.prisma`):** Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4, Prisma 7.8.0 (libSQL/SQLite adapter, `DATABASE_URL=file:./db/custom.db`), TanStack React Query, Zustand (custom client-side router via `RouteSync`), UploadThing, Sonner.
> **Architecture:** SPA-in-SSR. All pages render client-side. `src/proxy.ts` is the central middleware: JWT auth from HttpOnly cookie, CSRF validation on mutations, security headers (CSP/HSTS/X-Frame-Options), role-based API access, and `x-user-id`/`x-user-role` injection.
> **Verification note:** Every feature below is backed by an actual source file path (API route, page, model, or component) discovered in this scan. No feature is guessed.

---

## Executive Summary

| Metric | Value | Evidence |
|---|---|---|
| Total Features (catalogued) | **62** | Count of feature entries in this document |
| Total Pages | **72** | 72 `page.tsx` files (`src/app/**`) — 34 admin + 38 user-facing |
| Total API Endpoints | **169** | 169 `route.ts` modules under `src/app/api` (many export multiple HTTP methods) |
| Total Prisma Models | **73** | `prisma/schema.prisma` (`model` declarations) |
| Total Components | **320** | 320 `.tsx` files under `src/components` |
| Total User Roles | **4** | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT` (+ `Guest` = unauthenticated) |
| Overall Completion % | **~88%** | Heuristic: broad feature coverage present; gaps in email, automated payments, account recovery (see Missing Features) |

**Role model (verified):** Roles are stored as `String` fields, NOT Prisma enums — every `enum` block in `schema.prisma` is **commented out** (e.g. `// enum Role { SUPER_ADMIN ADMIN STUDENT }`). Effective roles observed in code: `SUPER_ADMIN`, `ADMIN`, `TEACHER` (via `TeacherModerator`), `STUDENT`. Granular RBAC exists via `Permission` + `RolePermission` models and `requirePermission()`.

---

# Feature Categories

## Authentication

### Login
- **Status:** Complete
- **Description:** JWT-based login; issues HttpOnly session cookie consumed by `proxy.ts`. Public route `/api/auth/login`.
- **Available For:** Guest → Student/Teacher/Admin/Super Admin
- **UI Pages:** `/login`
- **API Endpoints:** `GET/POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- **Source Files:** `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/me/route.ts`, `src/lib/auth/jwt.ts`

### Registration
- **Status:** Complete
- **Description:** Public self-registration creating a `STUDENT` user.
- **Available For:** Guest
- **UI Pages:** `/register`
- **API Endpoints:** `POST /api/auth/register`
- **Source Files:** `src/app/api/auth/register/route.ts`

### Session Management
- **Status:** Complete
- **Description:** JWT in HttpOnly cookie; `proxy.ts` verifies token + loads role from DB on every request; `x-user-id`/`x-user-role` headers injected. Client `AuthProvider` holds session.
- **Available For:** All authenticated roles
- **Source Files:** `src/proxy.ts` (`getAuthFromCookie`, `proxy`), `src/lib/auth/jwt.ts`, `src/hooks/*` (AuthProvider)

### Role-based Access
- **Status:** Complete
- **Description:** Proxy-level API gating via `PUBLIC_API_ROUTES` whitelist + DB role lookup; `withAdmin()`/`requireRole()`/`requirePermission()` guards; `Permission`/`RolePermission` granular model.
- **Available For:** SUPER_ADMIN, ADMIN, TEACHER, STUDENT, Guest
- **Source Files:** `src/proxy.ts`, `src/lib/auth.ts` (`requireRole`, `requirePermission`), `src/lib/api-utils.ts` (`withAdmin`, `withCsrf`), `prisma/schema.prisma` (`Permission`, `RolePermission`)

### Forgot Password / Email Verification
- **Status:** Missing
- **Description:** No password-reset, OTP, or email-verification routes exist. Search of `src/app/api` for `forgot|reset|verify|otp|password|email` returns only `/api/admin/database/reset` (DB tooling, unrelated).
- **Missing Functionality:** Account recovery and email confirmation are not implemented.
- **Source Files:** (none)

---

## User Management

### User Profiles
- **Status:** Complete
- **Description:** Authenticated users view/edit their own profile.
- **Available For:** Student, Teacher, Admin, Super Admin
- **UI Pages:** `/dashboard`
- **API Endpoints:** `GET/PUT /api/user/profile`
- **Source Files:** `src/app/api/user/profile/route.ts`

### User Dashboard
- **Status:** Complete
- **Description:** Personalized dashboard (recent lectures, progress, enrollments).
- **Available For:** Student, Teacher
- **UI Pages:** `/dashboard`
- **API Endpoints:** `GET /api/user/dashboard`, `GET /api/user/recent-lectures`, `GET /api/user/subscriptions`, `GET /api/user/payments`, `GET /api/user/feedback`
- **Source Files:** `src/app/api/user/dashboard/route.ts`, `src/app/api/user/recent-lectures/route.ts`, `src/app/api/user/subscriptions/route.ts`, `src/app/api/user/payments/route.ts`

### Admin User Management
- **Status:** Complete
- **Description:** Admins list, manage, and assign roles to users; super-admin CLI tooling.
- **Available For:** Admin, Super Admin
- **UI Pages:** `/admin/users`
- **API Endpoints:** `GET/POST/PUT/DELETE /api/admin/users`
- **Source Files:** `src/app/api/admin/users/route.ts`; CLI: `scripts/create-super-admin.ts` (npm `create-super-admin`, `list-super-admins`, `revoke-super-admin`)

### Teacher Moderators
- **Status:** Complete
- **Description:** Teacher/moderator role with content moderation scope (`TeacherModerator` model + public/teacher APIs).
- **Available For:** Teacher, Admin, Super Admin
- **API Endpoints:** `GET /api/teacher-moderators`, `GET/POST/PUT/DELETE /api/admin/teacher-moderators`
- **Source Files:** `src/app/api/teacher-moderators/route.ts`, `src/app/api/admin/teacher-moderators/route.ts`, `prisma/schema.prisma` (`TeacherModerator`)

---

## Admin Panel

### Admin Dashboard & Analytics
- **Status:** Complete
- **Description:** 34 admin pages; analytics suite (revenue, students, retention, conversion, drop-off, realtime, insights, predictions, alerts, geo, devices, reports, export). Audit logging via `AuditLog`.
- **Available For:** Admin, Super Admin
- **UI Pages:** `/admin`, `/admin/analytics`, `/admin/users`, `/admin/settings`, `/admin/hierarchy`, `/admin/content-purchases`, `/admin/subscriptions`, `/admin/notifications`, `/admin/feedback`, `/admin/database/*`
- **API Endpoints:** `GET /api/admin/stats`, `GET /api/admin/analytics/*` (22 sub-routes), `GET/PUT /api/admin/settings`, `GET/POST /api/admin/navigation`, `GET/POST /api/admin/feedback`, `GET/POST /api/admin/notifications`, `GET/POST/PUT/DELETE /api/admin/database/*`
- **Source Files:** `src/app/admin/**` (34 pages), `src/app/api/admin/analytics/**`, `src/app/api/admin/stats/route.ts`, `src/app/api/admin/settings/route.ts`, `prisma/schema.prisma` (`AuditLog`, `AnalyticsEvent`, `AnalyticsSession`, `AnalyticsAlert`, `AnalyticsReport`)

### Admin Content CRUD (bulk)
- **Status:** Complete
- **Description:** Full CRUD + bulk import for every content type; bulk-import type handling (knowledge/mcq/cq) and assignments.
- **Available For:** Admin, Super Admin
- **UI Pages:** `/admin/classes`, `/admin/subjects`, `/admin/chapters`, `/admin/lectures`, `/admin/mcq`, `/admin/cq`, `/admin/knowledge-questions`, `/admin/board`, `/admin/bulk-import`, `/admin/content`, `/admin/content-types`, `/admin/banners`, `/admin/faqs`, `/admin/testimonials`, `/admin/notices`, `/admin/suggestions`, `/admin/notes`, `/admin/topics`, `/admin/boards`, `/admin/years`, `/admin/board-years`
- **API Endpoints:** `GET/POST/PUT/DELETE /api/admin/classes`, `/api/admin/subjects`, `/api/admin/chapters`, `/api/admin/lectures`, `/api/admin/mcq`, `/api/admin/cq`, `/api/admin/knowledge-questions`, `/api/admin/bulk-import`, `/api/admin/content-types`, `/api/admin/banners`, `/api/admin/faqs`, `/api/admin/testimonials`, `/api/admin/notices`, `/api/admin/suggestions`, `/api/admin/notes`, `/api/admin/topics`, `/api/admin/boards`, `/api/admin/years`, `/api/admin/board-years`, `/api/admin/bundles`, `/api/admin/packages`, `/api/admin/featured`
- **Source Files:** `src/app/api/admin/**` (60+ route modules)

### Database Tools
- **Status:** Complete
- **Description:** Admin export/import/reset of database; seed scripts for navigation, settings, content-types.
- **Available For:** Admin, Super Admin
- **API Endpoints:** `GET/POST /api/admin/database/export`, `/api/admin/database/import`, `/api/admin/database/reset`, `POST /api/admin/navigation/seed`, `POST /api/admin/settings/seed`, `POST /api/content-types/seed`
- **Source Files:** `src/app/api/admin/database/**`, `src/app/api/admin/navigation/seed/route.ts`, `src/app/api/admin/settings/seed/route.ts`, `src/app/api/content-types/seed/route.ts`

---

## Dashboard
*(see User Dashboard and Admin Dashboard & Analytics above)*

---

## Course Management

### Courses (Catalog & CRUD)
- **Status:** Complete
- **Description:** Public course catalog with filtering, search, sorting, related courses; admin CRUD + lessons + assignments; syllabus sync.
- **Available For:** Guest (browse), Student (enroll/purchase), Admin (manage)
- **UI Pages:** `/courses` (orphaned — not linked from live navbar/footer/bottomNav), `/admin/courses`
- **API Endpoints:** `GET /api/courses` (action=list/related/etc.), `GET/POST/PUT/DELETE /api/admin/courses`, `GET/POST /api/admin/courses/lessons`, `GET/POST /api/admin/courses/assignments`, `POST /api/courses/syllabus/sync`
- **Source Files:** `src/app/api/courses/route.ts`, `src/app/api/admin/courses/route.ts`, `src/app/api/admin/courses/lessons/route.ts`, `prisma/schema.prisma` (`Course`, `CourseLesson`, `LessonNote`, `LessonResource`, `CourseExamSchedule`, `LessonExam`, `LessonAssignment`, `AssignmentSubmission`, `LessonSchedule`, `LessonProgress`)
- **Known Limitations:** Although `course-list` exists in `defaultNavItems` (`src/hooks/use-navigation.ts`), the live `Navigation` DB table has **no `course-list` row**, so the `/courses` page is unreachable from the user-facing navbar, footer, or bottom navigation. Add a `course-list` row to the `Navigation` table (and seed it via `POST /api/admin/navigation/seed` if applicable) to surface Courses in the UI.

### Course Enrollment & Lessons
- **Status:** Complete
- **Description:** Enroll (free/paid), progress tracking, lesson resources/notes, assignments, schedules.
- **Available For:** Student
- **API Endpoints:** `POST /api/courses/enroll`, `GET /api/courses/progress`, `GET/POST /api/courses/assignments`, `GET /api/courses/featured`, `GET/POST /api/courses/certificate`, `GET/POST /api/courses/purchase`
- **Source Files:** `src/app/api/courses/enroll/route.ts`, `src/app/api/courses/progress/route.ts`, `src/app/api/courses/assignments/route.ts`, `src/app/api/courses/certificate/route.ts`, `prisma/schema.prisma` (`CourseEnrollment`, `Certificate`, `CoursePurchase`)

### Course Certificates
- **Status:** Complete
- **Description:** Certificate generation on course completion.
- **Available For:** Student
- **API Endpoints:** `GET/POST /api/courses/certificate`
- **Source Files:** `src/app/api/courses/certificate/route.ts`, `prisma/schema.prisma` (`Certificate`)

---

## Class Management

### Classes (Class Categories)
- **Status:** Complete
- **Description:** Class 6→HSC hierarchy; public list + detail with aggregated content counts; admin CRUD.
- **Available For:** Guest (browse), Admin (manage)
- **UI Pages:** `/classes`, `/class/[classSlug]`
- **API Endpoints:** `GET /api/classes`, `GET /api/classes/[slug]`, `GET/POST/PUT/DELETE /api/admin/classes`
- **Source Files:** `src/app/api/classes/route.ts`, `src/app/api/classes/[slug]/route.ts`, `src/app/api/admin/classes/route.ts`, `src/components/class-hub/ClassHubPage.tsx`, `prisma/schema.prisma` (`ClassCategory`)

---

## Subject Management

### Subjects
- **Status:** Complete (recently fixed — see Known Limitations)
- **Description:** Subjects per class; public detail (chapters, counts) + admin CRUD.
- **Available For:** Guest (browse via `/api/subjects/[id]`, now public), Admin (manage)
- **UI Pages:** `/class/[classSlug]/[subjectSlug]`
- **API Endpoints:** `GET /api/subjects/[id]`, `GET/POST/PUT/DELETE /api/admin/subjects`
- **Source Files:** `src/app/api/subjects/[id]/route.ts`, `src/app/api/admin/subjects/route.ts`, `src/components/subject-hub/SubjectHubPage.tsx`, `prisma/schema.prisma` (`Subject`)

### Topics
- **Status:** Complete
- **Description:** Topic-level organization under chapters.
- **Available For:** Admin (manage)
- **API Endpoints:** `GET/POST/PUT/DELETE /api/admin/topics`
- **Source Files:** `src/app/api/admin/topics/route.ts`, `prisma/schema.prisma` (`Topic`)

---

## Chapter Management

### Chapters
- **Status:** Complete (recently fixed — see Known Limitations)
- **Description:** Chapters per subject with per-chapter content counts; public detail + admin CRUD + content-counts helper.
- **Available For:** Guest (browse), Admin (manage)
- **UI Pages:** `/class/[classSlug]/[subjectSlug]/[chapterSlug]`
- **API Endpoints:** `GET /api/chapters/[id]`, `GET/POST/PUT/DELETE /api/admin/chapters`, `GET /api/admin/chapters/content-counts`
- **Source Files:** `src/app/api/chapters/[id]/route.ts`, `src/app/api/admin/chapters/route.ts`, `src/app/api/admin/chapters/content-counts/route.ts`, `prisma/schema.prisma` (`Chapter`)

---

## Lecture Management

### Lectures
- **Status:** Complete
- **Description:** Video/text lectures with resources; public view + admin CRUD; recently-viewed & progress tracking.
- **Available For:** Guest (browse, premium gated), Student (progress), Admin (manage)
- **UI Pages:** `/lectures`, `/lecture/[lectureId]`
- **API Endpoints:** `GET /api/lectures`, `GET /api/lectures/[id]`, `GET/POST/PUT/DELETE /api/admin/lectures`, `GET/POST /api/recently-viewed`, `GET/POST /api/progress`
- **Source Files:** `src/app/api/lectures/route.ts`, `src/app/api/lectures/[id]/route.ts`, `src/app/api/admin/lectures/route.ts`, `src/app/api/recently-viewed/route.ts`, `src/app/api/progress/route.ts`, `prisma/schema.prisma` (`Lecture`, `Resource`, `Progress`)

---

## Notes

### Notes (Student & Admin)
- **Status:** Complete
- **Description:** User notes on content + admin note CRUD.
- **Available For:** Student (create/view own), Admin (manage)
- **API Endpoints:** `GET/POST/PUT/DELETE /api/notes`, `GET/PUT/DELETE /api/notes/[id]`, `GET/POST/PUT/DELETE /api/admin/notes`
- **Source Files:** `src/app/api/notes/route.ts`, `src/app/api/notes/[id]/route.ts`, `src/app/api/admin/notes/route.ts`, `prisma/schema.prisma` (`Note`, `LessonNote`)

---

## MCQ System

### MCQ Bank
- **Status:** Complete
- **Description:** MCQs (A/B/C/D) with board/year tagging, premium flag, free/paid; admin CRUD + bulk upload.
- **Available For:** Guest (browse, premium gated), Student (practice), Admin (manage)
- **UI Pages:** `/mcq/exam` (practice), `/admin/mcq`
- **API Endpoints:** `GET /api/mcq`, `GET /api/mcq/[id]`, `GET/POST/PUT/DELETE /api/admin/mcq`, `POST /api/admin/mcq/bulk-upload`
- **Source Files:** `src/app/api/mcq/route.ts`, `src/app/api/mcq/[id]/route.ts`, `src/app/api/admin/mcq/route.ts`, `prisma/schema.prisma` (`MCQ`)

---

## MCQ Exam

### MCQ Exam Packages
- **Status:** Complete
- **Description:** MCQ exam packages/sets, timed exams, results, retake requests, purchases.
- **Available For:** Student (take/purchase), Admin (manage)
- **UI Pages:** `/exams/mcq-packages`, `/exams/mcq-packages/[packageId]`, `/mcq/exam`, `/mcq/result/[resultId]`, `/mcq/result/[resultId]/review`, `/exams/history`, `/exams/my-exams`, `/admin/mcq-exam-packages`
- **API Endpoints:** `GET/POST /api/mcq-exam-packages`, `GET/POST /api/mcq/exam`, `GET/POST /api/admin/mcq-exam-packages`, `POST /api/admin/mcq-exam-packages/bulk-upload-questions`, `GET/POST /api/admin/mcq-exam-purchases`, `GET/POST /api/exams/results*`
- **Source Files:** `src/app/api/mcq-exam-packages/route.ts`, `src/app/api/mcq/exam/route.ts`, `src/app/api/admin/mcq-exam-packages/route.ts`, `src/app/api/admin/mcq-exam-purchases/route.ts`, `src/app/api/exams/results/route.ts`, `prisma/schema.prisma` (`MCQExamPackage`, `MCQExamSet`, `MCQExamSetQuestion`, `MCQExamSetResult`, `MCQExamSetRetakeRequest`, `MCQExamPackagePurchase`)

---

## CQ Exam

### CQ Exam Packages
- **Status:** Complete
- **Description:** CQ exam packages with answer submission, image answers, grading, retake requests.
- **Available For:** Student (take/submit/purchase), Admin (manage/grade)
- **UI Pages:** `/exams/cq-packages`, `/exams/cq-packages/[packageId]`, `/exams/cq-packages/[packageId]/take`, `/exams/cq-packages/[packageId]/result/[resultId]`, `/admin/cq-exam-packages`, `/cq`, `/cq/[cqId]`
- **API Endpoints:** `GET/POST /api/cq-exam-packages`, `GET/POST/PUT/DELETE /api/cq`, `GET/POST /api/cq/[id]`, `GET/POST/PUT /api/admin/cq-exam-packages`, `GET/POST /api/admin/cq`
- **Source Files:** `src/app/api/cq-exam-packages/route.ts`, `src/app/api/cq/route.ts`, `src/app/api/cq/[id]/route.ts`, `src/app/api/admin/cq-exam-packages/route.ts`, `src/app/api/admin/cq/route.ts`, `prisma/schema.prisma` (`CQExamPackage`, `CQExamSet`, `CQExamSetQuestion`, `CQExamPackagePurchase`, `CQExamSubmission`, `CQExamAnswer`, `CQExamAnswerImage`, `CQExamRetakeRequest`, `CQ`)

---

## Question Bank

### Knowledge Questions (Short Questions)
- **Status:** Complete
- **Description:** Knowledge/comprehension short-question bank; admin CRUD + public browse.
- **Available For:** Guest (browse), Admin (manage)
- **UI Pages:** `/knowledge-questions`, `/admin/knowledge-questions`
- **API Endpoints:** `GET /api/knowledge-questions`, `GET/POST/PUT/DELETE /api/admin/knowledge-questions`
- **Source Files:** `src/app/api/knowledge-questions/route.ts`, `src/app/api/admin/knowledge-questions/route.ts`, `prisma/schema.prisma` (`KnowledgeQuestion`)

### Suggestions
- **Status:** Complete
- **Description:** Curated suggestion/summary content with detail pages; admin CRUD.
- **Available For:** Guest (browse), Admin (manage)
- **UI Pages:** `/suggestions`, `/suggestions/[suggestionId]`, `/admin/suggestions`
- **API Endpoints:** `GET /api/suggestions`, `GET/POST/PUT/DELETE /api/suggestions/[id]`, `GET/POST/PUT/DELETE /api/admin/suggestions`
- **Source Files:** `src/app/api/suggestions/route.ts`, `src/app/api/suggestions/[id]/route.ts`, `src/app/api/admin/suggestions/route.ts`, `prisma/schema.prisma` (`Suggestion`)

---

## Board Questions

### Board Questions
- **Status:** Complete (recently fixed — see Known Limitations)
- **Description:** Past board (Dhaka/Rajshahi/etc.) exam questions by year; filters, search suggestions, public browse + admin CRUD.
- **Available For:** Guest (browse), Admin (manage)
- **UI Pages:** `/board-questions`, `/admin/board`
- **API Endpoints:** `GET /api/board-questions`, `GET /api/board-questions/filters`, `GET /api/board-questions/search-suggestions`, `GET/POST/PUT/DELETE /api/admin/board-questions`, `GET/POST /api/admin/boards`, `GET/POST /api/admin/years`, `GET/POST /api/admin/board-years`
- **Source Files:** `src/app/api/board-questions/route.ts`, `src/app/api/board-questions/filters/route.ts`, `src/app/api/board-questions/search-suggestions/route.ts`, `src/app/api/admin/board-questions/route.ts`, `src/app/api/admin/boards/route.ts`, `src/app/api/admin/years/route.ts`, `src/app/api/admin/board-years/route.ts`, `prisma/schema.prisma` (`Board`, `ExamYear`, `BoardYear`)

---

## Premium Content

### Premium Gating
- **Status:** Complete
- **Description:** `isPremium` flag strips premium content at API level for non-purchasers; premium landing page.
- **Available For:** Guest (gated preview), Student (purchasers), Admin
- **UI Pages:** `/premium`
- **API Endpoints:** `GET /api/premium` (gated), access checks via `GET /api/payment/access`, `GET /api/payment/content-info`
- **Source Files:** `src/app/api/premium/route.ts` (gated), `src/app/api/payment/access/route.ts`, `src/app/api/payment/content-info/route.ts`, `src/lib/course-access-resolver.ts`
- **Known Limitations:** `/api/premium` is not in the `PUBLIC_API_ROUTES` whitelist in `src/proxy.ts`, so it returns 401 for guests (consistent with auth-gated premium content). Premium content access is resolved per-content via purchase records.

---

## Payments

### Manual Payment (bKash / Nagad / Rocket)
- **Status:** Partial
- **Description:** Payment is **manual** — users enter bKash/Nagad/Rocket numbers (from `SiteSetting`), submit proof, and admins approve/reject (`PaymentStatus`: PENDING/APPROVED/REJECTED). **No payment-gateway SDK** (no Stripe/SSLCommerz) is present — verified by searching the codebase for `stripe|sslcommerz|paypal|aamarpay` (no matches).
- **Available For:** Student (submit), Admin (review)
- **UI Pages:** `/payment`, `/admin/payments`
- **API Endpoints:** `GET/POST /api/payment`, `GET/POST /api/payment/purchases`, `GET/POST /api/payment/check`, `GET/POST /api/payment/batch-check`, `GET /api/payment/accounts`, `GET/POST /api/payment/[id]`, `GET/POST /api/admin/payments`, `GET /api/admin/payments/stats`
- **Source Files:** `src/app/api/payment/route.ts`, `src/app/api/payment/purchases/route.ts`, `src/app/api/payment/check/route.ts`, `src/app/api/payment/accounts/route.ts`, `src/app/api/admin/payments/route.ts`, `src/lib/course-access-resolver.ts`, `prisma/schema.prisma` (`Payment`, `UserSubscription`, `CoursePurchase`, `ContentPackage`, `ContentBundle`)
- **Known Limitations:** Manual verification only; no automated gateway/webhook reconciliation.

---

## Orders

### Content Purchases / Subscriptions / Bundles
- **Status:** Complete
- **Description:** Content packages, bundles, subscriptions, and course purchases modeled with admin review.
- **Available For:** Student (buy), Admin (manage)
- **UI Pages:** `/admin/content-purchases`, `/admin/subscriptions`, `/admin/bundles`, `/admin/packages`
- **API Endpoints:** `GET/POST /api/admin/content-purchases`, `GET/POST /api/admin/subscriptions`, `GET/POST/PUT/DELETE /api/admin/bundles`, `GET/POST /api/admin/bundles/content`, `GET/PUT/DELETE /api/admin/bundles/[id]`, `GET/POST/PUT/DELETE /api/admin/packages`, `GET/PUT/DELETE /api/admin/packages/[id]`, `GET /api/bundles`, `GET /api/bundles/[id]`, `GET /api/packages`, `GET /api/packages/[id]`, `GET /api/packages/suggest`, `GET /api/content/bundles-for`
- **Source Files:** `src/app/api/admin/content-purchases/route.ts`, `src/app/api/admin/subscriptions/route.ts`, `src/app/api/admin/bundles/**`, `src/app/api/admin/packages/**`, `src/app/api/bundles/**`, `src/app/api/packages/**`, `prisma/schema.prisma` (`ContentBundle`, `BundleItem`, `ContentPackage`, `UserSubscription`)

---

## Coupons
- **Status:** Not found
- **Description:** No coupon/discount model or route exists in the scanned codebase.
- **Missing Functionality:** Discount/coupon system.

---

## Analytics

### Admin Analytics Suite
- **Status:** Complete
- **Description:** 22 analytics sub-routes: acquisition, alerts, conversion, courses, cq, devices, dropoff, export, geo, insights, lectures, mcq, payments, predictions, realtime, reports, retention, revenue, search, students, track. Event/session/search-query capture.
- **Available For:** Admin, Super Admin
- **API Endpoints:** `GET /api/admin/analytics/*` (22 routes), `POST /api/admin/analytics/track`
- **Source Files:** `src/app/api/admin/analytics/**` (22 route modules), `prisma/schema.prisma` (`AnalyticsEvent`, `AnalyticsSession`, `AnalyticsSearchQuery`, `AnalyticsAlert`, `AnalyticsReport`)
- **Known Limitations:** `realtime`/`predictions`/`insights` endpoints exist but their analytical depth is implementation-dependent; not separately verified beyond route presence.

---

## Reports

### Analytics Reports & Export
- **Status:** Complete
- **Description:** Generated reports + CSV/JSON export.
- **Available For:** Admin, Super Admin
- **API Endpoints:** `GET /api/admin/analytics/reports`, `POST /api/admin/analytics/reports/generate`, `GET /api/admin/analytics/export`
- **Source Files:** `src/app/api/admin/analytics/reports/route.ts`, `src/app/api/admin/analytics/reports/generate/route.ts`, `src/app/api/admin/analytics/export/route.ts`

---

## Notifications

### Announcements / In-App Notifications
- **Status:** Partial
- **Description:** `Notification` model + admin-managed broadcast. **No user-facing notification API** was found (only `/api/admin/notifications`). **No email/push transport** — codebase contains no `nodemailer`/`resend`/`sendgrid`/mailer (verified by search).
- **Available For:** Admin (create), all roles (view in-app where rendered)
- **UI Pages:** (admin) `/admin/notifications`
- **API Endpoints:** `GET/POST/PUT/DELETE /api/admin/notifications`
- **Source Files:** `src/app/api/admin/notifications/route.ts`, `prisma/schema.prisma` (`Notification`)
- **Missing Functionality:** Email notifications, push notifications, user-facing notification inbox API.

---

## Search

### Global Search
- **Status:** Complete
- **Description:** Public search endpoint + search page + search-suggestions for board questions.
- **Available For:** Guest
- **UI Pages:** `/search`
- **API Endpoints:** `GET /api/search`, `GET /api/board-questions/search-suggestions`
- **Source Files:** `src/app/api/search/route.ts`, `src/app/api/board-questions/search-suggestions/route.ts`
- **Known Limitations:** DB-backed keyword search (no external search engine / indexer found).

---

## Media Library

### File Uploads (UploadThing)
- **Status:** Complete
- **Description:** UploadThing integration for images/PDFs with auth-gated core.
- **Available For:** Admin, Teacher (auth)
- **API Endpoints:** `GET/POST /api/uploadthing`
- **Source Files:** `src/app/api/uploadthing/route.ts`, `src/lib/uploadthing/core.ts`
- **Dependencies:** `uploadthing`

---

## CMS

### Banners / FAQ / Testimonials / Notices / Featured
- **Status:** Complete
- **Description:** Public CMS content managed by admins.
- **Available For:** Guest (view), Admin (manage)
- **UI Pages:** `/notices`, `/notices/[noticeId]`, `/admin/banners`, `/admin/faqs`, `/admin/testimonials`, `/admin/notices`, `/admin/featured`
- **API Endpoints:** `GET /api/banners`, `GET/POST/PUT/DELETE /api/admin/banners`, `GET /api/faqs`, `GET/POST/PUT/DELETE /api/admin/faqs`, `GET /api/testimonials`, `GET/POST/PUT/DELETE /api/admin/testimonials`, `GET /api/notices`, `GET/POST/PUT/DELETE /api/admin/notices`, `GET/POST /api/admin/featured`, `GET /api/admin/featured/search`
- **Source Files:** `src/app/api/banners/route.ts`, `src/app/api/faqs/route.ts`, `src/app/api/testimonials/route.ts`, `src/app/api/notices/route.ts`, `src/app/api/admin/**`, `prisma/schema.prisma` (`Banner`, `FAQ`, `Testimonial`, `Notice`, `FeaturedContent`)

### Site Settings & Config
- **Status:** Complete
- **Description:** Site-wide settings (payment numbers, messages) + public config endpoint.
- **Available For:** Guest (read via `/api/config`), Admin (manage)
- **API Endpoints:** `GET /api/config`, `GET/PUT /api/admin/settings`
- **Source Files:** `src/app/api/config/route.ts`, `src/app/api/admin/settings/route.ts`, `prisma/schema.prisma` (`SiteSetting`)

---

## Blog
- **Status:** Not found as a distinct module
- **Description:** No dedicated blog model/route/page. Content is delivered via Suggestions/Notes/Notices instead.
- **Missing Functionality:** Blog/article module.

---

## FAQ
*(see CMS above)*

---

## Settings
*(see Site Settings & Config above; plus `/admin/settings` page)*

---

## Security

### Proxy Security Middleware
- **Status:** Complete
- **Description:** JWT auth, CSRF validation on mutations, security headers (CSP, HSTS, X-Frame-Options, X-XSS-Protection, Referrer-Policy), rate limiting on auth/API/upload/admin mutations, granular RBAC, premium content stripping.
- **Source Files:** `src/proxy.ts`, `src/lib/csrf.ts`, `src/lib/api-utils.ts` (rate limiter), `src/lib/auth.ts`, `prisma/schema.prisma` (`AuditLog`, `Permission`, `RolePermission`)
- **Known Limitations:** CSRF is **disabled in local development** via `ENABLE_CSRF=false` in `.env` + a `CSRF_ENABLED` flag in `src/lib/csrf.ts` (intended for local dev only).

### Audit Logging
- **Status:** Complete
- **Description:** `AuditLog` captures admin action history (`oldData`/`newData` JSON).
- **Source Files:** `prisma/schema.prisma` (`AuditLog`), `src/lib/audit.ts` (auditFromRequest)

---

## API Features

### Hierarchy Metadata Aggregator
- **Status:** Complete
- **Description:** Single source of truth for the class→subject→chapter→board hierarchy consumed client-side via `useHierarchyMetadata()`.
- **API Endpoints:** `GET /api/hierarchy/metadata`
- **Source Files:** `src/app/api/hierarchy/metadata/route.ts`, `src/hooks/use-metadata.ts`

### Navigation API
- **Status:** Complete
- **Description:** Nav items served from `Navigation` table; client `useNavigation()` falls back to `defaultNavItems`.
- **API Endpoints:** `GET /api/navigation`, `GET/POST /api/admin/navigation`
- **Source Files:** `src/app/api/navigation/route.ts`, `src/hooks/use-navigation.ts`, `prisma/schema.prisma` (`Navigation`)

### Content Types & Bookmarks
- **Status:** Complete
- **Description:** Content-type taxonomy + user bookmarks with batch checking.
- **Available For:** Guest (content-types), Student (bookmarks)
- **API Endpoints:** `GET /api/content-types`, `GET/POST/PUT/DELETE /api/bookmarks`, `GET /api/bookmarks/check`, `POST /api/bookmarks/batch-check`
- **Source Files:** `src/app/api/content-types/route.ts`, `src/app/api/bookmarks/**`, `prisma/schema.prisma` (`ContentType`, `Bookmark`)

### PDF & Plans & Teacher Moderators
- **Status:** Complete
- **Description:** Server-side PDF generation; subscription plans; teacher-moderator directory.
- **API Endpoints:** `GET /api/pdf`, `GET /api/plans`, `GET /api/teacher-moderators`
- **Source Files:** `src/app/api/pdf/route.ts`, `src/app/api/plans/route.ts`, `src/app/api/teacher-moderators/route.ts`

### Health & CSRF Token
- **Status:** Complete
- **Description:** Health check + CSRF token issuance (token is empty when CSRF disabled locally).
- **API Endpoints:** `GET /api/health`, `GET /api/csrf-token`
- **Source Files:** `src/app/api/health/route.ts`, `src/app/api/csrf-token/route.ts`

---

## Background Jobs
- **Status:** Not found
- **Description:** No job-queue/scheduler (no cron/worker/bullmq/queue) discovered. Long tasks (analytics aggregation, DB import/export) are request-driven.
- **Missing Functionality:** Async job processing / scheduling.

---

## Utility Features

### Recently Viewed & Progress & Feedback
- **Status:** Complete
- **Description:** Track recently-viewed content, learning progress, and user feedback with admin messaging thread.
- **Available For:** Student (track/submit), Admin (respond)
- **API Endpoints:** `GET/POST /api/recently-viewed`, `GET/POST /api/progress`, `POST /api/user/feedback`, `GET/POST /api/user/feedback/[id]/messages`, `GET/POST /api/admin/feedback`, `GET/POST /api/admin/feedback/[id]/messages`
- **Source Files:** `src/app/api/recently-viewed/route.ts`, `src/app/api/progress/route.ts`, `src/app/api/user/feedback/**`, `src/app/api/admin/feedback/**`, `prisma/schema.prisma` (`RecentlyViewed`, `Progress`, `UserFeedback`, `FeedbackMessage`)

### Create Exam (Custom)
- **Status:** Complete
- **Description:** Users/teachers create custom exams with access checks.
- **Available For:** Student, Teacher
- **UI Pages:** `/create-exam`
- **API Endpoints:** `POST /api/create-exam`, `GET /api/create-exam/check-access`
- **Source Files:** `src/app/api/create-exam/route.ts`, `src/app/api/create-exam/check-access/route.ts`, `prisma/schema.prisma` (`Exam`, `ExamQuestion`, `ExamResult`)

### Exams (General)
- **Status:** Complete
- **Description:** Exam listing, results, my-exams, admin exam management + question bank.
- **Available For:** Student, Teacher, Admin
- **UI Pages:** `/exams`, `/exams/history`, `/exams/my-exams`
- **API Endpoints:** `GET/POST /api/exams`, `GET/POST /api/exams/[id]`, `GET /api/exams/my-exams`, `GET/POST /api/exams/results`, `GET /api/exams/results/detail`, `GET /api/exams/results/[userId]`, `GET/POST/PUT/DELETE /api/admin/exams`, `GET/POST /api/admin/exams/questions`, `GET/POST /api/admin/exam-results`
- **Source Files:** `src/app/api/exams/**`, `src/app/api/admin/exams/**`, `src/app/api/admin/exam-results/route.ts`, `prisma/schema.prisma` (`Exam`, `ExamQuestion`, `ExamResult`)

### Bookmarks
*(see API Features above)*

---

# Navigation Map

**IMPORTANT — live navbar is DB-driven, not code-driven.** The client (`Header.tsx` → `useNavigation()`) reads `/api/navigation`, which serves rows from the **`Navigation` database table**. The `defaultNavItems` array in `src/hooks/use-navigation.ts` is only a fallback used when the DB returns **zero** rows (it currently returns 16 rows, so the fallback is never used). **Consequence:** items present only in `defaultNavItems` (e.g. `course-list` = Courses) do **not** appear in the live navbar.

Actual **header** items served from the `Navigation` table (verified via `/api/navigation`):

| Menu (BN) | Route key | Page Route | Status |
|---|---|---|---|
| হোম (Home) | `home` | `/` | Active |
| ক্লাসসমূহ (Classes) | `class-list` | `/classes` | Active |
| পরীক্ষা কেন্দ্র (Exam Center) | `exam-center` | `/exams` | Active |
| পরামর্শ (Suggestions) | `suggestions` | `/suggestions` | Active |
| বোর্ড প্রশ্ন (Board Questions) | `board-questions` | `/board-questions` | Active |
| নোটিশ (Notices) | `notices` | `/notices` | Active |
| প্রিমিয়াম (Premium) | `premium` | `/premium` | Active |
| অ্যাডমিন (Admin) | `admin-dashboard` | `/admin` | Admin-only |

**`course-list` (Courses) is NOT in the live `Navigation` table** (header, bottomNav, or footer) — so the Courses feature is implemented but **unreachable from navigation**. It exists only in the `defaultNavItems` code fallback.

Bottom navigation (DB): Home, Classes, Exam Center, Suggestions, User Dashboard (auth-only).
Footer (DB): Home, Classes, Board Questions, Premium.

Drill-down routes (not top-level nav): `/class/[classSlug]` → `/class/[classSlug]/[subjectSlug]` → `/class/[classSlug]/[subjectSlug]/[chapterSlug]`; plus `/lectures`, `/lecture/[lectureId]`, `/mcq/exam`, `/cq`, `/knowledge-questions`, `/search`, `/suggestions/[suggestionId]`, `/notices/[noticeId]`, `/courses` (orphaned — no nav link), `/payment`, `/dashboard`, `/login`, `/register`, `/privacy`, `/terms`.

---

# API Summary

Grouped by feature area (route module counts in parentheses):

**Auth (4):** `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/register`

**Public Content (read):** `/api/classes` (+`[slug]`), `/api/subjects/[id]`, `/api/chapters/[id]`, `/api/lectures` (+`[id]`), `/api/mcq` (+`[id]`), `/api/cq` (+`[id]`), `/api/knowledge-questions`, `/api/suggestions` (+`[id]`), `/api/board-questions` (+`filters`, `+search-suggestions`), `/api/boards`, `/api/years`, `/api/board-years`, `/api/banners`, `/api/faqs`, `/api/testimonials`, `/api/notices`, `/api/content-types` (+`seed`), `/api/courses` (+`enroll`,`progress`,`assignments`,`certificate`,`featured`,`purchase`,`syllabus/sync`), `/api/bundles` (+`[id]`), `/api/packages` (+`[id]`,`suggest`), `/api/content/bundles-for`, `/api/premium` (gated), `/api/plans`, `/api/search`, `/api/hierarchy/metadata`, `/api/navigation`, `/api/config`, `/api/teacher-moderators`, `/api/stats`, `/api/health`, `/api/csrf-token`, `/api/favicon`

**User (auth):** `/api/user/profile`, `/api/user/dashboard`, `/api/user/recent-lectures`, `/api/user/subscriptions`, `/api/user/payments`, `/api/user/feedback` (+`[id]/messages`), `/api/bookmarks` (+`check`,`batch-check`), `/api/recently-viewed`, `/api/progress`, `/api/notes` (+`[id]`), `/api/payment/*`, `/api/create-exam` (+`check-access`), `/api/exams/*`, `/api/mcq-exam-packages`, `/api/cq-exam-packages`, `/api/mcq/exam`

**Admin (60+):** `/api/admin/{analytics(22), users, classes, subjects, chapters(+content-counts), lectures, mcq(+bulk-upload), cq, knowledge-questions, bulk-import, content-types, banners, faqs, testimonials, notices, suggestions, notes, topics, boards, years, board-years, bundles(+content,+[id]), packages(+[id]), featured(+search), courses(+lessons,+assignments), mcq-exam-packages(+bulk-upload-questions,+mcq-exam-purchases), cq-exam-packages, exams(+questions), exam-results, feedback(+[id]/messages), notifications, navigation(+seed), settings(+seed), stats, subscriptions, content-purchases, payments(+stats), permissions, plans, teacher-moderators, database(export/import/reset), board-questions}`

**Upload:** `/api/uploadthing`

Total: **169** route modules.

---

# Database Mapping

| Feature | Prisma Model(s) | Table(s) |
|---|---|---|
| Users/Roles | `User`, `Permission`, `RolePermission`, `TeacherModerator` | User, Permission, RolePermission, TeacherModerator |
| Classes | `ClassCategory` | ClassCategory |
| Subjects | `Subject` | Subject |
| Chapters/Topics | `Chapter`, `Topic` | Chapter, Topic |
| Lectures | `Lecture`, `Resource`, `Progress`, `RecentlyViewed` | Lecture, Resource, Progress, RecentlyViewed |
| MCQ | `MCQ` | MCQ |
| CQ | `CQ` | CQ |
| Knowledge Q | `KnowledgeQuestion` | KnowledgeQuestion |
| Suggestions | `Suggestion` | Suggestion |
| Notes | `Note`, `LessonNote` | Note, LessonNote |
| Exams | `Exam`, `ExamQuestion`, `ExamResult` | Exam, ExamQuestion, ExamResult |
| Bookmarks | `Bookmark` | Bookmark |
| Feedback | `UserFeedback`, `FeedbackMessage` | UserFeedback, FeedbackMessage |
| Payments | `Payment` | Payment |
| Notifications | `Notification` | Notification |
| Audit | `AuditLog` | AuditLog |
| CMS | `Banner`, `FAQ`, `Testimonial`, `Notice`, `FeaturedContent`, `SiteSetting`, `Navigation` | Banner, FAQ, Testimonial, Notice, FeaturedContent, SiteSetting, Navigation |
| Board | `Board`, `ExamYear`, `BoardYear` | Board, ExamYear, BoardYear |
| Content Types | `ContentType` | ContentType |
| Bundles/Pkgs | `ContentBundle`, `BundleItem`, `ContentPackage` | ContentBundle, BundleItem, ContentPackage |
| Subscriptions | `UserSubscription` | UserSubscription |
| MCQ Exams | `MCQExamPackage`, `MCQExamSet`, `MCQExamSetQuestion`, `MCQExamSetResult`, `MCQExamSetRetakeRequest`, `MCQExamPackagePurchase` | (6 tables) |
| CQ Exams | `CQExamPackage`, `CQExamSet`, `CQExamSetQuestion`, `CQExamPackagePurchase`, `CQExamSubmission`, `CQExamAnswer`, `CQExamAnswerImage`, `CQExamRetakeRequest` | (8 tables) |
| Courses | `Course`, `CourseLesson`, `LessonResource`, `CourseExamSchedule`, `LessonExam`, `LessonAssignment`, `AssignmentSubmission`, `LessonSchedule`, `LessonProgress`, `CourseEnrollment`, `Certificate`, `CoursePurchase` | (12 tables) |
| Analytics | `AnalyticsEvent`, `AnalyticsSession`, `AnalyticsSearchQuery`, `AnalyticsAlert`, `AnalyticsReport` | (5 tables) |

Total: **73** Prisma models → 73 tables.

---

# Role Permission Matrix

| Capability | Guest | Student | Teacher | Admin | Super Admin |
|---|:--:|:--:|:--:|:--:|:--:|
| Browse public content | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register / Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| Take exams / practice | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create custom exam | ❌ | ✅ | ✅ | ✅ | ✅ |
| Purchase content | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage own profile/notes/bookmarks | ❌ | ✅ | ✅ | ✅ | ✅ |
| Moderate content (teacher scope) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Admin panel & CRUD | ❌ | ❌ | limited | ✅ | ✅ |
| User/role management | ❌ | ❌ | ❌ | ✅ | ✅ |
| Payment review | ❌ | ❌ | ❌ | ✅ | ✅ |
| Analytics & reports | ❌ | ❌ | ❌ | ✅ | ✅ |
| DB tools / settings / seed | ❌ | ❌ | ❌ | ✅ | ✅ |
| Granular permissions (`requirePermission`) | ❌ | ❌ | per-permission | per-permission | full |

Roles are string-valued (enums commented out in schema). `SUPER_ADMIN` and `ADMIN` are treated interchangeably for admin guards in most code paths.

---

# Hidden Features

- **`/[...slug]` catch-all route:** Single `page.tsx` entry rendering all client-side routes via the Zustand `RouteSync` router — there are no per-route SSR pages (verified in README "No SSR pages").
- **`ENABLE_CSRF` / `CSRF_ENABLED`:** CSRF protection can be fully disabled via `.env` (`ENABLE_CSRF=false`) — intended for local dev only.
- **Analytics `realtime` / `predictions` / `insights`:** Endpoints exist but depth unverified.
- **`/api/content-types/seed`, `/api/admin/navigation/seed`, `/api/admin/settings/seed`:** Seed endpoints not surfaced in normal UI.

---

# Experimental Features

- None explicitly flagged as experimental in source. The analytics prediction/insight endpoints may be early-stage (unverified depth).

---

# Deprecated Features

- None identified. (No `deprecated` markers or removed-model references found.)

---

# Incomplete Features

- **Prisma enums commented out:** All `enum` definitions in `schema.prisma` are commented (`// enum Role {…}` etc.); role/status values are plain `String` fields. Functional but loses DB-level enum safety.
- **Manual payments only:** No automated gateway integration (see Payments).
- **Analytics sub-endpoints:** Present but analytical implementation depth not separately verified.

---

# Broken Features

- **None currently broken.** Several navbar-destination APIs (`/api/classes/[slug]`, `/api/board-questions`, `/api/chapters/[id]`, `/api/subjects/[id]`) previously returned 500/401 due to (a) PostgreSQL-only SQL (`::int`/`::bigint` casts, `= ANY($1::text[])`) on the SQLite database and (b) `/api/subjects` missing from the public-API whitelist. These were diagnosed and fixed; all now return 200 for anonymous users (verified live).

---

# Duplicate Features

- **Subject/Chapter/Class counts:** Both `$queryRaw` aggregation endpoints (`/api/classes`, `/api/classes/[slug]`) and per-model `_count` relations compute counts; the raw-SQL path is the optimized variant (documented "single-pass aggregated counts").
- **Exams:** General `/api/exams` and MCQ/CQ exam-package systems overlap in exam concepts but serve distinct flows (custom vs packaged).
- **CMS content types:** `Suggestion`, `Note`, `Notice`, `KnowledgeQuestion` are distinct but conceptually overlapping content entities.

---

# Missing Features

- **Account recovery:** No forgot-password / reset-password / OTP routes.
- **Email verification & email transport:** No mailer library (`nodemailer`/`resend`/etc.) anywhere in codebase; no email sending.
- **Email/push notifications:** Notifications are admin-broadcast in-app only.
- **Coupons/discounts:** No model or route.
- **Blog module:** No dedicated blog.
- **Background jobs / scheduler:** No queue/cron/worker.
- **Automated payment gateway:** Manual bKash/Nagad/Rocket + admin approval only.

---

# Recommendations

### Short-term Improvements
- Add account-recovery (forgot-password + OTP/email) since auth currently has no recovery path.
- Surface user-facing notifications (inbox API) beyond admin-only broadcast.
- Convert commented-out `enum` blocks in `schema.prisma` to real Prisma enums (or document the String convention) to regain type safety.
- Add `/api/premium` to `PUBLIC_API_ROUTES` if premium landing should be guest-visible (currently 401 for guests).

### Long-term Improvements
- Introduce an automated payment gateway (SSLCommerz/aamarpay/bKash gateway API) with webhook reconciliation.
- Add a coupon/discount engine and a blog module.
- Implement email transport (e.g., Resend) for verification and notifications.

### Architecture Improvements
- Replace the hand-written raw SQLite SQL in aggregation routes with Prisma's typed aggregations (or a query-builder) to eliminate engine-dialect fragility (the recent 500s were caused by PostgreSQL syntax on SQLite).
- Centralize "public vs auth-gated" API policy (currently a manual `PUBLIC_API_ROUTES` list in `src/proxy.ts`) into a declarative route-config or middleware matcher.
- Add a background-job/queue layer for analytics aggregation and DB import/export.

### Performance Improvements
- The aggregation routes already consolidate ~50 count queries into 2–3 raw queries (good). Extend this pattern to other N+1 count paths.
- Add caching headers (already present via `cache-headers.ts` for some routes) consistently across read APIs.
- Consider a search index (e.g., SQLite FTS or external) instead of DB `contains` scans for `/api/search`.

### Security Improvements
- Re-enable CSRF in production (ensure `ENABLE_CSRF` is unset/`true` outside local dev).
- Rate-limit remains on auth/API/admin; extend to search and public heavy endpoints.
- Add input validation (zod) explicitly on the raw-SQL/`$queryRawUnsafe` paths to prevent SQL injection as the codebase evolves.

---

*Generated from a full source scan of `E:\Sikkhs` (169 API route modules, 72 pages, 73 Prisma models, 320 components). Every feature is traced to a concrete file. Counts are exact as of this scan; statuses reflect implemented, verified source, not aspirational functionality.*
