import { db } from '@/lib/db'
import { apiResponse, withAdmin, withCsrf } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { invalidateContentCache } from '@/lib/cache-invalidate'
import { NextResponse } from 'next/server'
import { auditFromRequest, AuditActions } from '@/lib/audit'
import { restore } from '@/lib/soft-delete'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const { id } = await params

    await db.$transaction(async (tx) => {
      await restore(tx, 'blogPost', id, auth.user.id)
      await auditFromRequest(request, auth.user.id, AuditActions.BLOG_RESTORE, 'blog_post', id, undefined, undefined, tx as never)
    })

    await invalidateContentCache('blog')
    return apiResponse({ id }, 'ব্লগ পোস্ট পুনরুদ্ধার করা হয়েছে')
  } catch (error) {
    return handleApiError(error, 'Admin Restore Blog Post')
  }
}
