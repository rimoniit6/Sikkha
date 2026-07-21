import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter, BN } from './00-helpers'

export async function seedBundles(db: PrismaClient) {
  resetCounter()

  const bundles = [
    { title: 'এসএসসি বিজ্ঞান বান্ডেল', slug: 'ssc-science-bundle', description: 'পদার্থবিজ্ঞান, রসায়ন ও জীববিজ্ঞানের এমসিকিউ ও সৃজনশীল প্রশ্ন একসাথে', classLevel: 'ssc', price: 149, originalPrice: 299, type: 'mixed' as const },
    { title: 'এসএসসি গণিত প্যাক', slug: 'ssc-math-pack', description: 'গণিত ও উচ্চতর গণিতের সম্পূর্ণ সমাধান', classLevel: 'ssc', price: 99, originalPrice: 199, type: 'mixed' as const },
    { title: 'এইচএসসি পদার্থ-রসায়ন বান্ডেল', slug: 'hsc-physics-chemistry-bundle', description: 'পদার্থবিজ্ঞান ও রসায়নের লেকচার ও প্রশ্ন', classLevel: 'hsc', price: 199, originalPrice: 399, type: 'mixed' as const },
    { title: 'এইচএসসি জীববিজ্ঞান বান্ডেল', slug: 'hsc-biology-bundle', description: 'জীববিজ্ঞানের লেকচার, এমসিকিউ ও সৃজনশীল প্রশ্ন', classLevel: 'hsc', price: 149, originalPrice: 299, type: 'mixed' as const },
    { title: '৬ষ্ঠ-৮ম শ্রেণি বিজ্ঞান বান্ডেল', slug: 'junior-science-bundle', description: '৬ষ্ঠ থেকে ৮ম শ্রেণি পর্যন্ত বিজ্ঞানের সব বিষয়', classLevel: 'class-8', price: 79, originalPrice: 149, type: 'mixed' as const },
    { title: 'এসএসসি বাংলাদেশ স্টাডিজ', slug: 'ssc-bangladesh-studies', description: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা এবং বাংলাদেশ ও বিশ্বপরিচয়', classLevel: 'ssc', price: 79, originalPrice: 149, type: 'mixed' as const },
  ]

  for (const b of bundles) {
    const existing = await db.contentBundle.findUnique({ where: { slug: b.slug } })
    if (existing) continue

    const bundle = await db.contentBundle.create({
    data: {
      id: deterministicId('cb'),
      title: b.title,
      slug: b.slug,
      description: b.description,
      classLevel: b.classLevel,
      price: b.price,
      originalPrice: b.originalPrice,
      type: b.type,
    },
  })

    // Add MCQs to bundle
    const mcqs = await db.mCQ.findMany({
      where: { classLevel: b.classLevel, deletedAt: null, isActive: true },
      take: 5,
      orderBy: { createdAt: 'asc' },
    })
    for (let i = 0; i < mcqs.length; i++) {
      await db.bundleItem.upsert({
        where: { bundleId_contentType_contentId: { bundleId: bundle.id, contentType: 'mcq', contentId: mcqs[i].id } },
        update: {},
        create: { id: deterministicId('bi'), bundleId: bundle.id, contentType: 'mcq', contentId: mcqs[i].id, order: i + 1 },
      })
    }

    // Add CQs
    const cqs = await db.cQ.findMany({
      where: { classLevel: b.classLevel, deletedAt: null, isActive: true },
      take: 3,
      orderBy: { createdAt: 'asc' },
    })
    for (let i = 0; i < cqs.length; i++) {
      await db.bundleItem.upsert({
        where: { bundleId_contentType_contentId: { bundleId: bundle.id, contentType: 'cq', contentId: cqs[i].id } },
        update: {},
        create: { id: deterministicId('bi'), bundleId: bundle.id, contentType: 'cq', contentId: cqs[i].id, order: mcqs.length + i + 1 },
      })
    }

    // Add lectures
    const lectures = await db.lecture.findMany({
      where: { chapter: { subject: { class: { slug: b.classLevel } } }, deletedAt: null, isActive: true },
      take: 2,
      orderBy: { createdAt: 'asc' },
    })
    for (let i = 0; i < lectures.length; i++) {
      await db.bundleItem.upsert({
        where: { bundleId_contentType_contentId: { bundleId: bundle.id, contentType: 'lecture', contentId: lectures[i].id } },
        update: {},
        create: { id: deterministicId('bi'), bundleId: bundle.id, contentType: 'lecture', contentId: lectures[i].id, order: mcqs.length + cqs.length + i + 1 },
      })
    }
  }
}
