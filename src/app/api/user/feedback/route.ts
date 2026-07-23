import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiError, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('প্রমাণীকরণ প্রয়োজন', 401)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const where: Record<string, unknown> = { userId: auth.user.id }
    if (status) where.status = status

    const [data, total] = await Promise.all([
      db.userFeedback.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.userFeedback.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error, 'Get User Feedback error:')
  }
}

export async function POST(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('প্রমাণীকরণ প্রয়োজন', 401)
    }

    const body = await request.json()
    const { subject, message } = body

    if (!subject?.trim() || !message?.trim()) {
      return apiError('বিষয় এবং বার্তা আবশ্যক', 400)
    }

    const feedback = await db.userFeedback.create({
      data: {
        userId: auth.user.id,
        subject: subject.trim(),
        status: 'PENDING',
        messages: {
          create: {
            senderId: auth.user.id,
            senderRole: 'USER',
            message: message.trim(),
          },
        },
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    // 🔔 Notify admins: new feedback submitted
    await db.notification.create({
      data: {
        userId: null,
        title: 'নতুন ফিডব্যাক',
        message: `একটি নতুন ফিডব্যাক জমা পড়েছে: "${feedback.subject}"`,
        type: 'INFO',
        link: '/admin/feedback',
      },
    })

    return NextResponse.json({ success: true, data: feedback }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Get User Feedback error:')
  }
}
