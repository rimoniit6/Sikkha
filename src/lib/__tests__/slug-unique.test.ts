/**
 * Tests for slug-unique helpers (findSlugConflict + generateUniqueSlug).
 *
 * Architecture:
 * The helpers use `includeDeleted: true` to bypass the Prisma $extends
 * middleware's soft-delete filter. These tests verify the correct query
 * parameters are sent and that the loop/conflict logic works.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock db client ────────────────────────────────────────────────
// The helpers call (client as any)[model].findFirst({ where, includeDeleted, select })
// vi.mock is hoisted, so we use vi.hoisted() for the mock function.

const mockFindFirst = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db', () => ({
  db: {
    blogPost: { findFirst: mockFindFirst },
    classCategory: { findFirst: mockFindFirst },
    board: { findFirst: mockFindFirst },
    subject: { findFirst: mockFindFirst },
    course: { findFirst: mockFindFirst },
    contentPackage: { findFirst: mockFindFirst },
    blogCategory: { findFirst: mockFindFirst },
    navigation: { findFirst: mockFindFirst },
    blogSeries: { findFirst: mockFindFirst },
    contentBundle: { findFirst: mockFindFirst },
  },
}))

import { findSlugConflict, generateUniqueSlug } from '@/lib/slug-unique'

beforeEach(() => {
  mockFindFirst.mockReset()
})

// ─── findSlugConflict ──────────────────────────────────────────────

describe('findSlugConflict', () => {
  it('returns null when no conflict exists', async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await findSlugConflict('blogPost', { slug: 'unique-slug' })

    expect(result).toBeNull()
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { slug: 'unique-slug' },
      includeDeleted: true,
      select: { id: true },
    })
  })

  it('returns the conflicting record when one exists', async () => {
    mockFindFirst.mockResolvedValue({ id: 'record-123' })

    const result = await findSlugConflict('board', { slug: 'taken-slug' })

    expect(result).toEqual({ id: 'record-123' })
  })

  it('excludes the given id for updates', async () => {
    mockFindFirst.mockResolvedValue(null)

    await findSlugConflict('classCategory', { slug: 'my-class' }, 'exclude-456')

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { slug: 'my-class', NOT: { id: 'exclude-456' } },
      includeDeleted: true,
      select: { id: true },
    })
  })

  it('works with compound unique constraints (subject)', async () => {
    mockFindFirst.mockResolvedValue({ id: 'subject-789' })

    const result = await findSlugConflict('subject', { slug: 'math', classId: 'class-1' })

    expect(result).toEqual({ id: 'subject-789' })
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { slug: 'math', classId: 'class-1' },
      includeDeleted: true,
      select: { id: true },
    })
  })

  it('accepts a custom prisma client (tx) parameter', async () => {
    const mockTxFindFirst = vi.fn().mockResolvedValue(null)
    const tx = { blogPost: { findFirst: mockTxFindFirst } }

    await findSlugConflict('blogPost', { slug: 'in-tx' }, undefined, tx)

    expect(mockTxFindFirst).toHaveBeenCalledWith({
      where: { slug: 'in-tx' },
      includeDeleted: true,
      select: { id: true },
    })
    // Should NOT have called the default db
    expect(mockFindFirst).not.toHaveBeenCalled()
  })
})

// ─── generateUniqueSlug ────────────────────────────────────────────

describe('generateUniqueSlug', () => {
  it('returns the base slug when no conflict exists', async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await generateUniqueSlug('course', 'my-course')

    expect(result).toBe('my-course')
    expect(mockFindFirst).toHaveBeenCalledTimes(1)
  })

  it('appends -1, -2, … until a unique slug is found', async () => {
    mockFindFirst
      .mockResolvedValueOnce({ id: 'existing-1' })
      .mockResolvedValueOnce(null)

    const result = await generateUniqueSlug('blogPost', 'taken')

    expect(result).toBe('taken-1')
    expect(mockFindFirst).toHaveBeenCalledTimes(2)
  })

  it('skips up to -N and returns the first available', async () => {
    mockFindFirst
      .mockResolvedValueOnce({ id: 'a' })
      .mockResolvedValueOnce({ id: 'b' })
      .mockResolvedValueOnce({ id: 'c' })
      .mockResolvedValueOnce(null)

    const result = await generateUniqueSlug('contentPackage', 'taken')

    expect(result).toBe('taken-3')
    expect(mockFindFirst).toHaveBeenCalledTimes(4)
  })

  it('works with a custom prisma client (tx)', async () => {
    const mockTxFindFirst = vi.fn()
    mockTxFindFirst
      .mockResolvedValueOnce({ id: 'existing-1' })
      .mockResolvedValueOnce(null)
    const tx = { blogPost: { findFirst: mockTxFindFirst } }

    const result = await generateUniqueSlug('blogPost', 'conflict', undefined, tx)

    expect(result).toBe('conflict-1')
    expect(mockTxFindFirst).toHaveBeenCalledTimes(2)
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  it('uses "untitled" fallback when baseSlug is empty', async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await generateUniqueSlug('blogPost', '')

    expect(result).toBe('untitled')
  })
})
