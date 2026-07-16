import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-utils'
import { getMyExams, ExamError } from '@/services/exam-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return apiError('অনুগ্রহ করে লগইন করুন', 401)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined

    const result = await getMyExams(auth.user.id, page, limit, search)
    return NextResponse.json({ success: true, data: result.exams, pagination: result.pagination })
  } catch (error) {
    if (error instanceof ExamError) {
      return apiError(error.message, error.statusCode)
    }
    console.error('Get my exams error:', error)
    return apiError('পরীক্ষার তালিকা আনতে সমস্যা হয়েছে', 500)
  }
}
