import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

/**
 * Admin Notification Bell API
 *
 * Dedicated endpoint for the admin notification bell dropdown.
 * Returns ONLY admin-targeted notifications (userId: null) for these 3 types:
 *   - New Feedback submitted
 *   - New Contact Message submitted
 *   - New Payment Submission
 *
 * GET  /api/admin/admin-notifications?limit=10&offset=0
 *   → { data: AdminNotification[], pagination: { total, unread, ... } }
 *
 * PATCH /api/admin/admin-notifications
 *   { markAll: true }                    → mark all as read
 *   { ids: ["id1", "id2"] }             → mark specific notifications as read
 */
export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    const where = { userId: null } as const

    const [data, total, unread] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { ...where, isRead: false } }),
    ])

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        unread,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    return handleApiError(error, 'Admin Admin-Notifications GET')
  }
}

export async function PATCH(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()

    if (body.markAll === true) {
      // Mark all admin-targeted notifications as read
      const result = await db.notification.updateMany({
        where: { userId: null, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, data: { updatedCount: result.count } })
    }

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      // Mark specific notifications as read
      const result = await db.notification.updateMany({
        where: { id: { in: body.ids }, userId: null },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, data: { updatedCount: result.count } })
    }

    return NextResponse.json({ success: false, error: 'মার্ক করার জন্য ids অথবা markAll প্রয়োজন' }, { status: 400 })
  } catch (error) {
    return handleApiError(error, 'Admin Admin-Notifications PATCH')
  }
}
