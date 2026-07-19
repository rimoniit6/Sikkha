import logger from '@/lib/logger'
import { initProcessHandlers } from '@/lib/process-handlers'

export async function register() {
  // Only run on the Node.js server runtime (DB client is node-only).
  if (process.env.NEXT_RUNTIME === 'edge') return

  // Initialize process error handlers
  initProcessHandlers()

  logger.info('Application starting', {
    context: 'instrumentation',
    nodeEnv: process.env.NODE_ENV,
    nodeVersion: process.version,
  })

  // Seed super admin
  try {
    const { db } = await import('@/lib/db')
    const { ensureSuperAdmin } = await import('@/lib/seed-super-admin')
    await ensureSuperAdmin(db as unknown as import('@prisma/client').PrismaClient)
    logger.info('Super admin seed completed', { context: 'instrumentation' })
  } catch (err) {
    logger.error('Super admin seed failed', err, { context: 'instrumentation' })
  }

  logger.info('Application ready', {
    context: 'instrumentation',
    uptime: Math.floor(process.uptime()),
  })
}
