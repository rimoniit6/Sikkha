import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError, applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'
import { getExamWithQuestions, ExamError } from '@/services/exam-service'
import { checkContentAccess } from '@/lib/access-control'
import { handleApiError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const { id } = await props.params
    const auth = await verifyAuth(request)
    const includeAnswers = !!auth?.isAdmin

    const examData = await getExamWithQuestions(
      id,
      includeAnswers,
      auth?.user?.id
    )

    return NextResponse.json({ success: true, data: { exam: examData } })
  } catch (error) {
    if (error instanceof ExamError) {
      return apiError(error.message, error.statusCode)
    }
    return handleApiError(error, 'Get exam detail error:')
  }
}
