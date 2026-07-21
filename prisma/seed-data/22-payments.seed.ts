import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter } from './00-helpers'

export async function seedPayments(db: PrismaClient) {
  resetCounter()

  const students = await db.user.findMany({ where: { role: 'STUDENT', isVerified: true } })
  if (students.length === 0) return

  const payments = [
    { email: students[0].email, amount: 149, method: 'BKASH', transactionId: 'BKASH001', paymentNumber: '01712345678', contentType: 'package', contentId: null, contentTitle: 'মাসিক প্যাকেজ', status: 'APPROVED' },
    { email: students[1].email, amount: 99, method: 'NAGAD', transactionId: 'NAGAD001', paymentNumber: '01812345678', contentType: 'mcq-exam-package', contentId: null, contentTitle: 'SSC MCQ Model Test', status: 'APPROVED' },
    { email: students[2].email, amount: 149, method: 'ROCKET', transactionId: 'ROCKET001', paymentNumber: '01912345678', contentType: 'bundle', contentId: null, contentTitle: 'SSC Science Bundle', status: 'PENDING' },
    { email: students[3].email, amount: 499, method: 'BKASH', transactionId: 'BKASH002', paymentNumber: '01612345678', contentType: 'course', contentId: null, contentTitle: 'SSC Physics Mastercourse', status: 'PENDING' },
    { email: students[4].email, amount: 79, method: 'NAGAD', transactionId: 'NAGAD002', paymentNumber: '01722345678', contentType: 'bundle', contentId: null, contentTitle: 'Junior Science Bundle', status: 'REJECTED' },
    { email: students[0].email, amount: 599, method: 'BKASH', transactionId: 'BKASH003', paymentNumber: '01712345678', contentType: 'package', contentId: null, contentTitle: 'Half-Yearly Package', status: 'APPROVED' },
    { email: students[1].email, amount: 39, method: 'ROCKET', transactionId: 'ROCKET002', paymentNumber: '01812345678', contentType: 'suggestion', contentId: null, contentTitle: 'HSC Physics Suggestion', status: 'APPROVED' },
  ]

  for (const p of payments) {
    const user = await db.user.findUnique({ where: { email: p.email } })
    if (!user) continue

    const existing = await db.payment.findUnique({ where: { transactionId: p.transactionId } })
    if (existing) continue

    await db.payment.create({
    data: {
      id: deterministicId('pay'),
      userId: user.id,
      amount: p.amount,
      method: p.method,
      transactionId: p.transactionId,
      paymentNumber: p.paymentNumber,
      contentType: p.contentType,
      contentTitle: p.contentTitle,
      status: p.status,
      isActive: p.status === 'APPROVED',
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    },
  })
  }
}
