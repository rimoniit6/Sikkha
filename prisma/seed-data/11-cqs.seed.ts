import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter, BN } from './00-helpers'

function generateUddeepok(subjectName: string, chapterName: string): string {
  return `${subjectName} এর ${chapterName} অধ্যায়ের আলোকে নিচের উদ্দীপকটি পড় এবং প্রশ্নগুলোর উত্তর দাও।\n\n${subjectName} একটি গুরুত্বপূর্ণ বিষয়। ${chapterName} অধ্যায়ের বিভিন্ন ধারণা বাস্তব জীবনে প্রয়োগ করা যায়। নিচের উদাহরণটি লক্ষ কর:\n\n"একজন শিক্ষার্থী তার দৈনন্দিন কাজে ${subjectName} এর বিভিন্ন সূত্র ও তত্ত্ব ব্যবহার করে। সে প্রতিদিন নতুন কিছু শেখে এবং তা বাস্তবে প্রয়োগ করে।"`
}

const CQ_ANSWERS = [
  'উদ্দীপকে বর্ণিত ঘটনাটি ${chapterName} অধ্যায়ের মূল ধারণার সাথে সামঞ্জস্যপূর্ণ। কারণ...',
  'উদ্দীপকে উল্লিখিত বিষয়টি ${subjectName} এর একটি গুরুত্বপূর্ণ অংশ। এর বৈশিষ্ট্যসমূহ হলো: প্রথমত, ... দ্বিতীয়ত, ... তৃতীয়ত, ...',
  'উদ্দীপকের আলোকে বলা যায়, ${concept} এর প্রভাব অত্যন্ত গুরুত্বপূর্ণ। এর ফলে শিক্ষার্থী তার জ্ঞানকে বাস্তবে প্রয়োগ করতে পারে।',
  'সবশেষে বলা যায়, ${chapterName} অধ্যায়ের জ্ঞান কাজে লাগিয়ে শিক্ষার্থী তার দৈনন্দিন জীবনকে সহজ ও সুন্দর করতে পারে।'
]

export async function seedCQs(db: PrismaClient) {
  resetCounter()

  const chapters = await db.chapter.findMany({
    where: { isActive: true, deletedAt: null },
    include: { subject: { include: { class: true } } },
    orderBy: [{ subjectId: 'asc' }, { order: 'asc' }],
  })

  for (const ch of chapters) {
    const cls = ch.subject.class
    const subjectName = ch.subject.name
    const chapterName = ch.name
    const clsSlug = cls.slug

    const existingCount = await db.cQ.count({ where: { chapterId: ch.id, deletedAt: null } })
    const target = (clsSlug === 'ssc' || clsSlug === 'hsc') ? 5 : 3
    const toCreate = Math.max(0, target - existingCount)
    if (toCreate === 0) continue

    const uddeepok = generateUddeepok(subjectName, chapterName)

    for (let i = 0; i < toCreate; i++) {
      const isPremium = i >= target - 1 && target > 3

      await db.cQ.create({
    data: {
      id: deterministicId('cq'),
      question1: `ক) ${chapterName} বলতে কী বোঝায়? ব্যাখ্যা কর।`,
      question2: `খ) উদ্দীপকের আলোকে ${subjectName} এর গুরুত্ব ব্যাখ্যা কর।`,
      question3: `গ) ${chapterName} অধ্যায়ের মূল ধারণাগুলো উদ্দীপকের প্রেক্ষিতে বিশ্লেষণ কর।`,
      question4: `ঘ) "${chapterName}" অধ্যায়ের জ্ঞান বাস্তব জীবনে কীভাবে প্রয়োগ করা যায় তা তোমার মতামত দাও।`,
      answer1: `${chapterName} হলো ${subjectName} এর একটি গুরুত্বপূর্ণ অধ্যায়। এই অধ্যায়ে আমরা ${ch.name} সম্পর্কে বিস্তারিত জানতে পারি।`,
      answer2: `${subjectName} এর গুরুত্ব অপরিসীম। উদ্দীপকের আলোকে আমরা দেখতে পাই যে ${chapterName} অধ্যায়ের জ্ঞান দৈনন্দিন জীবনে কীভাবে কাজে লাগে।`,
      answer3: `${chapterName} অধ্যায়ের মূল ধারণাসমূহ হলো: (১) মৌলিক তত্ত্ব, (২) প্রয়োগিক দিক, (৩) বাস্তব উদাহরণ। উদ্দীপকে বর্ণিত শিক্ষার্থী এই ধারণাগুলো কাজে লাগাচ্ছে।`,
      answer4: `${chapterName} অধ্যায়ের জ্ঞান বাস্তব জীবনে বিভিন্নভাবে প্রয়োগ করা যায়। যেমন: সমস্যা সমাধান, সিদ্ধান্ত গ্রহণ, এবং নতুন কিছু উদ্ভাবন।`,
      uddeepok,
      chapterId: ch.id,
      classLevel: clsSlug,
      subjectId: ch.subjectId,
      difficulty: i % 3 === 0 ? 'EASY' : i % 3 === 1 ? 'MEDIUM' : 'HARD',
      price: isPremium ? 20 : 0,
      tags: `${subjectName},${chapterName}`,
    },
  })
    }
  }
}
