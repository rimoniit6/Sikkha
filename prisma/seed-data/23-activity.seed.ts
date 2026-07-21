import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter } from './00-helpers'

export async function seedActivity(db: PrismaClient) {
  resetCounter()

  const students = await db.user.findMany({ where: { role: 'STUDENT', isVerified: true } })
  if (students.length === 0) return

  const lectures = await db.lecture.findMany({ where: { deletedAt: null, isActive: true }, take: 10, orderBy: { createdAt: 'asc' } })
  const mcqs = await db.mCQ.findMany({ where: { deletedAt: null, isActive: true }, take: 10, orderBy: { createdAt: 'asc' } })
  const cqs = await db.cQ.findMany({ where: { deletedAt: null, isActive: true }, take: 5, orderBy: { createdAt: 'asc' } })

  // Progress
  for (let si = 0; si < Math.min(students.length, 4); si++) {
    const student = students[si]
    for (const lec of lectures) {
      await db.progress.upsert({
        where: { userId_contentId_contentType: { userId: student.id, contentId: lec.id, contentType: 'lecture' } },
        update: {},
        create: {
          id: deterministicId('prog'),
          userId: student.id,
          contentId: lec.id,
          contentType: 'lecture',
          progress: 60 + Math.floor(Math.random() * 40),
          lastAccessed: new Date(),
        },
      })
    }
  }

  // Bookmarks
  for (let si = 0; si < Math.min(students.length, 3); si++) {
    const student = students[si]
    const toBookmark = [...mcqs.slice(0, 3), ...lectures.slice(0, 2)]
    for (const item of toBookmark) {
      const contentType = item.hasOwnProperty('question') ? 'mcq' : 'lecture'
      await db.bookmark.upsert({
        where: { userId_contentId_contentType: { userId: student.id, contentId: item.id, contentType } },
        update: {},
        create: { id: deterministicId('bm'), userId: student.id, contentId: item.id, contentType },
      })
    }
  }

  // Notes
  for (let si = 0; si < Math.min(students.length, 3); si++) {
    const student = students[si]
    for (let i = 0; i < 2; i++) {
      const lec = lectures[i]
      if (!lec) continue
      await db.note.upsert({
        where: { userId_contentId_contentType: { userId: student.id, contentId: lec.id, contentType: 'lecture' } },
        update: {},
        create: {
          id: deterministicId('nt'),
          userId: student.id,
          contentId: lec.id,
          contentType: 'lecture',
          content: `এই লেকচার থেকে গুরুত্বপূর্ণ পয়েন্ট:\n১. ${lec.title} এর মূল ধারণা\n২. গুরুত্বপূর্ণ সূত্র ও তত্ত্ব\n৩. পরীক্ষায় আসার মতো প্রশ্ন`,
        },
      })
    }
  }

  // Recently viewed
  const rvPrefixCounter = { val: 0 }
  for (let si = 0; si < Math.min(students.length, 3); si++) {
    const student = students[si]
    for (const lec of lectures.slice(0, 5)) {
      rvPrefixCounter.val++
      await db.recentlyViewed.upsert({
        where: { id: `rv_${rvPrefixCounter.val}` },
        update: {},
        create: {
          id: `rv_${rvPrefixCounter.val}`,
          userId: student.id,
          contentId: lec.id,
          contentType: 'lecture',
          title: lec.title,
          viewedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      })
    }
  }

  // Feedback
  const feedbackSubjects = ['প্ল্যাটফর্মের মান খুব ভালো', 'আরও লেকচার যোগ করার অনুরোধ', 'পেমেন্ট সিস্টেমে সমস্যা']
  for (let fi = 0; fi < Math.min(feedbackSubjects.length, 3); fi++) {
    const student = students[fi]
    const existing = await db.userFeedback.findFirst({ where: { userId: student.id, subject: feedbackSubjects[fi] } })
    if (existing) continue

    const feedback = await db.userFeedback.create({
    data: {
      id: deterministicId('ufb'),
      userId: student.id,
      subject: feedbackSubjects[fi],
      status: fi === 0 ? 'REPLIED' : 'PENDING',
    },
  })

    if (fi === 0) {
      const admin = await db.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } })
      if (admin) {
        await db.feedbackMessage.create({
    data: {
      id: deterministicId('fm'),
      feedbackId: feedback.id,
      senderId: student.id,
      senderRole: 'USER',
      message: 'প্ল্যাটফর্মটি খুবই ভালো। লেকচারগুলো অসাধারণ। আরও গণিতের লেকচার যোগ করুন।',
    },
  })
        await db.feedbackMessage.create({
    data: {
      id: deterministicId('fm'),
      feedbackId: feedback.id,
      senderId: admin.id,
      senderRole: 'ADMIN',
      message: 'আপনার মতামতের জন্য ধন্যবাদ! আমরা খুব শীঘ্রই আরও গণিতের লেকচার যোগ করব।',
    },
  })
      }
    } else {
      await db.feedbackMessage.create({
    data: {
      id: deterministicId('fm'),
      feedbackId: feedback.id,
      senderId: student.id,
      senderRole: 'USER',
      message: fi === 1 ? 'আমি এইচএসসি জীববিজ্ঞানের জন্য আরও লেকচার দেখতে চাই।' : 'বিকাশ পেমেন্টে সমস্যা হচ্ছে। টাকা কেটে নিচ্ছে কিন্তু অ্যাক্সেস পাচ্ছি না।',
    },
  })
    }
  }
}
