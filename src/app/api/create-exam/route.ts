import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError, applyRateLimit, withCsrf } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'
import { createCustomExam, ExamError } from '@/services/exam-service'
import { handleApiError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return apiError('অনুগ্রহ করে লগইন করুন', 401)
    }

    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error

    const body = await request.json()
    const { chapterIds, questionCount, duration, negativeMarks, marksPerMcq, title, freeOnly, difficulty } = body

    const result = await createCustomExam(auth.user.id, {
      chapterIds,
      questionCount,
      duration,
      negativeMarks,
      marksPerMcq,
      title,
      freeOnly,
      difficulty,
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    if (error instanceof ExamError) {
      return apiError(error.message, error.statusCode)
    }
    return handleApiError(error, 'Create Exam error:')
  }
}
