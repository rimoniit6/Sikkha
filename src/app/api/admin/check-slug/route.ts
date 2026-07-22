import { NextResponse } from 'next/server'
import { apiResponse, apiError, withAdmin } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { findSlugConflict } from '@/lib/slug-unique'
import type { SlugModel } from '@/lib/slug-unique'

/**
 * GET /api/admin/check-slug?model=blogPost&slug=my-slug&excludeId=abc123
 *
 * Lightweight slug uniqueness check for frontend validation.
 * Uses the shared `findSlugConflict` helper which bypasses the soft-delete
 * filter (includeDeleted: true) so soft-deleted records are seen.
 *
 * Returns:
 *   { success: true, data: { available: true } }  — slug is free
 *   { success: true, data: { available: false } } — slug is taken
 */
export async function GET(request: Request) {
  const auth = await withAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const { searchParams } = new URL(request.url)
    const model = searchParams.get('model') as SlugModel | null
    const slug = searchParams.get('slug')
    const excludeId = searchParams.get('excludeId') || undefined

    if (!model || !slug) {
      return apiError('model and slug parameters are required', 400)
    }

    const conflict = await findSlugConflict(model, { slug }, excludeId)

    return apiResponse({ available: !conflict })
  } catch (error) {
    return handleApiError(error, 'Check Slug')
  }
}
