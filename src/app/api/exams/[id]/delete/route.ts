import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError, applyRateLimit, withCsrf } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'
import { deleteExam, ExamError } from '@/services/exam-service'
import { handleApiError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

// DELETE /api/exams/:id/delete — Soft delete a custom exam
export async function DELETE(
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
    const result = await deleteExam(auth.user.id, id, auth.isAdmin)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof ExamError) {
      return apiError(error.message, error.statusCode)
    }
    return handleApiError(error, 'Delete exam error:')
  }
}
