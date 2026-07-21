import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, parseIdsParam, validateBody, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auditFromRequest, AuditActions } from '@/lib/audit'
import { softDelete } from '@/lib/soft-delete'

const createBannerSchema = z.object({
  title: z.string().min(1, 'ব্যানার শিরোনাম আবশ্যক'),
  subtitle: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
  buttonText: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  order: z.number().min(0).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
})

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    const data = await db.banner.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get Banners')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const validated = validateBody(createBannerSchema, body)
    if ('error' in validated) return validated.error
    const { data: { title, subtitle, image, link, buttonText, isActive, order, startDate, endDate } } = validated

    const data = await db.$transaction(async (tx) => {
      const created = await (tx as any).banner.create({
        data: {
          title,
          subtitle: subtitle || null,
          image: image || null,
          link: link || null,
          buttonText: buttonText || null,
          isActive: isActive ?? true,
          order: order ?? 0,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
      })
      await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_CREATE, 'banner', created.id, body, undefined, tx as never)
      return created
    })

    await invalidateContentCache('banner')
    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Banner')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const { ids, isActive } = body
    if (Array.isArray(ids) && ids.length > 0) {
      const updateData: Record<string, unknown> = {}
      if (isActive !== undefined) updateData.isActive = isActive
      const result = await db.$transaction(async (tx) => {
        const updateResult = await (tx as any).banner.updateMany({ where: { id: { in: ids } }, data: updateData })
        await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_UPDATE, 'banner', 'bulk:' + ids.join(','), undefined, undefined, tx as never)
        return updateResult
      })
      await invalidateContentCache('banner')
      return apiResponse({ updated: result.count }, `${result.count}টি আপডেট হয়েছে`)
    }
    const { id, ...updateData } = body

    if (!id) {
      return apiError('ব্যানার ID আবশ্যক', 400)
    }

    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) {
      return apiError('ব্যানার খুঁজে পাওয়া যায়নি', 404)
    }

    const data: Record<string, unknown> = {}
    const allowedFields = [
      'title', 'subtitle', 'image', 'link', 'buttonText',
      'isActive', 'order',
    ]

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field]
      }
    }

    if (updateData.startDate !== undefined) {
      data.startDate = updateData.startDate ? new Date(updateData.startDate) : null
    }
    if (updateData.endDate !== undefined) {
      data.endDate = updateData.endDate ? new Date(updateData.endDate) : null
    }

    const updated = await db.$transaction(async (tx) => {
      const result = await (tx as any).banner.update({
        where: { id },
        data: data as never,
      })
      await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_UPDATE, 'banner', result.id, undefined, undefined, tx as never)
      return result
    })
    await invalidateContentCache('banner')
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Banner')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const { searchParams } = new URL(request.url)

    const ids = parseIdsParam(searchParams)
    if (ids) {
      for (const id of ids) {
        await softDelete(db, 'banner', id, auth.user.id)
      }
      await db.$transaction(async (tx) => {
        await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_DELETE, 'banner', 'bulk:' + ids.join(','), undefined, undefined, tx as never)
      })
      await invalidateContentCache('banner')
      return apiResponse({ deleted: ids.length }, `${ids.length}টি সফলভাবে মুছে ফেলা হয়েছে`)
    }

    const idFromQuery = searchParams.get('id')

    let id = idFromQuery

    if (!id) {
      try {
        const body = await request.json()
        id = body.id
      } catch {
        // No body provided
      }
    }

    if (!id) {
      return apiError('ব্যানার ID আবশ্যক', 400)
    }

    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) {
      return apiError('ব্যানার খুঁজে পাওয়া যায়নি', 404)
    }

    await db.$transaction(async (tx) => {
      await softDelete(tx, 'banner', id, auth.user.id)
      await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_DELETE, 'banner', id, undefined, undefined, tx as never)
    })

    await invalidateContentCache('banner')
    return apiResponse({ id }, 'ব্যানার সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Banner')
  }
}
