import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

/**
 * CSRF Protection — configurable via Admin Settings.
 *
 * Production: CSRF is ALWAYS enabled (hardcoded safety).
 * Development: CSRF follows the admin setting (enableCsrfProtection).
 *              Default: disabled (backward-compatible with existing dev behavior).
 *
 * Architecture:
 *   - Single source of truth: SiteSetting table (key: 'enableCsrfProtection')
 *   - In-memory cache with 30s TTL to reduce database reads
 *   - Cache auto-invalidates when admin saves settings
 *   - Production always returns true regardless of setting
 */

// Environment-based default (for development fallback when DB is unavailable)
const CSRF_ENV_DEFAULT =
  process.env.ENABLE_CSRF !== undefined
    ? process.env.ENABLE_CSRF === 'true'
    : process.env.NODE_ENV !== 'development'

// In-memory cache with TTL
const CACHE_TTL_MS = 30_000 // 30 seconds
let _csrfCache: { enabled: boolean; timestamp: number } | null = null

/**
 * Read CSRF setting from database with cache.
 * Falls back to env var if database is unavailable.
 */
async function readCsrfSettingFromDB(): Promise<boolean> {
  try {
    // Dynamic import to avoid circular dependencies
    const { db } = await import('@/lib/db')
    const setting = await db.siteSetting.findUnique({
      where: { key: 'enableCsrfProtection' },
      select: { value: true },
    })
    return setting?.value === 'true'
  } catch {
    // Database unavailable — fall back to env var
    return CSRF_ENV_DEFAULT
  }
}

/**
 * Get effective CSRF state (async, database-backed).
 *
 * Resolution order:
 *   1. Production → always true (hardcoded safety)
 *   2. Cache hit (within TTL) → return cached value
 *   3. Database → read from SiteSetting, cache result
 *   4. Database failure → fall back to env var
 */
export async function isCsrfEnabled(): Promise<boolean> {
  // Production: always enabled — no override possible
  if (process.env.NODE_ENV === 'production') return true

  // Check cache
  if (_csrfCache && Date.now() - _csrfCache.timestamp < CACHE_TTL_MS) {
    return _csrfCache.enabled
  }

  // Read from database
  const enabled = await readCsrfSettingFromDB()

  // Update cache
  _csrfCache = { enabled, timestamp: Date.now() }

  return enabled
}

/**
 * Invalidate CSRF cache. Called after admin saves settings.
 * Forces next request to re-read from database.
 */
export function invalidateCsrfCache(): void {
  _csrfCache = null
}

function getCsrfSecret(): Uint8Array {
  const secret = process.env.CSRF_SECRET
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV !== 'production') {
      return new TextEncoder().encode('dev-fallback-csrf-secret-that-is-long-enough-32ch!')
    }
    throw new Error('CSRF_SECRET environment variable must be set and at least 32 characters long')
  }
  return new TextEncoder().encode(secret)
}

let _csrfSecret: Uint8Array | null = null
function getCsrfSecretCached(): Uint8Array {
  if (!_csrfSecret) {
    _csrfSecret = getCsrfSecret()
  }
  return _csrfSecret
}

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'

export async function generateCsrfToken(): Promise<string> {
  if (!(await isCsrfEnabled())) return ''
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getCsrfSecretCached())
  return token
}

export async function setCsrfCookie(token: string) {
  if (!(await isCsrfEnabled())) return
  const cookieStore = await cookies()
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60,
    path: '/',
  })
}

export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  if (!(await isCsrfEnabled())) return true
  try {
    await jwtVerify(token, getCsrfSecretCached())
    return true
  } catch {
    return false
  }
}

export async function verifyCsrfFromRequest(request: Request): Promise<boolean> {
  if (!(await isCsrfEnabled())) return true
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken && await validateCsrfToken(headerToken)) {
    return true
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      try {
        const body = await request.clone().json()
        if (body._csrf && await validateCsrfToken(body._csrf)) {
          return true
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }

  return false
}

export async function csrfMiddleware(request: Request): Promise<{ valid: boolean; token?: string }> {
  if (!(await isCsrfEnabled())) return { valid: true }
  const isValid = await verifyCsrfFromRequest(request)
  const existingToken = await getCsrfToken()
  if (!existingToken) {
    const newToken = await generateCsrfToken()
    await setCsrfCookie(newToken)
    return { valid: isValid, token: newToken }
  }
  return { valid: isValid, token: existingToken }
}

export function createCsrfTokenInput(token: string): string {
  const escaped = token.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<input type="hidden" name="_csrf" value="${escaped}" />`
}
