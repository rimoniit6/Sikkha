import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const checks = {
    database: false,
  }
  const errors: Record<string, string> = {}

  try {
    await db.$queryRaw`SELECT 1`
    checks.database = true
  } catch (e) {
    errors.database = e instanceof Error ? e.message : 'Unknown error'
  }

  const allHealthy = Object.values(checks).every(v => v)
  const status = allHealthy ? 200 : 503

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      ...(Object.keys(errors).length > 0 && { errors }),
    },
    { status }
  )
}
