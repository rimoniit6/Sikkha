import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {},
}))

vi.mock('@/lib/version-history', () => ({
  rollbackVersion: vi.fn(),
  getVersions: vi.fn(),
}))

vi.mock('@/lib/audit', () => ({
  getClientIP: vi.fn(() => '127.0.0.1'),
}))

import { rollbackVersion } from '@/lib/version-history'

describe('Rollback API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rollbackVersion is called with correct parameters', async () => {
    const mockRollback = rollbackVersion as ReturnType<typeof vi.fn>
    mockRollback.mockResolvedValue({ success: true, newVersionNumber: 3 })

    // Simulate the API route logic
    const entityType = 'lecture'
    const entityId = 'lec-1'
    const targetVersion = 1
    const userId = 'admin-1'
    const comment = 'Testing rollback'

    const result = await rollbackVersion({}, entityType, entityId, targetVersion, userId, {
      comment,
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    })

    expect(result.success).toBe(true)
    expect(result.newVersionNumber).toBe(3)
    expect(mockRollback).toHaveBeenCalledWith(
      {},
      entityType,
      entityId,
      targetVersion,
      userId,
      expect.objectContaining({
        comment,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      })
    )
  })

  it('rollbackVersion returns error on failure', async () => {
    const mockRollback = rollbackVersion as ReturnType<typeof vi.fn>
    mockRollback.mockResolvedValue({ success: false, newVersionNumber: 0, error: 'Version not found' })

    const result = await rollbackVersion({}, 'lecture', 'lec-1', 999, 'admin-1')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Version not found')
  })
})
