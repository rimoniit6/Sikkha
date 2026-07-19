import { NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { apiLimiter, getClientIdentifier, rateLimitHeaders } from '@/lib/rate-limit'
import { apiError } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'
import { resolvePurchaseStatus } from '@/lib/purchase-state'

/**
 * GET /api/payment/check
 *
 * Unified purchase status check using the centralized resolver.
 * Returns: { state, reason, paymentId, hasAccess, subscription?, bundleTitle? }
 *
 * Backward-compatible: also returns { purchased, pendingPayment } for legacy consumers.
 */
export async function GET(request: Request) {
  try {
    const identifier = getClientIdentifier(request)
    const rateResult = await apiLimiter.limit(identifier)
    if (!rateResult.success) {
      return NextResponse.json(
        { success: false, error: 'অনেক বেশি অনুরোধ।', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: rateLimitHeaders(rateResult) }
      )
    }

    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('contentType')
    const contentId = searchParams.get('contentId')

    if (!contentType || !contentId) {
      return apiError('contentType এবং contentId আবশ্যক', 400)
    }

    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = auth.user.role === 'ADMIN' || auth.user.role === 'SUPER_ADMIN'
      ? (searchParams.get('userId') || auth.user.id)
      : auth.user.id

    // Use centralized resolver
    const status = await resolvePurchaseStatus(userId, contentType, contentId)

    return NextResponse.json({
      success: true,
      data: {
        // New unified state
        state: status.state,
        reason: status.reason,
        paymentId: status.paymentId,
        hasAccess: status.hasAccess,
        subscription: status.subscription,
        bundleTitle: status.bundleTitle,
        partialAccess: status.partialAccess,
        // Backward-compatible fields
        purchased: status.hasAccess,
        pendingPayment: status.state === 'PENDING_APPROVAL',
        rejected: status.state === 'REJECTED',
      },
    })
  } catch (error) {
    return handleApiError(error, 'Payment check error')
  }
}
