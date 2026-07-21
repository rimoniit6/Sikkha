import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter, BN } from './00-helpers'

export async function seedHomepage(db: PrismaClient) {
  resetCounter()

  // Banners
  const banners = [
    { title: 'শিক্ষা বাংলায় স্বাগতম', subtitle: '৬ষ্ঠ থেকে এইচএসসি পর্যন্ত অনলাইন লার্নিং', buttonText: 'বিনামূল্যে শুরু করুন', link: '/register', image: '/banners/hero-banner.jpg', order: 1 },
    { title: 'এসএসসি প্রস্তুতি', subtitle: 'মডেল টেস্ট ও সাজেশন সহ সম্পূর্ণ প্রস্তুতি', buttonText: 'দেখুন', link: '/exams', image: '/banners/ssc-banner.jpg', order: 2 },
    { title: 'প্রিমিয়াম অ্যাক্সেস', subtitle: 'সব লেকচার, এমসিকিউ ও সৃজনশীল প্রশ্ন আনলিমিটেড', buttonText: 'কিনুন', link: '/premium', image: '/banners/premium-banner.jpg', order: 3 },
  ]
  for (const b of banners) {
    const existing = await db.banner.findFirst({ where: { title: b.title } })
    if (existing) {
      await db.banner.update({ where: { id: existing.id }, data: { isActive: true, deletedAt: null } })
    } else {
      await db.banner.create({
    data: {
      id: deterministicId('bnr'), title: b.title, subtitle: b.subtitle, buttonText: b.buttonText, link: b.link, image: b.image, order: b.order
    },
  })
    }
  }

  // FAQs
  const faqs = [
    { question: 'শিক্ষা বাংলা কী?', answer: 'শিক্ষা বাংলা একটি অনলাইন লার্নিং প্ল্যাটফর্ম যেখানে ৬ষ্ঠ থেকে এইচএসসি পর্যন্ত শিক্ষার্থীরা লেকচার, এমসিকিউ, সৃজনশীল প্রশ্ন ও সাজেশন পেতে পারে।', category: 'সাধারণ', order: 1 },
    { question: 'কিভাবে রেজিস্ট্রেশন করব?', answer: 'হোম পেজে "বিনামূল্যে শুরু করুন" বাটনে ক্লিক করে তোমার ইমেইল ও পাসওয়ার্ড দিয়ে রেজিস্ট্রেশন করতে পারো।', category: 'সাধারণ', order: 2 },
    { question: 'পেমেন্ট কিভাবে করব?', answer: 'প্রিমিয়াম কন্টেন্ট কিনতে বিকাশ, নগদ বা রকেটের মাধ্যমে পেমেন্ট করতে পারো। পেমেন্টের স্ক্রিনশট আপলোড করলে অ্যাডমিন যাচাই করে এক্সেস দিয়ে দেবে।', category: 'পেমেন্ট', order: 3 },
    { question: 'প্রিমিয়াম প্যাকেজে কী কী আছে?', answer: 'প্রিমিয়াম প্যাকেজে সব লেকচার, এমসিকিউ, সৃজনশীল প্রশ্ন, সাজেশন ও মডেল টেস্টে আনলিমিটেড অ্যাক্সেস থাকে।', category: 'প্রিমিয়াম', order: 4 },
    { question: 'কোন ক্লাসের জন্য কন্টেন্ট আছে?', answer: '৬ষ্ঠ, ৭ম, ৮ম শ্রেণি, এসএসসি ও এইচএসসি — এই পাঁচটি লেভেলের জন্য সম্পূর্ণ কন্টেন্ট আছে।', category: 'সাধারণ', order: 5 },
    { question: 'এমসিকিউ প্রশ্নের উত্তর কিভাবে দেখব?', answer: 'এমসিকিউ অনুশীলনের পরপরই সঠিক উত্তর ও ব্যাখ্যা দেখতে পারবে।', category: 'কন্টেন্ট', order: 6 },
    { question: 'সাজেশন কি বোর্ড পরীক্ষার জন্য?', answer: 'হ্যাঁ, আমাদের সাজেশন বোর্ড পরীক্ষার সিলেবাস অনুযায়ী তৈরি করা হয়।', category: 'সাজেশন', order: 7 },
    { question: 'টাকা ফেরত নীতি কী?', answer: 'পেমেন্টের পর ৭ দিনের মধ্যে কন্টেন্ট অ্যাক্সেস না করলে টাকা ফেরত পাওয়া যাবে।', category: 'পেমেন্ট', order: 8 },
    { question: 'কিভাবে শিক্ষকদের সাথে যোগাযোগ করব?', answer: 'প্রতিটি লেকচারের নিচে কমেন্ট সেকশনে প্রশ্ন করতে পারো। অথবা সরাসরি ফেসবুক গ্রুপে যোগ দিতে পারো।', category: 'সাধারণ', order: 9 },
    { question: 'মোবাইল অ্যাপ আছে কি?', answer: 'বর্তমানে আমরা শুধুমাত্র ওয়েবসাইট সার্ভিস দিচ্ছি। মোবাইল ব্রাউজার থেকেও সম্পূর্ণ সাইট ব্যবহার করা যায়।', category: 'সাধারণ', order: 10 },
  ]
  for (const faq of faqs) {
    const existing = await db.fAQ.findFirst({ where: { question: faq.question } })
    if (existing) {
      await db.fAQ.update({ where: { id: existing.id }, data: { isActive: true, deletedAt: null } })
    } else {
      await db.fAQ.create({
    data: {
      id: deterministicId('faq'), question: faq.question, answer: faq.answer, category: faq.category, order: faq.order
    },
  })
    }
  }

  // Testimonials
  const testimonials = [
    { name: 'রাহুল আহমেদ', role: 'এসএসসি শিক্ষার্থী', content: 'শিক্ষা বাংলা আমার এসএসসি প্রস্তুতিতে অনেক সাহায্য করেছে। বিশেষ করে এমসিকিউ ও সৃজনশীল প্রশ্নের ব্যাংক অসাধারণ।', rating: 5, order: 1 },
    { name: 'ফাতেমা খাতুন', role: 'এইচএসসি শিক্ষার্থী', content: 'লেকচারগুলো খুবই সহজ ভাষায় বোঝানো হয়েছে। বোর্ড পরীক্ষার আগে সাজেশনগুলো অনেক কাজে দিয়েছে।', rating: 5, order: 2 },
    { name: 'সাকিব হাসান', role: 'এইচএসসি শিক্ষার্থী', content: 'প্রিমিয়াম প্যাকেজ কিনে খুবই উপকৃত হয়েছি। সব কন্টেন্টে আনলিমিটেড অ্যাক্সেস থাকায় যে কোনো সময় পড়তে পারি।', rating: 4, order: 3 },
    { name: 'নুসরাত জাহান', role: 'অষ্টম শ্রেণির শিক্ষার্থী', content: 'বিজ্ঞানের লেকচারগুলো ভিডিওসহ থাকায় খুব সহজে বুঝতে পারি। শিক্ষকরা খুব ভালোভাবে বোঝান।', rating: 5, order: 4 },
    { name: 'তানভীর ইসলাম', role: '৬ষ্ঠ শ্রেণির শিক্ষার্থী', content: 'গণিতের লেকচারগুলো আমার খুব পছন্দ। কঠিন অধ্যায়গুলোও সহজে বুঝতে পারছি।', rating: 5, order: 5 },
    { name: 'আরিফ হোসেন', role: 'এসএসসি প্রার্থী', content: 'মডেল টেস্ট দেওয়ার সুযোগ থাকায় নিজের প্রস্তুতি কতটা ভালো তা যাচাই করতে পারছি।', rating: 4, order: 6 },
    { name: 'সাদিয়া ইসলাম', role: 'একাদশ শ্রেণির শিক্ষার্থী', content: 'বাংলা ও ইংরেজি লেকচারগুলো অসাধারণ। বোর্ড পরীক্ষার জন্য খুবই হেল্পফুল।', rating: 5, order: 7 },
  ]
  for (const t of testimonials) {
    const existing = await db.testimonial.findFirst({ where: { name: t.name } })
    if (existing) {
      await db.testimonial.update({ where: { id: existing.id }, data: { isActive: true, deletedAt: null } })
    } else {
      await db.testimonial.create({
    data: {
      id: deterministicId('tst'), name: t.name, role: t.role, content: t.content, rating: t.rating, order: t.order
    },
  })
    }
  }

  // Notices
  const notices = [
    { title: '২০২৬ সালের এসএসসি পরীক্ষার রুটিন প্রকাশিত', content: '২০২৬ সালের এসএসসি পরীক্ষার রুটিন প্রকাশিত হয়েছে। বিস্তারিত জানতে আমাদের নোটিশ বোর্ড দেখুন।', type: 'TEXT', isPinned: true, order: 1 },
    { title: 'প্রিমিয়াম প্যাকেজে ৫০% ছাড়', content: 'নতুন শিক্ষার্থীদের জন্য প্রিমিয়াম প্যাকেজে ৫০% ছাড় চলছে। সীমিত সময়ের জন্য এই অফার।', type: 'TEXT', isPinned: false, order: 2 },
    { title: 'নতুন কোর্স এসএসসি পদার্থবিজ্ঞান', content: 'এসএসসি পদার্থবিজ্ঞানের সম্পূর্ণ কোর্স যুক্ত হয়েছে। এখনই এনরোল করো।', type: 'TEXT', isPinned: false, order: 3 },
    { title: 'লাইভ ক্লাসের সময়সূচী', content: 'সাপ্তাহিক লাইভ ক্লাসের সময়সূচী প্রকাশিত হয়েছে। প্রতিটি ক্লাসের সময় ও তারিখ জানতে নিচে দেখো।', type: 'TEXT', isPinned: false, order: 4 },
    { title: 'এইচএসসি প্রস্তুতি সিরিজ', content: 'এইচএসসি পরীক্ষার্থীদের জন্য বিশেষ প্রস্তুতি সিরিজ শুরু হয়েছে। প্রতি সপ্তাহে মডেল টেস্ট ও লাইভ রিভিউ।', type: 'TEXT', isPinned: true, order: 5 },
  ]
  for (const n of notices) {
    const existing = await db.notice.findFirst({ where: { title: n.title } })
    if (existing) {
      await db.notice.update({ where: { id: existing.id }, data: { isActive: true, deletedAt: null } })
    } else {
      await db.notice.create({
    data: {
      id: deterministicId('ntc'), title: n.title, content: n.content, type: n.type, isPinned: n.isPinned, order: n.order
    },
  })
    }
  }

  // FeaturedContent — Lectures
  const lectures = await db.lecture.findMany({ where: { isActive: true, deletedAt: null }, take: 3, orderBy: { viewCount: 'desc' } })
  for (let i = 0; i < Math.min(lectures.length, 3); i++) {
    await db.featuredContent.upsert({
      where: { section_contentType_contentId: { section: 'homepage', contentType: 'lecture', contentId: lectures[i].id } },
      update: { order: i + 1, isActive: true, deletedAt: null },
      create: {
        contentType: 'lecture',
        contentId: lectures[i].id,
        title: lectures[i].title,
        section: 'homepage',
        order: i + 1,
      },
    })
  }

  // FeaturedContent — MCQs
  const mcqs = await db.mCQ.findMany({ where: { deletedAt: null, isActive: true }, take: 2, orderBy: { createdAt: 'desc' } })
  for (let i = 0; i < mcqs.length; i++) {
    await db.featuredContent.upsert({
      where: { section_contentType_contentId: { section: 'homepage', contentType: 'mcq', contentId: mcqs[i].id } },
      update: { order: i + 1, isActive: true, deletedAt: null },
      create: {
        contentType: 'mcq',
        contentId: mcqs[i].id,
        title: mcqs[i].question.substring(0, 100),
        section: 'homepage',
        order: i + 4,
      },
    })
  }

  // FeaturedContent — CQs
  const cqs = await db.cQ.findMany({ where: { deletedAt: null, isActive: true }, take: 2, orderBy: { createdAt: 'desc' } })
  for (let i = 0; i < cqs.length; i++) {
    await db.featuredContent.upsert({
      where: { section_contentType_contentId: { section: 'homepage', contentType: 'cq', contentId: cqs[i].id } },
      update: { order: i + 1, isActive: true, deletedAt: null },
      create: {
        contentType: 'cq',
        contentId: cqs[i].id,
        title: cqs[i].question1.substring(0, 100),
        section: 'homepage',
        order: i + 6,
      },
    })
  }

  // FeaturedContent — Bundles
  const bundles2 = await db.contentBundle.findMany({ where: { isActive: true }, take: 2, orderBy: { order: 'asc' } })
  for (let i = 0; i < bundles2.length; i++) {
    await db.featuredContent.upsert({
      where: { section_contentType_contentId: { section: 'homepage', contentType: 'bundle', contentId: bundles2[i].id } },
      update: { order: i + 1, isActive: true, deletedAt: null },
      create: {
        contentType: 'bundle',
        contentId: bundles2[i].id,
        title: bundles2[i].title,
        section: 'homepage',
        order: i + 8,
      },
    })
  }

  // FeaturedContent — Packages
  const packages2 = await db.contentPackage.findMany({ where: { isActive: true }, take: 2, orderBy: { order: 'asc' } })
  for (let i = 0; i < packages2.length; i++) {
    await db.featuredContent.upsert({
      where: { section_contentType_contentId: { section: 'homepage', contentType: 'package', contentId: packages2[i].id } },
      update: { order: i + 1, isActive: true, deletedAt: null },
      create: {
        contentType: 'package',
        contentId: packages2[i].id,
        title: packages2[i].title,
        section: 'homepage',
        order: i + 10,
      },
    })
  }
}
