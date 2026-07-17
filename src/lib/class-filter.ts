import { verifyAuth } from './auth'
import { db } from './db'

export type ClassFilterMode = 'denormalized' | 'relational' | 'subject' | 'chapter' | 'course' | 'suggestion'

export async function getClassLevelForRequest(request: Request): Promise<string | null> {
  const auth = await verifyAuth(request)
  if (!auth) return null
  const user = await db.user.findUnique({
    where: { id: auth.user.id },
    select: { learningMode: true, classLevel: true },
  })
  if (user?.learningMode === 'CLASS_BASED' && user?.classLevel) {
    return user.classLevel
  }
  return null
}

export async function getClassLevelForUserId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { learningMode: true, classLevel: true },
  })
  if (user?.learningMode === 'CLASS_BASED' && user?.classLevel) {
    return user.classLevel
  }
  return null
}

export function buildClassFilter(
  classLevel: string | null,
  mode: ClassFilterMode,
): Record<string, unknown> {
  if (!classLevel) return {}

  switch (mode) {
    case 'denormalized':
      return { classLevel }
    case 'subject':
      return { class: { slug: classLevel } }
    case 'chapter':
      return { subject: { class: { slug: classLevel } } }
    case 'relational':
      return { chapter: { subject: { class: { slug: classLevel } } } }
    case 'course':
      return { classCategory: { slug: classLevel } }
    case 'suggestion':
      return { classId: classLevel }
    default:
      return {}
  }
}

export async function applyClassFilter(
  request: Request,
  where: Record<string, unknown>,
  mode: ClassFilterMode,
): Promise<Record<string, unknown>> {
  const classLevel = await getClassLevelForRequest(request)
  if (!classLevel) return where
  const filter = buildClassFilter(classLevel, mode)
  return { ...where, ...filter }
}

export async function autoClassFilter(
  request: Request,
  where: Record<string, unknown>,
  mode: ClassFilterMode,
  explicitClassLevel?: string | null,
): Promise<Record<string, unknown>> {
  const classLevel = explicitClassLevel || (await getClassLevelForRequest(request))
  if (!classLevel) return where
  const filter = buildClassFilter(classLevel, mode)
  return { ...where, ...filter }
}

/**
 * Resolves the user's class filter from the request and returns both the
 * resolved classLevel slug and the Prisma where fragment.
 *
 * Usage in API routes:
 * ```ts
 * const { classLevel, where } = await resolveClassFilterFromRequest(request, 'relational')
 * const items = await db.lecture.findMany({ where: { isActive: true, ...where } })
 * ```
 */
export async function resolveClassFilterFromRequest(
  request: Request,
  mode: ClassFilterMode,
  explicitClassLevel?: string | null,
): Promise<{ classLevel: string | null; where: Record<string, unknown> }> {
  const classLevel = explicitClassLevel ?? (await getClassLevelForRequest(request))
  const where = classLevel ? buildClassFilter(classLevel, mode) : {}
  return { classLevel, where }
}
