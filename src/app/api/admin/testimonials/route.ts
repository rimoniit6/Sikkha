import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, parseIdsParam, validateBody, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auditFromRequest, AuditActions } from '@/lib/audit'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { softDelete } from '@/lib/soft-delete'

const createTestimonialSchema = z.object({
  name: z.string().min(1, 'নাম আবশ্যক'),
  role: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  content: z.string().min(1, 'বিষয়বস্তু আবশ্যক'),
  rating: z.number().min(1).max(5).optional(),
  isActive: z.boolean().optional(),
  order: z.number().min(0).optional(),
})

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {}
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === 'true'

    const data = await db.testimonial.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get Testimonials error')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const validation = validateBody(createTestimonialSchema, body)
    if ('error' in validation) return validation.error
    const { name, role, avatar, content, rating, isActive, order } = validation.data

    const data = await db.$transaction(async (tx) => {
      const created = await (tx as any).testimonial.create({
        data: {
          name,
          role: role || null,
          avatar: avatar || null,
          content,
          rating: rating ?? 5,
          isActive: isActive ?? true,
          order: order ?? 0,
        },
      })
      await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_CREATE, 'testimonial', created.id, body, undefined, tx as never)
      return created
    })

    await invalidateContentCache('faq')
    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Testimonial error')
  }
}

export async function PUT(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return apiError('টেস্টিমোনিয়াল ID আবশ্যক', 400)
    }

    const existing = await db.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return apiError('টেস্টিমোনিয়াল খুঁজে পাওয়া যায়নি', 404)
    }

    const updated = await db.$transaction(async (tx) => {
      const data: Record<string, unknown> = {}
      const allowedFields = ['name', 'role', 'avatar', 'content', 'rating', 'isActive', 'order']

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          data[field] = updateData[field]
        }
      }

      const result = await (tx as any).testimonial.update({
        where: { id },
        data: data as never,
      })
      await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_UPDATE, 'testimonial', result.id, undefined, undefined, tx as never)
      return result
    })

    await invalidateContentCache('faq')
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Testimonial error')
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
        await softDelete(db, 'testimonial', id, auth.user.id)
      }
      await db.$transaction(async (tx) => {
        await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_DELETE, 'testimonial', 'bulk:' + ids.join(','), undefined, undefined, tx as never)
      })
      await invalidateContentCache('faq')
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
      return apiError('টেস্টিমোনিয়াল ID আবশ্যক', 400)
    }

    const existing = await db.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return apiError('টেস্টিমোনিয়াল খুঁজে পাওয়া যায়নি', 404)
    }

    await db.$transaction(async (tx) => {
      await softDelete(tx, 'testimonial', id, auth.user.id)
      await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_DELETE, 'testimonial', id, undefined, undefined, tx as never)
    })
    await invalidateContentCache('faq')
    return apiResponse({ id }, 'টেস্টিমোনিয়াল সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Testimonial error')
  }
}
