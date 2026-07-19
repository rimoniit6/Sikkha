import { PrismaClient } from '@prisma/client'
import { transitionWorkflow, type TransitionResponse } from './workflow'

// ─── Constants ───

export const MAX_PUBLISH_RETRIES = 3

// ─── Types ───

export interface PublishResult {
  entityType: string
  entityId: string
  success: boolean
  error?: string
  version?: number
}

export interface ScheduledPublishReport {
  total: number
  published: number
  failed: number
  skipped: number
  results: PublishResult[]
  duration: number
}

// ─── Core Service ───

/**
 * Finds all SCHEDULED workflows where scheduledAt <= now,
 * and transitions them to PUBLISHED via the existing workflow engine.
 *
 * - Idempotent: safe to call multiple times
 * - Sequential: processes one workflow at a time (SQLite-safe)
 * - Retry-aware: tracks attempts, marks permanent failures after MAX_RETRIES
 * - Transactional: each transition uses the workflow engine's built-in transaction
 */
export async function publishScheduledContent(
  db: PrismaClient,
  options?: { dryRun?: boolean }
): Promise<ScheduledPublishReport> {
  const startTime = Date.now()
  const dryRun = options?.dryRun ?? false
  const now = new Date()

  // Find SCHEDULED workflows eligible for publishing
  const scheduledWorkflows = await db.contentWorkflow.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: now },
      publishFailedAt: null,
      publishAttempts: { lt: MAX_PUBLISH_RETRIES },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  const results: PublishResult[] = []
  let published = 0
  let failed = 0
  let skipped = 0

  for (const workflow of scheduledWorkflows) {
    // Re-read current state (may have changed since query)
    const current = await db.contentWorkflow.findFirst({
      where: { entityType: workflow.entityType, entityId: workflow.entityId },
    })

    if (!current) {
      skipped++
      continue
    }

    // Skip if already published (race condition)
    if (current.status === 'PUBLISHED') {
      skipped++
      continue
    }

    // Skip if not SCHEDULED (state changed by another process)
    if (current.status !== 'SCHEDULED') {
      skipped++
      continue
    }

    // Skip if permanently failed
    if (current.publishFailedAt) {
      skipped++
      continue
    }

    // Skip if exhausted retries
    if (current.publishAttempts >= MAX_PUBLISH_RETRIES) {
      skipped++
      continue
    }

    if (dryRun) {
      results.push({
        entityType: current.entityType,
        entityId: current.entityId,
        success: true,
        version: current.version,
      })
      published++
      continue
    }

    // Attempt publish via the existing workflow engine
    const result: TransitionResponse = await transitionWorkflow(db, {
      entityType: current.entityType,
      entityId: current.entityId,
      action: 'publish',
      userId: 'system-cron',
      userName: 'System Cron',
      userRole: 'SUPER_ADMIN',
      expectedVersion: current.version,
    })

    if (result.success) {
      // Reset retry state on success
      await db.contentWorkflow.update({
        where: { id: current.id },
        data: {
          publishAttempts: 0,
          lastPublishAttempt: now,
          publishError: null,
        },
      })

      results.push({
        entityType: current.entityType,
        entityId: current.entityId,
        success: true,
        version: result.version ?? undefined,
      })
      published++
    } else {
      // Increment retry count
      const newAttempts = current.publishAttempts + 1
      const updateData: Record<string, unknown> = {
        publishAttempts: newAttempts,
        lastPublishAttempt: now,
        publishError: result.error || 'Unknown error',
      }

      // Mark as permanently failed after max retries
      if (newAttempts >= MAX_PUBLISH_RETRIES) {
        updateData.publishFailedAt = now
      }

      await db.contentWorkflow.update({
        where: { id: current.id },
        data: updateData,
      })

      results.push({
        entityType: current.entityType,
        entityId: current.entityId,
        success: false,
        error: result.error,
      })
      failed++
    }
  }

  return {
    total: scheduledWorkflows.length,
    published,
    failed,
    skipped,
    results,
    duration: Date.now() - startTime,
  }
}

// ─── Crash Recovery ───

/**
 * Resets failed publish state for workflows that permanently failed.
 * Allows them to be retried on the next cron run.
 *
 * @returns Number of workflows reset
 */
export async function resetFailedPublishes(
  db: PrismaClient,
  options?: { entityType?: string; entityId?: string }
): Promise<number> {
  const where: Record<string, unknown> = {
    publishFailedAt: { not: null },
  }

  if (options?.entityType) where.entityType = options.entityType
  if (options?.entityId) where.entityId = options.entityId

  const result = await db.contentWorkflow.updateMany({
    where,
    data: {
      publishAttempts: 0,
      publishFailedAt: null,
      publishError: null,
    },
  })

  return result.count
}
