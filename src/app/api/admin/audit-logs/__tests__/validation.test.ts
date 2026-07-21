import { describe, it, expect } from 'vitest'
import { auditLogQuerySchema } from '../route'

type Parsed = typeof auditLogQuerySchema extends import('zod').ZodType<infer T> ? T : never

// Helper: safe parse returns the value or the error details
function parse(raw: Record<string, string>): { success: true; data: Parsed } | { success: false; errors: { field: string; message: string }[] } {
  const result = auditLogQuerySchema.safeParse(raw)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    })),
  }
}

describe('AuditLogQuerySchema — valid query', () => {
  it('accepts valid full query with all params', () => {
    const result = parse({
      page: '2',
      limit: '50',
      q: 'test search',
      action: 'user_create',
      adminId: 'admin-1',
      entityType: 'user',
      sessionId: 'sess-abc-123',
      requestId: 'req-xyz-789',
      correlationId: 'corr-def-456',
      from: '2024-01-01',
      to: '2024-12-31',
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.page).toBe(2)
    expect(result.data.limit).toBe(50)
    expect(result.data.q).toBe('test search')
    expect(result.data.action).toBe('user_create')
    expect(result.data.adminId).toBe('admin-1')
    expect(result.data.entityType).toBe('user')
    expect(result.data.sessionId).toBe('sess-abc-123')
    expect(result.data.requestId).toBe('req-xyz-789')
    expect(result.data.correlationId).toBe('corr-def-456')
    expect(result.data.from).toBe('2024-01-01')
    expect(result.data.to).toBe('2024-12-31')
  })

  it('defaults page to 1 when omitted', () => {
    const result = parse({})
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.page).toBe(1)
  })

  it('defaults limit to 20 when omitted', () => {
    const result = parse({})
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.limit).toBe(20)
  })
})

describe('AuditLogQuerySchema — pagination validation', () => {
  it('rejects page=0 (below min)', () => {
    const result = parse({ page: '0' })
    expect(result.success).toBe(false)
  })

  it('rejects page=-1 (negative)', () => {
    const result = parse({ page: '-1' })
    expect(result.success).toBe(false)
  })

  it('rejects page=abc (non-numeric)', () => {
    const result = parse({ page: 'abc' })
    expect(result.success).toBe(false)
  })

  it('rejects limit=0 (below min)', () => {
    const result = parse({ limit: '0' })
    expect(result.success).toBe(false)
  })

  it('rejects limit=10001 (above max)', () => {
    const result = parse({ limit: '10001' })
    expect(result.success).toBe(false)
  })

  it('rejects limit=abc (non-numeric)', () => {
    const result = parse({ limit: 'abc' })
    expect(result.success).toBe(false)
  })

  it('accepts export limit=10000 (edge case fix)', () => {
    const result = parse({ limit: '10000' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.limit).toBe(10000)
  })
})

describe('AuditLogQuerySchema — date validation', () => {
  it('rejects invalid from date', () => {
    const result = parse({ from: 'not-a-date' })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors[0].field).toBe('from')
    expect(result.errors[0].message).toContain('Invalid date')
  })

  it('rejects invalid to date', () => {
    const result = parse({ to: 'xyz-99-99' })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors[0].field).toBe('to')
  })

  it('accepts ISO date strings for from/to', () => {
    const result = parse({ from: '2024-06-15', to: '2024-06-30' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.from).toBe('2024-06-15')
    expect(result.data.to).toBe('2024-06-30')
  })

  it('accepts ISO datetime strings for from/to', () => {
    const result = parse({
      from: '2024-06-15T00:00:00.000Z',
      to: '2024-06-30T23:59:59.999Z',
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.from).toBe('2024-06-15T00:00:00.000Z')
    expect(result.data.to).toBe('2024-06-30T23:59:59.999Z')
  })

  it('omits from/to entirely when not provided', () => {
    const result = parse({})
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.from).toBeUndefined()
    expect(result.data.to).toBeUndefined()
  })
})

describe('AuditLogQuerySchema — empty query', () => {
  it('succeeds with completely empty input', () => {
    const result = parse({})
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.page).toBe(1)
    expect(result.data.limit).toBe(20)
    expect(result.data.q).toBeUndefined()
    expect(result.data.action).toBeUndefined()
    expect(result.data.adminId).toBeUndefined()
    expect(result.data.entityType).toBeUndefined()
  })
})

describe('AuditLogQuerySchema — optional filters', () => {
  it('accepts empty string for action (treated as omitted downstream)', () => {
    const result = parse({ action: '' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.action).toBe('')
  })

  it('accepts empty string for entityType (treated as omitted downstream)', () => {
    const result = parse({ entityType: '' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.entityType).toBe('')
  })

  it('rejects empty string for adminId (min 1 char)', () => {
    const result = parse({ adminId: '' })
    expect(result.success).toBe(false)
  })

  it('accepts sessionId filter', () => {
    const result = parse({ sessionId: 'sess-abc-123' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.sessionId).toBe('sess-abc-123')
  })

  it('accepts requestId filter', () => {
    const result = parse({ requestId: 'req-xyz-789' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.requestId).toBe('req-xyz-789')
  })

  it('accepts correlationId filter', () => {
    const result = parse({ correlationId: 'corr-def-456' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.correlationId).toBe('corr-def-456')
  })

  it('rejects empty string for sessionId (min 1 char)', () => {
    const result = parse({ sessionId: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty string for requestId (min 1 char)', () => {
    const result = parse({ requestId: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty string for correlationId (min 1 char)', () => {
    const result = parse({ correlationId: '' })
    expect(result.success).toBe(false)
  })

  it('accepts id for detail mode', () => {
    const result = parse({ id: 'some-log-id' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.id).toBe('some-log-id')
  })
})

describe('AuditLogQuerySchema — q search validation', () => {
  it('accepts short q string', () => {
    const result = parse({ q: 'user' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.q).toBe('user')
  })

  it('rejects q string exceeding 500 characters', () => {
    const result = parse({ q: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })
})
