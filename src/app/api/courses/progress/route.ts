import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAuth, withCsrf, apiResponse, apiError } from '@/lib/api-utils'
import { recomputeEnrollmentProgress } from '@/lib/course-completion'
import { handleApiError } from '@/lib/errors'

// LessonProgress is keyed by (userId, lessonId). Course content in the
// curriculum is referenced by its lesson id, which the client sends as
// `contentId`. We map it onto `lessonId` here.
const progressSchema = z.object({
  courseId: z.string().min(1, 'courseId is required'),
  contentId: z.string().min(1, 'contentId (lesson id) is required'),
  completed: z.boolean().optional(),
  lastPosition: z.number().min(0).optional(),
})

export async function GET(request: Request) {
  const auth = await withAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const userId = searchParams.get('userId') || auth.user.id

    if (userId !== auth.user.id && auth.user.role === 'STUDENT') {
      return apiError('Forbidden', 403)
    }

    if (!courseId) {
      return apiError('courseId is required', 400)
    }

    const [lessons, progressRows, lessonExams, lessonAssignments, assignmentSubmissions] =
      await Promise.all([
        db.courseLesson.findMany({
          where: { courseId },
          select: { id: true, lessonType: true },
        }),
        db.lessonProgress.findMany({
          where: { courseId, userId },
          select: { lessonId: true, completed: true },
        }),
        db.lessonExam.findMany({
          where: { lesson: { courseId } },
          select: { id: true, examType: true },
        }),
        db.lessonAssignment.findMany({
          where: { lesson: { courseId } },
          select: { id: true },
        }),
        db.assignmentSubmission.findMany({
          where: { assignment: { lesson: { courseId } }, userId },
          select: { assignmentId: true },
        }),
      ])

    const lessonProgress: Record<string, boolean> = {}
    const completedSet = new Set<string>()
    for (const row of progressRows) {
      lessonProgress[row.lessonId] = row.completed
      if (row.completed) completedSet.add(row.lessonId)
    }

    const total = lessons.length
    const completed = completedSet.size
    const percent = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100))

    const liveLessons = lessons.filter(l => l.lessonType === 'LIVE')
    const recordedLessons = lessons.filter(l => l.lessonType === 'RECORDED')
    const liveCompleted = liveLessons.filter(l => completedSet.has(l.id)).length
    const recordedCompleted = recordedLessons.filter(l => completedSet.has(l.id)).length

    const mcqExams = lessonExams.filter(e => e.examType === 'MCQ')
    const cqExams = lessonExams.filter(e => e.examType === 'CQ')
    const submittedAssignmentIds = new Set(assignmentSubmissions.map(s => s.assignmentId))

    return apiResponse({
      lessonProgress,
      overall: { total, completed, percent },
      breakdown: {
        lessons: { total, completed },
        liveClasses: { total: liveLessons.length, completed: liveCompleted },
        recordedClasses: { total: recordedLessons.length, completed: recordedCompleted },
        assignments: { total: lessonAssignments.length, completed: submittedAssignmentIds.size },
        mcqExams: { total: mcqExams.length, completed: 0 },
        cqExams: { total: cqExams.length, completed: 0 },
      },
    })
  } catch (error) {
    return handleApiError(error, 'Fetch Progress')
  }
}

export async function POST(request: Request) {
  const auth = await withAuth(request)
  if (auth instanceof NextResponse) return auth

  const csrf = await withCsrf(request)
  if (csrf instanceof NextResponse) return csrf

  try {
    const raw = await request.json().catch(() => null)
    const parsed = progressSchema.safeParse(raw)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid request body', 400)
    }
    const body = parsed.data
    const lessonId = body.contentId

    const enrollment = await db.courseEnrollment.findUnique({
      where: { userId_courseId: { userId: auth.user.id, courseId: body.courseId } },
      select: { id: true },
    })

    const completed = body.completed ?? true
    await db.lessonProgress.upsert({
      where: { userId_lessonId: { userId: auth.user.id, lessonId } },
      create: {
        userId: auth.user.id,
        courseId: body.courseId,
        lessonId,
        completed,
        completedAt: completed ? new Date() : null,
        enrollmentId: enrollment?.id,
      },
      update: {
        courseId: body.courseId,
        completed,
        completedAt: completed ? new Date() : null,
        enrollmentId: enrollment?.id,
      },
    })

    let completionPercent: number | null = null
    if (enrollment) {
      completionPercent = await recomputeEnrollmentProgress(body.courseId, auth.user.id)
    }

    return apiResponse({
      ok: true,
      completionPercent,
      enrollmentId: enrollment?.id ?? null,
    })
  } catch (error) {
    return handleApiError(error, 'Save Progress')
  }
}
