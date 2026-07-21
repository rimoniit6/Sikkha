import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, withCsrf, validateBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auditFromRequest, AuditActions } from '@/lib/audit'
import { softDelete } from '@/lib/soft-delete'

const categorySchema = z.object({
  name: z.string().min(1, 'নাম আবশ্যক'),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().min(0).optional().default(0),
})

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().replace(/^-|-$/g, '') || 'untitled'
}

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const data = await db.blogCategory.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { posts: { where: { deletedAt: null } } } } },
      orderBy: { order: 'asc' },
    })
    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get Blog Categories')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const validated = validateBody(categorySchema, body)
    if ('error' in validated) return validated.error

    const slug = validated.data.slug || generateSlug(validated.data.name)

    const data = await db.$transaction(async (tx) => {
      const created = await (tx as any).blogCategory.create({
        data: { ...validated.data, slug },
        include: { _count: { select: { posts: true } } },
      })
      await auditFromRequest(request, auth.user.id, AuditActions.BLOG_CATEGORY_CREATE, 'blog_category', created.id, body, undefined, tx as never)
      return created
    })

    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Blog Category')
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
    if (!id) return apiError('ক্যাটাগরি ID আবশ্যক', 400)

    const existing = await db.blogCategory.findUnique({ where: { id } })
    if (!existing) return apiError('ক্যাটাগরি খুঁজে পাওয়া যায়নি', 404)

    const data: Record<string, unknown> = {}
    const allowedFields = ['name', 'slug', 'description', 'color', 'isActive', 'order']
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) data[field] = updateData[field]
    }

    const updated = await db.$transaction(async (tx) => {
      const result = await (tx as any).blogCategory.update({ where: { id }, data })
      await auditFromRequest(request, auth.user.id, AuditActions.BLOG_CATEGORY_UPDATE, 'blog_category', id, undefined, undefined, tx as never)
      return result
    })

    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Blog Category')
  }
}

export async function DELETE(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const { id } = body
    if (!id) return apiError('ক্যাটাগরি ID আবশ্যক', 400)

    const existing = await db.blogCategory.findUnique({ where: { id } })
    if (!existing) return apiError('ক্যাটাগরি খুঁজে পাওয়া যায়নি', 404)

    const postCount = await db.blogPost.count({ where: { categoryId: id, deletedAt: null } })
    if (postCount > 0) {
      return apiError(`${postCount}টি ব্লগ পোস্ট এই ক্যাটাগরিতে আছে। আগে পোস্ট সরান।`, 400)
    }

    await db.$transaction(async (tx) => {
      await softDelete(tx, 'blogCategory', id, auth.user.id)
      await auditFromRequest(request, auth.user.id, AuditActions.BLOG_CATEGORY_DELETE, 'blog_category', id, undefined, undefined, tx as never)
    })

    return apiResponse({ id }, 'ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Blog Category')
  }
}
