/**
 * Audit Log Retention Policy & Archive Utility
 *
 * Configures how long audit logs are retained and provides
 * functions to archive and purge old logs.
 *
 * Note: Full archive export (e.g., to S3/Blob storage) is not yet implemented.
 * The purge function currently only deletes logs. For production, add an
 * export step before deletion.
 */

import logger from '@/lib/logger'

// ─── Retention Configuration ───

/** Default retention period in days */
export const AUDIT_RETENTION_DAYS = 365 // 1 year

/** Whether to keep security-related audit logs longer than the default */
export const AUDIT_SECURITY_RETENTION_DAYS = 730 // 2 years

/** Audit actions considered security-critical (retained longer) */
export const SECURITY_AUDIT_ACTIONS = new Set([
  'login',
  'login_failed',
  'logout',
  'user_password_change',
  'user_password_reset',
  'permission_update',
  'permission_create',
  'permission_delete',
  'role_change',
  'user_ban',
  'user_unban',
  'user_create',
  'user_delete',
])

// ─── Types ───

export interface AuditRetentionResult {
  /** Total log entries that were deleted */
  deleted: number
  /** Number of batch operations that failed */
  errors: number
  /** Retention period used (in days) */
  retentionDays: number
}

// ─── Archive & Cleanup ───

/**
 * Calculate the cutoff date for audit log retention.
 * Logs older than this date are eligible for archiving/purging.
 */
export function getRetentionCutoff(retentionDays: number = AUDIT_RETENTION_DAYS): Date {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)
  return cutoff
}

/**
 * Count audit logs eligible for archiving.
 * This is a dry-run to preview how many logs would be affected.
 */
export async function countArchivableLogs(
  db: { auditLog: { count: (args: { where: Record<string, unknown> }) => Promise<number> } },
  retentionDays?: number
): Promise<{ normal: number; security: number; total: number }> {
  const cutoff = getRetentionCutoff(retentionDays)
  const securityCutoff = getRetentionCutoff(AUDIT_SECURITY_RETENTION_DAYS)

  const [normal, security] = await Promise.all([
    db.auditLog.count({
      where: {
        createdAt: { lt: cutoff },
        action: { notIn: Array.from(SECURITY_AUDIT_ACTIONS) },
      },
    }),
    db.auditLog.count({
      where: {
        createdAt: { lt: securityCutoff },
        action: { in: Array.from(SECURITY_AUDIT_ACTIONS) },
      },
    }),
  ])

  return { normal, security, total: normal + security }
}

/**
 * Purge old audit logs beyond the retention period.
 *
 * Two-phase process:
 *   1. Non-security logs older than the standard retention period
 *   2. Security-critical logs older than the extended retention period
 *
 * For production use, call as a scheduled job (cron).
 * Before purging, export logs to an external store for compliance.
 *
 * @returns Summary of the purge operation
 */
export async function purgeOldAuditLogs(
  db: {
    auditLog: {
      deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>
    }
  },
  retentionDays?: number
): Promise<AuditRetentionResult> {
  const cutoff = getRetentionCutoff(retentionDays)
  const securityCutoff = getRetentionCutoff(AUDIT_SECURITY_RETENTION_DAYS)

  let deleted = 0
  let errors = 0

  try {
    // Phase 1: Purge non-security logs older than the standard retention period
    const normalResult = await db.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoff },
        action: { notIn: Array.from(SECURITY_AUDIT_ACTIONS) },
      },
    })
    deleted += normalResult.count

    // Phase 2: Purge security logs older than the extended retention period
    const securityResult = await db.auditLog.deleteMany({
      where: {
        createdAt: { lt: securityCutoff },
        action: { in: Array.from(SECURITY_AUDIT_ACTIONS) },
      },
    })
    deleted += securityResult.count
  } catch (error) {
    errors++
    logger.error('Audit retention purge failed', error, { context: 'audit-retention' })
  }

  return {
    deleted,
    errors,
    retentionDays: retentionDays || AUDIT_RETENTION_DAYS,
  }
}
