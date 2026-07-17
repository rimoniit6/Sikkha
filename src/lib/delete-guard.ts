import { db } from '@/lib/db'
import { apiError } from '@/lib/api-utils'
import { NextResponse } from 'next/server'

export interface DependencyCount {
  label: string
  count: number
}

type DepKind = 'id' | 'slug'

interface DependencyDef {
  label: string
  model: keyof typeof db & string
  fk: string
  kind: DepKind
  via?: string
}

/**
 * Registry of dependent-content counts for each admin module that performs a
 * destructive delete. Each entry counts children that would be cascade-removed
 * if the parent were deleted.
 *
 * Phase 6 / Critical C1: never allow a destructive deletion when child content
 * exists. If any dependent count is > 0 the delete is rejected and the caller
 * is instructed to use Archive instead.
 */
const DEPENDENCY_REGISTRY: Record<string, DependencyDef[]> = {
  classes: [{ label: 'subjects', model: 'subject', fk: 'classId', kind: 'id' }],
  subjects: [{ label: 'chapters', model: 'chapter', fk: 'subjectId', kind: 'id' }],
  chapters: [
    { label: 'lectures', model: 'lecture', fk: 'chapterId', kind: 'id' },
    { label: 'mcqs', model: 'mCQ', fk: 'chapterId', kind: 'id' },
    { label: 'cqs', model: 'cQ', fk: 'chapterId', kind: 'id' },
    { label: 'knowledgeQuestions', model: 'knowledgeQuestion', fk: 'chapterId', kind: 'id' },
    { label: 'topics', model: 'topic', fk: 'chapterId', kind: 'id' },
    { label: 'suggestions', model: 'suggestion', fk: 'chapterId', kind: 'id' },
  ],
  lectures: [{ label: 'resources', model: 'resource', fk: 'lectureId', kind: 'id' }],
  mcq: [{ label: 'examSetQuestions', model: 'mCQExamSetQuestion', fk: 'mcqId', kind: 'id' }],
  cq: [{ label: 'examSetQuestions', model: 'cQExamSetQuestion', fk: 'cqId', kind: 'id' }],
  courses: [
    { label: 'lessons', model: 'courseLesson', fk: 'courseId', kind: 'id' },
    { label: 'examSchedules', model: 'courseExamSchedule', fk: 'courseId', kind: 'id' },
    { label: 'purchases', model: 'coursePurchase', fk: 'courseId', kind: 'id' },
    { label: 'enrollments', model: 'courseEnrollment', fk: 'courseId', kind: 'id' },
    { label: 'certificates', model: 'certificate', fk: 'courseId', kind: 'id' },
  ],
  'mcq-exam-packages': [
    { label: 'examSets', model: 'mCQExamSet', fk: 'packageId', kind: 'id' },
    { label: 'purchases', model: 'mCQExamPackagePurchase', fk: 'packageId', kind: 'id' },
    { label: 'examSetQuestions', model: 'mCQExamSetQuestion', fk: 'setId', kind: 'id', via: 'mCQExamSet' },
  ],
  'cq-exam-packages': [
    { label: 'examSets', model: 'cQExamSet', fk: 'packageId', kind: 'id' },
    { label: 'purchases', model: 'cQExamPackagePurchase', fk: 'packageId', kind: 'id' },
    { label: 'examSetQuestions', model: 'cQExamSetQuestion', fk: 'setId', kind: 'id', via: 'cQExamSet' },
  ],
  boards: [
    { label: 'mcqs', model: 'mCQ', fk: 'board', kind: 'slug' },
    { label: 'cqs', model: 'cQ', fk: 'board', kind: 'slug' },
    { label: 'boardYears', model: 'boardYear', fk: 'board', kind: 'slug' },
  ],
  bundles: [{ label: 'items', model: 'bundleItem', fk: 'bundleId', kind: 'id' }],
  suggestions: [],
  topics: [],
  'board-years': [],
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Delegate = { count: (args: { where: Record<string, unknown> }) => Promise<number> }

/**
 * Check whether a destructive delete of `module` record `id` is safe.
 *
 * @param module  The admin module key (matches DEPENDENCY_REGISTRY).
 * @param id      The record id (used for FK `where` clauses).
 * @param slug    For modules keyed by slug (e.g. boards), the slug value.
 * @returns       { ok: true } if deletion may proceed, or
 *               { ok: false, response } with a 409 describing the blockers.
 */
export async function guardDeleteDependencies(
  module: string,
  id: string,
  slug?: string
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const deps = DEPENDENCY_REGISTRY[module]
  if (!deps || deps.length === 0) {
    return { ok: true }
  }

  const counts: DependencyCount[] = []

  for (const dep of deps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = (db as any)[dep.model] as Delegate | undefined
    if (!delegate || typeof delegate.count !== 'function') continue

    if (dep.via) {
      // Count grandchildren by first resolving parent ids, then counting on the
      // child table via its FK.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parentDelegate = (db as any)[dep.via] as Delegate | undefined
      if (!parentDelegate) continue
      const parents = await (parentDelegate as any).findMany({
        where: { [dep.fk === 'setId' ? 'packageId' : dep.fk]: id },
        select: { id: true },
      })
      const ids = (parents as { id: string }[]).map((p) => p.id)
      const count = ids.length
        ? await delegate.count({ where: { [dep.fk]: { in: ids } } })
        : 0
      counts.push({ label: dep.label, count })
    } else {
      const value = dep.kind === 'slug' ? (slug ?? '') : id
      const count = await delegate.count({ where: { [dep.fk]: value } })
      counts.push({ label: dep.label, count })
    }
  }

  const blockers = counts.filter((c) => c.count > 0)

  if (blockers.length > 0) {
    return {
      ok: false,
      response: apiError(
        'এই রেকর্ডের সাথে সংযুক্ত কন্টেন্ট রয়েছে, তাই এটি সরাসরি মুছে ফেলা যাবে না। আর্কাইভ ব্যবহার করুন।',
        409,
        'DELETE_BLOCKED_HAS_DEPENDENCIES',
        {
          module,
          id,
          dependencies: blockers,
          suggestion: 'ARCHIVE',
        }
      ),
    }
  }

  return { ok: true }
}
