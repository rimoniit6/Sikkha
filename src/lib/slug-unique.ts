/**
 * Reusable slug uniqueness helpers.
 *
 * ARCHITECTURE
 * ────────────
 * The Prisma $extends middleware in db.ts injects `deletedAt: null` into
 * every read query (findUnique, findFirst, findMany, count) for models in
 * SOFT_DELETE_MODELS. This hides soft-deleted records from uniqueness checks.
 *
 * But database @unique/index constraints still include soft-deleted rows,
 * causing P2002 errors when create/update attempts pass the app-level check
 * but fail at the DB level.
 *
 * These helpers use `includeDeleted: true` to bypass the soft-delete filter,
 * ensuring the check sees ALL records (active + soft-deleted) before hitting
 * the database constraint.
 *
 * USAGE
 * ─────
 *   import { findSlugConflict, generateUniqueSlug } from '@/lib/slug-unique'
 *
 *   // Simple slug uniqueness check (outside transaction)
 *   const conflict = await findSlugConflict('board', { slug: 'my-board' })
 *   if (conflict) return apiError('Slug taken', 409)
 *
 *   // With excludeId (for updates)
 *   const conflict = await findSlugConflict('blogPost', { slug }, currentId)
 *
 *   // Inside a Prisma $transaction
 *   const conflict = await findSlugConflict('subject', { slug, classId }, undefined, tx)
 *
 *   // Auto-generate unique slug
 *   const slug = await generateUniqueSlug('course', 'my-course')
 *   const slug2 = await generateUniqueSlug('blogPost', 'my-post', undefined, tx)
 */

import { db } from './db'

// ─── Supported models ────────────────────────────────────────────
// Only models that have a `slug` field with a unique constraint and
// are in SOFT_DELETE_MODELS need these helpers. Add new models here
// when they are introduced.
export type SlugModel =
  | 'blogPost'
  | 'classCategory'
  | 'board'
  | 'subject'
  | 'course'
  | 'contentPackage'
  | 'blogCategory'
  | 'navigation'
  | 'blogSeries'
  | 'contentBundle'

// ─── findSlugConflict ────────────────────────────────────────────
//
// Check whether a slug (or compound unique key) is already taken by
// ANY record — active or soft-deleted.
//
// @param model   - Logical model name (e.g. 'classCategory', 'board')
// @param where   - Unique-field filter, typically `{ slug: '...' }`.
//                  For compound unique constraints pass all fields, e.g.
//                  `{ slug: '...', classId: '...' }` for Subject.
// @param excludeId - Optional ID to exclude (for UPDATE — skip self).
// @param prisma   - Optional Prisma client (defaults to `db`).
//                   Pass `tx` when calling from inside a $transaction.
//
// @returns The conflicting record's `{ id }` or `null`.
//
export async function findSlugConflict(
  model: SlugModel,
  where: Record<string, unknown>,
  excludeId?: string,
  prisma?: any,
): Promise<{ id: string } | null> {
  const client = prisma ?? db
  const queryWhere: Record<string, unknown> = { ...where }

  if (excludeId) {
    queryWhere.NOT = { id: excludeId }
  }

  const existing = await (client as any)[model].findFirst({
    where: queryWhere,
    includeDeleted: true,
    select: { id: true },
  })

  return existing ?? null
}

// ─── generateUniqueSlug ──────────────────────────────────────────
//
// Given a base slug, append `-1`, `-2`, … until a unique slug is found.
// Handles the `includeDeleted` bypass internally.
//
// @param model   - Logical model name.
// @param baseSlug - Desired slug (will be used as-is if available).
// @param excludeId - Optional ID to exclude (for UPDATE).
// @param prisma   - Optional Prisma client (defaults to `db`).
//
// @returns A slug guaranteed to be unique across active + soft-deleted
//          records of the given model.
//
export async function generateUniqueSlug(
  model: SlugModel,
  baseSlug: string,
  excludeId?: string,
  prisma?: any,
): Promise<string> {
  let candidate = baseSlug || 'untitled'
  let counter = 1

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const conflict = await findSlugConflict(model, { slug: candidate }, excludeId, prisma)
    if (!conflict) return candidate
    candidate = `${baseSlug}-${counter}`
    counter++
  }
}
