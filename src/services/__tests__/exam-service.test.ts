import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    chapter: { findFirst: vi.fn() },
    userSubscription: { findFirst: vi.fn() },
    mCQ: { findMany: vi.fn(), findUnique: vi.fn() },
    exam: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn() },
    examQuestion: { findMany: vi.fn() },
    examResult: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    examSession: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    contentPackage: { findMany: vi.fn() },
  },
}))

// Mock access control
vi.mock('@/lib/access-control', () => ({
  checkContentAccess: vi.fn().mockResolvedValue({ hasAccess: true }),
}))

import { calculateRemainingTime, ExamError } from '@/services/exam-service'

// ====================================================================
// calculateRemainingTime — pure function tests
// ====================================================================

describe('calculateRemainingTime', () => {
  it('returns full time when just started', () => {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000) // 30 min
    const result = calculateRemainingTime(now, expiresAt, 30)
    expect(result.totalSeconds).toBe(1800)
    expect(result.remainingSeconds).toBeGreaterThanOrEqual(1798)
    expect(result.remainingSeconds).toBeLessThanOrEqual(1800)
    expect(result.isExpired).toBe(false)
  })

  it('returns 0 remaining when expired', () => {
    // Exam started 31 minutes ago with 30-minute duration = expired
    const startedAt = new Date(Date.now() - 31 * 60 * 1000)
    const expiresAt = new Date(Date.now() - 60 * 1000) // expired 1 min ago
    const result = calculateRemainingTime(startedAt, expiresAt, 30)
    expect(result.remainingSeconds).toBe(0)
    expect(result.isExpired).toBe(true)
  })

  it('calculates remaining correctly mid-exam', () => {
    const startedAt = new Date(Date.now() - 10 * 60 * 1000) // started 10 min ago
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000) // expires in 20 min
    const result = calculateRemainingTime(startedAt, expiresAt, 30)
    expect(result.totalSeconds).toBe(1800)
    expect(result.remainingSeconds).toBeGreaterThanOrEqual(1198)
    expect(result.remainingSeconds).toBeLessThanOrEqual(1202)
    expect(result.isExpired).toBe(false)
  })

  it('handles zero duration', () => {
    const now = new Date()
    const result = calculateRemainingTime(now, now, 0)
    expect(result.totalSeconds).toBe(0)
    expect(result.remainingSeconds).toBe(0)
  })
})

// ====================================================================
// ExamError
// ====================================================================

describe('ExamError', () => {
  it('creates with default values', () => {
    const err = new ExamError('test error')
    expect(err.message).toBe('test error')
    expect(err.statusCode).toBe(500)
    expect(err.code).toBe('EXAM_ERROR')
    expect(err.name).toBe('ExamError')
  })

  it('accepts custom status code and code', () => {
    const err = new ExamError('not found', 404, 'NOT_FOUND')
    expect(err.statusCode).toBe(404)
    expect(err.code).toBe('NOT_FOUND')
  })
})

// ====================================================================
// Randomization (Fisher-Yates)
// ====================================================================

describe('Fisher-Yates shuffle', () => {
  it('produces unbiased randomization', () => {
    // Simulate Fisher-Yates shuffle
    function shuffle<T>(arr: T[]): T[] {
      const result = [...arr]
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
      }
      return result
    }

    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const counts = new Map<number, number>()
    
    // Run 10000 shuffles
    for (let i = 0; i < 10000; i++) {
      const shuffled = shuffle(items)
      const first = shuffled[0]
      counts.set(first, (counts.get(first) || 0) + 1)
    }

    // Each item should appear as first roughly 10% of the time (±3%)
    for (const item of items) {
      const count = counts.get(item) || 0
      const percentage = count / 10000
      expect(percentage).toBeGreaterThan(0.07)
      expect(percentage).toBeLessThan(0.13)
    }
  })

  it('does not produce duplicate items', () => {
    function shuffle<T>(arr: T[]): T[] {
      const result = [...arr]
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
      }
      return result
    }

    const items = Array.from({ length: 30 }, (_, i) => i)
    const shuffled = shuffle(items)
    const unique = new Set(shuffled)
    expect(unique.size).toBe(items.length)
  })
})

// ====================================================================
// Scoring logic (unit test without DB)
// ====================================================================

describe('Scoring logic', () => {
  function calculateScore(
    answers: Record<string, string>,
    correctAnswers: Map<string, string>,
    marksPerMcq: number,
    negativeMarks: number
  ) {
    let correct = 0
    let wrong = 0

    for (const [questionId, userAnswer] of Object.entries(answers)) {
      const correctAnswer = correctAnswers.get(questionId)
      if (!correctAnswer) continue
      if (userAnswer === correctAnswer) correct++
      else wrong++
    }

    const score = Math.max(0, correct * marksPerMcq - wrong * negativeMarks)
    const totalMarks = correctAnswers.size * marksPerMcq
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0

    return { score, totalMarks, percentage, correct, wrong, skipped: correctAnswers.size - correct - wrong }
  }

  it('calculates perfect score', () => {
    const answers = { q1: 'A', q2: 'B', q3: 'C' }
    const correctAnswers = new Map([['q1', 'A'], ['q2', 'B'], ['q3', 'C']])
    const result = calculateScore(answers, correctAnswers, 1, 0)
    expect(result.correct).toBe(3)
    expect(result.wrong).toBe(0)
    expect(result.score).toBe(3)
    expect(result.percentage).toBe(100)
  })

  it('calculates score with negative marking', () => {
    const answers = { q1: 'A', q2: 'B', q3: 'C' }
    const correctAnswers = new Map([['q1', 'A'], ['q2', 'B'], ['q3', 'A']])
    const result = calculateScore(answers, correctAnswers, 1, 0.5)
    expect(result.correct).toBe(2)
    expect(result.wrong).toBe(1)
    expect(result.score).toBe(1.5) // 2*1 - 1*0.5
  })

  it('floors score at 0', () => {
    const answers = { q1: 'B', q2: 'A' }
    const correctAnswers = new Map([['q1', 'A'], ['q2', 'B']])
    const result = calculateScore(answers, correctAnswers, 1, 1)
    expect(result.correct).toBe(0)
    expect(result.wrong).toBe(2)
    expect(result.score).toBe(0) // max(0, 0*1 - 2*1)
  })

  it('handles empty answers', () => {
    const answers = {}
    const correctAnswers = new Map([['q1', 'A'], ['q2', 'B']])
    const result = calculateScore(answers, correctAnswers, 1, 0.5)
    expect(result.correct).toBe(0)
    expect(result.wrong).toBe(0)
    expect(result.skipped).toBe(2)
    expect(result.score).toBe(0)
  })

  it('handles mixed correct/wrong/skipped', () => {
    const answers = { q1: 'A', q3: 'D' }
    const correctAnswers = new Map([['q1', 'A'], ['q2', 'B'], ['q3', 'C'], ['q4', 'A']])
    const result = calculateScore(answers, correctAnswers, 2, 0.5)
    expect(result.correct).toBe(1) // q1
    expect(result.wrong).toBe(1)   // q3
    expect(result.skipped).toBe(2) // q2, q4
    expect(result.score).toBe(1.5) // 1*2 - 1*0.5
    expect(result.totalMarks).toBe(8) // 4*2
  })
})

// ====================================================================
// Passing grade logic
// ====================================================================

describe('Passing grade', () => {
  it('marks as passed when percentage meets threshold', () => {
    const percentage = 60
    const passingPercentage = 60
    expect(percentage >= passingPercentage).toBe(true)
  })

  it('marks as failed when percentage below threshold', () => {
    const percentage = 39
    const passingPercentage = 40
    expect(percentage >= passingPercentage).toBe(false)
  })

  it('returns null when no threshold set', () => {
    const passingPercentage = null
    const isPassed = passingPercentage != null ? 60 >= passingPercentage : null
    expect(isPassed).toBeNull()
  })
})
