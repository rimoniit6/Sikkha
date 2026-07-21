import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter } from './00-helpers'

export async function seedBlogCategories(db: PrismaClient) {
  resetCounter()

  const categories = [
    { name: 'শিক্ষা টিপস', slug: 'education-tips', description: 'পড়াশোনার বিভিন্ন টিপস ও কৌশল', color: '#10b981', order: 1 },
    { name: 'পরীক্ষা প্রস্তুতি', slug: 'exam-preparation', description: 'পরীক্ষার প্রস্তুতির গাইড', color: '#3b82f6', order: 2 },
    { name: 'বিষয়ভিত্তিক গাইড', slug: 'subject-guide', description: 'প্রত্যেক বিষয়ের জন্য নির্দেশিকা', color: '#8b5cf6', order: 3 },
    { name: 'ক্যারিয়ার', slug: 'career', description: 'ভবিষ্যৎ ক্যারিয়ার পরিকল্পনা', color: '#f59e0b', order: 4 },
    { name: 'নোটিশ', slug: 'notice', description: 'প্রাতিষ্ঠানিক নোটিশ', color: '#ef4444', order: 5 },
    { name: 'সাফল্যের গল্প', slug: 'success-stories', description: 'শিক্ষার্থীদের সাফল্যের গল্প', color: '#ec4899', order: 6 },
    { name: 'টেকনোলজি', slug: 'technology', description: 'প্রযুক্তি ও শিক্ষা', color: '#06b6d4', order: 7 },
    { name: 'মোটিভেশন', slug: 'motivation', description: 'উৎসাহ ও প্রেরণা', color: '#f97316', order: 8 },
    { name: 'ক্যারিয়ার গাইডেন্স', slug: 'career-guidance', description: 'ক্যারিয়ার পরিকল্পনা ও দিকনির্দেশনা', color: '#a855f7', order: 9 },
    { name: 'ভর্তি পরীক্ষা', slug: 'admission-test', description: 'ভর্তি পরীক্ষার প্রস্তুতি', color: '#14b8a6', order: 10 },
    { name: 'সাধারণ', slug: 'general', description: 'সাধারণ শিক্ষা বিষয়ক লেখা', color: '#eab308', order: 11 },
    { name: 'পড়াশোনার টিপস', slug: 'study-tips', description: 'কার্যকরী পড়াশোনার কৌশল', color: '#22c55e', order: 12 },
  ]

  for (const cat of categories) {
    await db.blogCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, color: cat.color, order: cat.order, isActive: true, deletedAt: null },
      create: { id: deterministicId('bc'), name: cat.name, slug: cat.slug, description: cat.description, color: cat.color, order: cat.order },
    })
  }

  const tags = [
    { name: 'গণিত', slug: 'mathematics' },
    { name: 'ইংরেজি', slug: 'english' },
    { name: 'পদার্থবিজ্ঞান', slug: 'physics' },
    { name: 'রসায়ন', slug: 'chemistry' },
    { name: 'জীববিজ্ঞান', slug: 'biology' },
    { name: 'বাংলা', slug: 'bangla' },
    { name: 'এসএসসি', slug: 'ssc' },
    { name: 'এইচএসসি', slug: 'hsc' },
    { name: 'আইসিটি', slug: 'ict' },
    { name: 'উচ্চতর গণিত', slug: 'higher-math' },
    { name: 'ভর্তি পরীক্ষা', slug: 'admission' },
    { name: 'মেডিকেল', slug: 'medical' },
    { name: 'ইঞ্জিনিয়ারিং', slug: 'engineering' },
    { name: 'বিশ্ববিদ্যালয়', slug: 'university' },
    { name: 'টিপস', slug: 'tips' },
    { name: 'মোটিভেশন', slug: 'motivation' },
    { name: 'পরীক্ষার রুটিন', slug: 'exam-routine' },
    { name: 'বোর্ড পরীক্ষা', slug: 'board-exam' },
    { name: 'সাজেশন', slug: 'suggestion' },
    { name: 'নোট', slug: 'notes' },
    { name: 'ক্যারিয়ার', slug: 'career' },
    { name: 'স্কলারশিপ', slug: 'scholarship' },
    { name: 'সিলেবাস', slug: 'syllabus' },
    { name: 'রিভিশন', slug: 'revision' },
    { name: 'মডেল টেস্ট', slug: 'model-test' },
  ]

  for (const tag of tags) {
    await db.blogTag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name },
      create: { id: deterministicId('btag'), name: tag.name, slug: tag.slug },
    })
  }

  const series = [
    { title: 'এসএসসি প্রস্তুতি সিরিজ', slug: 'ssc-preparation-series', description: 'এসএসসি পরীক্ষার্থীদের জন্য সম্পূর্ণ প্রস্তুতি গাইড', order: 1 },
    { title: 'এইচএসসি প্রস্তুতি সিরিজ', slug: 'hsc-preparation-series', description: 'এইচএসসি পরীক্ষার্থীদের জন্য সম্পূর্ণ প্রস্তুতি গাইড', order: 2 },
    { title: 'বিষয়ভিত্তিক টিউটোরিয়াল', slug: 'subject-tutorial-series', description: 'প্রত্যেক বিষয়ের বিস্তারিত টিউটোরিয়াল', order: 3 },
  ]

  for (const s of series) {
    await db.blogSeries.upsert({
      where: { slug: s.slug },
      update: { title: s.title, description: s.description, order: s.order },
      create: { id: deterministicId('bser'), title: s.title, slug: s.slug, description: s.description, order: s.order },
    })
  }
}
