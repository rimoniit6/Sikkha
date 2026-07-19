import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the workflow engine (NOT modified by this sprint)
const mockTransitionWorkflow = vi.fn()
vi.mock('../workflow', () => ({
  transitionWorkflow: (...args: unknown[]) => mockTransitionWorkflow(...args),
}))

// Mock the audit module (NOT modified by this sprint)
vi.mock('../audit', () => ({
  createAuditLog: vi.fn(async () => ({ id: 'audit-1' })),
}))

// ─── Imports ───

import {
  publishScheduledContent,
  resetFailedPublishes,
  MAX_PUBLISH_RETRIES,
} from '../scheduled-publish'

// ─── Mock DB Setup ───

interface MockRecord {
  id: string
  entityType: string
  entityId: string
  status: string
  version: number
  scheduledAt: Date | null
  publishAttempts: number
  lastPublishAttempt: Date | null
  publishFailedAt: Date | null
  publishError: string | null
  [key: string]: unknown
}

function createMockDb() {
  const store = new Map<string, MockRecord>()

  function buildDb() {
    return {
      contentWorkflow: {
        findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
          const results: MockRecord[] = []
          const now = new Date()
          for (const record of store.values()) {
            // Match status = 'SCHEDULED'
            if (where.status && record.status !== where.status) continue
            // Match scheduledAt <= now
            if (where.scheduledAt?.lte && record.scheduledAt) {
              if (record.scheduledAt > where.scheduledAt.lte) continue
            }
            // Match publishFailedAt = null (skip records where publishFailedAt is set)
            if (where.publishFailedAt === null && record.publishFailedAt !== null) continue
            // Match publishFailedAt: { not: null } (skip records where publishFailedAt is null)
            if (where.publishFailedAt?.not === null && record.publishFailedAt === null) continue
            // Match publishAttempts < MAX
            if (where.publishAttempts?.lt !== undefined && record.publishAttempts >= where.publishAttempts.lt) continue
            results.push({ ...record })
          }
          // Sort by scheduledAt asc
          results.sort((a, b) => {
            if (!a.scheduledAt) return 1
            if (!b.scheduledAt) return -1
            return a.scheduledAt.getTime() - b.scheduledAt.getTime()
          })
          return results
        }),
        findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
          for (const record of store.values()) {
            if (
              (!where.entityType || record.entityType === where.entityType) &&
              (!where.entityId || record.entityId === where.entityId)
            ) {
              return { ...record }
            }
          }
          return null
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          for (const [key, record] of store.entries()) {
            if (record.id === where.id) {
              const updated = { ...record }
              for (const [k, v] of Object.entries(data)) {
                if (typeof v === 'object' && v !== null && 'increment' in v) {
                  updated[k] = record[k] + (v as { increment: number }).increment
                } else {
                  updated[k] = v
                }
              }
              store.set(key, updated)
              return updated
            }
          }
          throw new Error('Record not found')
        }),
        updateMany: vi.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          let count = 0
          for (const [key, record] of store.entries()) {
            let match = true
            if (where.publishFailedAt?.not === null && record.publishFailedAt === null) match = false
            if (where.entityType && record.entityType !== where.entityType) match = false
            if (where.entityId && record.entityId !== where.entityId) match = false

            if (match) {
              const updated = { ...record }
              for (const [k, v] of Object.entries(data)) {
                updated[k] = v
              }
              store.set(key, updated)
              count++
            }
          }
          return { count }
        }),
      },
    }
  }

  const db = buildDb() as Record<string, unknown>

  function addWorkflow(overrides: Partial<MockRecord>) {
    const record: MockRecord = {
      id: `cw-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      entityType: 'lecture',
      entityId: `lec-${Math.random().toString(36).slice(2)}`,
      status: 'SCHEDULED',
      version: 1,
      scheduledAt: new Date(Date.now() - 60000), // 1 minute ago
      publishAttempts: 0,
      lastPublishAttempt: null,
      publishFailedAt: null,
      publishError: null,
      ...overrides,
    }
    store.set(`${record.entityType}:${record.entityId}`, record)
    return record
  }

  return { db, store, addWorkflow }
}

// ─── Tests ───

describe('publishScheduledContent', () => {
  let mockDb: ReturnType<typeof createMockDb>

  beforeEach(() => {
    vi.clearAllMocks()
    mockTransitionWorkflow.mockReset()
    mockDb = createMockDb()
  })

  it('publishes scheduled content when scheduledAt <= now', async () => {
    mockDb.addWorkflow({ entityType: 'lecture', entityId: 'lec-1', status: 'SCHEDULED' })
    mockDb.addWorkflow({ entityType: 'lecture', entityId: 'lec-2', status: 'SCHEDULED' })
    mockTransitionWorkflow.mockResolvedValue({ success: true, version: 2 })

    const report = await publishScheduledContent(mockDb.db as any)

    expect(report.total).toBe(2)
    expect(report.published).toBe(2)
    expect(report.failed).toBe(0)
    expect(report.skipped).toBe(0)
    expect(mockTransitionWorkflow).toHaveBeenCalledTimes(2)
  })

  it('skips content where scheduledAt > now', async () => {
    mockDb.addWorkflow({
      entityType: 'lecture',
      entityId: 'lec-future',
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
    })
    mockTransitionWorkflow.mockResolvedValue({ success: true })

    const report = await publishScheduledContent(mockDb.db as any)

    expect(report.total).toBe(0)
    expect(report.published).toBe(0)
    expect(mockTransitionWorkflow).not.toHaveBeenCalled()
  })

  it('skips content where publishFailedAt is set', async () => {
    mockDb.addWorkflow({
      entityType: 'lecture',
      entityId: 'lec-failed',
      status: 'SCHEDULED',
      publishFailedAt: new Date(),
      publishAttempts: 3,
    })
    mockTransitionWorkflow.mockResolvedValue({ success: true })

    const report = await publishScheduledContent(mockDb.db as any)

    expect(report.total).toBe(0)
    expect(report.published).toBe(0)
    expect(mockTransitionWorkflow).not.toHaveBeenCalled()
  })

  it('skips content where publishAttempts >= MAX_RETRIES', async () => {
    mockDb.addWorkflow({
      entityType: 'lecture',
      entityId: 'lec-exhausted',
      status: 'SCHEDULED',
      publishAttempts: MAX_PUBLISH_RETRIES,
    })
    mockTransitionWorkflow.mockResolvedValue({ success: true })

    const report = await publishScheduledContent(mockDb.db as any)

    expect(report.total).toBe(0)
    expect(report.published).toBe(0)
    expect(mockTransitionWorkflow).not.toHaveBeenCalled()
  })

  it('increments publishAttempts on failure', async () => {
    const workflow = mockDb.addWorkflow({
      entityType: 'lecture',
      entityId: 'lec-fail-1',
      status: 'SCHEDULED',
      publishAttempts: 0,
    })
    mockTransitionWorkflow.mockResolvedValue({ success: false, error: 'Content not found' })

    const report = await publishScheduledContent(mockDb.db as any)

    expect(report.failed).toBe(1)
    expect(report.results[0].success).toBe(false)
    expect(report.results[0].error).toBe('Content not found')

    // Check that publishAttempts was incremented
    const updated = mockDb.store.get('lecture:lec-fail-1')
    expect(updated?.publishAttempts).toBe(1)
  })

  it('sets publishFailedAt after MAX_RETRIES failures', async () => {
    mockDb.addWorkflow({
      entityType: 'lecture',
      entityId: 'lec-max-fail',
      status: 'SCHEDULED',
      publishAttempts: MAX_PUBLISH_RETRIES - 1, // 2, will fail once more
    })
    mockTransitionWorkflow.mockResolvedValue({ success: false, error: 'Timeout' })

    await publishScheduledContent(mockDb.db as any)

    const updated = mockDb.store.get('lecture:lec-max-fail')
    expect(updated?.publishAttempts).toBe(MAX_PUBLISH_RETRIES)
    expect(updated?.publishFailedAt).toBeInstanceOf(Date)
    expect(updated?.publishError).toBe('Timeout')
  })

  it('resets publishAttempts on success', async () => {
    mockDb.addWorkflow({
      entityType: 'lecture',
      entityId: 'lec-retry-success',
      status: 'SCHEDULED',
      publishAttempts: 2, // previously failed twice
    })
    mockTransitionWorkflow.mockResolvedValue({ success: true, version: 2 })

    const report = await publishScheduledContent(mockDb.db as any)

    expect(report.published).toBe(1)
    const updated = mockDb.store.get('lecture:lec-retry-success')
    expect(updated?.publishAttempts).toBe(0)
    expect(updated?.publishError).toBeNull()
  })

  it('processes workflows sequentially', async () => {
    mockDb.addWorkflow({ entityType: 'lecture', entityId: 'lec-a', status: 'SCHEDULED' })
    mockDb.addWorkflow({ entityType: 'lecture', entityId: 'lec-b', status: 'SCHEDULED' })
    mockDb.addWorkflow({ entityType: 'lecture', entityId: 'lec-c', status: 'SCHEDULED' })

    const callOrder: string[] = []
    mockTransitionWorkflow.mockImplementation(async (db: unknown, opts: { entityId: string }) => {
      callOrder.push(opts.entityId)
      return { success: true, version: 2 }
    })

    await publishScheduledContent(mockDb.db as any)

    // Should be processed in order
    expect(callOrder).toEqual(['lec-a', 'lec-b', 'lec-c'])
  })

  it('returns correct report counts', async () => {
    mockDb.addWorkflow({ entityType: 'lecture', entityId: 'lec-ok', status: 'SCHEDULED' })
    mockDb.addWorkflow({ entityType: 'lecture', entityId: 'lec-fail', status: 'SCHEDULED' })
    mockDb.addWorkflow({
      entityType: 'lecture',
      entityId: 'lec-skip',
      status: 'SCHEDULED',
      publishFailedAt: new Date(), // will be filtered out by findMany
    })

    mockTransitionWorkflow
      .mockResolvedValueOnce({ success: true, version: 2 })
      .mockResolvedValueOnce({ success: false, error: 'DB error' })

    const report = await publishScheduledContent(mockDb.db as any)

    // Only 2 eligible workflows (lec-skip filtered by findMany)
    expect(report.total).toBe(2)
    expect(report.published).toBe(1)
    expect(report.failed).toBe(1)
    expect(report.skipped).toBe(0)
  })

  it('dryRun does not transition', async () => {
    mockDb.addWorkflow({ entityType: 'lecture', entityId: 'lec-dry', status: 'SCHEDULED' })

    const report = await publishScheduledContent(mockDb.db as any, { dryRun: true })

    expect(report.published).toBe(1)
    expect(mockTransitionWorkflow).not.toHaveBeenCalled()
  })

  it('handles empty scheduled queue', async () => {
    const report = await publishScheduledContent(mockDb.db as any)

    expect(report.total).toBe(0)
    expect(report.published).toBe(0)
    expect(report.failed).toBe(0)
    expect(report.results).toEqual([])
  })

  it('includes duration in report', async () => {
    const report = await publishScheduledContent(mockDb.db as any)

    expect(report.duration).toBeGreaterThanOrEqual(0)
    expect(typeof report.duration).toBe('number')
  })

  it('skips workflow if state changed to non-SCHEDULED after query', async () => {
    // Add workflow that appears in findMany but changes before processing
    const workflow = mockDb.addWorkflow({
      entityType: 'lecture',
      entityId: 'lec-race',
      status: 'SCHEDULED',
    })

    // Make findFirst return PUBLISHED (simulates race condition)
    const findFirst = mockDb.db.contentWorkflow.findFirst as ReturnType<typeof vi.fn>
    findFirst.mockImplementation(async () => ({
      ...workflow,
      status: 'PUBLISHED', // changed between findMany and findFirst
    }))

    const report = await publishScheduledContent(mockDb.db as any)

    expect(report.published).toBe(0)
    expect(report.skipped).toBe(1)
    expect(mockTransitionWorkflow).not.toHaveBeenCalled()
  })
})

describe('resetFailedPublishes', () => {
  let mockDb: ReturnType<typeof createMockDb>

  beforeEach(() => {
    vi.clearAllMocks()
    mockDb = createMockDb()
  })

  it('resets failed workflows', async () => {
    mockDb.addWorkflow({
      entityType: 'lecture',
      entityId: 'lec-failed',
      status: 'SCHEDULED',
      publishFailedAt: new Date(),
      publishAttempts: 3,
      publishError: 'Timeout',
    })

    const count = await resetFailedPublishes(mockDb.db as any)

    expect(count).toBe(1)
    const updated = mockDb.store.get('lecture:lec-failed')
    expect(updated?.publishAttempts).toBe(0)
    expect(updated?.publishFailedAt).toBeNull()
    expect(updated?.publishError).toBeNull()
  })

  it('resets only matching entityType', async () => {
    mockDb.addWorkflow({
      entityType: 'lecture',
      entityId: 'lec-failed',
      publishFailedAt: new Date(),
      publishAttempts: 2,
    })
    mockDb.addWorkflow({
      entityType: 'mcq',
      entityId: 'mcq-failed',
      publishFailedAt: new Date(),
      publishAttempts: 2,
    })

    const count = await resetFailedPublishes(mockDb.db as any, { entityType: 'lecture' })

    expect(count).toBe(1)
    const lec = mockDb.store.get('lecture:lec-failed')
    const mcq = mockDb.store.get('mcq:mcq-failed')
    expect(lec?.publishFailedAt).toBeNull()
    expect(mcq?.publishFailedAt).not.toBeNull()
  })

  it('returns 0 when no failed workflows exist', async () => {
    const count = await resetFailedPublishes(mockDb.db as any)
    expect(count).toBe(0)
  })
})
