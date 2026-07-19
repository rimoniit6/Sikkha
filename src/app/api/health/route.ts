import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const startTime = Date.now()

export async function GET() {
  const checks: Record<string, boolean> = {
    database: false,
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

  const allHealthy = Object.values(checks).every(v => v)
  const status = allHealthy ? 200 : 503

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: process.env.npm_package_version || '0.2.0',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      },
      checks,
      details,
      ...(Object.keys(errors).length > 0 && { errors }),
    },
    { status }
  )
}
