import { db } from '@/lib/db'

/**
 * Unified Purchase State Machine
 *
 * Four valid states:
 *   NOT_PURCHASED — No payment submitted
 *   PENDING_APPROVAL — Payment submitted, awaiting admin review
 *   APPROVED — Payment approved, full access granted
 *   REJECTED — Payment rejected, may submit new payment
 *
 * Resolution priority (first match wins):
 *   1. Active subscription → APPROVED
 *   2. Approved direct payment → APPROVED
 *   3. Approved bundle payment → APPROVED
 *   4. Approved exam package purchase → APPROVED
 *   5. Approved course purchase → APPROVED
 *   6. Pending payment → PENDING_APPROVAL
 *   7. Most recent rejected payment → REJECTED
 *   8. Default → NOT_PURCHASED
 */

export type PurchaseState = 'NOT_PURCHASED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'purchased' | 'pending' | 'rejected' | 'locked'

export interface PurchaseStatus {
  state: PurchaseState
  reason: string | null
  paymentId: string | null
  hasAccess: boolean
  subscription?: {
    id: string
    packageName: string
    durationLabel: string
    endDate: Date
  }
  bundleTitle?: string
  partialAccess?: {
    purchasedItemCount: number
    totalItemCount: number
  }
}

// Cross-type mapping for mcq ↔ board-mcq, cq ↔ board-cq
const CROSS_TYPE_MAP: Record<string, string[]> = {
  mcq: ['board-mcq'],
  'board-mcq': ['mcq'],
  cq: ['board-cq'],
  'board-cq': ['cq'],
}

function getContentTypesToCheck(contentType: string): string[] {
  return [contentType, ...(CROSS_TYPE_MAP[contentType] || [])]
}

/**
 * Resolve the class level for a content item.
 * Used to check subscription eligibility.
 */
async function resolveClassLevel(
  contentType: string,
  contentId: string
): Promise<string | null> {
  if (['mcq', 'cq', 'board-mcq', 'board-cq'].includes(contentType)) {
    const Model: typeof db.mCQ | typeof db.cQ = contentType.includes('cq') ? db.cQ : db.mCQ
    const item = await (Model as typeof db.mCQ).findUnique({
      where: { id: contentId },
      select: { classLevel: true },
    })
    return item?.classLevel || null
  }

  if (contentType === 'lecture') {
    const lecture = await db.lecture.findUnique({
      where: { id: contentId },
      select: { chapter: { select: { subject: { select: { classId: true } } } } },
    })
    if (lecture) {
      const classCat = await db.classCategory.findUnique({
        where: { id: lecture.chapter.subject.classId },
        select: { slug: true },
      })
      return classCat?.slug || null
    }
  }

  if (contentType === 'exam') {
    const exam = await db.exam.findUnique({
      where: { id: contentId },
      select: { classLevel: true },
    })
    return exam?.classLevel || null
  }

  if (contentType === 'suggestion') {
    const suggestion = await db.suggestion.findUnique({
      where: { id: contentId },
      select: { classId: true },
    })
    if (suggestion?.classId) {
      const classCat = await db.classCategory.findUnique({
        where: { id: suggestion.classId },
        select: { slug: true },
      })
      return classCat?.slug || null
    }
  }

  if (contentType === 'mcq-exam-package') {
    const pkg = await db.mCQExamPackage.findUnique({
      where: { id: contentId },
      select: { id: true, classId: true },
    })
    if (pkg?.classId) {
      const classCat = await db.classCategory.findUnique({
        where: { id: pkg.classId },
        select: { slug: true },
      })
      return classCat?.slug || null
    }
    return null
  }

  if (contentType === 'cq-exam-package') {
    const pkg = await db.cQExamPackage.findUnique({
      where: { id: contentId },
      select: { id: true, classId: true },
    })
    if (pkg?.classId) {
      const classCat = await db.classCategory.findUnique({
        where: { id: pkg.classId },
        select: { slug: true },
      })
      return classCat?.slug || null
    }
    return null
  }

  return null
}

/**
 * Centralized purchase status resolver.
 * Returns the canonical purchase state for any (user, content) pair.
 */
export async function resolvePurchaseStatus(
  userId: string,
  contentType: string,
  contentId: string
): Promise<PurchaseStatus> {
  const contentTypesToCheck = getContentTypesToCheck(contentType)

  // ── Layer 1: Active subscription ──────────────────────────────
  const classLevel = await resolveClassLevel(contentType, contentId)
  if (classLevel) {
    const activeSubscription = await db.userSubscription.findFirst({
      where: {
        userId,
        classLevel,
        isActive: true,
        endDate: { gte: new Date() },
      },
      include: {
        package: { select: { title: true, durationLabel: true } },
      },
    })

    if (activeSubscription) {
      return {
        state: 'APPROVED',
        reason: 'active_subscription',
        paymentId: null,
        hasAccess: true,
        subscription: {
          id: activeSubscription.id,
          packageName: activeSubscription.package.title,
          durationLabel: activeSubscription.package.durationLabel,
          endDate: activeSubscription.endDate,
        },
      }
    }
  }

  // ── Layer 2: Direct payment (with cross-type matching) ───────
  const approvedPayment = await db.payment.findFirst({
    where: {
      userId,
      contentType: { in: contentTypesToCheck },
      contentId,
      status: 'APPROVED',
      isActive: true,
    },
    select: { id: true },
  })

  if (approvedPayment) {
    return {
      state: 'APPROVED',
      reason: 'direct_payment',
      paymentId: approvedPayment.id,
      hasAccess: true,
    }
  }

  // ── Layer 3: Bundle payment ──────────────────────────────────
  if (['mcq', 'cq', 'board-mcq', 'board-cq', 'lecture', 'suggestion', 'exam'].includes(contentType)) {
    const bundleItems = await db.bundleItem.findMany({
      where: {
        contentType: { in: contentTypesToCheck },
        contentId,
      },
      select: { bundleId: true },
    })

    const bundleIds = [...new Set(bundleItems.map((bi) => bi.bundleId))]

    if (bundleIds.length > 0) {
      const approvedBundlePayment = await db.payment.findFirst({
        where: {
          userId,
          contentType: 'bundle',
          contentId: { in: bundleIds },
          status: 'APPROVED',
          isActive: true,
        },
        select: { id: true, contentTitle: true },
      })

      if (approvedBundlePayment) {
        return {
          state: 'APPROVED',
          reason: 'bundle_purchase',
          paymentId: approvedBundlePayment.id,
          hasAccess: true,
          bundleTitle: approvedBundlePayment.contentTitle || undefined,
        }
      }

      // Check for pending bundle payment
      const pendingBundlePayment = await db.payment.findFirst({
        where: {
          userId,
          contentType: 'bundle',
          contentId: { in: bundleIds },
          status: 'PENDING',
        },
        select: { id: true },
      })

      if (pendingBundlePayment) {
        return {
          state: 'PENDING_APPROVAL',
          reason: 'pending_bundle',
          paymentId: pendingBundlePayment.id,
          hasAccess: false,
        }
      }
    }
  }

  // ── Layer 4: Bundle reverse-check (for bundle content type) ──
  if (contentType === 'bundle') {
    const bundleItems = await db.bundleItem.findMany({
      where: { bundleId: contentId },
      select: { contentType: true, contentId: true },
    })

    if (bundleItems.length > 0) {
      let purchasedCount = 0
      for (const item of bundleItems) {
        const itemTypes = getContentTypesToCheck(item.contentType)
        const hasPayment = await db.payment.findFirst({
          where: {
            userId,
            contentType: { in: itemTypes },
            contentId: item.contentId,
            status: 'APPROVED',
            isActive: true,
          },
          select: { id: true },
        })
        if (hasPayment) purchasedCount++
      }

      if (purchasedCount === bundleItems.length) {
        return {
          state: 'APPROVED',
          reason: 'all_bundle_items_purchased',
          paymentId: null,
          hasAccess: true,
        }
      }
    }
  }

  // ── Layer 5: Package subscription (for package content type) ─
  if (contentType === 'package') {
    const subscription = await db.userSubscription.findFirst({
      where: {
        userId,
        packageId: contentId,
        isActive: true,
        endDate: { gte: new Date() },
      },
      select: { id: true },
    })

    if (subscription) {
      return {
        state: 'APPROVED',
        reason: 'package_subscription',
        paymentId: null,
        hasAccess: true,
      }
    }
  }

  // ── Layer 6: Exam package purchase ───────────────────────────
  if (contentType === 'mcq-exam-package') {
    const purchase = await db.mCQExamPackagePurchase.findFirst({
      where: { userId, packageId: contentId, isActive: true },
      select: { id: true },
    })
    if (purchase) {
      return {
        state: 'APPROVED',
        reason: 'exam_package_purchase',
        paymentId: null,
        hasAccess: true,
      }
    }
  }

  if (contentType === 'cq-exam-package') {
    const purchase = await db.cQExamPackagePurchase.findFirst({
      where: { userId, packageId: contentId, isActive: true },
      select: { id: true },
    })
    if (purchase) {
      return {
        state: 'APPROVED',
        reason: 'exam_package_purchase',
        paymentId: null,
        hasAccess: true,
      }
    }
  }

  // ── Layer 7: Pending payment ─────────────────────────────────
  const pendingPayment = await db.payment.findFirst({
    where: {
      userId,
      contentType: { in: contentTypesToCheck },
      contentId,
      status: 'PENDING',
    },
    select: { id: true },
  })

  if (pendingPayment) {
    return {
      state: 'PENDING_APPROVAL',
      reason: 'pending_payment',
      paymentId: pendingPayment.id,
      hasAccess: false,
    }
  }

  // ── Layer 8: Check for rejected payment ──────────────────────
  const rejectedPayment = await db.payment.findFirst({
    where: {
      userId,
      contentType: { in: contentTypesToCheck },
      contentId,
      status: 'REJECTED',
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  if (rejectedPayment) {
    return {
      state: 'REJECTED',
      reason: 'rejected',
      paymentId: rejectedPayment.id,
      hasAccess: false,
    }
  }

  // ── Default: NOT_PURCHASED ───────────────────────────────────
  return {
    state: 'NOT_PURCHASED',
    reason: null,
    paymentId: null,
    hasAccess: false,
  }
}

/**
 * Batch resolve purchase statuses for multiple content items.
 * More efficient than calling resolvePurchaseStatus in a loop.
 */
export async function resolveBatchPurchaseStatuses(
  userId: string,
  items: Array<{ contentType: string; contentId: string }>
): Promise<Map<string, PurchaseStatus>> {
  const results = new Map<string, PurchaseStatus>()

  // Resolve all items in parallel
  const resolutions = await Promise.all(
    items.map(async (item) => {
      const key = `${item.contentType}:${item.contentId}`
      const status = await resolvePurchaseStatus(userId, item.contentType, item.contentId)
      return { key, status }
    })
  )

  for (const { key, status } of resolutions) {
    results.set(key, status)
  }

  return results
}
