// Sentry disabled for local development
export async function register() {
  // Only run on the Node.js server runtime (DB client is node-only).
  if (process.env.NEXT_RUNTIME === 'edge') return

  try {
    const { db } = await import('@/lib/db')
    const { ensureSuperAdmin } = await import('@/lib/seed-super-admin')
    await ensureSuperAdmin(db as unknown as import('@prisma/client').PrismaClient)
  } catch (err) {
    console.error('[instrumentation] super-admin seed failed:', (err as Error)?.message)
  }
}
