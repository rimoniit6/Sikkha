import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter } from './00-helpers'

export async function seedContentTypes(db: PrismaClient) {
  resetCounter()

  const types = [
    { key: 'lecture', labelBn: 'লেকচার', labelEn: 'Lecture', icon: 'PlayCircle', color: 'bg-emerald-500', lightColor: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-600 dark:text-emerald-400', route: 'lecture-viewer', paramKey: 'lectureId', buttonLabel: 'লেকচার দেখুন', order: 1 },
    { key: 'mcq', labelBn: 'এমসিকিউ', labelEn: 'MCQ', icon: 'CheckSquare', color: 'bg-blue-500', lightColor: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400', route: 'mcq-practice', paramKey: 'mcqId', buttonLabel: 'এমসিকিউ অনুশীলন', order: 2 },
    { key: 'cq', labelBn: 'সৃজনশীল', labelEn: 'CQ', icon: 'FileText', color: 'bg-purple-500', lightColor: 'bg-purple-50 dark:bg-purple-950/30', textColor: 'text-purple-600 dark:text-purple-400', route: 'cq-viewer', paramKey: 'cqId', buttonLabel: 'সৃজনশীল দেখুন', order: 3 },
    { key: 'board-mcq', labelBn: 'বোর্ড এমসিকিউ', labelEn: 'Board MCQ', icon: 'GraduationCap', color: 'bg-amber-500', lightColor: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400', route: 'board-questions', paramKey: 'id', buttonLabel: 'বোর্ড প্রশ্ন', order: 4 },
    { key: 'board-cq', labelBn: 'বোর্ড সৃজনশীল', labelEn: 'Board CQ', icon: 'BookOpen', color: 'bg-rose-500', lightColor: 'bg-rose-50 dark:bg-rose-950/30', textColor: 'text-rose-600 dark:text-rose-400', route: 'board-questions', paramKey: 'id', buttonLabel: 'বোর্ড সৃজনশীল', order: 5 },
    { key: 'suggestion', labelBn: 'সাজেশন', labelEn: 'Suggestion', icon: 'Lightbulb', color: 'bg-orange-500', lightColor: 'bg-orange-50 dark:bg-orange-950/30', textColor: 'text-orange-600 dark:text-orange-400', route: 'suggestion-viewer', paramKey: 'suggestionId', buttonLabel: 'সাজেশন দেখুন', order: 6 },
    { key: 'exam', labelBn: 'পরীক্ষা', labelEn: 'Exam', icon: 'ClipboardCheck', color: 'bg-red-500', lightColor: 'bg-red-50 dark:bg-red-950/30', textColor: 'text-red-600 dark:text-red-400', route: 'exam-page', paramKey: 'examId', buttonLabel: 'পরীক্ষা দিন', order: 7 },
    { key: 'bundle', labelBn: 'বান্ডেল', labelEn: 'Bundle', icon: 'Package', color: 'bg-pink-500', lightColor: 'bg-pink-50 dark:bg-pink-950/30', textColor: 'text-pink-600 dark:text-pink-400', route: 'bundle-viewer', paramKey: 'bundleId', buttonLabel: 'বান্ডেল দেখুন', order: 8 },
    { key: 'package', labelBn: 'প্যাকেজ', labelEn: 'Package', icon: 'Gift', color: 'bg-indigo-500', lightColor: 'bg-indigo-50 dark:bg-indigo-950/30', textColor: 'text-indigo-600 dark:text-indigo-400', route: 'premium', paramKey: 'slug', buttonLabel: 'প্যাকেজ কিনুন', order: 9 },
    { key: 'mcq-exam-package', labelBn: 'এমসিকিউ প্যাকেজ', labelEn: 'MCQ Package', icon: 'Layers', color: 'bg-cyan-500', lightColor: 'bg-cyan-50 dark:bg-cyan-950/30', textColor: 'text-cyan-600 dark:text-cyan-400', route: 'mcq-packages', paramKey: 'id', buttonLabel: 'প্যাকেজ দেখুন', order: 10 },
    { key: 'cq-exam-package', labelBn: 'সৃজনশীল প্যাকেজ', labelEn: 'CQ Package', icon: 'Layers', color: 'bg-teal-500', lightColor: 'bg-teal-50 dark:bg-teal-950/30', textColor: 'text-teal-600 dark:text-teal-400', route: 'cq-packages', paramKey: 'id', buttonLabel: 'প্যাকেজ দেখুন', order: 11 },
    { key: 'knowledge', labelBn: 'জ্ঞানমূলক', labelEn: 'Knowledge', icon: 'Brain', color: 'bg-violet-500', lightColor: 'bg-violet-50 dark:bg-violet-950/30', textColor: 'text-violet-600 dark:text-violet-400', route: 'knowledge-questions', paramKey: 'chapterId', buttonLabel: 'জ্ঞানমূলক প্রশ্ন', order: 12 },
  ]

  for (const ct of types) {
    await db.contentType.upsert({
      where: { key: ct.key },
      update: { ...ct, showInChapterDetail: true, isActive: true, deletedAt: null },
      create: { id: deterministicId('ct'), ...ct, showInChapterDetail: true },
    })
  }
}
