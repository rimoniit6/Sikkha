import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withCsrf } from '@/lib/api-utils'

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

    return NextResponse.json({ success: true, data: contactMessage }, { status: 201 })
  } catch (error) {
    console.error('Contact message error:', error)
    return NextResponse.json({ error: 'বার্তা পাঠাতে সমস্যা হয়েছে' }, { status: 500 })
  }
}
