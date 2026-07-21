import { describe, it, expect, vi } from 'vitest'
import {
  getRetentionCutoff,
  countArchivableLogs,
  purgeOldAuditLogs,
  AUDIT_RETENTION_DAYS,
  SECURITY_AUDIT_ACTIONS,
} from '../audit-retention'

describe('getRetentionCutoff', () => {
  it('returns a date in the past by the specified number of days', () => {
    const cutoff = getRetentionCutoff(30)
    const now = new Date()
    const diffMs = now.getTime() - cutoff.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeGreaterThanOrEqual(29)
    expect(diffDays).toBeLessThanOrEqual(31)
  })

  it('uses default AUDIT_RETENTION_DAYS when no argument provided', () => {
    const cutoff = getRetentionCutoff()
    const now = new Date()
    const diffMs = now.getTime() - cutoff.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeGreaterThanOrEqual(AUDIT_RETENTION_DAYS - 1)
    expect(diffDays).toBeLessThanOrEqual(AUDIT_RETENTION_DAYS + 1)
  })
})

describe('countArchivableLogs', () => {
  it('returns zero counts when no logs exist', async () => {
    const mockDb = {
      auditLog: {
        count: vi.fn().mockResolvedValue(0),
      },
    }

    const result = await countArchivableLogs(mockDb as never)
    expect(result.normal).toBe(0)
    expect(result.security).toBe(0)
    expect(result.total).toBe(0)
  })

  it('counts normal and security logs separately', async () => {
    const mockDb = {
      auditLog: {
        count: vi.fn()
          .mockResolvedValueOnce(50) // normal logs
          .mockResolvedValueOnce(10), // security logs
      },
    }

    const result = await countArchivableLogs(mockDb as never)
    expect(result.normal).toBe(50)
    expect(result.security).toBe(10)
    expect(result.total).toBe(60)
  })

  it('passes the correct count filters to the database', async () => {
    const countMock = vi.fn().mockResolvedValue(0)
    const mockDb = {
      auditLog: { count: countMock },
    }

    await countArchivableLogs(mockDb as never)

    // First call: non-security logs older than standard retention
    expect(countMock).toHaveBeenNthCalledWith(1, {
      where: expect.objectContaining({
        createdAt: expect.objectContaining({ lt: expect.any(Date) }),
        action: { notIn: expect.any(Array) },
      }),
    })

    // Second call: security logs older than extended retention
    expect(countMock).toHaveBeenNthCalledWith(2, {
      where: expect.objectContaining({
        createdAt: expect.objectContaining({ lt: expect.any(Date) }),
        action: { in: expect.any(Array) },
      }),
    })
  })
})

describe('SECURITY_AUDIT_ACTIONS', () => {
  it('contains critical security actions', () => {
    expect(SECURITY_AUDIT_ACTIONS.has('login')).toBe(true)
    expect(SECURITY_AUDIT_ACTIONS.has('login_failed')).toBe(true)
    expect(SECURITY_AUDIT_ACTIONS.has('logout')).toBe(true)
    expect(SECURITY_AUDIT_ACTIONS.has('user_password_change')).toBe(true)
    expect(SECURITY_AUDIT_ACTIONS.has('permission_update')).toBe(true)
    expect(SECURITY_AUDIT_ACTIONS.has('role_change')).toBe(true)
    expect(SECURITY_AUDIT_ACTIONS.has('user_ban')).toBe(true)
    expect(SECURITY_AUDIT_ACTIONS.has('user_unban')).toBe(true)
  })

  it('does not contain non-security actions', () => {
    expect(SECURITY_AUDIT_ACTIONS.has('content_create')).toBe(false)
    expect(SECURITY_AUDIT_ACTIONS.has('content_view')).toBe(false)
    expect(SECURITY_AUDIT_ACTIONS.has('exam_start')).toBe(false)
  })
})

describe('purgeOldAuditLogs', () => {
  it('returns zero counts when no logs to purge', async () => {
    const mockDb = {
      auditLog: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    }

    const result = await purgeOldAuditLogs(mockDb as never)
    expect(result.deleted).toBe(0)
    expect(result.errors).toBe(0)
    expect(result.retentionDays).toBe(AUDIT_RETENTION_DAYS)
  })

  it('calls deleteMany twice (normal + security) and returns total', async () => {
    const deleteManyMock = vi.fn()
      .mockResolvedValueOnce({ count: 100 }) // normal
      .mockResolvedValueOnce({ count: 20 })   // security

    const mockDb = {
      auditLog: { deleteMany: deleteManyMock },
    }

    const result = await purgeOldAuditLogs(mockDb as never)
    expect(result.deleted).toBe(120) // 100 + 20
    expect(result.errors).toBe(0)
    expect(deleteManyMock).toHaveBeenCalledTimes(2)
  })

  it('returns the specified retention days', async () => {
    const mockDb = {
      auditLog: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    }

    const result = await purgeOldAuditLogs(mockDb as never, 180)
    expect(result.retentionDays).toBe(180)
  })

  it('returns error count when deleteMany throws', async () => {
    const mockDb = {
      auditLog: {
        deleteMany: vi.fn().mockRejectedValue(new Error('DB error')),
      },
    }

    const result = await purgeOldAuditLogs(mockDb as never)
    expect(result.deleted).toBe(0)
    expect(result.errors).toBe(1)
  })
})
