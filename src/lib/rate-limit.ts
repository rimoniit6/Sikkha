import { db } from '@/lib/db'

const DEFAULT_LIMITS = {
  api: { windowMs: 60_000, maxRequests: 60 },
  upload: { windowMs: 60_000, maxRequests: 10 },
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
}

let cachedLimits: typeof DEFAULT_LIMITS | null = null
let cachedLimitsTime = 0
const LIMITS_CACHE_TTL = 5 * 60_000

async function loadLimits(): Promise<typeof DEFAULT_LIMITS> {
  const now = Date.now()
  if (cachedLimits && now - cachedLimitsTime < LIMITS_CACHE_TTL) return cachedLimits
  try {
    const settings = await db.siteSetting.findMany({
      where: { key: { in: ['rate_limit_api_max', 'rate_limit_upload_max', 'rate_limit_auth_max'] } },
    })
    const map: Record<string, string> = {}
    for (const s of settings) map[s.key] = s.value

    cachedLimits = {
      api: { windowMs: 60_000, maxRequests: parseInt(map.rate_limit_api_max) || DEFAULT_LIMITS.api.maxRequests },
      upload: { windowMs: 60_000, maxRequests: parseInt(map.rate_limit_upload_max) || DEFAULT_LIMITS.upload.maxRequests },
      auth: { windowMs: 15 * 60 * 1000, maxRequests: parseInt(map.rate_limit_auth_max) || DEFAULT_LIMITS.auth.maxRequests },
    }
    cachedLimitsTime = now
    return cachedLimits
  } catch {
    return DEFAULT_LIMITS
  }
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

interface SlidingWindowEntry {
  count: number
  resetAt: number
}

const windows = new Map<string, SlidingWindowEntry>()

// Periodic cleanup of expired windows
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of windows) {
      if (entry.resetAt <= now) windows.delete(key)
    }
  }, 60_000)
}

export class RateLimiter {
  private windowMs: number
  private maxRequests: number

  constructor(config: { windowMs: number; maxRequests: number }) {
    this.windowMs = config.windowMs
    this.maxRequests = config.maxRequests
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    const key = `${identifier}:${Math.floor(now / this.windowMs)}`
    const entry = windows.get(key)

    if (!entry || entry.resetAt <= now) {
      windows.set(key, { count: 1, resetAt: now + this.windowMs })
      return { success: true, limit: this.maxRequests, remaining: this.maxRequests - 1, reset: now + this.windowMs }
    }

    if (entry.count >= this.maxRequests) {
      return { success: false, limit: this.maxRequests, remaining: 0, reset: entry.resetAt }
    }

    entry.count++
    return { success: true, limit: this.maxRequests, remaining: this.maxRequests - entry.count, reset: entry.resetAt }
  }
}

class LazyRateLimiter {
  private key: keyof typeof DEFAULT_LIMITS
  private instance: RateLimiter | null = null
  private instanceTime = 0

  constructor(key: keyof typeof DEFAULT_LIMITS) {
    this.key = key
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    if (!this.instance || now - this.instanceTime >= LIMITS_CACHE_TTL) {
      const limits = await loadLimits()
      this.instance = new RateLimiter(limits[this.key])
      this.instanceTime = now
    }
    return this.instance.limit(identifier)
  }
}

export const apiLimiter = new LazyRateLimiter('api') as unknown as RateLimiter
export const uploadLimiter = new LazyRateLimiter('upload') as unknown as RateLimiter
export const authLimiter = new LazyRateLimiter('auth') as unknown as RateLimiter

export function getClientIdentifier(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return `ip:${cfIp}`

  const vercelIp = request.headers.get('x-vercel-ip')
  if (vercelIp) return `ip:${vercelIp}`

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim()
    if (ip && ip !== 'unknown') return `ip:${ip}`
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp && realIp !== 'unknown') return `ip:${realIp}`

  const ua = request.headers.get('user-agent') || ''
  const url = new URL(request.url)
  const pathPrefix = url.pathname.split('/').slice(0, 3).join('/')
  const uaHash = simpleHash(`${ua}:${pathPrefix}`)
  return `fp:${uaHash}`
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
  }
}
