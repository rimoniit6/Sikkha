import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/date-utils', () => ({
  getExamTimeMs: vi.fn((date: Date, time: string) => {
    const [h, m] = time.split(':').map(Number)
    const d = new Date(date)
    const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    return base + h * 3600000 + m * 60000
  }),
}))

import { getExamTimeWindow, formatTimeRemaining, calculateTimeRemaining } from '../time-window'

describe('getExamTimeWindow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns windowOpen=true when scheduledDate is null', () => {
    vi.setSystemTime(new Date('2026-07-22T12:00:00Z'))

    const result = getExamTimeWindow({ scheduledDate: null })

    expect(result.windowOpen).toBe(true)
    expect(result.windowExpired).toBe(false)
    expect(result.examStartMs).toBe(0)
    expect(result.effectiveEndMs).toBe(Infinity)
  })

  it('returns windowOpen=true when scheduledDate is undefined', () => {
    vi.setSystemTime(new Date('2026-07-22T12:00:00Z'))

    const result = getExamTimeWindow({})

    expect(result.windowOpen).toBe(true)
    expect(result.windowExpired).toBe(false)
    expect(result.examStartMs).toBe(0)
    expect(result.effectiveEndMs).toBe(Infinity)
  })

  it('calculates correct start/end for same-day window', () => {
    vi.setSystemTime(new Date('2026-07-22T12:00:00Z'))
    const date = new Date('2026-07-22T00:00:00Z')

    const result = getExamTimeWindow({
      scheduledDate: date,
      startTime: '10:00',
      endTime: '14:00',
    })

    const base = new Date('2026-07-22T00:00:00Z').getTime()
    expect(result.examStartMs).toBe(base + 10 * 3600000)
    expect(result.effectiveEndMs).toBe(base + 14 * 3600000)
    expect(result.windowOpen).toBe(true)
    expect(result.windowExpired).toBe(false)
  })

  it('extends effectiveEndMs when endTime crosses midnight', () => {
    vi.setSystemTime(new Date('2026-07-22T12:00:00Z'))
    const date = new Date('2026-07-22T00:00:00Z')

    const result = getExamTimeWindow({
      scheduledDate: date,
      startTime: '23:00',
      endTime: '02:00',
    })

    const base = new Date('2026-07-22T00:00:00Z').getTime()
    const examStartMs = base + 23 * 3600000
    const examEndMs = base + 2 * 3600000
    expect(result.examStartMs).toBe(examStartMs)
    expect(result.effectiveEndMs).toBe(examEndMs + 24 * 60 * 60 * 1000)
    expect(result.effectiveEndMs).toBeGreaterThan(result.examStartMs)
  })

  it('reports windowOpen=false before startTime', () => {
    vi.setSystemTime(new Date('2026-07-22T08:00:00Z'))
    const date = new Date('2026-07-22T00:00:00Z')

    const result = getExamTimeWindow({
      scheduledDate: date,
      startTime: '10:00',
      endTime: '14:00',
    })

    expect(result.windowOpen).toBe(false)
  })

  it('reports windowExpired=true after effectiveEndMs', () => {
    vi.setSystemTime(new Date('2026-07-22T15:00:00Z'))
    const date = new Date('2026-07-22T00:00:00Z')

    const result = getExamTimeWindow({
      scheduledDate: date,
      startTime: '10:00',
      endTime: '14:00',
    })

    expect(result.windowExpired).toBe(true)
  })

  it('uses default times when startTime/endTime are null', () => {
    vi.setSystemTime(new Date('2026-07-22T00:00:00Z'))
    const date = new Date('2026-07-22T00:00:00Z')

    const result = getExamTimeWindow({
      scheduledDate: date,
      startTime: null,
      endTime: null,
    })

    const base = new Date('2026-07-22T00:00:00Z').getTime()
    expect(result.examStartMs).toBe(base)
    expect(result.effectiveEndMs).toBe(base + 23 * 3600000 + 59 * 60000)
  })
})

describe('formatTimeRemaining', () => {
  it('returns 00:00 for zero or negative seconds', () => {
    expect(formatTimeRemaining(0)).toBe('00:00')
    expect(formatTimeRemaining(-10)).toBe('00:00')
  })

  it('formats minutes and seconds only', () => {
    expect(formatTimeRemaining(90)).toBe('01:30')
    expect(formatTimeRemaining(61)).toBe('01:01')
  })

  it('formats hours, minutes, and seconds', () => {
    expect(formatTimeRemaining(3661)).toBe('01:01:01')
    expect(formatTimeRemaining(7200)).toBe('02:00:00')
  })
})

describe('calculateTimeRemaining', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns full duration when startedAt is null', () => {
    const result = calculateTimeRemaining(null, 60)
    expect(result).toBe(3600)
  })

  it('calculates remaining time from now', () => {
    const now = new Date('2026-07-22T11:30:00Z')
    vi.setSystemTime(now)
    const startedAt = new Date('2026-07-22T11:00:00Z')

    const result = calculateTimeRemaining(startedAt, 60)

    expect(result).toBe(1800)
  })

  it('returns 0 when time has expired', () => {
    const now = new Date('2026-07-22T13:01:00Z')
    vi.setSystemTime(now)
    const startedAt = new Date('2026-07-22T12:00:00Z')

    const result = calculateTimeRemaining(startedAt, 60)

    expect(result).toBe(0)
  })
})
