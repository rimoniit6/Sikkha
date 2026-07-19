/**
 * Request Logger Middleware
 *
 * Wraps API route handlers to automatically log:
 * - Request method, path, status code
 * - Request duration
 * - Request ID propagation
 * - Error logging with context
 */

import { NextResponse } from 'next/server'
import logger from './logger'
import { getOrCreateRequestId, requestIdHeaders } from './request-id'

export interface RequestContext {
  requestId: string
  userId?: string
  route: string
  method: string
}

/**
 * Create a request context from an incoming Request.
 */
export function createRequestContext(request: Request): RequestContext {
  const url = new URL(request.url)
  return {
    requestId: getOrCreateRequestId(request),
    route: url.pathname,
    method: request.method,
  }
}

/**
 * Wrap an API handler with automatic request logging.
 *
 * Usage:
 *   export const GET = withRequestLogging(async (request, ctx) => {
 *     // Your handler logic
 *     return NextResponse.json({ data })
 *   })
 */
export function withRequestLogging<T>(
  handler: (request: Request, ctx: RequestContext) => Promise<NextResponse>
) {
  return async (request: Request): Promise<NextResponse> => {
    const ctx = createRequestContext(request)
    const startTime = Date.now()

    try {
      const response = await handler(request, ctx)
      const duration = Date.now() - startTime

      // Add request ID to response headers
      const headers = new Headers(response.headers)
      headers.set('X-Request-ID', ctx.requestId)

      // Log the request
      logger.request(ctx.method, ctx.route, response.status, duration, {
        requestId: ctx.requestId,
        userId: ctx.userId,
      })

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch (error) {
      const duration = Date.now() - startTime

      logger.error(`Unhandled error in ${ctx.method} ${ctx.route}`, error, {
        requestId: ctx.requestId,
        route: ctx.route,
        method: ctx.method,
      })

      return NextResponse.json(
        { success: false, error: 'Internal server error', requestId: ctx.requestId },
        { status: 500, headers: requestIdHeaders(ctx.requestId) }
      )
    }
  }
}
