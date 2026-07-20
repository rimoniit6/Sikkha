import logger from '@/lib/logger'

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { registerProcessHandlers } = await import(
    '@/lib/process-handlers.node'
  )
  registerProcessHandlers()

  logger.info('Application starting', {
    context: 'instrumentation',
    nodeEnv: process.env.NODE_ENV,
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
  })
}
