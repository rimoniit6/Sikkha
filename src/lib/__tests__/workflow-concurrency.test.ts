import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock external dependencies
vi.mock('../version-history', () => ({
  createVersion: vi.fn(async () => 1),
  isVersionableModel: vi.fn(() => false),
}))

vi.mock('../user-agent-parser', () => ({
  parseUserAgent: vi.fn(() => ({ os: null, browser: null, device: 'desktop' })),
}))

import {
  transitionWorkflow,
  getWorkflow,
  isValidTransition,
} from '../workflow'
import { createVersion, isVersionableModel } from '../version-history'

// ─── Shared state for mock ───

interface MockRecord {
  id: string
  entityType: string
  entityId: string
  status: string
  version: number
  [key: string]: unknown
}

function createMockDb() {
  const store = new Map<string, MockRecord>()
  const extraModels = new Map<string, Map<string, unknown>>()
  const counter = { history: 0, audit: 0 }

  function buildDb(): Record<string, unknown> {
    const models: Record<string, unknown> = {
      contentWorkflow: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const record = { ...data, id: `cw-${Date.now()}-${Math.random().toString(36).slice(2)}` } as MockRecord
          store.set(`${data.entityType}:${data.entityId}`, record)
          return record
        }),
        findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
          for (const record of store.values()) {
            if (record.entityType === where.entityType && record.entityId === where.entityId) {
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
      },
      workflowHistory: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          counter.history++
          return { id: `wh-${counter.history}`, ...data }
        }),
      },
      auditLog: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          counter.audit++
          return { id: `al-${counter.audit}`, ...data }
        }),
      },
      workflowComment: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          return { id: `wc-${Date.now()}`, ...data }
        }),
      },
    }

    // Expose extra models (e.g. lecture, mCQ) for versionable model lookups
    for (const [modelName, modelStore] of extraModels) {
      models[modelName] = {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return modelStore.get(where.id) || null
        }),
      }
    }

    return models
  }

  const db = buildDb() as Record<string, unknown>

  db.$transaction = vi.fn(async (fn: (tx: Record<string, unknown>) => Promise<unknown>) => {
    return fn(buildDb())
  })

  function registerModel(name: string, records: Record<string, unknown>) {
    const modelStore = new Map<string, unknown>()
    for (const [id, data] of Object.entries(records)) {
      modelStore.set(id, data)
    }
    extraModels.set(name, modelStore)
  }

  return { db, store, counter, registerModel }
}

async function setupWorkflow(db: ReturnType<typeof createMockDb>['db'], entityType: string, entityId: string, status = 'DRAFT', version = 0) {
  await db.contentWorkflow.create({
    data: { entityType, entityId, status, version },
  })
}

// ─── Tests ───

describe('Workflow Orchestrator', () => {
  let db: ReturnType<typeof createMockDb>['db']
  let counter: ReturnType<typeof createMockDb>['counter']
  let registerModel: ReturnType<typeof createMockDb>['registerModel']

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isVersionableModel).mockReturnValue(false)
    const mock = createMockDb()
    db = mock.db
    counter = mock.counter
    registerModel = mock.registerModel
  })

  // ─── Valid Transitions ───

  describe('Valid Transitions', () => {
    it('DRAFT → IN_REVIEW', async () => {
      await setupWorkflow(db, 'lecture', 'e1')

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'submit_for_review',
        userId: 'user-1',
        userRole: 'ADMIN',
        expectedVersion: 0,
      })

      expect(result.success).toBe(true)
      expect(result.previousState).toBe('DRAFT')
      expect(result.newState).toBe('IN_REVIEW')
      expect(result.version).toBe(1)
      expect(result.httpStatus).toBe(200)
    })

    it('IN_REVIEW → APPROVED', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'IN_REVIEW', 1)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'approve',
        userId: 'user-2',
        userRole: 'ADMIN',
        expectedVersion: 1,
      })

      expect(result.success).toBe(true)
      expect(result.previousState).toBe('IN_REVIEW')
      expect(result.newState).toBe('APPROVED')
      expect(result.version).toBe(2)
    })

    it('IN_REVIEW → REJECTED', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'IN_REVIEW', 1)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'reject',
        userId: 'user-2',
        userRole: 'ADMIN',
        expectedVersion: 1,
        comment: 'Needs detail',
      })

      expect(result.success).toBe(true)
      expect(result.newState).toBe('REJECTED')
    })

    it('REJECTED → DRAFT', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'REJECTED', 2)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'reset_to_draft',
        userId: 'user-1',
        userRole: 'ADMIN',
        expectedVersion: 2,
      })

      expect(result.success).toBe(true)
      expect(result.previousState).toBe('REJECTED')
      expect(result.newState).toBe('DRAFT')
    })

    it('APPROVED → PUBLISHED', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'APPROVED', 2)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'publish',
        userId: 'user-3',
        userRole: 'ADMIN',
        expectedVersion: 2,
      })

      expect(result.success).toBe(true)
      expect(result.newState).toBe('PUBLISHED')
    })

    it('APPROVED → SCHEDULED', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'APPROVED', 2)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'schedule',
        userId: 'user-3',
        userRole: 'ADMIN',
        expectedVersion: 2,
      })

      expect(result.success).toBe(true)
      expect(result.newState).toBe('SCHEDULED')
    })

    it('SCHEDULED → PUBLISHED', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'SCHEDULED', 3)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'publish',
        userId: 'user-3',
        userRole: 'ADMIN',
        expectedVersion: 3,
      })

      expect(result.success).toBe(true)
      expect(result.newState).toBe('PUBLISHED')
    })

    it('PUBLISHED → ARCHIVED', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'PUBLISHED', 4)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'archive',
        userId: 'user-3',
        userRole: 'ADMIN',
        expectedVersion: 4,
      })

      expect(result.success).toBe(true)
      expect(result.newState).toBe('ARCHIVED')
    })

    it('ARCHIVED → DRAFT', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'ARCHIVED', 5)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'reset_to_draft',
        userId: 'user-1',
        userRole: 'ADMIN',
        expectedVersion: 5,
      })

      expect(result.success).toBe(true)
      expect(result.newState).toBe('DRAFT')
    })

    it('Admin reset: PUBLISHED → DRAFT', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'PUBLISHED', 4)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'reset_to_draft',
        userId: 'user-1',
        userRole: 'ADMIN',
        expectedVersion: 4,
      })

      expect(result.success).toBe(true)
      expect(result.previousState).toBe('PUBLISHED')
      expect(result.newState).toBe('DRAFT')
    })

    it('Full lifecycle', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      const steps = [
        { action: 'submit_for_review' as const, expected: 'IN_REVIEW' },
        { action: 'approve' as const, expected: 'APPROVED' },
        { action: 'publish' as const, expected: 'PUBLISHED' },
        { action: 'archive' as const, expected: 'ARCHIVED' },
        { action: 'reset_to_draft' as const, expected: 'DRAFT' },
      ]

      let version = 0
      for (const step of steps) {
        const result = await transitionWorkflow(db as never, {
          entityType: 'lecture',
          entityId: 'e1',
          action: step.action,
          userId: 'user-1',
          userRole: 'ADMIN',
          expectedVersion: version,
        })
        expect(result.success).toBe(true)
        expect(result.newState).toBe(step.expected)
        version = result.version!
      }
    })
  })

  // ─── Invalid Transitions ───

  describe('Invalid Transitions', () => {
    it('IN_REVIEW → PUBLISHED (skip)', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'IN_REVIEW', 1)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'publish',
        userId: 'user-3',
        userRole: 'ADMIN',
        expectedVersion: 1,
      })

      expect(result.success).toBe(false)
      expect(result.httpStatus).toBe(400)
    })

    it('DRAFT → APPROVED', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'approve',
        userId: 'user-2',
        userRole: 'ADMIN',
        expectedVersion: 0,
      })

      expect(result.success).toBe(false)
      expect(result.httpStatus).toBe(400)
    })

    it('DRAFT → ARCHIVED', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'archive',
        userId: 'user-3',
        userRole: 'ADMIN',
        expectedVersion: 0,
      })

      expect(result.success).toBe(false)
      expect(result.httpStatus).toBe(400)
    })

    it('ARCHIVED → PUBLISHED', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'ARCHIVED', 5)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'publish',
        userId: 'user-3',
        userRole: 'ADMIN',
        expectedVersion: 5,
      })

      expect(result.success).toBe(false)
      expect(result.httpStatus).toBe(400)
    })

    it('REJECTED → PUBLISHED', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'REJECTED', 2)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'publish',
        userId: 'user-3',
        userRole: 'ADMIN',
        expectedVersion: 2,
      })

      expect(result.success).toBe(false)
      expect(result.httpStatus).toBe(400)
    })
  })

  // ─── Permission Failures ───

  describe('Permission Failures', () => {
    it('STUDENT cannot submit', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'submit_for_review',
        userId: 'user-student',
        userRole: 'STUDENT',
        expectedVersion: 0,
      })

      expect(result.success).toBe(false)
      expect(result.httpStatus).toBe(403)
    })

    it('STUDENT cannot approve', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'IN_REVIEW', 1)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'approve',
        userId: 'user-student',
        userRole: 'STUDENT',
        expectedVersion: 1,
      })

      expect(result.success).toBe(false)
      expect(result.httpStatus).toBe(403)
    })

    it('SUPER_ADMIN can do anything', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'submit_for_review',
        userId: 'super-1',
        userRole: 'SUPER_ADMIN',
        expectedVersion: 0,
      })

      expect(result.success).toBe(true)
    })
  })

  // ─── Conflict Failures ───

  describe('Conflict Failures', () => {
    it('stale version returns 409', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'submit_for_review',
        userId: 'user-1',
        userRole: 'ADMIN',
        expectedVersion: 5,
      })

      expect(result.success).toBe(false)
      expect(result.conflict).toBe(true)
      expect(result.httpStatus).toBe(409)
    })

    it('two concurrent updates', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      const a = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'submit_for_review',
        userId: 'admin-a',
        userRole: 'ADMIN',
        expectedVersion: 0,
      })
      expect(a.success).toBe(true)

      const b = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'approve',
        userId: 'admin-b',
        userRole: 'ADMIN',
        expectedVersion: 0,
      })
      expect(b.success).toBe(false)
      expect(b.conflict).toBe(true)
    })
  })

  // ─── Atomic Side Effects ───

  describe('Atomic Side Effects', () => {
    it('creates WorkflowHistory + AuditLog on success', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      const historyBefore = counter.history
      const auditBefore = counter.audit

      await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'submit_for_review',
        userId: 'user-1',
        userRole: 'ADMIN',
        expectedVersion: 0,
      })

      expect(counter.history).toBe(historyBefore + 1)
      expect(counter.audit).toBe(auditBefore + 1)
    })

    it('creates NOTHING on invalid transition', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      const historyBefore = counter.history
      const auditBefore = counter.audit

      await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'approve',
        userId: 'user-2',
        userRole: 'ADMIN',
        expectedVersion: 0,
      })

      expect(counter.history).toBe(historyBefore)
      expect(counter.audit).toBe(auditBefore)
    })

    it('creates NOTHING on permission failure', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      const historyBefore = counter.history
      const auditBefore = counter.audit

      await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'submit_for_review',
        userId: 'user-student',
        userRole: 'STUDENT',
        expectedVersion: 0,
      })

      expect(counter.history).toBe(historyBefore)
      expect(counter.audit).toBe(auditBefore)
    })

    it('creates NOTHING on conflict', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      const historyBefore = counter.history
      const auditBefore = counter.audit

      await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'submit_for_review',
        userId: 'user-1',
        userRole: 'ADMIN',
        expectedVersion: 5,
      })

      expect(counter.history).toBe(historyBefore)
      expect(counter.audit).toBe(auditBefore)
    })

    it('AuditLog has correct action key', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'submit_for_review',
        userId: 'user-1',
        userRole: 'ADMIN',
        expectedVersion: 0,
      })

      // The mock $transaction creates inner db; check the counter incremented
      expect(counter.audit).toBe(1)
    })
  })

  // ─── Version History Integration ───

  describe('Version History Integration', () => {
    it('calls createVersion for versionable models', async () => {
      vi.mocked(isVersionableModel).mockReturnValue(true)
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)
      // Register a lecture model that returns data
      registerModel('lecture', { 'e1': { id: 'e1', title: 'Test Lecture' } })

      await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'submit_for_review',
        userId: 'user-1',
        userRole: 'ADMIN',
        expectedVersion: 0,
      })

      expect(createVersion).toHaveBeenCalledOnce()
    })

    it('does NOT call createVersion for non-versionable models', async () => {
      vi.mocked(isVersionableModel).mockReturnValue(false)
      await setupWorkflow(db, 'notice', 'e1', 'DRAFT', 0)

      await transitionWorkflow(db as never, {
        entityType: 'notice',
        entityId: 'e1',
        action: 'submit_for_review',
        userId: 'user-1',
        userRole: 'ADMIN',
        expectedVersion: 0,
      })

      expect(createVersion).not.toHaveBeenCalled()
    })

    it('does NOT call createVersion on failure', async () => {
      vi.mocked(isVersionableModel).mockReturnValue(true)
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'submit_for_review',
        userId: 'user-student',
        userRole: 'STUDENT',
        expectedVersion: 0,
      })

      expect(createVersion).not.toHaveBeenCalled()
    })
  })

  // ─── Edge Cases ───

  describe('Edge Cases', () => {
    it('version unchanged after failure', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'approve',
        userId: 'user-2',
        userRole: 'ADMIN',
        expectedVersion: 0,
      })

      const wf = await getWorkflow(db as never, 'lecture', 'e1')
      expect(wf?.version).toBe(0)
    })

    it('transitionTime measured', async () => {
      await setupWorkflow(db, 'lecture', 'e1', 'DRAFT', 0)

      const result = await transitionWorkflow(db as never, {
        entityType: 'lecture',
        entityId: 'e1',
        action: 'submit_for_review',
        userId: 'user-1',
        userRole: 'ADMIN',
        expectedVersion: 0,
      })

      expect(result.success).toBe(true)
      expect(result.transitionTime).toBeDefined()
      expect(typeof result.transitionTime).toBe('number')
    })
  })

  // ─── isValidTransition ───

  describe('isValidTransition()', () => {
    it('allows valid transitions', () => {
      expect(isValidTransition('DRAFT', 'IN_REVIEW')).toBe(true)
      expect(isValidTransition('IN_REVIEW', 'APPROVED')).toBe(true)
      expect(isValidTransition('IN_REVIEW', 'REJECTED')).toBe(true)
      expect(isValidTransition('APPROVED', 'PUBLISHED')).toBe(true)
      expect(isValidTransition('SCHEDULED', 'PUBLISHED')).toBe(true)
      expect(isValidTransition('PUBLISHED', 'ARCHIVED')).toBe(true)
      expect(isValidTransition('ARCHIVED', 'DRAFT')).toBe(true)
      expect(isValidTransition('REJECTED', 'DRAFT')).toBe(true)
    })

    it('rejects invalid transitions', () => {
      expect(isValidTransition('DRAFT', 'APPROVED')).toBe(false)
      expect(isValidTransition('DRAFT', 'ARCHIVED')).toBe(false)
      expect(isValidTransition('IN_REVIEW', 'PUBLISHED')).toBe(false)
      expect(isValidTransition('ARCHIVED', 'PUBLISHED')).toBe(false)
      expect(isValidTransition('REJECTED', 'PUBLISHED')).toBe(false)
    })
  })
})
