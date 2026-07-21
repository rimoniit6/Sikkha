import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter } from './00-helpers'

export async function seedWorkflow(db: PrismaClient) {
  resetCounter()

  const admins = await db.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } })
  if (admins.length === 0) return

  const admin = admins[0]

  // Pick some lectures to create workflows for
  const lectures = await db.lecture.findMany({ where: { deletedAt: null, isActive: true }, take: 5, orderBy: { createdAt: 'asc' } })
  if (lectures.length === 0) return

  const workflowStatuses = ['PUBLISHED', 'PUBLISHED', 'DRAFT', 'IN_REVIEW', 'PUBLISHED']

  for (let i = 0; i < Math.min(lectures.length, 5); i++) {
    const lecture = lectures[i]
    const status = workflowStatuses[i]

    await db.contentWorkflow.upsert({
      where: { entityType_entityId: { entityType: 'lecture', entityId: lecture.id } },
      update: { status },
      create: {
        id: deterministicId('cw'),
        entityType: 'lecture',
        entityId: lecture.id,
        status,
        submittedBy: status === 'PUBLISHED' ? admin.id : status === 'IN_REVIEW' ? admin.id : null,
        submittedAt: status !== 'DRAFT' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : null,
        reviewedBy: status === 'PUBLISHED' ? admin.id : null,
        reviewedAt: status === 'PUBLISHED' ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : null,
        approvedBy: status === 'PUBLISHED' ? admin.id : null,
        approvedAt: status === 'PUBLISHED' ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) : null,
        publishedBy: status === 'PUBLISHED' ? admin.id : null,
        publishedAt: status === 'PUBLISHED' ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
        publishAttempts: 1,
        lastPublishAttempt: status === 'PUBLISHED' ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
      },
    })
  }

  // Workflow history for published items
  const transitions = [
    { from: 'DRAFT', to: 'IN_REVIEW', comment: 'প্রকাশের জন্য জমা দেওয়া হয়েছে।' },
    { from: 'IN_REVIEW', to: 'APPROVED', comment: 'রিভিউ সম্পন্ন। কন্টেন্ট অনুমোদিত।' },
    { from: 'APPROVED', to: 'PUBLISHED', comment: 'পাবলিশ করা হয়েছে।' },
  ]

  for (let i = 0; i < Math.min(lectures.length, 3); i++) {
    const lecture = lectures[i]
    for (const trans of transitions) {
      await db.workflowHistory.create({
    data: {
      entityType: 'lecture',
      entityId: lecture.id,
      fromStatus: trans.from,
      toStatus: trans.to,
      performedBy: admin.id,
      performedByName: admin.name ?? 'Admin',
      performedByRole: admin.role,
      comment: trans.comment,
      versionNumber: 1,
    },
  })
    }

    // Workflow comments for the first one
    if (i === 0) {
      await db.workflowComment.create({
    data: {
      entityType: 'lecture',
      entityId: lecture.id,
      authorId: admin.id,
      authorName: admin.name ?? 'Admin',
      authorRole: admin.role,
      content: 'এই লেকচারে কিছু ছবি যোগ করতে হবে। বাকি অংশ ভালো আছে।',
      action: 'request_changes',
    },
  })
      await db.workflowComment.create({
    data: {
      entityType: 'lecture',
      entityId: lecture.id,
      authorId: admin.id,
      authorName: admin.name ?? 'Admin',
      authorRole: admin.role,
      content: 'ছবি যোগ করা হয়েছে। এখন পাবলিশ করার জন্য রেডি।',
      action: 'approve',
      isResolved: true,
    },
  })
    }
  }
}
