---
phase: XX-course-admin-ui-audit
reviewed: 2025-07-14T00:00:00Z
depth: deep
files_reviewed: 12
files_reviewed_list:
  - src/app/api/admin/courses/route.ts
  - src/app/api/admin/courses/lessons/route.ts
  - src/app/api/admin/courses/assignments/route.ts
  - src/app/api/admin/analytics/courses/route.ts
  - src/app/api/courses/route.ts
  - src/app/api/courses/syllabus/sync/route.ts
  - src/app/api/courses/purchase/route.ts
  - src/app/api/courses/progress/route.ts
  - src/app/api/courses/featured/route.ts
  - src/app/api/courses/enroll/route.ts
  - src/app/api/courses/assignments/route.ts
  - src/services/api/course-admin.service.ts
findings:
  critical: 8
  warning: 18
  info: 6
  total: 32
status: issues_found
---

# Phase XX: Course API & Service Layer Backend Audit

**Reviewed:** 2025-07-14
**Depth:** deep (cross-file analysis, call chains, Prisma schema review)
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Reviewed all 12 course-related API route handlers, the admin course service, and the Prisma schema for Course, Lesson, Assignment, and ExamSchedule models. Found **8 critical issues** (unbounded queries, missing transaction wrapping, missing input validation on mutation endpoints, auth-before-DB inversion), **18 warnings** (race conditions, missing pagination, code duplication, inconsistent response contracts, missing index), and **6 info items** (hardcoded strings, redundant computation, `any` types).

---

## Critical Issues

### CR-01: Delete endpoint skips transaction and runs redundant manual cascades

**File:** `src/app/api/admin/courses/route.ts:393-400`
**Issue:** The `delete` action calls `db.coursePurchase.deleteMany`, `db.courseLesson.deleteMany`, and `db.courseExamSchedule.deleteMany` before `db.course.delete`. These three models all declare `onDelete: Cascade` on their `Course` relation in Prisma, so the manual `deleteMany` calls are redundant. More importantly, they are not wrapped in `db.$transaction(...)`. If `db.course.delete` fails after the manual deletes succeed, the database is left with orphaned (actually deleted) child rows while the parent `Course` still exists. This is a data-integrity risk.
**Fix:**
```typescript
case 'delete': {
  const { id } = body
  if (!id) return apiError('Course ID required', 400)
  // Rely on Prisma onDelete: Cascade; wrap in transaction for atomicity
  await db.$transaction([
    db.course.delete({ where: { id } }),
  ])
  return apiResponse({ success: true })
}
```

### CR-02: Analytics endpoint loads ALL lesson progress records with no filter

**File:** `src/app/api/admin/analytics/courses/route.ts:32-37`
**Issue:** `db.lessonProgress.findMany({ select: { completed: true } })` has no `where` clause. As the platform scales, this query loads every `LessonProgress` row ever written into memory, groups them in JS, and computes averages. This will exhaust memory and crash the server.
**Fix:**
```typescript
db.lessonProgress.findMany({
  where: { createdAt: { gte: fromDate, lte: toDate } },
  select: { completed: true },
}).then((results) => ({
  _count: results.length,
  _sum: { completed: results.filter((r) => r.completed).length },
})),
```

### CR-03: Detail endpoint includes all lessons and children without pagination

**File:** `src/app/api/admin/courses/route.ts:50-67`
**Issue:** The `detail` action fetches `course.lessons` with nested `exams`, `assignments`, `schedules`, `notes`, and `resources` — all unbounded. A course with 1,000 lessons and 20 assignments per lesson produces a response with 20,000+ assignment objects. This will time out or OOM in production.
**Fix:** Add a `lessonsPage` / `lessonsLimit` param, or use Prisma pagination (`skip`, `take`) on the lessons include, or create a separate `/admin/courses/{id}/lessons` endpoint for paginated lesson loading.

### CR-04: Student-progress endpoint issues unbounded per-course queries

**File:** `src/app/api/admin/courses/route.ts:232-326`
**Issue:** Similar to CR-03 — `db.courseLesson.findMany({ where: { courseId } })`, `db.lessonExam.findMany({ where: { lesson: { courseId } } })`, `db.courseExamSchedule.findMany({ where: { courseId } })`, and the subsequent exam-set queries are all unbounded. For a large course this returns thousands of records.
**Fix:** Introduce pagination or stream results. At minimum, cap `take` on lessons and batch exam-set IDs.

### CR-05: Progress POST upserts without verifying lesson belongs to course

**File:** `src/app/api/courses/progress/route.ts:145-180`
**Issue:** `db.lessonProgress.upsert({ where: { userId_lessonId: { userId, lessonId } }, ... })` creates a `LessonProgress` record using the caller-supplied `courseId` and `lessonId` without verifying the lesson actually belongs to that course. A user could set `courseId: 'A', lessonId: 'B'` where lesson B is in course Z, corrupting progress analytics.
**Fix:**
```typescript
const lesson = await db.courseLesson.findUnique({
  where: { id: lid },
  select: { courseId: true },
})
if (!lesson || lesson.courseId !== courseId) {
  return apiError('Lesson does not belong to this course', 400)
}
```

### CR-06: Syllabus-sync endpoint runs DB query before auth check

**File:** `src/app/api/courses/syllabus/sync/route.ts:6-34`
**Issue:** `db.course.findUnique(...)` executes on line 12 before `await withAuth(request)` on line 33. An unauthenticated request costs a DB round-trip and leaks whether a course ID exists via timing/error differences.
**Fix:**
```typescript
export async function POST(request: Request) {
  const authResult = await withAuth(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = authResult.user.id

  const body = await request.json()
  const { courseId } = body
  // ... rest of logic
}
```

### CR-07: No input validation on create/update endpoints — accepts malformed slugs, prices, statuses

**File:** `src/app/api/admin/courses/route.ts:348-390`
**Issue:** The `create` action accepts `title`, `slug`, `price`, `status`, etc. as raw JSON with no Zod schema validation. Effects:
- `slug` with spaces or special chars breaks URL routing.
- `price` can be negative or non-numeric, silently coerced via `price || 0`.
- `status` accepts any string and uppercases it; typos like `"PUBLISED"` pass through to the DB.
- `classId` / `subjectId` are not checked for existence.

**Fix:**
```typescript
const schema = z.object({
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().nullable().optional(),
  isPremium: z.boolean().optional(),
  price: z.number().nonNegative().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  classId: z.string().uuid().nullable().optional(),
  subjectId: z.string().uuid().nullable().optional(),
})
const validated = validateBody(schema, body)
if ('error' in validated) return validated.error
const { title, slug, ... } = validated.data
```

### CR-08: Student-progress action drops enrollment data when purchase and enrollment both exist

**File:** `src/app/api/admin/courses/route.ts:73-97`
**Issue:** `students` flattens purchases and enrollments into one array keyed by `user.id`. Purchases are mapped first (line 89-90), then enrollments are filtered by the `seen` Set (line 92-96). If a user has both an active purchase and an active enrollment, the enrollment record is silently dropped. The admin sees `source: 'purchase'` and loses `enrolledAt`, `type`, etc.
**Fix:** Merge records instead of filtering, or return an array with a `sources` array.

---

## Warnings

### WR-01: Race condition in free-course enrollment — 500 on duplicate instead of 409

**File:** `src/app/api/courses/enroll/route.ts:22-42`
**Issue:** Check-then-create pattern:
```typescript
const existing = await db.courseEnrollment.findUnique({ where: { userId_courseId } })
if (existing) return apiResponse({ enrollment: existing, alreadyEnrolled: true })
// ...
enrollment = await db.courseEnrollment.create({ ... })
```
Concurrent requests pass the `findUnique` check and hit the `@@unique([userId, courseId])` constraint. Prisma throws `P2002`, the generic `catch` returns 500, and the user sees a server error instead of a graceful "already enrolled" response.
**Fix:** Use `upsert` or catch `PrismaClientKnownRequestError` with code `P2002` and return the existing record.

### WR-02: Race condition in assignment submission — 500 on duplicate instead of 400

**File:** `src/app/api/courses/assignments/route.ts:78-86`
**Issue:** Same check-then-create pattern as WR-01. Concurrent submissions hit `@@unique([assignmentId, userId])` and throw `P2002`, surfacing as 500.
**Fix:** Use `upsert` or catch the unique-violation error code and return `apiError('Already submitted', 400)`.

### WR-03: Reorder endpoint updates `displayOrder` without validating lesson ownership

**File:** `src/app/api/admin/courses/lessons/route.ts:123-129`
**Issue:**
```typescript
await db.$transaction(lessonIds.map((id, i) =>
  db.courseLesson.update({ where: { id }, data: { displayOrder: i } })
))
```
If `lessonIds` contains lessons from another course, their `displayOrder` is overwritten. The `courseId` body param is never used to validate that the lessons belong to that course.
**Fix:**
```typescript
const lessons = await db.courseLesson.findMany({
  where: { id: { in: lessonIds }, courseId },
  select: { id: true },
})
if (lessons.length !== lessonIds.length) return apiError('Some lessons do not belong to this course', 400)
```

### WR-04: Bulk-grade does not verify the assignment exists before updating

**File:** `src/app/api/admin/courses/assignments/route.ts:205-218`
**Issue:** `db.assignmentSubmission.updateMany({ where: { assignmentId, status: 'submitted' } })` silently updates 0 rows if the `assignmentId` does not exist. The response is `{ count: 0 }` with no indication of failure.
**Fix:**
```typescript
const assignment = await db.lessonAssignment.findUnique({ where: { id: assignmentId } })
if (!assignment) return apiError('Assignment not found', 404)
```

### WR-05: Grade action accepts `marks` without range validation

**File:** `src/app/api/admin/courses/assignments/route.ts:185-203`
**Issue:** `marks` (a Float) is accepted from the request body with no lower/upper bounds. An admin can submit `marks: -50` or `marks: 99999`, corrupting grade data.
**Fix:**
```typescript
if (typeof marks !== 'number' || marks < 0 || marks > 100) {
  return apiError('Marks must be between 0 and 100', 400)
}
```

### WR-06: Add-exam-schedule does not validate `examType` enum

**File:** `src/app/api/admin/courses/route.ts:404-418`
**Issue:** `examType` is accepted as a raw string. If the client sends `"MCQQ"` or `""`, the DB stores it (Prisma `String` field) and downstream matching in `matchSet` breaks.
**Fix:**
```typescript
if (!['MCQ', 'CQ'].includes(examType)) return apiError('examType must be MCQ or CQ', 400)
```

### WR-07: Add-exam-schedules-from-package creates duplicates on repeated calls

**File:** `src/app/api/admin/courses/route.ts:422-446`
**Issue:** Running the action twice with the same `packageId` creates duplicate `CourseExamSchedule` rows because there is no `upsert` or pre-check for existing schedules.
**Fix:**
```typescript
const existing = await db.courseExamSchedule.findFirst({
  where: { courseId, examType, packageId, examDate: set.scheduledDate, startTime: set.startTime },
})
if (existing) continue // or upsert
```

### WR-08: `detail` action uses `findFirst` where `findUnique` is correct

**File:** `src/app/api/courses/route.ts:47`
**Issue:**
```typescript
const course = await db.course.findFirst({
  where: slug ? { slug } : { id: id! },
```
`slug` and `id` are both unique in Prisma schema. `findUnique` is semantically correct and avoids an unnecessary sort/limit internally.
**Fix:**
```typescript
const course = slug
  ? await db.course.findUnique({ where: { slug } })
  : await db.course.findUnique({ where: { id: id! } })
```

### WR-09: Public syllabus action duplicates admin syllabus logic

**File:** `src/app/api/courses/route.ts:106-259`
**Issue:** The `syllabus` action re-implements the same row-building, package-map, and exam-calendar logic already present in `admin/courses/route.ts:100-176`. Any fix (e.g., adding a new field) must be copy-pasted twice, and the two implementations already diverge (e.g., admin doesn't include `resources`, public doesn't include `exams` in the include).
**Fix:** Extract a `buildSyllabusResponse(course, userId?)` helper in `src/lib/course-helpers.ts` and import it from both routes.

### WR-10: Public syllabus reports `totalResources: 0` while resources exist in DB

**File:** `src/app/api/courses/route.ts:254`
**Issue:** The summary hardcodes `totalResources: 0` even though `LessonResource` is a model and admin `detail` returns resources. The frontend will display "0 resources" for every course.
**Fix:**
```typescript
totalResources: course.lessons.reduce((acc, l) => acc + (l.resources?.length || 0), 0),
```
(Also add `resources: true` to the include on line 119.)

### WR-11: Update-exam-schedule uses unsafe `as never` cast to bypass type checking

**File:** `src/app/api/admin/courses/route.ts:460`
**Issue:**
```typescript
const schedule = await db.courseExamSchedule.update({
  where: { id },
  data: updateData as never,
})
```
`as never` suppresses all type errors. If `examDate` or another field is the wrong type (e.g., a string where Date is expected), Prisma will throw a runtime error that TypeScript could have caught.
**Fix:** Define a proper `UpdateCourseExamScheduleInput` interface and cast to that, or use Prisma's generated types.

### WR-12: Students endpoint loses enrollment metadata for dual purchase+enrollment users

**File:** `src/app/api/admin/courses/route.ts:88-97`
**Issue:** The `seen` Set keeps the first occurrence per `user.id`. Because purchases map first (line 89-90), enrollments for the same user are dropped. Admins cannot tell whether a user enrolled for free or paid, or see `enrolledAt` if purchase exists.
**Fix:** Merge into a single object per user with `sources: ['purchase', 'enrollment']` and preserve `enrolledAt` from enrollment.

### WR-13: Missing rate limiting on public mutation endpoints

**File:** `src/app/api/courses/enroll/route.ts`, `src/app/api/courses/purchase/route.ts`, `src/app/api/courses/progress/route.ts`, `src/app/api/courses/assignments/route.ts`
**Issue:** Authenticated mutation endpoints have no rate limiting. A scripted client can hammer `/enroll`, `/progress`, or `/assignments` at high volume. Only admin endpoints apply rate limiting via `withAdmin`.
**Fix:** Import and apply `applyRateLimit(apiLimiter, request)` at the top of each POST handler.

### WR-14: `course-admin.service.ts` uses `any[]` for every return type

**File:** `src/services/api/course-admin.service.ts:9-68`
**Issue:** Every service method returns `{ course: any }`, `{ lessons: any[] }`, etc. The frontend loses all type safety, and refactors in the API shape silently break the UI.
**Fix:** Define interfaces in `src/features/course/types.ts` (or inline) and use them:
```typescript
list: (params?: QueryParams) =>
  api.get<{ courses: CourseRecord[]; pagination: PaginationMeta }>('admin/courses', { action: 'list', ...params }),
```

### WR-15: Console.error in production response path

**File:** `src/app/api/courses/featured/route.ts:280`
**Issue:** `console.error('Get featured content error:', error)` runs on every featured-content failure. In production, this leaks stack traces to stdout and provides no structured logging.
**Fix:** Use the project's logger (`logger.error('Failed to load featured content', { error, requestId })`) or remove the log entirely.

### WR-16: Hardcoded section filter prevents multi-zone featured content

**File:** `src/app/api/courses/featured/route.ts:9`
**Issue:**
```typescript
where: { section: 'homepage', isActive: true }
```
The endpoint is locked to `homepage`. Any future need to feature content on `/courses` or `/exams` requires a new endpoint.
**Fix:** Read `section` from `searchParams` with a default of `'homepage'`.

### WR-17: Inline `Promise.resolve` for set-building in student-progress

**File:** `src/app/api/admin/courses/route.ts:291-293`
**Issue:**
```typescript
Promise.resolve([...new Set([...lessonExams.filter(...), ...examSchedules.filter(...)])]),
```
These are synchronous array transforms wrapped in `Promise.resolve` inside `Promise.all`. They should be computed inline before the `Promise.all` to avoid unnecessary microtask scheduling.
**Fix:**
```typescript
const mcqPackageIds = [...new Set([
  ...lessonExams.filter(e => e.examType === 'MCQ').map(e => e.packageId),
  ...examSchedules.filter(e => e.examType === 'MCQ').map(e => e.packageId),
])]
// then Promise.all([...mcqSets, cqSets, completedMcqResults, completedCqSubmissions])
```

### WR-18: Syllabus `matchSet` uses strict string comparison for times

**File:** `src/app/api/courses/route.ts:154`
**Issue:**
```typescript
if (sDate === schedDate && s.startTime === sched.startTime)
```
If the exam set stores `startTime: '09:00'` and the schedule stores `startTime: '9:00'`, they don't match. Time strings should be normalized (pad hours) or compared structurally.
**Fix:**
```typescript
const normalizeTime = (t: string | null) => t ? t.padStart(5, '0') : null
if (sDate === schedDate && normalizeTime(s.startTime) === normalizeTime(sched.startTime)) { ... }
```

---

## Info

### IN-01: Redundant `lessonProgressMap` / `lessonProgress` double construction

**File:** `src/app/api/admin/courses/route.ts:267-275` and `src/app/api/courses/progress/route.ts:54-58`
**Issue:** Both files build a `Map` from `progressRecords` and then immediately rebuild a `Record` via a `for` loop. One pass is enough.
**Fix:**
```typescript
const lessonProgress: Record<string, boolean> = {}
for (const r of progressRecords) {
  lessonProgress[r.lessonId] = r.completed
}
```

### IN-02: Hardcoded Bengali suffix in lesson duplication

**File:** `src/app/api/admin/courses/lessons/route.ts:145`
**Issue:**
```typescript
title: `${source.title} (কপি)`,
```
The suffix is baked into the API layer. Any i18n rollout must change this string in every consumer.
**Fix:** Return a `duplicateSuffix` from an i18n helper or make it configurable.

### IN-03: `add-schedule` returns 201 for create but implicit 200 for update

**File:** `src/app/api/admin/courses/lessons/route.ts:229-245`
**Issue:** When an existing schedule is updated, `apiResponse({ schedule })` is returned without a status code (defaults to 200). When created, it returns 201. The response contract is inconsistent.
**Fix:** Return 200 for both, or 201 for both if that is the team's convention. Remove the special-case 201 on create.

### IN-04: `lessonProgress.findMany` fetched twice in progress POST / public syllabus GET

**File:** `src/app/api/courses/progress/route.ts:34-38` and `src/app/api/courses/route.ts:199-204`
**Issue:** Both endpoints fetch `lessonProgress` rows for the same `userId` + `courseId`. If both endpoints are called for the same request flow, this is a redundant DB hit.
**Fix:** Cache per-request or consolidate into the calling hook's fetch cycle.

### IN-05: `$queryRawUnsafe` depends on Prisma-generated table-name casing

**File:** `src/app/api/admin/courses/assignments/route.ts:48-89`
**Issue:** The raw SQL hardcodes `"CourseLesson"`, `"LessonAssignment"`, `"AssignmentSubmission"`, `"User"` (with the exact casing Prisma generates). If model names change, the queries break silently until runtime.
**Fix:** Use Prisma's `$queryRaw` with tagged template parameters (which still accept arbitrary SQL but keep values parameterized via `Prisma.Sql`), or wrap in a database view. If raw SQL is unavoidable, add integration tests that assert row shapes.

### IN-06: Admin `syllabus` and public `syllabus` use different `include` shapes

**File:** `src/app/api/admin/courses/route.ts:103-116` vs `src/app/api/courses/route.ts:110-124`
**Issue:** Admin includes `notes` but not `resources` or `exams`. Public includes `exams` but not `resources`. After extracting a shared helper (WR-09), reconcile which relations both endpoints actually need and include them consistently.

---

_Reviewed: 2025-07-14_
_Reviewer: the agent (gsd-code-review)_
_Depth: deep_
