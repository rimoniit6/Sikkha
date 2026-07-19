import { SignJWT, jwtVerify } from 'jose'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is not set. ' +
        'The application cannot start without a JWT secret in production. ' +
        'Set JWT_SECRET to a random string of at least 32 characters.'
      )
    }
    // Development fallback — clearly documented, not usable in production
    console.warn(
      '[SECURITY] JWT_SECRET is not set. Using development fallback. ' +
      'This MUST NOT be used in production.'
    )
    return new TextEncoder().encode('dev-only-jwt-secret-not-for-production-32ch!')
  }

  if (secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL: JWT_SECRET must be at least 32 characters long in production. ' +
        `Current length: ${secret.length}.`
      )
    }
    console.warn(
      `[SECURITY] JWT_SECRET is only ${secret.length} characters. Minimum recommended: 32.`
    )
  }

  return new TextEncoder().encode(secret)
}

const COOKIE_NAME = 'session'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

export interface JwtPayload {
  userId: string
  role: string
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

export function getSessionCookieName(): string {
  return COOKIE_NAME
}

export function getCookieOptions() {
  return COOKIE_OPTIONS
}
