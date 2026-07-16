import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-utils'
import { checkSubscriptionAccess, ExamError } from '@/services/exam-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth?.user?.id) {
      return apiError('অনুগ্রহ করে লগইন করুন', 401)
    }

    const { searchParams } = new URL(request.url)
    const classSlug = searchParams.get('classSlug') || ''

    if (!classSlug) {
      return apiError('classSlug প্রয়োজন', 400)
    }

    const data = await checkSubscriptionAccess(auth.user.id, classSlug)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error instanceof ExamError) {
      return apiError(error.message, error.statusCode)
    }
    console.error('Check access error:', error)
    return apiError('সাবস্ক্রিপশন চেক করতে সমস্যা হয়েছে', 500)
  }
}
