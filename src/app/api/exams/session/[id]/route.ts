import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError, applyRateLimit, withCsrf } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'
import { getSessionState, updateSessionActivity, ExamError } from '@/services/exam-service'
import { handleApiError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

// GET /api/exams/session/:id — Get session state
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return apiError('অনুগ্রহ করে লগইন করুন', 401)
    }

    const { id } = await props.params
    const state = await getSessionState(auth.user.id, id)
    return NextResponse.json({ success: true, data: state })
  } catch (error) {
    if (error instanceof ExamError) {
      return apiError(error.message, error.statusCode)
    }
    return handleApiError(error, 'Get session error:')
  }
}

// PATCH /api/exams/session/:id — Update session activity (answers, question index)
export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return apiError('অনুগ্রহ করে লগইন করুন', 401)
    }

    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error

    const { id } = await props.params
    const body = await request.json()
    const { currentQuestionIndex, answers } = body

    await updateSessionActivity(auth.user.id, id, {
      currentQuestionIndex,
      answers,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ExamError) {
      return apiError(error.message, error.statusCode)
    }
    return handleApiError(error, 'Get session error:')
  }
}
