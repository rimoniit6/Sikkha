import { apiResponse, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { verifyAuditChain, quickVerifyAuditChain } from '@/lib/audit-integrity'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/audit-logs/verify
 *
 * Verify the integrity of the audit log hash chain.
 * Checks that every entry's hash matches the computed hash based on
 * the previous entry's hash + current entry data.
 *
 * Query params:
 *   quick=true   — Only check the most recent 50 entries (fast)
 *   limit=N      — Max entries to check (default 1000)
 *   since=ISO    — Only check entries after this date
 */
export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const isQuick = searchParams.get('quick') === 'true'
    const limitParam = searchParams.get('limit')
    const sinceParam = searchParams.get('since')

    let result

    if (isQuick) {
      result = await quickVerifyAuditChain(50)
    } else {
      const limit = limitParam ? parseInt(limitParam) : 1000
      const since = sinceParam ? new Date(sinceParam) : undefined
      result = await verifyAuditChain({ limit, since })
    }

    return apiResponse({
      isValid: result.isValid,
      totalChecked: result.totalChecked,
      brokenLinks: result.brokenLinks,
      brokenLinkDetails: result.brokenLinkDetails.length > 0 ? result.brokenLinkDetails : undefined,
      durationMs: result.durationMs,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    return handleApiError(error, 'Admin Audit Log Verify')
  }
}
