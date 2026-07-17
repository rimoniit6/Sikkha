import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/password'
import { signToken, getCookieOptions, getSessionCookieName } from '@/lib/auth/jwt'
import { loginSchema } from '@/lib/validations'
import { validateBody } from '@/lib/api-utils'
import { handleApiError, AuthenticationError } from '@/lib/errors'
import { authLimiter, getClientIdentifier, rateLimitHeaders } from '@/lib/rate-limit'

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
    const parsed = validateBody(loginSchema, body)
    if ('error' in parsed) return parsed.error

    const { email, password } = parsed.data

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true, role: true, avatar: true, phone: true, institute: true, classLevel: true, board: true, learningMode: true, isPremium: true, premiumExpiry: true },
    })

    if (!user || !user.password || !verifyPassword(password, user.password)) {
      throw new AuthenticationError('ইমেইল বা পাসওয়ার্ড সঠিক নয়')
    }

    const token = await signToken({ userId: user.id, role: user.role })

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? '',
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          institute: user.institute,
          classLevel: user.classLevel,
          board: user.board,
          learningMode: user.learningMode,
          isPremium: user.isPremium,
          premiumExpiry: user.premiumExpiry?.toISOString() ?? undefined,
        },
      },
    })
    response.cookies.set(getSessionCookieName(), token, getCookieOptions())
    return response
  } catch (error) {
    return handleApiError(error, 'Login error')
  }
}
