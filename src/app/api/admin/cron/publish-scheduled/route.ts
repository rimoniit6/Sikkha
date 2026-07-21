import { db } from '@/lib/db'
import { publishScheduledContent } from '@/lib/scheduled-publish'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { auditFromRequest } from '@/lib/audit'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/cron/publish-scheduled
 *
 * Cron endpoint for Vercel — publishes SCHEDULED content where scheduledAt <= now.
 *
 * Auth:
 *   - Vercel Cron: Authorization: Bearer <CRON_SECRET>
 *   - Admin manual trigger: session auth via withAdmin()
 */
export async function GET(request: Request) {
  // Check for Vercel Cron Bearer token
  const authHeader = request.headers.get('authorization')
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isVercelCron) {
    // Fall back to admin session auth
    const auth = await withAdmin(request)
    if (auth instanceof NextResponse) return auth
  }

  try {
    const report = await publishScheduledContent(db)
    return apiResponse(report)
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'সময় নির্ধারিত প্রকাশ ব্যর্থ',
      500,
      'CRON_ERROR'
    )
  }
}

/**
 * POST /api/admin/cron/publish-scheduled
 *
 * Manual trigger for admin UI — same logic as GET, requires admin auth.
 */
export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const report = await publishScheduledContent(db)

    await auditFromRequest(
      request,
      auth.user.id,
      'scheduled_publish_trigger',
      'cron',
      `batch-${Date.now()}`,
      undefined,
      {
        total: report.total,
        published: report.published,
        failed: report.failed,
        skipped: report.skipped,
        duration: report.duration,
      } as Record<string, unknown>
    )

    return apiResponse(report)
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'সময় নির্ধারিত প্রকাশ ব্যর্থ',
      500,
      'CRON_ERROR'
    )
  }
}
