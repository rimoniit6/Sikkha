import { describe, it, expect } from 'vitest'

// ─── Analytics Data Types ───

interface StatusDistribution {
  draft: number
  inReview: number
  approved: number
  rejected: number
  scheduled: number
  published: number
  archived: number
}

interface PublishMetrics {
  successRate: number
  pendingScheduled: number
  totalPublished: number
  averageRetries: number
  totalRetries: number
  workflowsWithRetries: number
}

// ─── Helper Functions (extracted from route for testability) ───

function calculatePublishSuccessRate(published: number, scheduled: number): number {
  const totalAttempted = scheduled + published
  return totalAttempted > 0 ? Math.round((published / totalAttempted) * 100) : 0
}

function buildStatusDistribution(
  raw: Array<{ status: string; _count: { id: number } }>
): StatusDistribution {
  const map: Record<string, number> = {}
  for (const item of raw) {
    map[item.status] = item._count.id
  }
  return {
    draft: map['DRAFT'] || 0,
    inReview: map['IN_REVIEW'] || 0,
    approved: map['APPROVED'] || 0,
    rejected: map['REJECTED'] || 0,
    scheduled: map['SCHEDULED'] || 0,
    published: map['PUBLISHED'] || 0,
    archived: map['ARCHIVED'] || 0,
  }
}

function buildTransitionMap(
  raw: Array<{ action: string; _count: { id: number } }>
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const item of raw) {
    map[item.action] = item._count.id
  }
  return map
}

// ─── Tests ───

describe('Workflow Analytics — publish success rate', () => {
  it('calculates success rate correctly', () => {
    expect(calculatePublishSuccessRate(80, 20)).toBe(80)
    expect(calculatePublishSuccessRate(50, 50)).toBe(50)
    expect(calculatePublishSuccessRate(100, 0)).toBe(100)
    expect(calculatePublishSuccessRate(0, 0)).toBe(0)
  })

  it('rounds to nearest integer', () => {
    expect(calculatePublishSuccessRate(1, 3)).toBe(25)
    expect(calculatePublishSuccessRate(1, 2)).toBe(33)
  })
})

describe('Workflow Analytics — status distribution', () => {
  it('builds distribution from raw groupBy results', () => {
    const raw = [
      { status: 'DRAFT', _count: { id: 5 } },
      { status: 'PUBLISHED', _count: { id: 10 } },
      { status: 'IN_REVIEW', _count: { id: 3 } },
    ]

    const dist = buildStatusDistribution(raw)
    expect(dist.draft).toBe(5)
    expect(dist.published).toBe(10)
    expect(dist.inReview).toBe(3)
    expect(dist.approved).toBe(0)
    expect(dist.rejected).toBe(0)
    expect(dist.scheduled).toBe(0)
    expect(dist.archived).toBe(0)
  })

  it('handles empty results', () => {
    const dist = buildStatusDistribution([])
    expect(dist.draft).toBe(0)
    expect(dist.published).toBe(0)
  })
})

describe('Workflow Analytics — transition map', () => {
  it('builds transition map from raw groupBy results', () => {
    const raw = [
      { action: 'submit', _count: { id: 15 } },
      { action: 'approve', _count: { id: 10 } },
      { action: 'publish', _count: { id: 8 } },
    ]

    const map = buildTransitionMap(raw)
    expect(map['submit']).toBe(15)
    expect(map['approve']).toBe(10)
    expect(map['publish']).toBe(8)
  })

  it('handles empty results', () => {
    const map = buildTransitionMap([])
    expect(Object.keys(map)).toHaveLength(0)
  })
})
