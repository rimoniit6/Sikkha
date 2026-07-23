import { db } from '@/lib/db'

/**
 * Resolve the class level (slug) for a content item.
 * Used by both access and batch-check routes to determine subscription eligibility.
 *
 * Returns the class slug if the content type supports subscription-based access,
 * or null if the content type does not participate in subscription checks.
 */
export async function resolveContentClassLevel(
  contentType: string,
  contentId: string
): Promise<string | null> {
  switch (contentType) {
    case 'mcq':
    case 'board-mcq': {
      const mcq = await db.mCQ.findUnique({
        where: { id: contentId },
        select: { classLevel: true },
      })
      return mcq?.classLevel || null
    }

    case 'cq':
    case 'board-cq': {
      const cq = await db.cQ.findUnique({
        where: { id: contentId },
        select: { classLevel: true },
      })
      return cq?.classLevel || null
    }

    case 'lecture': {
      const lecture = await db.lecture.findUnique({
        where: { id: contentId },
        select: { chapter: { select: { subject: { select: { classId: true } } } } },
      })
      if (!lecture) return null
      const classCat = await db.classCategory.findUnique({
        where: { id: lecture.chapter.subject.classId },
        select: { slug: true },
      })
      return classCat?.slug || null
    }

    case 'exam': {
      const exam = await db.exam.findUnique({
        where: { id: contentId },
        select: { classLevel: true },
      })
      return exam?.classLevel || null
    }

    case 'suggestion': {
      const suggestion = await db.suggestion.findUnique({
        where: { id: contentId },
        select: { classId: true },
      })
      if (!suggestion?.classId) return null
      const classCat = await db.classCategory.findUnique({
        where: { id: suggestion.classId },
        select: { slug: true },
      })
      return classCat?.slug || null
    }

    case 'mcq-exam-package': {
      const pkg = await db.mCQExamPackage.findUnique({
        where: { id: contentId },
        select: { class: { select: { slug: true } } },
      })
      return pkg?.class?.slug || null
    }

    case 'short-questions': {
      const sq = await db.knowledgeQuestion.findUnique({
        where: { id: contentId },
        select: {
          chapter: {
            select: { subject: { select: { classId: true } } },
          },
        },
      })
      if (!sq) return null
      const classCat = await db.classCategory.findUnique({
        where: { id: sq.chapter.subject.classId },
        select: { slug: true },
      })
      return classCat?.slug || null
    }

    // These types do not participate in subscription-based access:
    // - bundle: checked via bundle-item purchase ownership
    // - package: checked via dedicated package subscription lookup
    // - course: checked via course-granted access layer
    // - cq-exam-package: checked via dedicated purchase check
    // - blog, notice, etc.: not premium content
    default:
      return null
  }
}

/**
 * Batch-resolve class levels for multiple content items.
 * Returns a Map<contentId, classSlug> for items that have a resolvable class level.
 */
export async function batchResolveContentClassLevels(
  items: Array<{ contentType: string; contentId: string }>
): Promise<Map<string, string>> {
  const result = new Map<string, string>()

  // Group items by content type for efficient batch queries
  const byType = new Map<string, string[]>()
  for (const item of items) {
    const existing = byType.get(item.contentType) || []
    existing.push(item.contentId)
    byType.set(item.contentType, existing)
  }

  // Batch resolve MCQs
  const mcqIds = [
    ...(byType.get('mcq') || []),
    ...(byType.get('board-mcq') || []),
  ]
  if (mcqIds.length > 0) {
    const mcqs = await db.mCQ.findMany({
      where: { id: { in: mcqIds } },
      select: { id: true, classLevel: true },
    })
    for (const mcq of mcqs) {
      if (mcq.classLevel) result.set(mcq.id, mcq.classLevel)
    }
  }

  // Batch resolve CQs
  const cqIds = [
    ...(byType.get('cq') || []),
    ...(byType.get('board-cq') || []),
  ]
  if (cqIds.length > 0) {
    const cqs = await db.cQ.findMany({
      where: { id: { in: cqIds } },
      select: { id: true, classLevel: true },
    })
    for (const cq of cqs) {
      if (cq.classLevel) result.set(cq.id, cq.classLevel)
    }
  }

  // Batch resolve lectures
  const lectureIds = byType.get('lecture') || []
  if (lectureIds.length > 0) {
    const lectures = await db.lecture.findMany({
      where: { id: { in: lectureIds } },
      select: {
        id: true,
        chapter: { select: { subject: { select: { classId: true } } } },
      },
    })
    if (lectures.length > 0) {
      const classIds = [...new Set(lectures.map(l => l.chapter.subject.classId))]
      const classCats = await db.classCategory.findMany({
        where: { id: { in: classIds } },
        select: { id: true, slug: true },
      })
      const slugMap = new Map(classCats.map(c => [c.id, c.slug]))
      for (const lecture of lectures) {
        const slug = slugMap.get(lecture.chapter.subject.classId)
        if (slug) result.set(lecture.id, slug)
      }
    }
  }

  // Batch resolve exams
  const examIds = byType.get('exam') || []
  if (examIds.length > 0) {
    const exams = await db.exam.findMany({
      where: { id: { in: examIds } },
      select: { id: true, classLevel: true },
    })
    for (const exam of exams) {
      if (exam.classLevel) result.set(exam.id, exam.classLevel)
    }
  }

  // Batch resolve suggestions
  const suggestionIds = byType.get('suggestion') || []
  if (suggestionIds.length > 0) {
    const suggestions = await db.suggestion.findMany({
      where: { id: { in: suggestionIds } },
      select: { id: true, classId: true },
    })
    const validClassIds = suggestions
      .map(s => s.classId)
      .filter((id): id is string => id !== null)
    if (validClassIds.length > 0) {
      const classCats = await db.classCategory.findMany({
        where: { id: { in: [...new Set(validClassIds)] } },
        select: { id: true, slug: true },
      })
      const slugMap = new Map(classCats.map(c => [c.id, c.slug]))
      for (const suggestion of suggestions) {
        if (suggestion.classId) {
          const slug = slugMap.get(suggestion.classId)
          if (slug) result.set(suggestion.id, slug)
        }
      }
    }
  }

  // Batch resolve short-questions (knowledge questions)
  const sqIds = byType.get('short-questions') || []
  if (sqIds.length > 0) {
    const sqs = await db.knowledgeQuestion.findMany({
      where: { id: { in: sqIds } },
      select: {
        id: true,
        chapter: { select: { subject: { select: { classId: true } } } },
      },
    })
    if (sqs.length > 0) {
      const classIds = [...new Set(sqs.map(sq => sq.chapter.subject.classId))]
      const classCats = await db.classCategory.findMany({
        where: { id: { in: classIds } },
        select: { id: true, slug: true },
      })
      const slugMap = new Map(classCats.map(c => [c.id, c.slug]))
      for (const sq of sqs) {
        const slug = slugMap.get(sq.chapter.subject.classId)
        if (slug) result.set(sq.id, slug)
      }
    }
  }

  // Batch resolve MCQ exam packages
  const mcqPkgIds = byType.get('mcq-exam-package') || []
  if (mcqPkgIds.length > 0) {
    const pkgs = await db.mCQExamPackage.findMany({
      where: { id: { in: mcqPkgIds } },
      select: { id: true, class: { select: { slug: true } } },
    })
    for (const pkg of pkgs) {
      if (pkg.class?.slug) result.set(pkg.id, pkg.class.slug)
    }
  }

  return result
}
