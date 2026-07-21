import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter, BN } from './00-helpers'

const MCQ_TEMPLATES: Record<string, Array<{ q: string; opts: string[]; correct: string; explanation?: string }>> = {
  'physics': [
    { q: 'আলোর বেগ কত?', opts: ['৩×১০⁸ m/s', '৩×১০⁶ m/s', '৩×১০⁵ m/s', '৩×১০⁴ m/s'], correct: 'A', explanation: 'আলোর বেগ শূন্য মাধ্যমে ৩×১০⁸ m/s' },
    { q: 'নিউটনের প্রথম সূত্রটি কী নামে পরিচিত?', opts: ['জড়তার সূত্র', 'গতির সূত্র', 'প্রতিক্রিয়ার সূত্র', 'মহাকর্ষের সূত্র'], correct: 'A' },
    { q: 'বলের একক কী?', opts: ['নিউটন', 'জুল', 'ওয়াট', 'প্যাসকেল'], correct: 'A', explanation: 'বলের SI একক নিউটন (N)' },
    { q: 'ঘনত্বের একক কী?', opts: ['kg/m³', 'kg/m²', 'g/cm³', 'kg/L'], correct: 'A' },
    { q: 'পৃথিবীর মহাকর্ষীয় ত্বরণের মান কত?', opts: ['9.8 m/s²', '9.8 m/s', '8.9 m/s²', '10.2 m/s²'], correct: 'A', explanation: 'পৃথিবীর মহাকর্ষীয় ত্বরণ g = 9.8 m/s²' },
    { q: 'চাপের SI একক কী?', opts: ['প্যাসকেল', 'নিউটন', 'বার', 'টর'], correct: 'A' },
    { q: 'শব্দের বেগ সবচেয়ে বেশি কোন মাধ্যমে?', opts: ['কঠিন', 'তরল', 'গ্যাসীয়', 'শূন্য'], correct: 'A' },
    { q: 'তাপমাত্রার SI একক কী?', opts: ['কেলভিন', 'সেলসিয়াস', 'ফারেনহাইট', 'রেওমুর'], correct: 'A' },
    { q: 'বৈদ্যুতিক প্রবাহের একক কী?', opts: ['অ্যাম্পিয়ার', 'ভোল্ট', 'ওহম', 'কুলম্ব'], correct: 'A' },
    { q: 'রোধের SI একক কী?', opts: ['ওহম', 'ভোল্ট', 'অ্যাম্পিয়ার', 'ওয়াট'], correct: 'A' },
    { q: 'পারমাণবিক সংখ্যা দ্বারা কী বোঝায়?', opts: ['প্রোটন সংখ্যা', 'নিউট্রন সংখ্যা', 'ইলেকট্রন সংখ্যা', 'নিউক্লিয়ন সংখ্যা'], correct: 'A' },
    { q: 'একটি বস্তুর ভর ৫ kg। এর ওজন কত?', opts: ['৪৯ N', '৫ N', '৫০ N', '৪.৯ N'], correct: 'A', explanation: 'W = mg = 5 × 9.8 = 49 N' },
    { q: 'নিউক্লিয়ার ফিশন কি?', opts: ['নিউক্লিয়াস বিভাজন', 'নিউক্লিয়াস সংযোজন', 'ইলেকট্রন নির্গমন', 'প্রোটন নির্গমন'], correct: 'A' },
    { q: 'ট্রান্সফরমার কী কাজে ব্যবহৃত হয়?', opts: ['ভোল্টেজ পরিবর্তন', 'কারেন্ট উৎপাদন', 'রোধ পরিমাপ', 'ফ্রিকোয়েন্সি পরিবর্তন'], correct: 'A' },
    { q: 'সরল দোলকের দোলনকাল কীসের উপর নির্ভর করে?', opts: ['দৈর্ঘ্য', 'ভর', 'আয়তন', 'ঘনত্ব'], correct: 'A' },
    { q: 'পানির স্ফুটনাঙ্ক কত?', opts: ['১০০°C', '০°C', '৩৭°C', '২৫°C'], correct: 'A' },
    { q: 'আপেক্ষিক তাপ কাকে বলে?', opts: ['একক ভরের তাপ ধারণ ক্ষমতা', 'তাপমাত্রা বৃদ্ধি', 'তাপের পরিমাণ', 'সুপ্ত তাপ'], correct: 'A' },
    { q: 'শব্দের কম্পাঙ্কের একক কী?', opts: ['হার্টজ', 'ডেসিবেল', 'নিউটন', 'ওয়াট'], correct: 'A' },
    { q: 'চৌম্বক ক্ষেত্রের একক কী?', opts: ['টেসলা', 'গস', 'ওয়েবার', 'হেনরি'], correct: 'A' },
    { q: 'আইনস্টাইনের বিখ্যাত সমীকরণ কোনটি?', opts: ['E=mc²', 'F=ma', 'PV=nRT', 'V=IR'], correct: 'A' },
  ],
  'chemistry': [
    { q: 'পানির রাসায়নিক সংকেত কী?', opts: ['H₂O', 'CO₂', 'NaCl', 'HCl'], correct: 'A' },
    { q: 'মোলার ভর কাকে বলে?', opts: ['এক মোল পদার্থের ভর', 'আণবিক ভর', 'পারমাণবিক ভর', 'সমতুল্য ভর'], correct: 'A' },
    { q: 'pH স্কেলের পরিসর কত?', opts: ['০-১৪', '১-১০', '০-৭', '৭-১৪'], correct: 'A' },
    { q: 'অম্ল ও ক্ষারের বিক্রিয়াকে কী বলে?', opts: ['নিরপেক্ষীকরণ', 'জারণ', 'বিজারণ', 'পরিমাপন'], correct: 'A' },
    { q: 'সবচেয়ে হালকা মৌল কোনটি?', opts: ['হাইড্রোজেন', 'হিলিয়াম', 'লিথিয়াম', 'অক্সিজেন'], correct: 'A' },
    { q: 'জারণ সংখ্যা কী?', opts: ['পরমাণুর আপেক্ষিক চার্জ', 'পরমাণুর ভর', 'ইলেকট্রনের সংখ্যা', 'প্রোটনের সংখ্যা'], correct: 'A' },
    { q: 'জৈব যৌগের মূল উপাদান কী?', opts: ['কার্বন', 'অক্সিজেন', 'হাইড্রোজেন', 'নাইট্রোজেন'], correct: 'A' },
    { q: 'পিরিয়ডিক টেবিলের জনক কে?', opts: ['মেন্ডেলিফ', 'নিউটন', 'আইনস্টাইন', 'বোর'], correct: 'A' },
    { q: 'সবচেয়ে সক্রিয় মৌল কোনটি?', opts: ['ফ্লোরিন', 'ক্লোরিন', 'ব্রোমিন', 'আয়োডিন'], correct: 'A' },
    { q: 'লবণের রাসায়নিক নাম কী?', opts: ['সোডিয়াম ক্লোরাইড', 'সোডিয়াম হাইড্রোক্সাইড', 'ক্যালসিয়াম কার্বনেট', 'সোডিয়াম বাইকার্বনেট'], correct: 'A' },
  ],
  'mathematics': [
    { q: 'পাই (π) এর মান কত?', opts: ['৩.১৪১৬', '২.১৪১৬', '৪.১৪১৬', '৩.১৪১৪'], correct: 'A' },
    { q: 'সেটের উপাদান সংখ্যা বোঝাতে কোন চিহ্ন ব্যবহৃত হয়?', opts: ['n(A)', '|A|', 'A ∪ B', 'A ∩ B'], correct: 'A' },
    { q: 'সরলরেখার সমীকরণ কোনটি?', opts: ['y = mx + c', 'y = ax² + bx + c', 'x² + y² = r²', 'y = aˣ'], correct: 'A' },
    { q: 'লগারিদমের ভিত্তি কত?', opts: ['১০', '২', 'e', '১'], correct: 'A' },
    { q: 'ত্রিভুজের তিন কোণের সমষ্টি কত?', opts: ['১৮০°', '৯০°', '৩৬০°', '২৭০°'], correct: 'A' },
    { q: 'বৃত্তের ক্ষেত্রফলের সূত্র কী?', opts: ['πr²', '২πr', 'πd', 'πr'], correct: 'A' },
    { q: 'গড় নির্ণয়ের সূত্র কী?', opts: ['সমষ্টি / সংখ্যা', 'গুণফল / সংখ্যা', 'বিয়োগফল / সংখ্যা', 'ভাগফল'], correct: 'A' },
    { q: 'মৌলিক সংখ্যা কাকে বলে?', opts: ['১ ও নিজে ছাড়া ভাগ নেই', 'জোড় সংখ্যা', 'বিজোড় সংখ্যা', 'পূর্ণ বর্গ সংখ্যা'], correct: 'A' },
    { q: 'x² - y² এর উৎপাদক কী?', opts: ['(x+y)(x-y)', '(x+y)²', '(x-y)²', 'x(x-y)'], correct: 'A' },
    { q: 'ত্রিকোণমিতির মৌলিক অনুপাত কয়টি?', opts: ['৩টি', '২টি', '৪টি', '৬টি'], correct: 'A' },
  ],
  'biology': [
    { q: 'কোষের আবিষ্কারক কে?', opts: ['রবার্ট হুক', 'লিউয়েনহুক', 'ডারউইন', 'মেন্ডেল'], correct: 'A' },
    { q: 'মানবদেহে কতটি ক্রোমোজোম আছে?', opts: ['৪৬টি', '২৩টি', '৪৮টি', '২৪টি'], correct: 'A' },
    { q: 'সবচেয়ে বড় কোষ কোনটি?', opts: ['উটপাখির ডিম', 'স্নায়ুকোষ', 'পেশিকোষ', 'লোহিত কণিকা'], correct: 'A' },
    { q: 'রক্তের pH কত?', opts: ['৭.৪', '৭.০', '৭.৮', '৬.৮'], correct: 'A' },
    { q: 'উদ্ভিদের খাদ্য প্রস্তুতের প্রক্রিয়াকে কী বলে?', opts: ['সালোকসংশ্লেষণ', 'শ্বসন', 'প্রস্বেদন', 'পরাগায়ন'], correct: 'A' },
    { q: 'ডিএনএর গঠন আবিষ্কার করেন কে?', opts: ['ওয়াটসন ও ক্রিক', 'ডারউইন', 'মেন্ডেল', 'ল্যামার্ক'], correct: 'A' },
    { q: 'মানবহৃদয়ে কয়টি প্রকোষ্ঠ আছে?', opts: ['৪টি', '২টি', '৩টি', '৬টি'], correct: 'A' },
    { q: 'লোহিত রক্তকণিকার আয়ুষ্কাল কত?', opts: ['১২০ দিন', '৬০ দিন', '৯০ দিন', '৩০ দিন'], correct: 'A' },
    { q: 'সবচেয়ে হালকা হাড় কোনটি?', opts: ['স্টেপিজ', 'ফিমার', 'টিবিয়া', 'রেডিয়াস'], correct: 'A' },
    { q: 'উদ্ভিদের মূলের কাজ কী?', opts: ['পানি ও খনিজ শোষণ', 'খাদ্য প্রস্তুত', 'বংশবিস্তার', 'পরিবহন'], correct: 'A' },
  ],
  'bangla': [
    { q: 'বাংলা বর্ণমালায় কয়টি বর্ণ আছে?', opts: ['৫০টি', '৪৪টি', '৫২টি', '৪৮টি'], correct: 'A' },
    { q: 'বাংলা সাহিত্যের প্রথম কাব্য কোনটি?', opts: ['চর্যাপদ', 'শ্রীকৃষ্ণকীর্তন', 'মঙ্গলকাব্য', 'পদাবলী'], correct: 'A' },
    { q: 'আধুনিক বাংলা সাহিত্যের জনক কে?', opts: ['রবীন্দ্রনাথ ঠাকুর', 'বঙ্কিমচন্দ্র', 'মাইকেল মধুসূদন', 'কাজী নজরুল'], correct: 'A' },
    { q: 'বাংলা ভাষার মূল উৎস কী?', opts: ['মাগধী প্রাকৃত', 'সংস্কৃত', 'পালি', 'অর্ধমাগধী'], correct: 'A' },
    { q: 'শব্দের অর্থ অনুযায়ী কয় প্রকার?', opts: ['২ প্রকার', '৩ প্রকার', '৪ প্রকার', '৫ প্রকার'], correct: 'A' },
  ],
  'english': [
    { q: 'How many parts of speech are there?', opts: ['8', '6', '7', '9'], correct: 'A' },
    { q: 'What is the past tense of "go"?', opts: ['went', 'gone', 'going', 'goes'], correct: 'A' },
    { q: 'Which is a conjunction?', opts: ['and', 'he', 'quickly', 'beautiful'], correct: 'A' },
    { q: 'What is a noun?', opts: ['A naming word', 'An action word', 'A describing word', 'A joining word'], correct: 'A' },
    { q: 'What is the synonym of "happy"?', opts: ['joyful', 'sad', 'angry', 'tired'], correct: 'A' },
  ],
  'ict': [
    { q: 'কম্পিউটারের জনক কে?', opts: ['চার্লস ব্যাবেজ', 'বিল গেটস', 'স্টিভ জবস', 'অ্যালান টুরিং'], correct: 'A' },
    { q: 'HTML এর পূর্ণরূপ কী?', opts: ['HyperText Markup Language', 'HighText Machine Language', 'HyperText Markdown Language', 'None'], correct: 'A' },
    { q: 'ডাটাবেসের মৌলিক একক কী?', opts: ['টেবিল', 'কোয়েরি', 'ফর্ম', 'রিপোর্ট'], correct: 'A' },
    { q: 'কোনটি প্রোগ্রামিং ভাষা?', opts: ['পাইথন', 'HTML', 'XML', 'CSS'], correct: 'A' },
    { q: 'ইন্টারনেটের জনক কে?', opts: ['ভিন্টন সার্ফ', 'টিম বার্নার্স-লি', 'বিল গেটস', 'মার্ক জাকারবার্গ'], correct: 'A' },
  ],
}

const DEFAULT_TEMPLATES = [
  { q: 'নিচের কোনটি সঠিক?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
  { q: 'প্রথম অধ্যায়ের মূল ধারণা কী?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
  { q: 'কোন বিকল্পটি সঠিক?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
  { q: 'সবচেয়ে গুরুত্বপূর্ণ বিষয় কোনটি?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
  { q: 'কীভাবে সমাধান করবে?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
  { q: 'উদাহরণ কোনটি?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
  { q: 'এর কারণ কী?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
  { q: 'প্রক্রিয়াটি কয় ধাপে সম্পন্ন হয়?', opts: ['২ ধাপে', '৩ ধাপে', '৪ ধাপে', '৫ ধাপে'], correct: 'A' },
  { q: 'প্রধান বৈশিষ্ট্য কোনটি?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
  { q: 'সঠিক সংজ্ঞা কোনটি?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
  { q: 'পার্থক্য কী?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
  { q: 'প্রয়োগক্ষেত্র কী?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
  { q: 'সূত্রটি কী?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
  { q: 'সংক্ষেপে ব্যাখ্যা কর?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
  { q: 'উদাহরণ দিয়ে ব্যাখ্যা কর?', opts: ['ক', 'খ', 'গ', 'ঘ'], correct: 'A' },
]

const DIFFICULTIES = ['EASY', 'MEDIUM', 'MEDIUM', 'MEDIUM', 'HARD'] as const

export async function seedMCQs(db: PrismaClient) {
  resetCounter()

  const chapters = await db.chapter.findMany({
    where: { isActive: true, deletedAt: null },
    include: { subject: { include: { class: true } } },
    orderBy: [{ subjectId: 'asc' }, { order: 'asc' }],
  })

  for (const ch of chapters) {
    const subjSlug = ch.subject.slug.replace(`-${ch.subject.class.slug}`, '')
    const templates = MCQ_TEMPLATES[subjSlug] ?? DEFAULT_TEMPLATES
    const clsSlug = ch.subject.class.slug

    const existingCount = await db.mCQ.count({ where: { chapterId: ch.id, deletedAt: null } })
    const targetPerChapter = subjSlug === 'physics' || subjSlug === 'mathematics' || subjSlug === 'chemistry' || subjSlug === 'biology'
      ? 20 : (subjSlug === 'bangla' || subjSlug === 'english' ? 10 : 8)

    const toCreate = Math.max(0, targetPerChapter - existingCount)
    if (toCreate === 0) continue

    for (let i = 0; i < toCreate; i++) {
      const template = templates[i % templates.length]
      const difficulty = DIFFICULTIES[i % DIFFICULTIES.length]
      const isPremium = i >= targetPerChapter - 2 && targetPerChapter > 5

      await db.mCQ.create({
    data: {
      id: deterministicId('mcq'),
      question: template.q,
      optionA: template.opts[0],
      optionB: template.opts[1],
      optionC: template.opts[2],
      optionD: template.opts[3],
      correctAnswer: template.correct,
      explanation: template.explanation ?? null,
      chapterId: ch.id,
      classLevel: clsSlug,
      subjectId: ch.subjectId,
      price: isPremium ? 10 : 0,
      tags: `${subjSlug},${clsSlug}`,
    },
  })
    }
  }
}
