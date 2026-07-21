import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { NextResponse } from 'next/server'
import { purgeOldAuditLogs } from '@/lib/audit-retention'

/**
 * GET /api/admin/cron/purge-audit-logs
 *
 * Cron endpoint for Vercel — purges audit logs older than the retention period.
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
    const result = await purgeOldAuditLogs(db)
    return apiResponse(result)
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'অডিট লগ পরিষ্কার ব্যর্থ',
      500,
      'CRON_ERROR'
    )
  }
}

/**
 * POST /api/admin/cron/purge-audit-logs
 *
 * Manual trigger for admin UI — same logic as GET, requires admin auth.
 */
export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const result = await purgeOldAuditLogs(db)
    return apiResponse(result)
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'অডিট লগ পরিষ্কার ব্যর্থ',
      500,
      'CRON_ERROR'
    )
  }
}
