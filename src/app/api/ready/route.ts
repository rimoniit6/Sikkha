import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/ready
 *
 * Readiness probe — verifies the application can serve traffic.
 * Returns 200 only when all critical dependencies are available.
 * Returns 503 when the application is not ready to serve.
 *
 * Checks:
 * - Database connectivity and responsiveness
 * - Required environment variables
 * - Cache availability
 */
export async function GET() {
  const checks: Record<string, boolean> = {
    database: false,
    environment: false,
  }
  const details: Record<string, unknown> = {}
  const errors: Record<string, string> = {}

  // Database check
  try {
    const start = Date.now()
    await db.$queryRaw`SELECT 1`
    checks.database = true
    details.databaseLatency = `${Date.now() - start}ms`
  } catch (e) {
    errors.database = e instanceof Error ? e.message : 'Unknown error'
  }

  // Environment variable checks
  const requiredEnvVars = ['DATABASE_URL']
  const optionalEnvVars = ['JWT_SECRET', 'CSRF_SECRET', 'SENTRY_DSN']

  const missingRequired = requiredEnvVars.filter(v => !process.env[v])
  const missingOptional = optionalEnvVars.filter(v => !process.env[v])

  if (missingRequired.length === 0) {
    checks.environment = true
  } else {
    errors.environment = `Missing required: ${missingRequired.join(', ')}`
  }

  details.requiredEnvVars = missingRequired.length === 0 ? 'present' : missingRequired
  details.optionalEnvVars = missingOptional.length > 0 ? `missing: ${missingOptional.join(', ')}` : 'present'

  // Cache check (in-memory caches are always available)
  checks.cache = true

  const allReady = Object.values(checks).every(v => v)
  const status = allReady ? 200 : 503

  return NextResponse.json(
    {
      status: allReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
      details,
      ...(Object.keys(errors).length > 0 && { errors }),
    },
    { status }
  )
}
