import { db } from '@/lib/db'
import { createHash } from 'node:crypto'

// ─── Hash Computation ───

/**
 * Compute SHA-256 hash for an audit log entry.
 * The hash is computed from the entry's own data only (no chained previousHash).
 * Chain linking is handled by the previousId field.
 * Any modification to a stored entry will change its hash, breaking verification.
 */
export function computeAuditLogHash(params: {
  action: string
  entityType: string
  entityId: string
  adminId?: string | null
  createdAt: Date | string
}): string {
  const data = [
    params.action,
    params.entityType,
    params.entityId,
    params.adminId || '',
    new Date(params.createdAt).toISOString(),
  ].join('|')
  return createHash('sha256').update(data).digest('hex')
}

// ─── Previous Log Lookup ───

/**
 * Find the most recent audit log entry (by createdAt DESC) to link as previous.
 * This is used when inserting a new log to maintain the chain.
 */
export async function findLastAuditLogId(): Promise<{ id: string; hash: string } | null> {
  // Include soft-deleted logs — they are still part of the hash chain
  const last = await db.auditLog.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true, hash: true },
  })
  return last as { id: string; hash: string } | null
}

// ─── Chain Verification ───

export interface ChainVerificationResult {
  /** Whether the entire chain is valid */
  isValid: boolean
  /** Total entries checked */
  totalChecked: number
  /** Number of broken links found */
  brokenLinks: number
  /** Details of any broken links */
  brokenLinkDetails: Array<{
    index: number
    entry: { id: string; action: string; createdAt: string }
    expectedHash: string
    actualHash: string | null
  }>
  /** Execution time in ms */
  durationMs: number
}

/**
 * Verify the entire audit log hash chain.
 * Walks entries in chronological order (ASC) and checks each hash.
 *
 * @param options.limit  Max entries to check (default 1000, use -1 for all)
 * @param options.since  Only check entries after this date
 */
export async function verifyAuditChain(options?: {
  limit?: number
  since?: Date
}): Promise<ChainVerificationResult> {
  const startTime = Date.now()
  const limit = options?.limit ?? 1000
  const brokenLinkDetails: ChainVerificationResult['brokenLinkDetails'] = []

  // Build where clause
  const where: Record<string, unknown> = { deletedAt: null }
  if (options?.since) {
    where.createdAt = { gte: options.since }
  }

  // Fetch entries in chronological order
  const entries = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      hash: true,
      action: true,
      entityType: true,
      entityId: true,
      adminId: true,
      createdAt: true,
    },
    ...(limit > 0 ? { take: limit } : {}),
  })

  if (entries.length === 0) {
    return {
      isValid: true,
      totalChecked: 0,
      brokenLinks: 0,
      brokenLinkDetails: [],
      durationMs: Date.now() - startTime,
    }
  }

  // Walk entries chronologically and verify each entry's hash independently
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]

    // Skip entries with NULL hash (pre-migration) — they can't be verified
    if (!entry.hash) continue

    // Compute expected hash from the entry's own data
    const expectedHash = computeAuditLogHash({
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      adminId: entry.adminId,
      createdAt: entry.createdAt,
    })

    const actualHash = entry.hash

    if (actualHash !== expectedHash) {
      brokenLinkDetails.push({
        index: i,
        entry: {
          id: entry.id,
          action: entry.action,
          createdAt: entry.createdAt.toISOString(),
        },
        expectedHash,
        actualHash,
      })
    }
  }

  return {
    isValid: brokenLinkDetails.length === 0,
    totalChecked: entries.length,
    brokenLinks: brokenLinkDetails.length,
    brokenLinkDetails,
    durationMs: Date.now() - startTime,
  }
}

// ─── Quick Check ───

/**
 * Quick check: verify the most recent N entries.
 * Useful for real-time monitoring without processing the full chain.
 */
export async function quickVerifyAuditChain(
  checkCount: number = 50
): Promise<ChainVerificationResult> {
  return verifyAuditChain({ limit: checkCount })
}
