import { db } from '@/lib/db'
import { apiError, withAdmin, withCsrf } from '@/lib/api-utils'
import { NextResponse } from 'next/server'
import { auditFromRequest, AuditActions } from '@/lib/audit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAdmin(request)
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const feedback = await db.userFeedback.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    if (!feedback) {
      return apiError('ফিডব্যাক খুঁজে পাওয়া যায়নি', 404)
    }

    const messages = await db.feedbackMessage.findMany({
      where: { feedbackId: id },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ success: true, data: { feedback, messages } })
  } catch (error) {
    console.error('Admin Get Feedback Messages error:', error)
    return apiError('বার্তা আনতে সমস্যা হয়েছে', 500)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAdmin(request)
    if (auth instanceof NextResponse) return auth

    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error

    const { id } = await params
    const feedback = await db.userFeedback.findUnique({ where: { id } })

    if (!feedback) {
      return apiError('ফিডব্যাক খুঁজে পাওয়া যায়নি', 404)
    }

    const body = await request.json()
    const { message } = body

    if (!message?.trim()) {
      return apiError('বার্তা আবশ্যক', 400)
    }

    const msg = await db.$transaction(async (tx) => {
      const m = await tx.feedbackMessage.create({
        data: {
          feedbackId: id,
          senderId: auth.user.id,
          senderRole: 'ADMIN',
          message: message.trim(),
        },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      })
      await tx.userFeedback.update({
        where: { id },
        data: { status: 'REPLIED', updatedAt: new Date() },
      })
      await auditFromRequest(request, auth.user.id, AuditActions.FEEDBACK_MESSAGE_SEND, 'feedback_message', m.id, undefined, m as Record<string, unknown>, tx as never)

      // 🔔 Notify student: admin replied to their feedback
      await tx.notification.create({
        data: {
          userId: feedback.userId,
          title: 'ফিডব্যাকে উত্তর দেওয়া হয়েছে',
          message: `আপনার "${feedback.subject}" ফিডব্যাকে অ্যাডমিন উত্তর দিয়েছেন।`,
          type: 'INFO',
          link: `/user/feedback/${id}`,
        },
      })

      return m
    })

    return NextResponse.json({ success: true, data: msg }, { status: 201 })
  } catch (error) {
    console.error('Admin Reply Feedback error:', error)
    return apiError('উত্তর দিতে সমস্যা হয়েছে', 500)
  }
}
