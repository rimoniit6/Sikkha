import { NextResponse } from 'next/server'
import { getSessionCookieName, verifyToken } from '@/lib/auth/jwt'
import { apiError } from '@/lib/api-utils'
import { createAuditLog, AuditActions } from '@/lib/audit'
import { handleApiError } from '@/lib/errors'

/**
 * Parse a named cookie from a raw Cookie header.
 * Mirrors the pattern used in src/lib/auth.ts.
 */
function parseCookie(cookie: string, name: string): string | null {
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export async function POST(request: Request) {
  try {
    // Extract user info from JWT BEFORE clearing the session cookie
    const cookieHeader = request.headers.get('cookie') ?? ''
    const token = parseCookie(cookieHeader, getSessionCookieName())

    let userId = 'system'
    let userName: string | undefined
    let userRole: string | undefined
    let entityId = 'unknown'

    if (token) {
      const payload = await verifyToken(token)
      if (payload) {
        userId = payload.userId
        entityId = payload.userId
        userRole = payload.role
        // userName is not in the JWT payload, but we set userId as entityId
        // The cached userName will be null — acceptable for logout audit
      }
    }

    const cookieName = getSessionCookieName()
    const response = NextResponse.json({ success: true, data: { message: 'সফলভাবে লগআউট হয়েছে' } })
    response.cookies.set(cookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    })

    await createAuditLog({
      adminId: userId,
      action: AuditActions.LOGOUT,
      entityType: 'user',
      entityId,
      userName,
      userRole,
      status: 'success',
    }).catch(() => {})

    return response
  } catch {
    return apiError('লগআউট ব্যর্থ হয়েছে', 500, 'LOGOUT_FAILED')
  }
}
