import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter } from './00-helpers'

export async function seedNotifications(db: PrismaClient) {
  resetCounter()

  const users = await db.user.findMany({ where: { isVerified: true } })

  const notifications = [
    { title: 'শিক্ষা বাংলায় স্বাগতম!', message: 'তোমার শিক্ষার যাত্রা শুরু হোক। সব কন্টেন্ট এক্সপ্লোর করো।', type: 'INFO' as const },
    { title: 'পরীক্ষার ফলাফল প্রকাশিত', message: 'তোমার এসএসসি পদার্থবিজ্ঞান মডেল টেস্টের ফলাফল প্রকাশিত হয়েছে।', type: 'SUCCESS' as const },
    { title: 'পেমেন্ট অনুমোদিত', message: 'তোমার মাসিক প্যাকেজের পেমেন্ট অনুমোদিত হয়েছে। এখন সব কন্টেন্ট অ্যাক্সেস করতে পারো।', type: 'SUCCESS' as const },
    { title: 'নতুন কন্টেন্ট যোগ হয়েছে', message: 'এসএসসি গণিতের নতুন লেকচার যোগ হয়েছে। এখনই দেখো।', type: 'INFO' as const },
    { title: 'পরীক্ষার সময়সীমা শেষ', message: 'তোমার পরীক্ষার সময়সীমা শেষ হতে চলেছে। দ্রুত উত্তর জমা দাও।', type: 'WARNING' as const },
    { title: 'সাজেশন আপডেট', message: 'এইচএসসি পদার্থবিজ্ঞানের নতুন সাজেশন যোগ হয়েছে।', type: 'INFO' as const },
    { title: 'অ্যাকাউন্ট ভেরিফাইড', message: 'তোমার অ্যাকাউন্ট সফলভাবে ভেরিফাইড হয়েছে।', type: 'SUCCESS' as const },
    { title: 'পেমেন্ট বাতিল', message: 'তোমার রকেট পেমেন্টটি বাতিল হয়েছে। আবার চেষ্টা করো।', type: 'ERROR' as const },
    { title: 'প্রিমিয়াম অ্যাক্সেস একটিভ', message: 'তোমার প্রিমিয়াম অ্যাক্সেস একটিভ হয়েছে। সব কন্টেন্ট উপভোগ করো।', type: 'SUCCESS' as const },
    { title: 'লাইভ ক্লাস শুরু', message: 'আজ রাত ৮টায় এসএসসি পদার্থবিজ্ঞানের লাইভ ক্লাস শুরু হবে।', type: 'INFO' as const },
  ]

  for (const user of users) {
    for (const notif of notifications) {
      const existing = await db.notification.findFirst({
        where: { userId: user.id, title: notif.title, message: notif.message },
      })
      if (existing) continue
      await db.notification.create({
    data: {
      userId: user.id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      isRead: Math.random() > 0.5,
    },
  })
    }
  }
}
