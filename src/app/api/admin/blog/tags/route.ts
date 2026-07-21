import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, withCsrf, validateBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auditFromRequest, AuditActions } from '@/lib/audit'

const tagSchema = z.object({
  name: z.string().min(1, 'নাম আবশ্যক'),
  slug: z.string().optional(),
})

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().replace(/^-|-$/g, '') || 'untitled'
}

export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const data = await db.blogTag.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    })
    return apiResponse(data)
  } catch (error) {
    return handleApiError(error, 'Admin Get Blog Tags')
  }
}

export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const body = await request.json()
    const validated = validateBody(tagSchema, body)
    if ('error' in validated) return validated.error

    const slug = validated.data.slug || generateSlug(validated.data.name)

    const data = await db.$transaction(async (tx) => {
      const existing = await (tx as any).blogTag.findUnique({ where: { slug } })
      if (existing) throw new Error('এই স্লাগে ইতিমধ্যে একটি ট্যাগ আছে')

      const created = await (tx as any).blogTag.create({
        data: { name: validated.data.name, slug },
        include: { _count: { select: { posts: true } } },
      })
      await auditFromRequest(request, auth.user.id, AuditActions.BLOG_CATEGORY_CREATE, 'blog_tag', created.id, body, undefined, tx as never)
      return created
    })

    return apiResponse(data, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Blog Tag')
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
    if (!id) return apiError('ট্যাগ ID আবশ্যক', 400)

    const existing = await db.blogTag.findUnique({ where: { id } })
    if (!existing) return apiError('ট্যাগ খুঁজে পাওয়া যায়নি', 404)

    const data: Record<string, unknown> = {}
    if (updateData.name !== undefined) data.name = updateData.name
    if (updateData.slug !== undefined) data.slug = updateData.slug

    const updated = await db.blogTag.update({ where: { id }, data })
    return apiResponse(updated)
  } catch (error) {
    return handleApiError(error, 'Admin Update Blog Tag')
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
    if (!id) return apiError('ট্যাগ ID আবশ্যক', 400)

    const existing = await db.blogTag.findUnique({ where: { id } })
    if (!existing) return apiError('ট্যাগ খুঁজে পাওয়া যায়নি', 404)

    const postCount = await db.blogPostTag.count({ where: { tagId: id } })
    if (postCount > 0) {
      await db.blogPostTag.deleteMany({ where: { tagId: id } })
    }

    await db.$transaction(async (tx) => {
      await (tx as any).blogTag.delete({ where: { id } })
      await auditFromRequest(request, auth.user.id, AuditActions.BLOG_CATEGORY_DELETE, 'blog_tag', id, undefined, undefined, tx as never)
    })

    return apiResponse({ id }, 'ট্যাগ সফলভাবে মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Blog Tag')
  }
}
