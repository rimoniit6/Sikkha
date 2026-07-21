import { db } from '@/lib/db'
import { z } from 'zod'
import { apiResponse, apiError, withAdmin, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { transitionWorkflow } from '@/lib/workflow'
import { auditFromRequest, AuditActions, getClientIP } from '@/lib/audit'

const lessonPostSchema = z.object({
  courseId: z.string().min(1).optional(),
  lessonId: z.string().min(1).optional(),
  id: z.string().min(1).optional(),
  assignmentId: z.string().min(1).optional(),
}).passthrough()

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    if (!courseId) return apiError('courseId required', 400)

    const lessons = await db.courseLesson.findMany({
      where: { courseId },
      orderBy: { displayOrder: 'asc' },
      include: {
        assignments: { orderBy: { displayOrder: 'asc' } },
        schedules: true,
        notes: { orderBy: { displayOrder: 'asc' } },
        resources: { orderBy: { displayOrder: 'asc' } },
      },
    })

    return apiResponse({ lessons })
  } catch (error) {
    return handleApiError(error, 'Lessons GET')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrf = await withCsrf(request)
  if (csrf instanceof NextResponse) return csrf

  try {
    const body = await request.json()
    const parsed = lessonPostSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid request', 400)
    }
    const { action } = body

    switch (action) {
      case 'create': {
        const { courseId, title, description, lessonType, meetingLink, meetingId, platform, password, videoUrl, previewVideo, duration, displayOrder, notes, resources } = body
        if (!courseId || !title || !lessonType) return apiError('courseId, title, lessonType required', 400)

        const maxOrder = await db.courseLesson.aggregate({ where: { courseId }, _max: { displayOrder: true } })
        const nextOrder = (maxOrder._max.displayOrder ?? -1) + 1

        const lesson = await db.$transaction(async (tx) => {
          const created = await tx.courseLesson.create({
          data: {
            courseId,
            title,
            description: description || null,
            lessonType,
            meetingLink: meetingLink || null,
            meetingId: meetingId || null,
            platform: platform || null,
            password: password || null,
            videoUrl: videoUrl || null,
            previewVideo: previewVideo || null,
            duration: duration || null,
            displayOrder: displayOrder ?? nextOrder,
            notes: notes?.length ? {
              create: notes.map((n: any, i: number) => ({
                title: n.title,
                type: n.type || 'link',
                content: n.content || null,
                fileUrl: n.fileUrl || null,
                link: n.link || null,
                displayOrder: n.displayOrder ?? i,
              })),
            } : undefined,
            resources: resources?.length ? {
              create: resources.map((r: any, i: number) => ({
                title: r.title,
                type: r.type || 'link',
                fileUrl: r.fileUrl || null,
                link: r.link || null,
                displayOrder: r.displayOrder ?? i,
              })),
            } : undefined,
          },
          include: {
            assignments: true,
            schedules: true,
            notes: true,
            resources: true,
          },
        })
        await auditFromRequest(request, auth.user.id, AuditActions.COURSE_LESSON_CREATE, 'course_lesson', created.id, body, { title: created.title }, tx as never)
          return created
        })
        return apiResponse({ lesson }, 201)
      }

      case 'update': {
        const { id, ...data } = body
        if (!id) return apiError('Lesson ID required', 400)

        const existing = await db.courseLesson.findUnique({ where: { id } })
        if (!existing) return apiError('Lesson not found', 404)

        const allowed = ['title', 'description', 'lessonType', 'meetingLink', 'meetingId', 'platform', 'password', 'videoUrl', 'previewVideo', 'duration', 'displayOrder']
        const updateData: Record<string, unknown> = {}
        for (const f of allowed) { if (data[f] !== undefined) updateData[f] = data[f] }

        const changedFields = Object.keys(updateData).filter(
          key => JSON.stringify(updateData[key]) !== JSON.stringify(existing[key as keyof typeof existing])
        )

        const ipAddress = getClientIP(request)
        const userAgent = request.headers.get('user-agent') || undefined

        const workflow = await db.contentWorkflow.findFirst({ where: { entityType: 'courseLesson', entityId: id } })

        const result = await transitionWorkflow(db, {
          entityType: 'courseLesson',
          entityId: id,
          action: 'update_content',
          userId: auth.user.id,
          userRole: auth.user.role,
          expectedVersion: workflow?.version ?? 0,
          ipAddress,
          userAgent,
          changedFields,
          contentUpdate: {
            data: updateData,
            include: {
              assignments: true,
              schedules: true,
              notes: true,
              resources: true,
            },
          },
        })

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: result.httpStatus })
        }

        return apiResponse({ lesson: result.contentRecord })
      }

      case 'delete': {
        const { id } = body
        if (!id) return apiError('Lesson ID required', 400)
        await db.$transaction(async (tx) => {
          await tx.courseLesson.update({
            where: { id },
            data: { deletedAt: new Date(), deletedBy: auth.user.id },
          })
          await auditFromRequest(request, auth.user.id, AuditActions.COURSE_LESSON_DELETE, 'course_lesson', id, undefined, undefined, tx as never)
        })
        return apiResponse({ success: true })
      }

      case 'reorder': {
        const { courseId, lessonIds } = body
        if (!courseId || !lessonIds?.length) return apiError('courseId and lessonIds required', 400)
        await db.$transaction(lessonIds.map((id: string, i: number) =>
          db.courseLesson.update({ where: { id }, data: { displayOrder: i } })
        ))
        await auditFromRequest(request, auth.user.id, 'course_lesson_reorder', 'course_lesson', courseId, undefined, { order: body.order })
        return apiResponse({ success: true })
      }

      case 'duplicate': {
        const { id } = body
        if (!id) return apiError('Lesson ID required', 400)
        const source = await db.courseLesson.findUnique({
          where: { id },
          include: { notes: true, resources: true, assignments: true, schedules: true },
        })
        if (!source) return apiError('Lesson not found', 404)

        const maxOrder = await db.courseLesson.aggregate({ where: { courseId: source.courseId }, _max: { displayOrder: true } })
        const lesson = await db.$transaction(async (tx) => {
          const created = await tx.courseLesson.create({
            data: {
              courseId: source.courseId,
              title: `${source.title} (কপি)`,
              description: source.description,
              lessonType: source.lessonType,
              meetingLink: source.meetingLink,
              meetingId: source.meetingId,
              platform: source.platform,
              password: source.password,
              videoUrl: source.videoUrl,
              previewVideo: source.previewVideo,
              duration: source.duration,
              displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
              assignments: { create: source.assignments.map(a => ({ title: a.title, description: a.description, deadline: a.deadline, attachment: a.attachment, displayOrder: a.displayOrder })) },
              schedules: source.schedules.length ? { create: source.schedules.map(s => ({ date: s.date, startTime: s.startTime, endTime: s.endTime })) } : undefined,
              notes: { create: source.notes.map(n => ({ title: n.title, type: n.type, content: n.content, fileUrl: n.fileUrl, link: n.link, displayOrder: n.displayOrder })) },
              resources: { create: source.resources.map(r => ({ title: r.title, type: r.type, fileUrl: r.fileUrl, link: r.link, displayOrder: r.displayOrder })) },
            },
            include: { assignments: true, schedules: true, notes: true, resources: true },
          })
          await auditFromRequest(request, auth.user.id, AuditActions.COURSE_LESSON_CREATE, 'course_lesson', created.id, body, { title: created.title }, tx as never)
          return created
        })
        return apiResponse({ lesson }, 201)
      }

      case 'add-assignment': {
        const { lessonId, title, description, deadline, attachment } = body
        if (!lessonId || !title) return apiError('lessonId, title required', 400)
        const max = await db.lessonAssignment.aggregate({ where: { lessonId }, _max: { displayOrder: true } })
        await db.$transaction(async (tx) => {
          const assignment = await tx.lessonAssignment.create({
            data: {
              lessonId, title, description: description || null,
              deadline: deadline ? new Date(deadline).toISOString() : null, attachment: attachment || null,
              displayOrder: (max._max.displayOrder ?? -1) + 1,
            },
          })
          await auditFromRequest(request, auth.user.id, 'course_assignment_create', 'course_assignment', assignment.id, body, undefined, tx as never)
          return assignment
        })
        return apiResponse({ assignment }, 201)
      }

      case 'remove-assignment': {
        const { id } = body
        if (!id) return apiError('Assignment ID required', 400)
        await db.$transaction(async (tx) => {
          await tx.lessonAssignment.delete({ where: { id } })
          await auditFromRequest(request, auth.user.id, 'course_assignment_delete', 'course_assignment', id, undefined, undefined, tx as never)
        })
        return apiResponse({ success: true })
      }

      case 'add-note': {
        const { lessonId, title, type, content, fileUrl, link } = body
        if (!lessonId || !title) return apiError('lessonId, title required', 400)
        const max = await db.lessonNote.aggregate({ where: { lessonId }, _max: { displayOrder: true } })
        const note = await db.lessonNote.create({
          data: {
            lessonId, title, type: type || 'link',
            content: content || null, fileUrl: fileUrl || null, link: link || null,
            displayOrder: (max._max.displayOrder ?? -1) + 1,
          },
        })
        return apiResponse({ note }, 201)
      }

      case 'remove-note': {
        const { id } = body
        if (!id) return apiError('Note ID required', 400)
        await db.lessonNote.delete({ where: { id } })
        return apiResponse({ success: true })
      }

      case 'add-resource': {
        const { lessonId, title, type, fileUrl, link } = body
        if (!lessonId || !title) return apiError('lessonId, title required', 400)
        const max = await db.lessonResource.aggregate({ where: { lessonId }, _max: { displayOrder: true } })
        const resource = await db.lessonResource.create({
          data: {
            lessonId, title, type: type || 'link',
            fileUrl: fileUrl || null, link: link || null,
            displayOrder: (max._max.displayOrder ?? -1) + 1,
          },
        })
        return apiResponse({ resource }, 201)
      }

      case 'remove-resource': {
        const { id } = body
        if (!id) return apiError('Resource ID required', 400)
        await db.lessonResource.delete({ where: { id } })
        return apiResponse({ success: true })
      }

      case 'add-schedule': {
        const { lessonId, date, startTime, endTime } = body
        if (!lessonId) return apiError('lessonId required', 400)
        const dateIso = date ? new Date(date).toISOString() : null
        const existing = await db.lessonSchedule.findUnique({ where: { lessonId } })
        if (existing) {
          const schedule = await db.lessonSchedule.update({
            where: { lessonId },
            data: { date: dateIso, startTime: startTime || null, endTime: endTime || null },
          })
          return apiResponse({ schedule })
        }
        const schedule = await db.lessonSchedule.create({
          data: { lessonId, date: dateIso, startTime: startTime || null, endTime: endTime || null },
        })
        return apiResponse({ schedule }, 201)
      }

      case 'remove-schedule': {
        const { lessonId } = body
        if (!lessonId) return apiError('lessonId required', 400)
        await db.lessonSchedule.deleteMany({ where: { lessonId } })
        return apiResponse({ success: true })
      }

      default:
        return apiError(`Unknown action: ${action}`, 400)
    }
  } catch (error) {
    return handleApiError(error, 'Lessons POST')
  }
}
