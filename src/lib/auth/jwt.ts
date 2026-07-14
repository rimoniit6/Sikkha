import { SignJWT, jwtVerify } from 'jose'

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars')

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
