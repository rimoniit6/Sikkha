import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter } from './00-helpers'

export async function seedTeachers(db: PrismaClient) {
  resetCounter()

  const teachers = [
    { name: 'প্রফেসর ড. আব্দুল্লাহ আল মামুন', image: null, title: 'অধ্যাপক - পদার্থবিজ্ঞান', institution: 'ঢাকা কলেজ', order: 1 },
    { name: 'মোছা. শামীমা আক্তার', image: null, title: 'সিনিয়র শিক্ষক - গণিত', institution: 'ভিকারুননিসা নুন স্কুল', order: 2 },
    { name: 'মো. রাশেদুল ইসলাম', image: null, title: 'প্রভাষক - রসায়ন', institution: 'নটর ডেম কলেজ', order: 3 },
    { name: 'সানজিদা করিম', image: null, title: 'প্রভাষক - ইংরেজি', institution: 'হলি ক্রস কলেজ', order: 4 },
    { name: 'মো. কামরুল হাসান', image: null, title: 'সিনিয়র শিক্ষক - জীববিজ্ঞান', institution: 'আদমজী ক্যান্টনমেন্ট কলেজ', order: 5 },
    { name: 'নাজনীন সুলতানা', image: null, title: 'প্রভাষক - বাংলা', institution: 'ঢাকা কলেজ', order: 6 },
    { name: 'ইঞ্জি. তৌহিদুর রহমান', image: null, title: 'প্রভাষক - আইসিটি', institution: 'মিলিটারি কলেজ', order: 7 },
    { name: 'মো. আব্দুর রাজ্জাক', image: null, title: 'সিনিয়র শিক্ষক - উচ্চতর গণিত', institution: 'রাজউক উত্তরা মডেল কলেজ', order: 8 },
    { name: 'ড. ফারজানা ইসলাম', image: null, title: 'সহযোগী অধ্যাপক - অর্থনীতি', institution: 'ইডেন কলেজ', order: 9 },
    { name: 'মো. সোহেল রানা', image: null, title: 'মডারেটর - কন্টেন্ট ডেভেলপমেন্ট', institution: 'শিক্ষা বাংলা', order: 10 },
  ]

  for (const t of teachers) {
    const existing = await db.teacherModerator.findFirst({ where: { name: t.name } })
    if (existing) {
      await db.teacherModerator.update({
        where: { id: existing.id },
        data: { title: t.title, institution: t.institution, order: t.order, isActive: true, deletedAt: null },
      })
    } else {
      await db.teacherModerator.create({
    data: {
      id: deterministicId('tchr'),
      name: t.name,
      title: t.title,
      institution: t.institution,
      order: t.order,
    },
  })
    }
  }
}
