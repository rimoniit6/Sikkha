import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAuth, withCsrf, apiResponse, apiError } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

const preferenceSchema = z.object({
  learningMode: z.enum(['CLASS_BASED', 'GLOBAL']),
  classLevel: z.string().min(1).max(50).nullable().optional(),
})

export async function GET(request: Request) {
  const auth = await withAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const user = await db.user.findUnique({
      where: { id: auth.user.id },
      select: { learningMode: true, classLevel: true },
    })
    if (!user) return apiError('User not found', 404)

    return apiResponse({
      learningMode: user.learningMode ?? null,
      classLevel: user.classLevel ?? null,
    })
  } catch (error) {
    return handleApiError(error, 'Get Learning Preference')
  }
}

export async function PUT(request: Request) {
  const auth = await withAuth(request)
  if (auth instanceof NextResponse) return auth

  const csrf = await withCsrf(request)
  if (csrf instanceof NextResponse) return csrf

  try {
    const body = await request.json().catch(() => null)
    if (!body) return apiError('Invalid request body', 400)

    const parsed = preferenceSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || 'Invalid data', 400)
    }

    const { learningMode, classLevel } = parsed.data

    // Validate classLevel exists in ClassCategory when setting CLASS_BASED mode
    if (learningMode === 'CLASS_BASED' && classLevel) {
      const validClass = await db.classCategory.findUnique({
        where: { slug: classLevel, isActive: true },
        select: { id: true },
      })
      if (!validClass) {
        return apiError('অবৈধ শ্রেণি নির্বাচন। অনুগ্রহ করে একটি বৈধ শ্রেণি বেছে নিন।', 400)
      }
    }

    const updated = await db.user.update({
      where: { id: auth.user.id },
      data: {
        learningMode,
        ...(classLevel !== undefined ? { classLevel } : {}),
      },
      select: { learningMode: true, classLevel: true },
    })

    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Save Learning Preference')
  }
}
