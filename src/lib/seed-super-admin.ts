import type { PrismaClient } from '@prisma/client'
import { hashPassword, verifyPassword } from '@/lib/password'
import logger from '@/lib/logger'

interface EnsureSuperAdminOptions {
  email?: string
  password?: string
  name?: string
}

/**
 * Ensures a SUPER_ADMIN user exists in the database.
 * - Creates the user (with a hashed password) when missing.
 * - Promotes an existing user to SUPER_ADMIN when needed.
 * - Syncs the password to the env password ONLY when the env credentials do
 *   not already verify — so login with the env credentials is guaranteed to
 *   work, without clobbering a password that already accepts them.
 * - No-ops when no email/password is available (safe for server startup).
 *
 * Database-driven: call this from instrumentation on server boot and from the
 * seed script.
 */
export async function ensureSuperAdmin(
  db: PrismaClient,
  overrides?: EnsureSuperAdminOptions,
): Promise<void> {
  const email = (overrides?.email ?? process.env.SUPER_ADMIN_EMAIL)
    ?.toLowerCase()
    .trim()
  const password = (overrides?.password ?? process.env.SUPER_ADMIN_PASSWORD)?.trim()
  const name = overrides?.name?.trim() || process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin'

  if (!email || !email.includes('@') || !password) {
    logger.info('SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set — skipping super-admin seed.', { context: 'seed' })
    return
  }

  const existing = await db.user.findUnique({ where: { email } })

  if (!existing) {
    await db.user.create({
      data: {
        email,
        name,
        password: hashPassword(password),
        role: 'SUPER_ADMIN',
        isVerified: true,
        isPremium: true,
      },
    })
    logger.info(`Super Admin created (${email})`, { context: 'seed' })
    return
  }

  const updates: Record<string, unknown> = {}
  if (existing.role !== 'SUPER_ADMIN') updates.role = 'SUPER_ADMIN'
  if (!existing.isVerified) updates.isVerified = true

  const envMatches = typeof existing.password === 'string' && existing.password.length > 0
    ? verifyPassword(password, existing.password)
    : false

  if (!envMatches) {
    updates.password = hashPassword(password)
  }

  if (Object.keys(updates).length === 0) {
    logger.info(`Super Admin already present (${email})`, { context: 'seed' })
    return
  }

  await db.user.update({ where: { id: existing.id }, data: updates })
  const changed = Object.keys(updates).join(', ')
  logger.info(`Super Admin synced (${email}): ${changed}`, { context: 'seed' })
}
