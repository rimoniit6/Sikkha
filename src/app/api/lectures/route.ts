import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { handleApiError } from '@/lib/errors'
import { applyRateLimit } from '@/lib/api-utils'
import { apiLimiter } from '@/lib/rate-limit'
import { verifyAuth } from '@/lib/auth'
import { batchCheckContentAccess } from '@/lib/access-control'
import { cacheHeaders } from '@/lib/cache-headers'

export async function GET(request: Request) {
  try {
    const rateCheck = await applyRateLimit(apiLimiter, request)
    if ('error' in rateCheck) return rateCheck.error

    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get('chapterId')
    const subjectId = searchParams.get('subjectId')
    let classLevel = searchParams.get('classLevel')
    if (!classLevel) {
      const auth = await verifyAuth(request)
      if (auth?.user?.learningMode === 'CLASS_BASED' && auth?.user?.classLevel) {
        classLevel = auth.user.classLevel
      }
    }
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = { isActive: true }

    if (chapterId) {
      where.chapterId = chapterId
    }

    const chapterFilter: Record<string, unknown> = {}
    if (subjectId) {
      chapterFilter.subjectId = subjectId
    }
    if (classLevel) {
      chapterFilter.subject = {
        class: {
          slug: classLevel,
        },
      }
    }
    if (Object.keys(chapterFilter).length > 0) {
      where.chapter = chapterFilter
    }

    const [lectures, total] = await Promise.all([
      db.lecture.findMany({
        where,
        orderBy: { order: 'asc' },
        include: {
          chapter: {
            select: {
              id: true,
              name: true,
              slug: true,
              subject: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  class: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
          resources: {
            where: { isActive: true },
            select: { title: true, url: true, type: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.lecture.count({ where }),
    ])

    // ── Access control: resolve which premium lectures the user can see ──
    const auth = await verifyAuth(request)
    const userId = auth?.user.id
    const isAdmin = auth?.user && ['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)

    let accessiblePremiumIds = new Set<string>()
    if (!isAdmin && userId) {
      const premiumLectureIds = lectures.filter((l) => l.isPremium).map((l) => l.id)
      if (premiumLectureIds.length > 0) {
        const accessMap = await batchCheckContentAccess({
          userId,
          items: premiumLectureIds.map((id) => ({ contentType: 'lecture', contentId: id })),
        })
        for (const [id, result] of accessMap) {
          if (result.hasAccess) accessiblePremiumIds.add(id)
        }
      }
    } else if (isAdmin) {
      // Admins see all lectures
      accessiblePremiumIds = new Set(lectures.filter((l) => l.isPremium).map((l) => l.id))
    }

    const transformedLectures = lectures.map((lecture) => {
      const isPremiumLocked = lecture.isPremium && !accessiblePremiumIds.has(lecture.id)

      // Build safe metadata-only response for locked premium lectures
      const base = {
        id: lecture.id,
        title: lecture.title,
        slug: lecture.slug,
        thumbnail: lecture.thumbnail,
        chapterName: lecture.chapter.name,
        subjectName: lecture.chapter.subject.name,
        className: lecture.chapter.subject.class.name,
        classSlug: lecture.chapter.subject.class.slug,
        subjectId: lecture.chapter.subject.id,
        subjectSlug: lecture.chapter.subject.slug,
        chapterId: lecture.chapter.id,
        chapterSlug: lecture.chapter.slug,
        order: lecture.order,
        isPremium: lecture.isPremium,
        price: lecture.price,
        duration: lecture.duration,
        hasAccess: !isPremiumLocked,
      }

      if (isPremiumLocked) {
        return base // metadata only — no content, videoUrl, audioUrl, pdfUrl, resources
      }

      return {
        ...base,
        content: lecture.content,
        videoUrl: lecture.videoUrl,
        audioUrl: lecture.audioUrl,
        pdfUrl: lecture.pdfUrl,
        resources: lecture.resources.map((r) => ({
          name: r.title,
          url: r.url,
          type: r.type,
        })),
      }
    })

    return NextResponse.json({
      success: true,
      data: { lectures: transformedLectures },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { headers: cacheHeaders.noCache })
  } catch (error) {
    return handleApiError(error, 'Get lectures error')
  }
}
