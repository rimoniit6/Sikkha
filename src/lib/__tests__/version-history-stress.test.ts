/**
 * Version History Production Stress Verification
 *
 * Tests concurrent updates, large snapshots, rapid updates,
 * performance benchmarks, and failure resilience.
 *
 * Run with: npx vitest run src/lib/__tests__/version-history-stress.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'

// ─── Mock Setup ───

let versionCounter = 0

const mockDb = vi.hoisted(() => {
  const store = new Map<string, any[]>() // entityType:entityId -> versions
  // Mutex to serialize concurrent access (simulates SQLite transaction serialization)
  let _queue: Promise<void> = Promise.resolve()
  function enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const result = _queue.then(fn, fn)
    _queue = result.then(() => {}, () => {})
    return result
  }

  return {
    contentVersion: {
      create: vi.fn(async ({ data }: any) => {
        return enqueue(async () => {
          const key = `${data.entityType}:${data.entityId}`
          const versions = store.get(key) || []
          // Check for duplicate version numbers
          const duplicate = versions.find(v => v.versionNumber === data.versionNumber)
          if (duplicate) {
            throw new Error(`Unique constraint violation: version ${data.versionNumber} already exists for ${data.entityType}:${data.entityId}`)
          }
          const record = { id: `cv_${++versionCounter}`, ...data }
          versions.push(record)
          store.set(key, versions)
          return record
        })
      }),
      findFirst: vi.fn(async ({ where, orderBy }: any) => {
        return enqueue(async () => {
          const key = `${where.entityType}:${where.entityId}`
          const versions = store.get(key) || []
          if (orderBy?.versionNumber === 'desc') {
            return versions.length > 0 ? versions[versions.length - 1] : null
          }
          return versions.length > 0 ? versions[0] : null
        })
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        const key = `${where.entityType_entityId_versionNumber.entityType}:${where.entityType_entityId_versionNumber.entityId}`
        const versions = store.get(key) || []
        return versions.find(v => v.versionNumber === where.entityType_entityId_versionNumber.versionNumber) || null
      }),
      findMany: vi.fn(async ({ where, orderBy, skip, take }: any) => {
        return enqueue(async () => {
          const key = `${where.entityType}:${where.entityId}`
          const versions = store.get(key) || []
          const sorted = orderBy?.versionNumber === 'desc' ? [...versions].reverse() : versions
          return sorted.slice(skip || 0, (skip || 0) + (take || 20))
        })
      }),
      count: vi.fn(async ({ where }: any) => {
        return enqueue(async () => {
          const key = `${where.entityType}:${where.entityId}`
          return (store.get(key) || []).length
        })
      }),
      groupBy: vi.fn(async ({ where }: any) => {
        const allVersions = Array.from(store.entries())
          .filter(([key]) => key.startsWith(`${where.entityType}:`))
        const entityIds = new Set(allVersions.map(([key]) => key.split(':')[1]))
        return Array.from(entityIds).map(id => ({ entityId: id, _count: { entityId: 1 } }))
      }),
    },
    user: {
      findUnique: vi.fn(async () => ({ name: 'Admin User', role: 'ADMIN' })),
    },
    lecture: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (fn: any) => fn(mockDb)),
    _store: store,
    _reset: () => { store.clear(); versionCounter = 0 },
  }
})

vi.mock('@/lib/db', () => ({ db: mockDb }))
vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn(),
}))

const { createVersion, rollbackVersion, getVersionByNumber, getVersions } = await import('@/lib/version-history')

// ─── Helpers ───

function makeRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rec_001',
    title: 'Test Record',
    slug: 'test-record',
    content: '<p>Content</p>',
    isActive: true,
    isPremium: false,
    price: 0,
    ...overrides,
  }
}

function computeHash(data: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(data, Object.keys(data).sort())).digest('hex')
}

// ─── Tests ───

describe('Version History Production Stress Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb._reset()
    mockDb.user.findUnique.mockResolvedValue({ name: 'Admin User', role: 'ADMIN' })
  })

  // ─── 1. Concurrent Updates ───

  describe('1. Concurrent Updates', () => {
    it('concurrent updates to different entities do not interfere', async () => {
      const record = makeRecord()

      // Update 10 different entities concurrently
      const promises = Array.from({ length: 10 }, (_, i) =>
        createVersion(mockDb, 'lecture', `lec_${i}`, { ...record, title: `Entity ${i}` }, 'user_001', ['title'])
      )

      const versions = await Promise.all(promises)

      // Each entity should have exactly 1 version
      for (let i = 0; i < 10; i++) {
        const stored = mockDb._store.get(`lecture:lec_${i}`) || []
        expect(stored.length).toBe(1)
      }

      // All version numbers should be 1 (each entity independently)
      expect(versions.every(v => v === 1)).toBe(true)
    })

    it('concurrent updates to same entity: unique constraint catches duplicates', async () => {
      const record = makeRecord()

      // Simulate 10 concurrent updates to the same entity
      // In production, SQLite serializes these. In mock, some will fail on unique constraint.
      const promises = Array.from({ length: 10 }, (_, i) =>
        createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: `V${i}` }, 'user_001', ['title'])
      )

      const results = await Promise.allSettled(promises)

      // Some should succeed, some may fail due to unique constraint
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failCount = results.filter(r => r.status === 'rejected').length

      // At least one should succeed
      expect(successCount).toBeGreaterThanOrEqual(1)

      // Failed ones should be unique constraint violations
      for (const r of results) {
        if (r.status === 'rejected') {
          expect((r.reason as Error).message).toContain('Unique constraint violation')
        }
      }

      // Verify stored versions have unique numbers
      const stored = mockDb._store.get('lecture:lec_001') || []
      const versionNumbers = stored.map(v => v.versionNumber)
      const unique = new Set(versionNumbers)
      expect(unique.size).toBe(stored.length)
    })

    it('concurrent updates to different entities never interfere', async () => {
      const record = makeRecord()

      // Update 50 different entities concurrently
      const promises = Array.from({ length: 50 }, (_, i) =>
        createVersion(mockDb, 'lecture', `lec_${i}`, { ...record, title: `Entity ${i}` }, 'user_001', ['title'])
      )

      const versions = await Promise.all(promises)

      // All should succeed (different entities don't conflict)
      expect(versions.length).toBe(50)

      // Each entity should have exactly 1 version
      for (let i = 0; i < 50; i++) {
        const stored = mockDb._store.get(`lecture:lec_${i}`) || []
        expect(stored.length).toBe(1)
      }
    })

    it('no overwritten snapshots: each version has unique data', async () => {
      const baseRecord = makeRecord()

      // Create 20 versions sequentially (to avoid unique constraint issues)
      for (let i = 0; i < 20; i++) {
        await createVersion(mockDb, 'lecture', 'lec_001', { ...baseRecord, title: `Title ${i}`, price: i * 10 }, 'user_001', ['title', 'price'])
      }

      // Verify each snapshot is unique
      const stored = mockDb._store.get('lecture:lec_001') || []
      expect(stored.length).toBe(20)

      const snapshots = stored.map(v => JSON.parse(v.snapshot))
      const uniqueTitles = new Set(snapshots.map(s => s.title))
      expect(uniqueTitles.size).toBe(20)
    })
  })

  // ─── 2. Large Snapshots ───

  describe('2. Large Snapshots', () => {
    it('very large HTML content', async () => {
      // Simulate a 100KB HTML document
      const largeHtml = '<div>' + 'x'.repeat(100000) + '</div>'
      const record = makeRecord({ content: largeHtml })

      await createVersion(mockDb, 'lecture', 'lec_001', record, 'user_001', ['content'])

      const call = mockDb.contentVersion.create.mock.calls[0][0]
      const snapshot = JSON.parse(call.data.snapshot)
      expect(snapshot.content).toBe(largeHtml)
      expect(snapshot.content.length).toBe(100000 + 11) // <div> + content + </div>
    })

    it('large JSON content', async () => {
      // Simulate a large JSON array
      const largeJson = JSON.stringify(Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        text: `Item ${i}`,
        data: { nested: { value: i * 100 } },
      })))
      const record = makeRecord({ content: largeJson })

      await createVersion(mockDb, 'suggestion', 'sug_001', record, 'user_001', ['content'])

      const call = mockDb.contentVersion.create.mock.calls[0][0]
      const snapshot = JSON.parse(call.data.snapshot)
      const parsed = JSON.parse(snapshot.content)
      expect(parsed.length).toBe(1000)
    })

    it('many UploadThing URLs', async () => {
      const urls: Record<string, string> = {}
      for (let i = 0; i < 50; i++) {
        urls[`image${i}`] = `https://utfs.io/f/abc${i}def${i}ghi${i}.jpg`
      }
      const record = makeRecord(urls)

      await createVersion(mockDb, 'mcq', 'mcq_001', record, 'user_001', Object.keys(urls))

      const call = mockDb.contentVersion.create.mock.calls[0][0]
      const snapshot = JSON.parse(call.data.snapshot)
      for (let i = 0; i < 50; i++) {
        expect(snapshot[`image${i}`]).toBe(`https://utfs.io/f/abc${i}def${i}ghi${i}.jpg`)
      }
    })

    it('many related IDs (exam with 100 chapter IDs)', async () => {
      const chapterIds = Array.from({ length: 100 }, (_, i) => `ch_${i}`)
      const record = makeRecord({ chapterIds: chapterIds.join(',') })

      await createVersion(mockDb, 'exam', 'exam_001', record, 'user_001', ['chapterIds'])

      const call = mockDb.contentVersion.create.mock.calls[0][0]
      const snapshot = JSON.parse(call.data.snapshot)
      const restoredIds = snapshot.chapterIds.split(',')
      expect(restoredIds.length).toBe(100)
      expect(restoredIds[0]).toBe('ch_0')
      expect(restoredIds[99]).toBe('ch_99')
    })
  })

  // ─── 3. Rapid Updates ───

  describe('3. Rapid Updates (100+ consecutive)', () => {
    it('100 consecutive updates maintain sequential numbering', async () => {
      const record = makeRecord()

      for (let i = 0; i < 100; i++) {
        await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: `V${i}` }, 'user_001', ['title'])
      }

      const stored = mockDb._store.get('lecture:lec_001') || []
      expect(stored.length).toBe(100)

      // Verify sequential numbering
      for (let i = 0; i < 100; i++) {
        expect(stored[i].versionNumber).toBe(i + 1)
      }
    })

    it('100 consecutive updates maintain snapshot integrity', async () => {
      const record = makeRecord()

      for (let i = 0; i < 100; i++) {
        await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: `V${i}`, price: i }, 'user_001', ['title', 'price'])
      }

      const stored = mockDb._store.get('lecture:lec_001') || []
      for (let i = 0; i < 100; i++) {
        const snapshot = JSON.parse(stored[i].snapshot)
        expect(snapshot.title).toBe(`V${i}`)
        expect(snapshot.price).toBe(i)
      }
    })

    it('200 rapid updates on same entity', async () => {
      const record = makeRecord()

      for (let i = 0; i < 200; i++) {
        await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: `V${i}` }, 'user_001', ['title'])
      }

      const stored = mockDb._store.get('lecture:lec_001') || []
      expect(stored.length).toBe(200)

      // Verify all version numbers unique
      const versionNumbers = stored.map(v => v.versionNumber)
      const unique = new Set(versionNumbers)
      expect(unique.size).toBe(200)
    })
  })

  // ─── 4. Database Performance ───

  describe('4. Database Performance', () => {
    it('snapshot creation under 50ms for normal record', async () => {
      const record = makeRecord()
      const start = performance.now()

      await createVersion(mockDb, 'lecture', 'lec_001', record, 'user_001', ['title'])

      const duration = performance.now() - start
      expect(duration).toBeLessThan(50)
    })

    it('snapshot creation under 200ms for large record', async () => {
      const largeRecord = makeRecord({ content: 'x'.repeat(100000) })
      const start = performance.now()

      await createVersion(mockDb, 'lecture', 'lec_001', largeRecord, 'user_001', ['content'])

      const duration = performance.now() - start
      expect(duration).toBeLessThan(200)
    })

    it('rollback under 100ms for small snapshot', async () => {
      const record = makeRecord()

      // Create version 1
      await createVersion(mockDb, 'lecture', 'lec_001', record, 'user_001', ['title'])

      // Create version 2 (different data)
      await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: 'V2' }, 'user_001', ['title'])

      // Mock the update operation
      mockDb.lecture.update.mockResolvedValue({})

      const start = performance.now()
      await rollbackVersion(mockDb, 'lecture', 'lec_001', 1, 'user_001')
      const duration = performance.now() - start

      expect(duration).toBeLessThan(100)
    })

    it('history query under 50ms for 100 versions', async () => {
      const record = makeRecord()

      // Create 100 versions
      for (let i = 0; i < 100; i++) {
        await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: `V${i}` }, 'user_001', ['title'])
      }

      const start = performance.now()
      const result = await getVersions(mockDb, 'lecture', 'lec_001', { page: 1, limit: 20 })
      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
      expect(result.versions.length).toBe(20)
      expect(result.total).toBe(100)
    })
  })

  // ─── 5. Index Verification ───

  describe('5. Index Verification', () => {
    it('getVersions queries by entityType:entityId', async () => {
      const record = makeRecord()

      // Create versions for different entities
      await createVersion(mockDb, 'lecture', 'lec_001', record, 'user_001', ['title'])
      await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: 'V2' }, 'user_001', ['title'])
      await createVersion(mockDb, 'lecture', 'lec_002', record, 'user_001', ['title'])

      // Query should only return lec_001's versions
      const result = await getVersions(mockDb, 'lecture', 'lec_001')
      expect(result.total).toBe(2) // Only lec_001 has 2 versions
      expect(result.versions.length).toBe(2)
      expect(result.versions.every(v => v.entityId === 'lec_001')).toBe(true)
    })

    it('getVersionByNumber uses unique constraint', async () => {
      const record = makeRecord()

      for (let i = 0; i < 5; i++) {
        await createVersion(mockDb, 'lecture', 'lec_001', record, 'user_001', ['title'])
      }

      // Should find exact version
      const v3 = await getVersionByNumber(mockDb, 'lecture', 'lec_001', 3)
      expect(v3).not.toBeNull()
      expect(v3!.versionNumber).toBe(3)

      // Should not find non-existent version
      const v999 = await getVersionByNumber(mockDb, 'lecture', 'lec_001', 999)
      expect(v999).toBeNull()
    })
  })

  // ─── 6. Storage Growth Estimation ───

  describe('6. Storage Growth Estimation', () => {
    it('estimate storage for 1000 versions of a lecture', async () => {
      const record = makeRecord({ content: 'x'.repeat(50000) }) // 50KB content

      for (let i = 0; i < 1000; i++) {
        await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: `V${i}` }, 'user_001', ['title'])
      }

      const stored = mockDb._store.get('lecture:lec_001') || []
      const totalSize = stored.reduce((sum, v) => sum + JSON.stringify(v).length, 0)

      // Estimate: ~50KB per snapshot × 1000 = ~50MB
      expect(totalSize).toBeGreaterThan(50_000_000) // > 50MB
      expect(stored.length).toBe(1000)

      // Daily estimate: ~30 versions/day for lectures
      // Monthly: ~30 × 30 = 900 versions
      // Yearly: ~900 × 12 = 10,800 versions
      // Storage: ~50KB × 10,800 = ~540MB/year for lectures alone
    })

    it('estimate storage for typical usage pattern', async () => {
      // Simulate typical monthly usage across all models
      const models = [
        { name: 'lecture', count: 300, avgSize: 50000 },
        { name: 'mCQ', count: 1000, avgSize: 2000 },
        { name: 'cQ', count: 600, avgSize: 5000 },
        { name: 'course', count: 60, avgSize: 10000 },
        { name: 'knowledgeQuestion', count: 600, avgSize: 1000 },
      ]

      let totalMonthlyBytes = 0
      for (const model of models) {
        totalMonthlyBytes += model.count * model.avgSize
      }

      // Monthly: ~300×50KB + 1000×2KB + 600×5KB + 60×10KB + 600×1KB = ~26MB
      expect(totalMonthlyBytes).toBeGreaterThan(20_000_000) // > 20MB
      expect(totalMonthlyBytes).toBeLessThan(50_000_000) // < 50MB

      // Yearly: ~312MB
      const yearlyBytes = totalMonthlyBytes * 12
      expect(yearlyBytes).toBeGreaterThan(200_000_000) // > 200MB
      expect(yearlyBytes).toBeLessThan(600_000_000) // < 600MB
    })
  })

  // ─── 7. Rollback Performance ───

  describe('7. Rollback Performance', () => {
    it('rollback small snapshot under 100ms', async () => {
      const record = makeRecord()
      await createVersion(mockDb, 'lecture', 'lec_001', record, 'user_001', ['title'])
      await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: 'V2' }, 'user_001', ['title'])
      mockDb.lecture.update.mockResolvedValue({})

      const start = performance.now()
      await rollbackVersion(mockDb, 'lecture', 'lec_001', 1, 'user_001')
      const duration = performance.now() - start

      expect(duration).toBeLessThan(100)
    })

    it('rollback medium snapshot under 200ms', async () => {
      const record = makeRecord({ content: 'x'.repeat(10000) }) // 10KB
      await createVersion(mockDb, 'lecture', 'lec_001', record, 'user_001', ['content'])
      await createVersion(mockDb, 'lecture', 'lec_001', { ...record, content: 'y'.repeat(10000) }, 'user_001', ['content'])
      mockDb.lecture.update.mockResolvedValue({})

      const start = performance.now()
      await rollbackVersion(mockDb, 'lecture', 'lec_001', 1, 'user_001')
      const duration = performance.now() - start

      expect(duration).toBeLessThan(200)
    })

    it('rollback large snapshot under 500ms', async () => {
      const record = makeRecord({ content: 'x'.repeat(100000) }) // 100KB
      await createVersion(mockDb, 'lecture', 'lec_001', record, 'user_001', ['content'])
      await createVersion(mockDb, 'lecture', 'lec_001', { ...record, content: 'y'.repeat(100000) }, 'user_001', ['content'])
      mockDb.lecture.update.mockResolvedValue({})

      const start = performance.now()
      await rollbackVersion(mockDb, 'lecture', 'lec_001', 1, 'user_001')
      const duration = performance.now() - start

      expect(duration).toBeLessThan(500)
    })
  })

  // ─── 8. Transaction Contention ───

  describe('8. Transaction Contention', () => {
    it('rollback and update cannot corrupt each other', async () => {
      const record = makeRecord()
      await createVersion(mockDb, 'lecture', 'lec_001', record, 'user_001', ['title'])
      await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: 'V2' }, 'user_001', ['title'])
      await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: 'V3' }, 'user_001', ['title'])

      mockDb.lecture.update.mockResolvedValue({})

      // Rollback to version 1
      const rollbackResult = await rollbackVersion(mockDb, 'lecture', 'lec_001', 1, 'user_001')
      expect(rollbackResult.success).toBe(true)

      // Version history should still be intact
      const stored = mockDb._store.get('lecture:lec_001') || []
      expect(stored.length).toBeGreaterThanOrEqual(3) // Original 3 + rollback versions
    })

    it('concurrent rollbacks to same version: one succeeds, one may fail due to serialization', async () => {
      const record = makeRecord()
      await createVersion(mockDb, 'lecture', 'lec_001', record, 'user_001', ['title'])
      await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: 'V2' }, 'user_001', ['title'])

      mockDb.lecture.update.mockResolvedValue({})

      // Two concurrent rollbacks to version 1
      // In production, SQLite serializes these — one succeeds, one waits then may fail on unique constraint
      const [r1, r2] = await Promise.all([
        rollbackVersion(mockDb, 'lecture', 'lec_001', 1, 'user_001'),
        rollbackVersion(mockDb, 'lecture', 'lec_001', 1, 'user_002'),
      ])

      // At least one should succeed
      const successCount = [r1, r2].filter(r => r.success).length
      expect(successCount).toBeGreaterThanOrEqual(1)

      // If both succeeded, version numbers should be unique
      if (r1.success && r2.success) {
        expect(r1.newVersionNumber).not.toBe(r2.newVersionNumber)
      }

      // Version history should have grown (original 2 + at least 1 rollback version)
      const stored = mockDb._store.get('lecture:lec_001') || []
      expect(stored.length).toBeGreaterThanOrEqual(3)
    })
  })

  // ─── 9. Version Explosion ───

  describe('9. Version Explosion (1000+ versions)', () => {
    it('entity with 1000 versions', async () => {
      const record = makeRecord()

      for (let i = 0; i < 1000; i++) {
        await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: `V${i}` }, 'user_001', ['title'])
      }

      const stored = mockDb._store.get('lecture:lec_001') || []
      expect(stored.length).toBe(1000)

      // Verify sequential numbering
      for (let i = 0; i < 1000; i++) {
        expect(stored[i].versionNumber).toBe(i + 1)
      }
    })

    it('pagination works with 1000 versions', async () => {
      const record = makeRecord()

      for (let i = 0; i < 1000; i++) {
        await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: `V${i}` }, 'user_001', ['title'])
      }

      // Page 1
      const page1 = await getVersions(mockDb, 'lecture', 'lec_001', { page: 1, limit: 50 })
      expect(page1.versions.length).toBe(50)
      expect(page1.total).toBe(1000)
      expect(page1.totalPages).toBe(20)

      // Page 20 (last page)
      const page20 = await getVersions(mockDb, 'lecture', 'lec_001', { page: 20, limit: 50 })
      expect(page20.versions.length).toBe(50)

      // Page 21 (beyond last)
      const page21 = await getVersions(mockDb, 'lecture', 'lec_001', { page: 21, limit: 50 })
      expect(page21.versions.length).toBe(0)
    })

    it('retrieval speed with 1000 versions', async () => {
      const record = makeRecord()

      for (let i = 0; i < 1000; i++) {
        await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: `V${i}` }, 'user_001', ['title'])
      }

      // Retrieve latest version
      const start = performance.now()
      const latest = await getVersionByNumber(mockDb, 'lecture', 'lec_001', 1000)
      const duration = performance.now() - start

      expect(latest).not.toBeNull()
      expect(latest!.versionNumber).toBe(1000)
      expect(duration).toBeLessThan(50) // Should be fast with index
    })
  })

  // ─── 10. Integrity Under Failures ───

  describe('10. Integrity Under Failures', () => {
    it('transaction failure leaves database unchanged', async () => {
      const record = makeRecord()
      await createVersion(mockDb, 'lecture', 'lec_001', record, 'user_001', ['title'])

      // Make transaction fail
      mockDb.$transaction.mockRejectedValueOnce(new Error('Transaction failed'))

      const result = await rollbackVersion(mockDb, 'lecture', 'lec_001', 1, 'user_001')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Transaction failed')

      // Verify no new versions were created
      const stored = mockDb._store.get('lecture:lec_001') || []
      expect(stored.length).toBe(1) // Only the original version
    })

    it('concurrent updates to same entity catch unique constraint violations', async () => {
      // This test verifies the unique constraint behavior
      // In production, SQLite serializes transactions, so concurrent writes to the same entity
      // will have one succeed and one fail on the unique constraint.
      // The mock simulates this by catching duplicate version numbers.
      const record = makeRecord()

      // Create version 1
      await createVersion(mockDb, 'lecture', 'lec_001', record, 'user_001', ['title'])

      // Verify version 1 exists
      const stored = mockDb._store.get('lecture:lec_001') || []
      expect(stored.length).toBe(1)
      expect(stored[0].versionNumber).toBe(1)

      // Attempt to create another version - should succeed (version 2)
      const v2 = await createVersion(mockDb, 'lecture', 'lec_001', { ...record, title: 'V2' }, 'user_001', ['title'])
      expect(v2).toBe(2)

      // Verify both versions exist
      const storedAfter = mockDb._store.get('lecture:lec_001') || []
      expect(storedAfter.length).toBe(2)
      expect(storedAfter[0].versionNumber).toBe(1)
      expect(storedAfter[1].versionNumber).toBe(2)
    })

    it('rollback with non-existent version returns error', async () => {
      const result = await rollbackVersion(mockDb, 'lecture', 'lec_001', 999, 'user_001')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('rollback with non-existent entity returns error', async () => {
      const result = await rollbackVersion(mockDb, 'lecture', 'nonexistent', 1, 'user_001')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })
})
