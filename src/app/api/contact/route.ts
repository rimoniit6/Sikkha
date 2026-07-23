import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

export async function POST(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error

    const body = await request.json()
    const { name, email, message } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'নাম আবশ্যক' }, { status: 400 })
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'সঠিক ইমেইল দিন' }, { status: 400 })
    }
    if (!message?.trim()) {
      return NextResponse.json({ error: 'বার্তা আবশ্যক' }, { status: 400 })
    }

    const contactMessage = await db.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      },
    })

    // 🔔 Notify admins: new contact message
    await db.notification.create({
      data: {
        userId: null,
        title: 'নতুন যোগাযোগ বার্তা',
        message: `নতুন যোগাযোগ বার্তা এসেছে: ${name.trim()} — ${message.trim().slice(0, 100)}`,
        type: 'INFO',
        link: '/admin/contact-messages',
      },
    }).catch(() => {
      // Non-critical — don't block the contact response
    })

    return NextResponse.json({ success: true, data: contactMessage }, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Contact message error:')
  }
}
