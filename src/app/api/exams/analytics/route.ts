import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-utils'
import { getExamAnalytics, ExamError } from '@/services/exam-service'

export const dynamic = 'force-dynamic'

// GET /api/exams/analytics?examId=... — Get analytics for a custom exam
export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return apiError('অনুগ্রহ করে লগইন করুন', 401)
    }

    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')
    if (!examId) {
      return apiError('examId প্রয়োজন', 400)
    }

    const data = await getExamAnalytics(auth.user.id, examId)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof ExamError) {
      return apiError(error.message, error.statusCode)
    }
    console.error('Get exam analytics error:', error)
    return apiError('বিশ্লেষণ লোড করতে সমস্যা হয়েছে', 500)
  }
}
