import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter } from './00-helpers'

export async function seedContacts(db: PrismaClient) {
  resetCounter()

  const messages = [
    { name: 'মো. রাশেদ মিয়া', email: 'rashed@email.com', message: 'আমি আপনার প্ল্যাটফর্মটি ব্যবহার করে খুবই উপকৃত হয়েছি। লেকচারগুলো অসাধারণ। আরও গণিতের লেকচার যোগ করার অনুরোধ করছি।', isRead: false },
    { name: 'শামীমা আক্তার', email: 'shamima@email.com', message: 'আমার ছেলে আপনার সাইট থেকে পড়ছে। খুবই ভালো বলছে। কিন্তু বিকাশ পেমেন্টে একটু সমস্যা হচ্ছে। হেল্প করলে খুশি হব।', isRead: true },
    { name: 'আব্দুর রহিম', email: 'rahim@email.com', message: 'আমি একজন শিক্ষক। আপনার প্ল্যাটফর্মে আমার কন্টেন্ট অ্যাড করতে চাই। কীভাবে সম্ভব?', isRead: false },
    { name: 'নাজমা বেগম', email: 'najma@email.com', message: 'এসএসসি পরীক্ষার্থীদের জন্য কী কী কন্টেন্ট আছে? দয়া করে বিস্তারিত জানাবেন।', isRead: true },
    { name: 'মো. জাহিদ হাসান', email: 'zahid@email.com', message: 'প্রিমিয়াম প্যাকেজ কিনেছি কিন্তু কিছু লেকচার এখনও লক দেখাচ্ছে। প্লিজ হেল্প করুন।', isRead: false },
  ]

  for (const msg of messages) {
    await db.contactMessage.upsert({
      where: { id: `cm_${msg.email}` },
      update: {},
      create: {
        id: `cm_${msg.email}`,
        name: msg.name,
      email: msg.email,
      message: msg.message,
      isRead: msg.isRead,
    },
  })
  }
}
