import { db } from '@/lib/db'
import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { NextResponse } from 'next/server'
import { countArchivableLogs, purgeOldAuditLogs, AUDIT_RETENTION_DAYS, AUDIT_SECURITY_RETENTION_DAYS } from '@/lib/audit-retention'

/**
 * GET /api/admin/audit-logs/retention
 *
 * Preview (dry-run) — counts how many audit logs are eligible for purging
 * based on the retention policy (365d normal, 730d security).
 *
 * Auth: Admin only (session auth via withAdmin())
 */
export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const counts = await countArchivableLogs(db)
    return apiResponse({
      ...counts,
      retentionDays: AUDIT_RETENTION_DAYS,
      securityRetentionDays: AUDIT_SECURITY_RETENTION_DAYS,
    })
  } catch (error) {
    return handleApiError(error, 'Audit Retention Preview')
  }
}

/**
 * POST /api/admin/audit-logs/retention
 *
 * Execute purge — deletes audit logs older than the retention period.
 *
 * Auth: Admin only (session auth via withAdmin()).
 *
 * Response:
 *   - deleted: number of logs deleted
 *   - errors: number of batch operations that failed
 *   - retentionDays: retention period used
 */
export async function POST(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const result = await purgeOldAuditLogs(db)
    return apiResponse(result)
  } catch (error) {
    return handleApiError(error, 'Audit Retention Purge')
  }
}
