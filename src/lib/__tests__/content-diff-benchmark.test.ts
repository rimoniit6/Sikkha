import { describe, it, expect } from 'vitest'
import { computeDiff } from '@/lib/content-diff'

describe('Content Diff Engine — Performance Benchmarks', () => {
  function makeSnapshot(size: number): Record<string, unknown> {
    const snapshot: Record<string, unknown> = {
      title: 'Test Record',
      slug: 'test-record',
      description: 'A'.repeat(size),
      content: '<p>' + 'X'.repeat(size) + '</p>',
      price: 99.99,
      isActive: true,
      isPremium: false,
      status: 'PUBLISHED',
      thumbnail: 'https://utfs.io/f/abc123.jpg',
      videoUrl: 'https://utfs.io/f/video.mp4',
      board: 'dhaka',
      year: '2025',
      topic: 'physics',
      tags: 'physics,science',
      classLevel: 'class-9',
      subjectId: 'sub_001',
      chapterId: 'ch_001',
    }
    return snapshot
  }

  it('100KB snapshot: diff completes in <10ms', () => {
    const a = makeSnapshot(100000)
    const b = { ...a, title: 'Updated' }

    const start = performance.now()
    const result = computeDiff(a, b)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(10)
    expect(result.changes.length).toBeGreaterThan(0)
  })

  it('500KB snapshot: diff completes in <50ms', () => {
    const a = makeSnapshot(500000)
    const b = { ...a, title: 'Updated', price: 199.99 }

    const start = performance.now()
    const result = computeDiff(a, b)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(50)
    expect(result.changes.length).toBeGreaterThan(0)
  })

  it('1MB snapshot: diff completes in <100ms', () => {
    const a = makeSnapshot(1000000)
    const b = { ...a, title: 'Updated' }

    const start = performance.now()
    const result = computeDiff(a, b)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
    expect(result.changes.length).toBeGreaterThan(0)
  })

  it('Large JSON content: diff completes in <50ms', () => {
    const a = { content: JSON.stringify(Array.from({ length: 1000 }, (_, i) => ({ id: i, text: `Item ${i}`, data: { nested: { value: i } } }))) }
    const b = { content: JSON.stringify(Array.from({ length: 1001 }, (_, i) => ({ id: i, text: `Item ${i}`, data: { nested: { value: i } } }))) }

    const start = performance.now()
    const result = computeDiff(a, b)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(50)
  })

  it('Many fields: diff completes in <5ms', () => {
    const a: Record<string, unknown> = {}
    const b: Record<string, unknown> = {}
    for (let i = 0; i < 100; i++) {
      a[`field${i}`] = `value${i}`
      b[`field${i}`] = i % 2 === 0 ? `updated${i}` : `value${i}`
    }

    const start = performance.now()
    const result = computeDiff(a, b)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(5)
    expect(result.changes.length).toBe(50)
  })

  it('Nested objects: diff completes in <10ms', () => {
    const a = { data: { blocks: Array.from({ length: 100 }, (_, i) => ({ id: i, title: `Block ${i}`, content: 'X'.repeat(100) })) } }
    const b = { data: { blocks: Array.from({ length: 100 }, (_, i) => ({ id: i, title: i === 50 ? 'Updated' : `Block ${i}`, content: 'X'.repeat(100) })) } }

    const start = performance.now()
    const result = computeDiff(a, b)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(10)
  })
})
