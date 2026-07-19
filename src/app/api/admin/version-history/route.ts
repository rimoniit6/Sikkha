import { db } from '@/lib/db'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { getVersions } from '@/lib/version-history'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/version-history
 *
 * Returns version history for a specific entity.
 * Query params: entityType, entityId, page, limit, q, action
 */
export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!entityType || !entityId) {
      return apiError('এন্টিটি টাইপ এবং আইডি আবশ্যক', 400)
    }

    const result = await getVersions(db, entityType, entityId, { page, limit })

    return apiResponse(result)
  } catch (error) {
    return handleApiError(error, 'Admin Get Version History')
  }
}
