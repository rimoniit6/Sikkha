import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiError, withCsrf } from '@/lib/api-utils'
import { getClassLevelForUserId } from '@/lib/class-filter'
import { handleApiError } from '@/lib/errors'

const VALID_CONTENT_TYPES = ['lecture', 'mcq', 'cq']

// GET: Get recently viewed items for the authenticated user
export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('প্রমাণীকরণ প্রয়োজন', 401)
    }

    const userId = auth.user.id
    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType')
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))

    const classLevel = await getClassLevelForUserId(userId)

    // Build where clause
    const where: { userId: string; contentType?: string } = { userId }
    if (contentType && VALID_CONTENT_TYPES.includes(contentType)) {
      where.contentType = contentType
    }

    const recentlyViewedItems = await db.recentlyViewed.findMany({
      where,
      orderBy: { viewedAt: 'desc' },
      take: limit * 2, // overfetch to account for class filtering
    })

    // Batch-resolve content titles + class membership
    const byType: Record<string, string[]> = {}
    for (const item of recentlyViewedItems) {
      if (!byType[item.contentType]) byType[item.contentType] = []
      byType[item.contentType].push(item.contentId)
    }
    const titleMap = new Map<string, string>()
    const classMembershipMap = new Map<string, boolean>()

    const queries = Object.entries(byType).map(async ([type, ids]) => {
      if (type === 'mcq') {
        const mcqs = await db.mCQ.findMany({
          where: { id: { in: ids }, ...(classLevel ? { classLevel } : {}) },
          select: { id: true, question: true },
        })
        for (const m of mcqs) {
          titleMap.set(m.id, m.question.length > 80 ? m.question.substring(0, 80) + '...' : m.question)
          classMembershipMap.set(m.id, true)
        }
        if (classLevel) {
          for (const id of ids) {
            if (!classMembershipMap.has(id)) classMembershipMap.set(id, false)
          }
        }
      } else if (type === 'cq') {
        const cqs = await db.cQ.findMany({
          where: { id: { in: ids }, ...(classLevel ? { classLevel } : {}) },
          select: { id: true, uddeepok: true },
        })
        for (const c of cqs) {
          titleMap.set(c.id, c.uddeepok.length > 80 ? c.uddeepok.substring(0, 80) + '...' : c.uddeepok)
          classMembershipMap.set(c.id, true)
        }
        if (classLevel) {
          for (const id of ids) {
            if (!classMembershipMap.has(id)) classMembershipMap.set(id, false)
          }
        }
      } else if (type === 'lecture') {
        const lectures = await db.lecture.findMany({
          where: {
            id: { in: ids },
            ...(classLevel ? { chapter: { subject: { class: { slug: classLevel } } } } : {}),
          },
          select: { id: true, title: true },
        })
        for (const l of lectures) {
          titleMap.set(l.id, l.title)
          classMembershipMap.set(l.id, true)
        }
        if (classLevel) {
          for (const id of ids) {
            if (!classMembershipMap.has(id)) classMembershipMap.set(id, false)
          }
        }
      }
    })
    await Promise.all(queries)

    // Filter by class membership
    const filteredItems = classLevel
      ? recentlyViewedItems.filter((item) => classMembershipMap.get(item.contentId) !== false)
      : recentlyViewedItems

    const enrichedItems = filteredItems.slice(0, limit).map((item) => ({
      id: item.id,
      contentId: item.contentId,
      contentType: item.contentType,
      title: titleMap.get(item.contentId) || item.title || 'অজানা কন্টেন্ট',
      viewedAt: item.viewedAt,
    }))

    return NextResponse.json({
      success: true,
      data: { items: enrichedItems },
    })
  } catch (error) {
    return handleApiError(error, 'Get recently viewed error:')
  }
}

// POST: Record a recently viewed item
export async function POST(request: Request) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth) {
      return apiError('প্রমাণীকরণ প্রয়োজন', 401)
    }

    const userId = auth.user.id
    const body = await request.json()
    const { contentId, contentType, title } = body

    if (!contentId || !contentType) {
      return apiError('contentId এবং contentType আবশ্যক', 400)
    }

    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return apiError('contentType অবশ্যই lecture, mcq, বা cq হতে হবে', 400)
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return apiError('title আবশ্যক', 400)
    }

    // Upsert: if already exists, update viewedAt timestamp
    const existing = await db.recentlyViewed.findFirst({
      where: {
        userId,
        contentId,
        contentType,
      },
    })

    if (existing) {
      await db.recentlyViewed.update({
        where: { id: existing.id },
        data: {
          viewedAt: new Date(),
          title: title.trim(),
        },
      })
    } else {
      await db.recentlyViewed.create({
        data: {
          userId,
          contentId,
          contentType,
          title: title.trim(),
          viewedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    return handleApiError(error, 'Get recently viewed error:')
  }
}
