import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withAdmin, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const unreadOnly = searchParams.get('unread') === 'true'

    const where: Record<string, unknown> = {}
    if (unreadOnly) where.isRead = false

    const [data, total, unreadCount] = await Promise.all([
      db.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contactMessage.count({ where }),
      db.contactMessage.count({ where: { isRead: false } }),
    ])

    return NextResponse.json({
      success: true,
      data,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleApiError(error, 'Admin Get Contact Messages')
  }
}

export async function PATCH(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const { id, isRead } = body

    if (!id) {
      return NextResponse.json({ error: 'ID আবশ্যক' }, { status: 400 })
    }

    const updated = await db.contactMessage.update({
      where: { id },
      data: { isRead: isRead ?? true },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return handleApiError(error, 'Admin Update Contact Message')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID আবশ্যক' }, { status: 400 })
    }

    await db.contactMessage.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Admin Delete Contact Message')
  }
}
