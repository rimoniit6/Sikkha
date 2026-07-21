import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter, BN } from './00-helpers'

export async function seedSuggestions(db: PrismaClient) {
  resetCounter()

  const suggestionData = [
    { title: 'এসএসসি পদার্থবিজ্ঞান সাজেশন', slug: 'ssc-physics-suggestion', classSlug: 'ssc', subjectSlug: 'physics-ssc', isPremium: false },
    { title: 'এসএসসি রসায়ন সাজেশন', slug: 'ssc-chemistry-suggestion', classSlug: 'ssc', subjectSlug: 'chemistry-ssc', isPremium: false },
    { title: 'এসএসসি গণিত সাজেশন', slug: 'ssc-mathematics-suggestion', classSlug: 'ssc', subjectSlug: 'mathematics-ssc', isPremium: true, price: 29 },
    { title: 'এসএসসি জীববিজ্ঞান সাজেশন', slug: 'ssc-biology-suggestion', classSlug: 'ssc', subjectSlug: 'biology-ssc', isPremium: false },
    { title: 'এসএসসি ইংরেজি সাজেশন', slug: 'ssc-english-suggestion', classSlug: 'ssc', subjectSlug: 'english-ssc', isPremium: false },
    { title: 'এইচএসসি পদার্থবিজ্ঞান সাজেশন', slug: 'hsc-physics-suggestion', classSlug: 'hsc', subjectSlug: 'physics-hsc', isPremium: true, price: 39 },
    { title: 'এইচএসসি রসায়ন সাজেশন', slug: 'hsc-chemistry-suggestion', classSlug: 'hsc', subjectSlug: 'chemistry-hsc', isPremium: false },
    { title: 'এইচএসসি জীববিজ্ঞান সাজেশন', slug: 'hsc-biology-suggestion', classSlug: 'hsc', subjectSlug: 'biology-hsc', isPremium: true, price: 39 },
    { title: 'এইচএসসি উচ্চতর গণিত সাজেশন', slug: 'hsc-higher-mathematics-suggestion', classSlug: 'hsc', subjectSlug: 'higher-mathematics-hsc', isPremium: false },
    { title: 'এসএসসি বাংলা সাজেশন', slug: 'ssc-bangla-suggestion', classSlug: 'ssc', subjectSlug: 'bangla-ssc', isPremium: false },
    { title: 'এইচএসসি বাংলা সাজেশন', slug: 'hsc-bangla-suggestion', classSlug: 'hsc', subjectSlug: 'bangla-hsc', isPremium: false },
    { title: 'এসএসসি আইসিটি সাজেশন', slug: 'ssc-ict-suggestion', classSlug: 'ssc', subjectSlug: 'ict-ssc', isPremium: false },
    { title: '৮ম শ্রেণি বিজ্ঞান সাজেশন', slug: 'class-8-science-suggestion', classSlug: 'class-8', subjectSlug: 'science-class-8', isPremium: false },
    { title: 'অষ্টম শ্রেণি বার্ষিক পরীক্ষার সাজেশন', slug: 'class-8-annual-suggestion', classSlug: 'class-8', subjectSlug: null, isPremium: true, price: 49 },
  ]

  for (const sug of suggestionData) {
    const existing = await db.suggestion.findUnique({ where: { slug: sug.slug } })
    if (existing) {
      await db.suggestion.update({
        where: { id: existing.id },
        data: { isActive: true, deletedAt: null, title: sug.title },
      })
      continue
    }

    let chapterId: string | null = null
    if (sug.subjectSlug) {
      const subject = await db.subject.findFirst({
        where: { slug: sug.subjectSlug, deletedAt: null },
      })
      if (subject) {
        const chapter = await db.chapter.findFirst({
          where: { subjectId: subject.id, deletedAt: null },
          orderBy: { order: 'asc' },
        })
        if (chapter) chapterId = chapter.id
      }
    }

    let classId: string | null = null
    const classRec = await db.classCategory.findUnique({ where: { slug: sug.classSlug } })
    if (classRec) classId = classRec.id

    await db.suggestion.create({
    data: {
      id: deterministicId('sug'),
      title: sug.title,
      slug: sug.slug,
      content: `<h2>${sug.title}</h2><p>এই সাজেশনটি ${sug.classSlug} শিক্ষার্থীদের জন্য প্রস্তুত করা হয়েছে। এখানে গুরুত্বপূর্ণ টপিক ও প্রশ্নগুলোর উপর জোর দেওয়া হয়েছে যা পরীক্ষার জন্য অত্যন্ত সহায়ক হবে।</p><h3>গুরুত্বপূর্ণ অধ্যায়</h3><ul><li>প্রথম অধ্যায়</li><li>দ্বিতীয় অধ্যায়</li><li>তৃতীয় অধ্যায়</li><li>চতুর্থ অধ্যায়</li></ul><h3>পরামর্শ</h3><p>প্রতিটি অধ্যায় ভালোভাবে পড়ার পর নিজে নিজে উত্তর দেওয়ার চেষ্টা কর। প্রয়োজনে লেকচার ও এমসিকিউ দেখে নিতে পারো।</p>`,
      subjectId: sug.subjectSlug ? (await db.subject.findFirst({ where: { slug: sug.subjectSlug } }))?.id ?? null : null,
      isPremium: sug.isPremium,
      price: (sug as { price?: number }).price ?? 0,
      viewCount: Math.floor(Math.random() * 500),
    },
  })
  }
}
