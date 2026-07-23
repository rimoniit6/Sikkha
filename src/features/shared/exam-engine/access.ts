import { db } from '@/lib/db'
import { resolveCourseLayerAccess } from '@/lib/course-access-resolver'

export type AccessResult =
  | { hasAccess: true; purchaseId: string | null; accessSource: 'direct_purchase' | 'course' }
  | { hasAccess: false; accessSource: 'none' }

export async function validateExamAccess(
  userId: string,
  packageId: string,
  module: 'cq' | 'mcq',
): Promise<AccessResult> {
  const contentType = module === 'cq' ? 'cq-exam-package' : 'mcq-exam-package'

  const purchase =
    module === 'cq'
      ? await db.cQExamPackagePurchase.findUnique({
          where: { userId_packageId: { userId, packageId } },
        })
      : await db.mCQExamPackagePurchase.findUnique({
          where: { userId_packageId: { userId, packageId } },
        })

  if (purchase?.isActive) {
    return { hasAccess: true, purchaseId: purchase.id, accessSource: 'direct_purchase' }
  }

  const courseAccess = await resolveCourseLayerAccess(userId, contentType, packageId)
  if (courseAccess.hasAccess) {
    return { hasAccess: true, purchaseId: null, accessSource: 'course' }
  }

  return { hasAccess: false, accessSource: 'none' }
}
