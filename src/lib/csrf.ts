import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

/**
 * Master switch for the CSRF protection system.
 *
 * Disabled for local development so the app runs without a CSRF token.
 * Re-enable in any environment by setting ENABLE_CSRF=true.
 *
 * Resolution order:
 *   - ENABLE_CSRF set  -> explicit true/false wins
 *   - otherwise          -> enabled everywhere EXCEPT NODE_ENV==='development'
 */
const CSRF_ENABLED =
  process.env.ENABLE_CSRF !== undefined
    ? process.env.ENABLE_CSRF === 'true'
    : process.env.NODE_ENV !== 'development'

export const isCsrfEnabled = (): boolean => CSRF_ENABLED

function getCsrfSecret(): Uint8Array {
  const secret = process.env.CSRF_SECRET
  if (!secret || secret.length < 32) {
    // In development, use a fallback secret instead of crashing
    if (process.env.NODE_ENV !== 'production') {
      return new TextEncoder().encode('dev-fallback-csrf-secret-that-is-long-enough-32ch!')
    }
    throw new Error('CSRF_SECRET environment variable must be set and at least 32 characters long')
  }
  return new TextEncoder().encode(secret)
}

// Lazy initialization to avoid top-level crashes
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
  if (!CSRF_ENABLED) return ''
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(getCsrfSecretCached())
  return token
}

export async function setCsrfCookie(token: string) {
  if (!CSRF_ENABLED) return
  const cookieStore = await cookies()
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  })
}

export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  if (!CSRF_ENABLED) return true
  try {
    await jwtVerify(token, getCsrfSecretCached())
    return true
  } catch {
    return false
  }
}

export async function verifyCsrfFromRequest(request: Request): Promise<boolean> {
  if (!CSRF_ENABLED) return true
  // Check header first
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken && await validateCsrfToken(headerToken)) {
    return true
  }

  // Check form data for mutating requests
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
  if (!CSRF_ENABLED) return { valid: true }
  const isValid = await verifyCsrfFromRequest(request)
  // Ensure cookie exists for subsequent requests
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