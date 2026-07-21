import { db } from '@/lib/db'
import { apiResponse, apiError, applyRateLimit } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { verifyAuth } from '@/lib/auth'
import { apiLimiter } from '@/lib/rate-limit'
import { batchCheckContentAccess } from '@/lib/access-control'
import { cacheHeaders } from '@/lib/cache-headers'

export async function GET(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')
    const type = searchParams.get('type')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))

    if (!chapterId) return apiError('chapterId is required', 400)

    const where: Record<string, unknown> = { chapterId, isActive: true }
    if (type) where.type = type

    const [data, total] = await Promise.all([
      db.knowledgeQuestion.findMany({
        where,
        select: {
          id: true,
          type: true,
          question: true,
          answer: true,
          questionImage: true,
          answerImage: true,
          isPremium: true,
          price: true,
          order: true,
        },
        orderBy: [{ type: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.knowledgeQuestion.count({ where }),
    ])

    // Access control — use unified batchCheckContentAccess instead of manual subscription-only check
    const auth = await verifyAuth(request)
    const userId = auth?.user.id
    const isAdmin = auth?.user && ['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)
    const lockedPremiumIds = new Set<string>()

    // Class-based access gate: reject if chapter doesn't belong to user's class
    if (auth?.user?.learningMode === 'CLASS_BASED' && auth?.user?.classLevel) {
      const chapter = await db.chapter.findUnique({
        where: { id: chapterId },
        select: { subject: { select: { class: { select: { slug: true } } } } },
      })
      if (chapter?.subject?.class?.slug !== auth.user.classLevel) {
        return apiError('এই অধ্যায়ের কন্টেন্ট আপনার ক্লাসের জন্য নয়', 403)
      }
    }

    if (!isAdmin && userId) {
      const premiumItemIds = data.filter((d) => d.isPremium).map((d) => d.id)
      if (premiumItemIds.length > 0) {
        const accessMap = await batchCheckContentAccess({
          userId,
          items: premiumItemIds.map((id) => ({ contentType: 'knowledgeQuestion' as const, contentId: id })),
        })
        for (const [id, result] of accessMap) {
          if (!result.hasAccess) lockedPremiumIds.add(id)
        }
      }
    } else if (!userId) {
      // Anonymous users — all premium items locked
      for (const d of data) {
        if (d.isPremium) lockedPremiumIds.add(d.id)
      }
    }

    const result = data.map(item => {
      if (lockedPremiumIds.has(item.id)) {
        return { ...item, answer: null, answerImage: null }
      }
      return item
    })

    return apiResponse({ data: result, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, null, 200, { ...cacheHeaders.noCache })
  } catch (error) {
    return handleApiError(error, 'Get Knowledge Questions')
  }
}
