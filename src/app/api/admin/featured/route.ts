import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, validateBody, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auditFromRequest, AuditActions } from '@/lib/audit'
import { invalidateMultipleCache } from '@/lib/cache-invalidate'
import {
  getFeaturedRegistration,
  batchResolveFeaturedContent,
  resolveFeaturedDisplayItem,
} from '@/lib/featured-content-registry'

const createFeaturedSchema = z.object({
  contentType: z.string().min(1, 'কন্টেন্ট টাইপ আবশ্যক'),
  contentId: z.string().min(1, 'কন্টেন্ট ID আবশ্যক'),
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  thumbnail: z.string().nullable().optional(),
  section: z.string().optional(),
  isActive: z.boolean().optional(),
  order: z.number().min(0).optional(),
})

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'homepage'
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = { section }
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    const data = await db.featuredContent.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    const resolved = await resolveFeaturedContent(data)
    return apiResponse(resolved)
  } catch (error) {
    return handleApiError(error, 'Admin Get Featured')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const validation = validateBody(createFeaturedSchema, body)
    if ('error' in validation) return validation.error
    const {
      contentType,
      contentId,
      title,
      subtitle,
      thumbnail,
      section,
      isActive,
      order,
    } = validation.data

    const existing = await db.featuredContent.findUnique({
      where: {
        section_contentType_contentId: {
          section: section || 'homepage',
          contentType,
          contentId,
        },
      },
    })

    if (existing) return apiError('এই কন্টেন্টটি ইতিমধ্যে এই সেকশনে ফিচার্ড আছে', 409)

    const maxOrderItem = await db.featuredContent.findFirst({
      where: { section: section || 'homepage' },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const created = await db.$transaction(async (tx) => {
      const c = await tx.featuredContent.create({
        data: {
          contentType,
          contentId,
          title: title || null,
          subtitle: subtitle || null,
          thumbnail: thumbnail || null,
          section: section || 'homepage',
          isActive: isActive ?? true,
          order: order ?? (maxOrderItem ? maxOrderItem.order + 1 : 0),
        },
      })
      await auditFromRequest(request, auth.user.id, AuditActions.FEATURED_CREATE, 'featured_content', c.id, undefined, c as Record<string, unknown>, tx as never)
      return c
    })

    // Invalidate homepage featured cache so the public API picks up changes
    await invalidateMultipleCache(['featured'])

    return apiResponse(created, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Featured')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) return apiError('ফিচার্ড কন্টেন্ট ID আবশ্যক', 400)

    const existing = await db.featuredContent.findUnique({ where: { id } })
    if (!existing) return apiError('ফিচার্ড কন্টেন্ট খুঁজে পাওয়া যায়নি', 404)

    const data: Record<string, unknown> = {}
    const allowedFields: string[] = [
      'contentType', 'contentId', 'title', 'subtitle',
      'thumbnail', 'section', 'isActive', 'order',
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) data[field] = updateData[field]
    }

    const updated = await db.$transaction(async (tx) => {
      const u = await tx.featuredContent.update({ where: { id }, data })
      await auditFromRequest(request, auth.user.id, AuditActions.FEATURED_UPDATE, 'featured_content', u.id, existing as Record<string, unknown>, u as Record<string, unknown>, tx as never)
      return u
    })

    await invalidateMultipleCache(['featured'])

    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Featured')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')

    if (!id) {
      const body = await request.json().catch(() => ({}))
      id = body.id
    }

    if (!id) return apiError('ফিচার্ড কন্টেন্ট ID আবশ্যক', 400)

    const existing = await db.featuredContent.findUnique({ where: { id } })
    if (!existing) return apiError('ফিচার্ড কন্টেন্ট খুঁজে পাওয়া যায়নি', 404)

    await db.$transaction(async (tx) => {
      await tx.featuredContent.update({
        where: { id },
        data: { deletedAt: new Date(), deletedBy: auth.user.id },
      })
      await auditFromRequest(request, auth.user.id, AuditActions.FEATURED_DELETE, 'featured_content', id, existing as Record<string, unknown>, undefined, tx as never)
    })

    await invalidateMultipleCache(['featured'])

    return apiResponse({ id, message: 'ফিচার্ড কন্টেন্ট সফলভাবে মুছে ফেলা হয়েছে' })
  } catch (error) {
    return handleApiError(error, 'Admin Delete Featured')
  }
}

async function resolveFeaturedContent(data: { id: string; contentType: string; contentId: string; title: string | null; subtitle: string | null; thumbnail: string | null }[]) {
  // Group contentIds by type
  const idsByType: Record<string, string[]> = {}
  for (const item of data) {
    if (!idsByType[item.contentType]) idsByType[item.contentType] = []
    idsByType[item.contentType].push(item.contentId)
  }

  // Batch-resolve per type using the registry
  const contentMap: Record<string, Record<string, Record<string, unknown>>> = {}
  for (const [type, ids] of Object.entries(idsByType)) {
    contentMap[type] = await batchResolveFeaturedContent(type, ids, db as never)
  }

  return data.map((item) => {
    const entry = contentMap[item.contentType]?.[item.contentId]
    const resolved = resolveFeaturedDisplayItem(item.contentType, item, entry)
    return {
      ...item,
      displayTitle: resolved.displayTitle,
      displaySubtitle: resolved.displaySubtitle,
      displayThumbnail: resolved.displayThumbnail,
      isPremium: resolved.isPremium,
      contentExists: resolved.contentExists,
    }
  })
}
