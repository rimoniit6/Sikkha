import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter, BN } from './00-helpers'

export async function seedPackages(db: PrismaClient) {
  resetCounter()

  const packageDefs = [
    { title: 'মাসিক প্যাকেজ', slug: 'monthly-package', description: '৩০ দিনের জন্য সব কন্টেন্টে আনলিমিটেড অ্যাক্সেস', price: 149, originalPrice: 299, duration: 30, durationLabel: '৩০ দিন', classLevel: null },
    { title: '৬ মাসের প্যাকেজ', slug: 'half-yearly-package', description: '৬ মাসের জন্য সব কন্টেন্টে আনলিমিটেড অ্যাক্সেস', price: 599, originalPrice: 999, duration: 180, durationLabel: '৬ মাস', classLevel: null },
    { title: 'বার্ষিক প্যাকেজ', slug: 'annual-package', description: '১ বছর ধরে সব কন্টেন্টে আনলিমিটেড অ্যাক্সেস', price: 999, originalPrice: 1999, duration: 365, durationLabel: '১ বছর', classLevel: null },
    { title: 'এসএসসি প্রস্তুতি প্যাকেজ', slug: 'ssc-preparation-package', description: 'এসএসসি পরীক্ষার্থীদের জন্য বিশেষ প্যাকেজ', price: 799, originalPrice: 1499, duration: 365, durationLabel: '১ বছর', classLevel: 'ssc' },
    { title: 'এইচএসসি প্রস্তুতি প্যাকেজ', slug: 'hsc-preparation-package', description: 'এইচএসসি পরীক্ষার্থীদের জন্য বিশেষ প্যাকেজ', price: 899, originalPrice: 1699, duration: 365, durationLabel: '১ বছর', classLevel: 'hsc' },
  ]

  for (const pkg of packageDefs) {
    await db.contentPackage.upsert({
      where: { slug: pkg.slug },
      update: { title: pkg.title, description: pkg.description, price: pkg.price, originalPrice: pkg.originalPrice, duration: pkg.duration, durationLabel: pkg.durationLabel, classLevel: pkg.classLevel, isActive: true, deletedAt: null },
      create: { id: deterministicId('cpkg'), title: pkg.title, slug: pkg.slug, description: pkg.description, price: pkg.price, originalPrice: pkg.originalPrice, duration: pkg.duration, durationLabel: pkg.durationLabel, classLevel: pkg.classLevel },
    })
  }

  // Create subscriptions for premium students
  const premiumStudents = await db.user.findMany({
    where: { role: 'STUDENT', isPremium: true, isVerified: true },
  })
  const annualPackage = await db.contentPackage.findUnique({ where: { slug: 'annual-package' } })
  const monthlyPackage = await db.contentPackage.findUnique({ where: { slug: 'monthly-package' } })

  if (premiumStudents.length > 0 && annualPackage) {
    const student = premiumStudents[0]
    const now = new Date()
    await db.userSubscription.upsert({
      where: { userId_packageId_classLevel: { userId: student.id, packageId: annualPackage.id, classLevel: student.classLevel ?? 'ssc' } },
      update: {},
      create: {
        id: deterministicId('usub'),
        userId: student.id,
        packageId: annualPackage.id,
        classLevel: student.classLevel ?? 'ssc',
        startDate: now,
        endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      },
    })
  }

  if (premiumStudents.length > 1 && monthlyPackage) {
    const student = premiumStudents[1]
    const now = new Date()
    await db.userSubscription.upsert({
      where: { userId_packageId_classLevel: { userId: student.id, packageId: monthlyPackage.id, classLevel: student.classLevel ?? 'hsc' } },
      update: {},
      create: {
        id: deterministicId('usub'),
        userId: student.id,
        packageId: monthlyPackage.id,
        classLevel: student.classLevel ?? 'hsc',
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    })
  }
}
