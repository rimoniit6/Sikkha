/**
 * Request ID Generation and Propagation
 *
 * Generates a unique ID for each incoming request and provides
 * context propagation through the request lifecycle.
 */

let counter = 0

/**
 * Generate a compact unique request ID.
 * Format: timestamp-base36-counter
 * Example: "m3x5k2-a1b"
 */
export function generateRequestId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 6)
  const seq = (counter++).toString(36)
  return `${ts}-${rand}${seq}`
}

/**
 * Extract request ID from headers or generate a new one.
 * Clients can send X-Request-ID header to correlate requests.
 */
export function getOrCreateRequestId(request: Request): string {
  return request.headers.get('x-request-id') || generateRequestId()
}

/**
 * Create standard response headers with request ID.
 */
export function requestIdHeaders(requestId: string): Record<string, string> {
  return { 'X-Request-ID': requestId }
}
