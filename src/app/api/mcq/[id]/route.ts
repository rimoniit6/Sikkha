import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { checkContentAccess } from '@/lib/access-control'
import { apiError, withCsrf } from '@/lib/api-utils'
import { buildPremiumUpdatePayload } from '@/lib/premium'
import { cacheHeaders } from '@/lib/cache-headers'


function transformMCQ(mcq: {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  explanation: string | null
  questionImage?: string | null
  optionAImage?: string | null
  optionBImage?: string | null
  optionCImage?: string | null
  optionDImage?: string | null
  explanationImage?: string | null
  isPremium: boolean
  price: number
  chapterId?: string
  [key: string]: unknown
}) {
  return {
    id: mcq.id,
    text: mcq.question,
    questionImage: mcq.questionImage || null,
    options: [
      { key: 'A', text: mcq.optionA, image: mcq.optionAImage || null },
      { key: 'B', text: mcq.optionB, image: mcq.optionBImage || null },
      { key: 'C', text: mcq.optionC, image: mcq.optionCImage || null },
      { key: 'D', text: mcq.optionD, image: mcq.optionDImage || null },
    ],
    correctAnswer: mcq.correctAnswer,
    explanation: mcq.explanation || '',
    explanationImage: mcq.explanationImage || null,
    chapterId: mcq.chapterId || null,
    isPremium: mcq.isPremium,
    price: mcq.price,
  }
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params

    const mcq = await db.mCQ.findUnique({
      where: { id, isActive: true },
      include: {
        chapter: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    if (!mcq) {
      return apiError('MCQ খুঁজে পাওয়া যায়নি', 404)
    }

    if (mcq.isPremium) {
      const auth = await verifyAuth()
      const userId = auth?.user.id

      // Anonymous users get preview metadata — never redirect to login
      if (!userId) {
        return NextResponse.json({
          success: true,
          data: {
            id: mcq.id,
            text: mcq.question,
            isPremium: true,
            price: mcq.price,
            chapterId: mcq.chapterId,
            chapterName: mcq.chapter?.name || '',
            hasAccess: false,
          },
        }, { headers: cacheHeaders.noCache })
      }

      const access = await checkContentAccess({
        userId,
        contentType: 'mcq',
        contentId: id,
      })

      if (!access.hasAccess) {
    // Premium content without access — return metadata only
        return NextResponse.json({
          success: true,
          data: {
            id: mcq.id,
            text: mcq.question,
            isPremium: true,
            price: mcq.price,
            chapterId: mcq.chapterId,
            chapterName: mcq.chapter?.name || '',
            hasAccess: false,
            pendingPayment: access.pendingPayment,
          },
        }, { headers: cacheHeaders.noCache })
      }
    }

    return NextResponse.json({ success: true, data: transformMCQ(mcq as unknown as Parameters<typeof transformMCQ>[0]) }, { headers: cacheHeaders.noCache })
  } catch (error) {
    console.error('Get MCQ detail error:', error)
    return apiError('MCQ এর বিস্তারিত তথ্য আনতে সমস্যা হয়েছে', 500)
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth || !auth.user || !['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)) {
      return apiError('MCQ আপডেট করার অনুমতি নেই', 403)
    }

    const { id } = await props.params
    const body = await request.json()

    const existingMcq = await db.mCQ.findUnique({ where: { id } })

    if (!existingMcq) {
      return apiError('MCQ খুঁজে পাওয়া যায়নি', 404)
    }

    const mcq = await db.mCQ.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: buildPremiumUpdatePayload(body) as any,
    })

    return NextResponse.json({ success: true, data: { message: 'MCQ আপডেট হয়েছে', mcq: transformMCQ(mcq as unknown as Parameters<typeof transformMCQ>[0]) } })
  } catch (error) {
    console.error('Update MCQ error:', error)
    return apiError('MCQ আপডেট করতে সমস্যা হয়েছে', 500)
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const auth = await verifyAuth(request)
    if (!auth || !auth.user || !['ADMIN', 'SUPER_ADMIN'].includes(auth.user.role)) {
      return apiError('MCQ মুছে ফেলার অনুমতি নেই', 403)
    }

    const { id } = await props.params

    const existingMcq = await db.mCQ.findUnique({ where: { id } })

    if (!existingMcq) {
      return apiError('MCQ খুঁজে পাওয়া যায়নি', 404)
    }

    await db.mCQ.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, data: { message: 'MCQ সফলভাবে মুছে ফেলা হয়েছে' } })
  } catch (error) {
    console.error('Delete MCQ error:', error)
    return apiError('MCQ মুছে ফেলতে সমস্যা হয়েছে', 500)
  }
}
