import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError, applyRateLimit, withCsrf } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'
import { startExamSession, ExamError } from '@/services/exam-service'

export const dynamic = 'force-dynamic'

// POST /api/exams/session — Start or resume an exam session
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
    const { examId } = body

    if (!examId) {
      return apiError('পরীক্ষার ID প্রয়োজন', 400)
    }

    const session = await startExamSession(auth.user.id, examId)
    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    if (error instanceof ExamError) {
      return apiError(error.message, error.statusCode)
    }
    console.error('Start session error:', error)
    return apiError('সেশন শুরু করতে সমস্যা হয়েছে', 500)
  }
}
