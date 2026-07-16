import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const [pendingPayments, pendingFeedback] = await Promise.all([
      db.payment.count({ where: { status: 'PENDING' } }),
      db.userFeedback.count({ where: { status: 'PENDING' } }),
    ])

    return apiResponse({
      payments: { pending: pendingPayments },
      feedback: { pending: pendingFeedback },
    })
  } catch (error) {
    return handleApiError(error, 'Get admin alerts')
  }
}
