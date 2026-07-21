import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter } from './00-helpers'
import crypto from 'crypto'

export async function seedAudit(db: PrismaClient) {
  resetCounter()

  const admins = await db.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } })
  if (admins.length === 0) return

  const admin = admins[0]

  const auditActions = [
    { action: 'payment_approve', entityType: 'payment', entityId: deterministicId('eid'), status: 'success', duration: 120 },
    { action: 'user_create', entityType: 'user', entityId: deterministicId('eid'), status: 'success', duration: 45 },
    { action: 'content_create', entityType: 'mcq_question', entityId: deterministicId('eid'), status: 'success', duration: 230 },
    { action: 'content_update', entityType: 'lecture', entityId: deterministicId('eid'), status: 'success', duration: 180 },
    { action: 'payment_reject', entityType: 'payment', entityId: deterministicId('eid'), status: 'success', duration: 90 },
    { action: 'grade_update', entityType: 'submission', entityId: deterministicId('eid'), status: 'success', duration: 300 },
    { action: 'user_update', entityType: 'user', entityId: deterministicId('eid'), status: 'success', duration: 55 },
    { action: 'content_delete', entityType: 'mcq_question', entityId: deterministicId('eid'), status: 'failed', duration: 0 },
    { action: 'payment_approve', entityType: 'payment', entityId: deterministicId('eid'), status: 'success', duration: 110 },
    { action: 'retake_approve', entityType: 'cq_set', entityId: deterministicId('eid'), status: 'success', duration: 65 },
  ]

  for (const a of auditActions) {
    const raw = `${a.action}|${a.entityType}|${a.entityId}|${admin.id}|${new Date().toISOString()}`
    const hash = crypto.createHash('sha256').update(raw).digest('hex')

    await db.auditLog.create({
    data: {
      adminId: admin.id,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      newData: JSON.stringify({ seeded: true, timestamp: new Date().toISOString() }),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 Seed Script',
      userName: admin.name ?? 'Admin',
      userRole: admin.role,
      status: a.status,
      duration: a.duration,
      os: 'Windows',
      browser: 'Chrome',
    },
  })
  }

  // Content versions
  const lectures2 = await db.lecture.findMany({ where: { deletedAt: null }, take: 5, orderBy: { createdAt: 'asc' } })
  for (const lec of lectures2) {
    await db.contentVersion.upsert({
      where: {
        entityType_entityId_versionNumber: { entityType: 'lecture', entityId: lec.id, versionNumber: 1 },
      },
      update: {},
      create: {
        entityType: 'lecture',
        entityId: lec.id,
        versionNumber: 1,
        snapshot: JSON.stringify({
        title: lec.title,
        content: lec.content?.substring(0, 100),
        duration: lec.duration,
        isPremium: lec.isPremium,
        }),
        changedFields: JSON.stringify(['title', 'content', 'duration']),
        changeType: 'create',
        performedBy: admin.id,
        performedByName: admin.name ?? 'Admin',
        performedByRole: admin.role,
      },
    })
  }
}
