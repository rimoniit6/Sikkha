import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { hashPassword } from '@/lib/password'
import { signToken, getCookieOptions, getSessionCookieName } from '@/lib/auth/jwt'
import { registerSchema } from '@/lib/validations'
import { validateBody } from '@/lib/api-utils'
import { handleApiError, ConflictError } from '@/lib/errors'
import { authLimiter, getClientIdentifier, rateLimitHeaders } from '@/lib/rate-limit'
import { createAuditLog, AuditActions, getClientIP } from '@/lib/audit'

export async function POST(request: Request) {
  try {
    const identifier = getClientIdentifier(request)
    const rateLimitResult = await authLimiter.limit(identifier)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'অনেকবার চেষ্টা করেছেন। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।', code: 'RATE_LIMITED' },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      )
    }

    const body = await request.json()
    const parsed = validateBody(registerSchema, body)
    if ('error' in parsed) return parsed.error

    const { email, password, name } = parsed.data

    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (existing) {
      throw new ConflictError('এই ইমেইলে ইতিমধ্যে একটি অ্যাকাউন্ট আছে')
    }

    const user = await db.user.create({
      data: {
        email,
        password: hashPassword(password),
        name: name || email.split('@')[0],
        role: 'STUDENT',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        phone: true,
        institute: true,
        classLevel: true,
        board: true,
        learningMode: true,
        isPremium: true,
        premiumExpiry: true,
      },
    })

    const token = await signToken({ userId: user.id, role: user.role })

    const response = NextResponse.json(
      { success: true, data: { user: { ...user, premiumExpiry: user.premiumExpiry?.toISOString() ?? undefined } } },
      { status: 201 },
    )
    response.cookies.set(getSessionCookieName(), token, getCookieOptions())

    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || undefined
    await createAuditLog({ adminId: user.id, action: AuditActions.USER_REGISTER, entityType: 'user', entityId: user.id, ipAddress, userAgent, userName: user.name || undefined, userRole: user.role, status: 'success' })

    return response
  } catch (error) {
    return handleApiError(error, 'Register error')
  }
}
