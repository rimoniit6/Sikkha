import { NextResponse } from 'next/server'
import { getSessionCookieName } from '@/lib/auth/jwt'
import { apiError } from '@/lib/api-utils'
import { createAuditLog, AuditActions } from '@/lib/audit'

export async function POST() {
  try {
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

    await createAuditLog({ adminId: 'system', action: AuditActions.LOGOUT, entityType: 'user', entityId: 'unknown', status: 'success' }).catch(() => {})

    return response
  } catch {
    return apiError('লগআউট ব্যর্থ হয়েছে', 500, 'LOGOUT_FAILED')
  }
}
