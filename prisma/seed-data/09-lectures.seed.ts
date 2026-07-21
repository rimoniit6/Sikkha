import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter, BN } from './00-helpers'

function generateLectureContent(title: string, subjectName: string, chapterName: string, clsName: string): string {
  return `<h2>${title}</h2>
<p>${subjectName} এর ${chapterName} অধ্যায়ের এই লেকচারে আমরা বিস্তারিত আলোচনা করব। এই অধ্যায়টি ${clsName} শিক্ষার্থীদের জন্য অত্যন্ত গুরুত্বপূর্ণ।</p>
<h3>গুরুত্বপূর্ণ বিষয়সমূহ</h3>
<ul>
<li>এই অধ্যায়ের মূল ধারণাসমূহ</li>
<li>গুরুত্বপূর্ণ সূত্র ও তত্ত্ব</li>
<li>ব্যবহারিক উদাহরণ</li>
<li>পরীক্ষায় আসার মতো প্রশ্ন</li>
</ul>
<p>বোর্ড পরীক্ষায় এই অধ্যায় থেকে <strong>প্রায়ই প্রশ্ন আসে</strong>। শিক্ষার্থীদের এই অধ্যায়টি ভালোভাবে আয়ত্ত করার পরামর্শ দেওয়া হচ্ছে।</p>
<h3>মূল আলোচনা</h3>
<p>প্রথমে আমরা অধ্যায়ের মৌলিক ধারণা সম্পর্কে জানব। এরপর ধাপে ধাপে জটিল বিষয়গুলো সহজভাবে বুঝার চেষ্টা করব। প্রতিটি টপিক শেষে কিছু অনুশীলনী প্রশ্ন দেওয়া আছে যা নিজে নিজে উত্তর দেওয়ার চেষ্টা করবে।</p>
<p>প্রয়োজনে লেকচারটি একাধিকবার দেখতে পারো। ভালোভাবে বুঝতে না পারলে কমেন্ট সেকশনে জানাতে পারো।</p>`
}

export async function seedLectures(db: PrismaClient) {
  resetCounter()

  const chapters = await db.chapter.findMany({
    where: { isActive: true, deletedAt: null },
    include: { subject: true, subject: { include: { class: true } } },
    orderBy: [{ subjectId: 'asc' }, { order: 'asc' }],
  })

  const classMap: Record<string, string> = {
    'class-6': 'ষষ্ঠ শ্রেণি', 'class-7': 'সপ্তম শ্রেণি', 'class-8': 'অষ্টম শ্রেণি',
    'ssc': 'এসএসসি', 'hsc': 'এইচএসসি',
  }

  for (const ch of chapters) {
    const cls = ch.subject.class
    const clsName = classMap[cls.slug] ?? cls.name
    const lecSlug = `lecture-${ch.slug}`
    const title = `${ch.name} - লেকচার`

    const existing = await db.lecture.findFirst({ where: { slug: lecSlug, chapterId: ch.id } })
    if (existing) {
      await db.lecture.update({
        where: { id: existing.id },
        data: { isActive: true, deletedAt: null },
      })
      continue
    }

    const isPremium = ch.order % 5 === 0
    const duration = 20 + (ch.order * 5) % 40

    const lecture = await db.lecture.create({
    data: {
      id: deterministicId('lec'),
      title,
      slug: lecSlug,
      chapterId: ch.id,
      content: generateLectureContent(title, ch.subject.name, ch.name, clsName),
      order: ch.order,
      price: isPremium ? 49 + (ch.order % 10) * 10 : 0,
    },
  })

    await db.resource.create({
    data: {
      id: deterministicId('res'),
      lectureId: lecture.id,
      title: `${ch.name} - পিডিএফ নোট`,
      type: 'pdf',
      url: `/files/notes/${ch.slug}.pdf`,
    },
  })
  }
}
