import { db } from '@/lib/db'
import { apiResponse, paginatedApiResponse, apiError, withAdmin, parseIdsParam, validateBody, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { deriveIsPremium } from '@/lib/premium'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { toDecimal } from '@/lib/decimal'
import { softDelete } from '@/lib/soft-delete'
import { createVersion } from '@/lib/version-history'
import { auditFromRequest, AuditActions, getClientIP } from '@/lib/audit'

const createExamSchema = z.object({
  title: z.string().min(1, 'পরীক্ষার নাম আবশ্যক'),
  description: z.string().nullable().optional(),
  classLevel: z.string().min(1, 'শ্রেণি আবশ্যক'),
  subjectId: z.string().nullable().optional(),
  chapterIds: z.string().nullable().optional(),
  type: z.string().min(1, 'পরীক্ষার ধরন আবশ্যক'),
  duration: z.number().int().positive('সময়কাল আবশ্যক'),
  totalMarks: z.number().min(0).optional(),
  marksPerMcq: z.number().min(0).optional(),
  negativeMarks: z.number().min(0).optional(),
  isPremium: z.boolean().optional(),
  price: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
  status: z.string().optional(),
  instructions: z.string().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  questions: z.array(z.object({
    questionType: z.string(),
    questionId: z.string(),
    marks: z.number().min(0),
    order: z.number().min(0).optional(),
  })).optional(),
})

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const classLevel = searchParams.get('classLevel')
    const subjectId = searchParams.get('subjectId')
    const type = searchParams.get('type')
    const isPremium = searchParams.get('isPremium')
    const isActive = searchParams.get('isActive')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (classLevel) where.classLevel = classLevel
    if (subjectId) where.subjectId = subjectId
    if (type) where.type = type
    if (isPremium !== null && isPremium !== undefined) where.isPremium = isPremium === 'true'
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'
    if (status) where.status = status

    const [data, total] = await Promise.all([
      db.exam.findMany({
        where,
        include: {
          questions: { orderBy: { order: 'asc' } },
          _count: { select: { results: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.exam.count({ where }),
    ])

    return paginatedApiResponse(data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleApiError(error, 'Admin Get Exams')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const validation = validateBody(createExamSchema, body)
    if ('error' in validation) return validation.error
    const {
      title, description, classLevel, subjectId, chapterIds, type, duration,
      totalMarks, marksPerMcq, negativeMarks, isPremium, price, isActive,
      status, instructions, startsAt, endsAt, questions,
    } = validation.data

    const exam = await db.exam.create({
      data: {
        title, description: description || null, classLevel, subjectId: subjectId || null,
        chapterIds: chapterIds || null, type: type as 'MCQ' | 'CQ' | 'MIXED', duration,
        totalMarks: totalMarks ?? 0, marksPerMcq: marksPerMcq ?? 1, negativeMarks: negativeMarks ?? 0,
        isPremium: deriveIsPremium(price), price: price ?? 0, isActive: isActive ?? true,
        status: ((status ?? 'DRAFT') as string).toUpperCase() as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED', instructions: instructions || null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        questions: questions && questions.length > 0
          ? { create: questions.map((q: { questionType: string; questionId: string; marks: number; order?: number }) => ({ questionType: q.questionType, questionId: q.questionId, marks: q.marks || 0, order: q.order || 0 })) }
          : undefined,
      },
      include: { questions: true },
    })

    if (exam.totalMarks === 0 && exam.questions.length > 0) {
      const calcMarks = exam.questions.reduce((sum, q) => sum + toDecimal(q.marks), 0)
      await db.exam.update({ where: { id: exam.id }, data: { totalMarks: calcMarks } })
      exam.totalMarks = calcMarks
    }

    await auditFromRequest(request, auth.user.id, AuditActions.EXAM_CREATE, 'exam', exam.id, body, { title: exam.title })
    return apiResponse(exam, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Exam')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const { id, questions, ...updateData } = body

    if (!id) return apiError('পরীক্ষা ID আবশ্যক', 400)

    const existing = await db.exam.findUnique({ where: { id } })
    if (!existing) return apiError('পরীক্ষা খুঁজে পাওয়া যায়নি', 404)

    const updateFields: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'description', 'classLevel', 'subjectId', 'chapterIds',
      'type', 'duration', 'totalMarks', 'marksPerMcq', 'negativeMarks',
      'isPremium', 'price', 'isActive', 'status', 'instructions',
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = field === 'status' ? String(updateData[field]).toUpperCase() : updateData[field]
      }
    }

    // Derive isPremium from price if price is being changed
    if (updateData.price !== undefined) {
      updateFields.isPremium = deriveIsPremium(updateData.price)
    }

    if (updateData.startsAt !== undefined) updateFields.startsAt = updateData.startsAt ? new Date(updateData.startsAt) : null
    if (updateData.endsAt !== undefined) updateFields.endsAt = updateData.endsAt ? new Date(updateData.endsAt) : null

    if (questions !== undefined) {
      updateFields.questions = {
        deleteMany: { examId: id },
        create: questions.map((q: { questionType: string; questionId: string; marks: number; order?: number }) => ({
          questionType: q.questionType, questionId: q.questionId, marks: q.marks || 0, order: q.order || 0,
        })),
      }
      updateFields.totalMarks = questions.reduce((sum: number, q: { marks: number }) => sum + toDecimal(q.marks || 0), 0)
    }

    // Determine which fields actually changed
    const changedFields = Object.keys(updateFields).filter(
      key => JSON.stringify(updateFields[key]) !== JSON.stringify(existing[key as keyof typeof existing])
    )

    // Create version snapshot + update in single transaction
    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || undefined

    const updated = await db.$transaction(async (tx) => {
      // Create version snapshot of current state BEFORE update
      await createVersion(tx, 'exam', id, { ...existing }, auth.user.id, changedFields, {
        ipAddress,
        userAgent,
      })

      // Perform the actual update
      return tx.exam.update({
        where: { id },
        data: updateFields,
        include: { questions: true },
      })
    }, {
      maxWait: 10000,
      timeout: 30000,
    })

    await auditFromRequest(request, auth.user.id, AuditActions.EXAM_UPDATE, 'exam', id, existing, updateFields)
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Exam')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const { searchParams } = new URL(request.url)
    const ids = parseIdsParam(searchParams)
    if (ids) {
      for (const id of ids) {
        await softDelete(db, 'exam', id, auth.user.id)
      }
      await auditFromRequest(request, auth.user.id, AuditActions.EXAM_DELETE, 'exam', ids.join(','), undefined, { count: ids.length })
      return apiResponse({ deleted: ids.length }, `${ids.length}টি সফলভাবে মুছে ফেলা হয়েছে`)
    }
    const id = searchParams.get('id')

    if (!id) return apiError('পরীক্ষা ID আবশ্যক', 400)

    const existing = await db.exam.findUnique({ where: { id } })
    if (!existing) return apiError('পরীক্ষা খুঁজে পাওয়া যায়নি', 404)

    await softDelete(db, 'exam', id, auth.user.id)
    await auditFromRequest(request, auth.user.id, AuditActions.EXAM_DELETE, 'exam', id)
    return apiResponse({ id }, 'পরীক্ষা সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Exam')
  }
}
