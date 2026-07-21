import { apiError,apiResponse,validateBody,withSuperAdmin,withCsrf } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { softDelete } from '@/lib/soft-delete'
import { auditFromRequest, AuditActions } from '@/lib/audit'

const createContentTypeSchema = z.object({
  key: z.string().min(1, 'key আবশ্যক'),
  labelBn: z.string().min(1, 'labelBn আবশ্যক'),
  labelEn: z.string().min(1, 'labelEn আবশ্যক'),
  description: z.string().nullable().optional(),
  icon: z.string().min(1, 'icon আবশ্যক'),
  color: z.string().min(1, 'color আবশ্যক'),
  lightColor: z.string().nullable().optional(),
  textColor: z.string().nullable().optional(),
  route: z.string().nullable().optional(),
  paramKey: z.string().nullable().optional(),
  buttonLabel: z.string().nullable().optional(),
  showInChapterDetail: z.boolean().optional(),
  order: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: Request) {
  const auth = await withSuperAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const contentTypes = await db.contentType.findMany({
      orderBy: { order: 'asc' },
    })
    return apiResponse(contentTypes)
  } catch (error) {
    return handleApiError(error, 'Admin Get Content Types')
  }
}

export async function POST(request: Request) {
  const auth = await withSuperAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const validation = validateBody(createContentTypeSchema, body)
    if ('error' in validation) return validation.error
    const { key, labelBn, labelEn, description, icon, color, lightColor, textColor, route, paramKey, buttonLabel, showInChapterDetail, order, isActive } = validation.data

    const contentType = await db.$transaction(async (tx) => {
      const created = await (tx as any).contentType.create({
        data: {
          key, labelBn, labelEn, description, icon, color, lightColor, textColor,
          route, paramKey, buttonLabel,
          showInChapterDetail: showInChapterDetail ?? true,
          order: order ?? 0, isActive: isActive ?? true,
        },
      })
      await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_TYPE_CREATE, 'content_type', created.id, undefined, created as Record<string, unknown>, tx as never)
      return created
    })

    return apiResponse(contentType, 201)
  } catch (error) {
    return handleApiError(error, 'Admin Create Content Type')
  }
}

export async function PUT(request: Request) {
  const auth = await withSuperAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return apiError('id আবশ্যক', 400)
    }

    const contentType = await db.$transaction(async (tx) => {
      const result = await (tx as any).contentType.update({
        where: { id },
        data: updates,
      })
      await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_TYPE_UPDATE, 'content_type', result.id, undefined, result as Record<string, unknown>, tx as never)
      return result
    })

    return apiResponse(contentType)
  } catch (error) {
    return handleApiError(error, 'Admin Update Content Type')
  }
}

export async function DELETE(request: Request) {
  const auth = await withSuperAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('id আবশ্যক', 400)
    }

    await db.$transaction(async (tx) => {
      await softDelete(tx, 'contentType', id, auth.user.id)
      await auditFromRequest(request, auth.user.id, AuditActions.CONTENT_TYPE_DELETE, 'content_type', id, undefined, undefined, tx as never)
    })

    return apiResponse({ id }, 'কন্টেন্ট টাইপ মুছে ফেলা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Delete Content Type')
  }
}
