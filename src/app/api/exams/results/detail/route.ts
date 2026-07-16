import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-utils'
import { getResultDetail, ExamError } from '@/services/exam-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return apiError('অনুগ্রহ করে লগইন করুন', 401)
    }

    const { searchParams } = new URL(request.url)
    const resultId = searchParams.get('resultId')
    if (!resultId) {
      return apiError('resultId প্রয়োজন', 400)
    }

    const data = await getResultDetail(auth.user.id, resultId, auth.isAdmin)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof ExamError) {
      return apiError(error.message, error.statusCode)
    }
    console.error('Get exam result detail error:', error)
    return apiError('ফলাফলের বিস্তারিত তথ্য আনতে সমস্যা হয়েছে', 500)
  }
}
