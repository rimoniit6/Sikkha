import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { NextResponse } from 'next/server'
import { auditFromRequest, AuditActions } from '@/lib/audit'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const { id } = await params
    const existing = await db.blogPost.findUnique({ where: { id } })
    if (!existing) return apiError('ব্লগ পোস্ট খুঁজে পাওয়া যায়নি', 404)

    const data = await db.$transaction(async (tx) => {
      const updated = await (tx as any).blogPost.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      })
      await auditFromRequest(request, auth.user.id, AuditActions.BLOG_UPDATE, 'blog_post', id, undefined, undefined, tx as never)
      return updated
    })

    await invalidateContentCache('blog')
    return apiResponse(data, 'ব্লগ পোস্ট আর্কাইভ করা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Archive Blog Post')
  }
}
