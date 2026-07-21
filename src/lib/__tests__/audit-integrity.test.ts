import { describe, it, expect, vi } from 'vitest'
import { computeAuditLogHash } from '../audit-integrity'

// ─── Pure function tests (no mocking needed) ───

describe('computeAuditLogHash', () => {
  const testDate = new Date('2026-07-21T12:00:00.000Z')
  const baseParams = {
    action: 'user_create',
    entityType: 'user',
    entityId: 'user_123',
    adminId: 'admin_1',
    createdAt: testDate,
  }

  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = computeAuditLogHash(baseParams)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('is deterministic — same inputs produce same hash', () => {
    const hash1 = computeAuditLogHash(baseParams)
    const hash2 = computeAuditLogHash(baseParams)
    expect(hash1).toBe(hash2)
  })

  it('produces different hashes for different actions', () => {
    const hash1 = computeAuditLogHash({ ...baseParams, action: 'user_create' })
    const hash2 = computeAuditLogHash({ ...baseParams, action: 'user_delete' })
    expect(hash1).not.toBe(hash2)
  })

  it('produces different hashes for different entityTypes', () => {
    const hash1 = computeAuditLogHash({ ...baseParams, entityType: 'user' })
    const hash2 = computeAuditLogHash({ ...baseParams, entityType: 'payment' })
    expect(hash1).not.toBe(hash2)
  })

  it('produces different hashes for different entityIds', () => {
    const hash1 = computeAuditLogHash({ ...baseParams, entityId: 'abc' })
    const hash2 = computeAuditLogHash({ ...baseParams, entityId: 'xyz' })
    expect(hash1).not.toBe(hash2)
  })

  it('produces different hashes for different adminIds', () => {
    const hash1 = computeAuditLogHash({ ...baseParams, adminId: 'admin_1' })
    const hash2 = computeAuditLogHash({ ...baseParams, adminId: 'admin_2' })
    expect(hash1).not.toBe(hash2)
  })

  it('produces different hashes for different timestamps', () => {
    const hash1 = computeAuditLogHash({ ...baseParams, createdAt: new Date('2026-01-01') })
    const hash2 = computeAuditLogHash({ ...baseParams, createdAt: new Date('2026-06-15') })
    expect(hash1).not.toBe(hash2)
  })

  it('handles null adminId (empty string fallback)', () => {
    const hash = computeAuditLogHash({ ...baseParams, adminId: null })
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('handles undefined adminId (empty string fallback)', () => {
    const hash = computeAuditLogHash({
      action: baseParams.action,
      entityType: baseParams.entityType,
      entityId: baseParams.entityId,
      createdAt: baseParams.createdAt,
    })
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('handles string date input', () => {
    const hash = computeAuditLogHash({ ...baseParams, createdAt: '2026-07-21T12:00:00.000Z' })
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('produces consistent hash regardless of adminId null vs undefined', () => {
    const hashNull = computeAuditLogHash({ ...baseParams, adminId: null })
    const hashUndefined = computeAuditLogHash({
      action: baseParams.action,
      entityType: baseParams.entityType,
      entityId: baseParams.entityId,
      createdAt: baseParams.createdAt,
    })
    expect(hashNull).toBe(hashUndefined)
  })
})

// ─── verifyAuditChain tests (needs DB mocking) ───

const mockFindMany = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  db: {
    auditLog: {
      findMany: mockFindMany,
    },
  },
}))

// Import after the mock is set up
const { verifyAuditChain, quickVerifyAuditChain } = await import('../audit-integrity')

describe('verifyAuditChain', () => {
  beforeEach(() => {
    mockFindMany.mockReset()
  })

  it('returns valid result when no entries exist', async () => {
    mockFindMany.mockResolvedValue([])
    const result = await verifyAuditChain()
    expect(result.isValid).toBe(true)
    expect(result.totalChecked).toBe(0)
    expect(result.brokenLinks).toBe(0)
    expect(result.brokenLinkDetails).toEqual([])
  })

  it('returns valid result when all hashes are correct', async () => {
    const createdAt1 = new Date('2026-07-21T10:00:00.000Z')
    const createdAt2 = new Date('2026-07-21T11:00:00.000Z')
    const hash1 = computeAuditLogHash({
      action: 'user_create', entityType: 'user', entityId: '1', adminId: 'admin_1', createdAt: createdAt1,
    })
    const hash2 = computeAuditLogHash({
      action: 'payment_approve', entityType: 'payment', entityId: '2', adminId: 'admin_1', createdAt: createdAt2,
    })

    mockFindMany.mockResolvedValue([
      { id: 'log_1', hash: hash1, action: 'user_create', entityType: 'user', entityId: '1', adminId: 'admin_1', createdAt: createdAt1 },
      { id: 'log_2', hash: hash2, action: 'payment_approve', entityType: 'payment', entityId: '2', adminId: 'admin_1', createdAt: createdAt2 },
    ])

    const result = await verifyAuditChain()
    expect(result.isValid).toBe(true)
    expect(result.totalChecked).toBe(2)
    expect(result.brokenLinks).toBe(0)
  })

  it('detects tampered hashes', async () => {
    const createdAt1 = new Date('2026-07-21T10:00:00.000Z')
    const createdAt2 = new Date('2026-07-21T11:00:00.000Z')
    const hash1 = computeAuditLogHash({
      action: 'user_create', entityType: 'user', entityId: '1', adminId: 'admin_1', createdAt: createdAt1,
    })

    mockFindMany.mockResolvedValue([
      { id: 'log_1', hash: hash1, action: 'user_create', entityType: 'user', entityId: '1', adminId: 'admin_1', createdAt: createdAt1 },
      // log_2 has a tampered hash (doesn't match its data)
      { id: 'log_2', hash: 't' + hash1.slice(1), action: 'payment_approve', entityType: 'payment', entityId: '2', adminId: 'admin_1', createdAt: createdAt2 },
    ])

    const result = await verifyAuditChain()
    expect(result.isValid).toBe(false)
    expect(result.totalChecked).toBe(2)
    expect(result.brokenLinks).toBe(1)
    expect(result.brokenLinkDetails[0].entry.id).toBe('log_2')
  })

  it('skips entries with NULL hash (pre-migration)', async () => {
    const createdAt1 = new Date('2026-07-21T10:00:00.000Z')
    const createdAt2 = new Date('2026-07-21T11:00:00.000Z')

    mockFindMany.mockResolvedValue([
      { id: 'log_1', hash: null, action: 'login', entityType: 'user', entityId: '1', adminId: 'admin_1', createdAt: createdAt1 },
      { id: 'log_2', hash: null, action: 'login', entityType: 'user', entityId: '2', adminId: 'admin_1', createdAt: createdAt2 },
    ])

    const result = await verifyAuditChain()
    expect(result.isValid).toBe(true)
    expect(result.totalChecked).toBe(2)
    expect(result.brokenLinks).toBe(0)
  })

  it('honors the limit parameter', async () => {
    mockFindMany.mockResolvedValue([])
    await verifyAuditChain({ limit: 5 })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    )
  })

  it('honors the since parameter', async () => {
    const sinceDate = new Date('2026-07-20T00:00:00.000Z')
    mockFindMany.mockResolvedValue([])
    await verifyAuditChain({ since: sinceDate })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({ gte: sinceDate }),
        }),
      })
    )
  })
})

describe('quickVerifyAuditChain', () => {
  beforeEach(() => {
    mockFindMany.mockReset()
  })

  it('passes default checkCount of 50 to verifyAuditChain', async () => {
    mockFindMany.mockResolvedValue([])
    await quickVerifyAuditChain()
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    )
  })

  it('passes custom checkCount to verifyAuditChain', async () => {
    mockFindMany.mockResolvedValue([])
    await quickVerifyAuditChain(100)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    )
  })
})
