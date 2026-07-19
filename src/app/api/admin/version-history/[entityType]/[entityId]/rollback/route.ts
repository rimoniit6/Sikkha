import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin, withCsrf, validateBody } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { rollbackVersion } from '@/lib/version-history'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getClientIP } from '@/lib/audit'

const rollbackSchema = z.object({
  targetVersion: z.number().int().positive('ভার্সন নম্বর বৈধ হতে হবে'),
  comment: z.string().max(500).optional(),
})

/**
 * POST /api/admin/version-history/[entityType]/[entityId]/rollback
 *
 * Rolls back an entity to a specific version.
 * Single transaction: verify → createVersion → rollbackVersion → syncWorkflow → audit → commit.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  const csrfCheck = await withCsrf(request)
  if ('error' in csrfCheck) return csrfCheck.error

  try {
    const { entityType, entityId } = await params
    const body = await request.json()
    const validated = validateBody(rollbackSchema, body)
    if ('error' in validated) return validated.error

    const { targetVersion, comment } = validated.data
    const userId = auth.user.id
    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || undefined

    const result = await rollbackVersion(db, entityType, entityId, targetVersion, userId, {
      comment,
      ipAddress,
      userAgent,
    })

    if (!result.success) {
      return apiError(result.error || 'রোলব্যাক ব্যর্থ', 400, 'ROLLBACK_FAILED')
    }

    return apiResponse({
      success: true,
      newVersionNumber: result.newVersionNumber,
      message: `ভার্সন ${targetVersion} এ সফলভাবে রোলব্যাক করা হয়েছে`,
    })
  } catch (error) {
    return handleApiError(error, 'Admin Rollback Version')
  }
}
