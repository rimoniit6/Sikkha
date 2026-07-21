import type { PrismaClient } from '@prisma/client'
import { CLASSES, SUBJECTS, BOARDS, YEARS, generateChapterNames, generateTopicNames, deterministicId, resetCounter } from './00-helpers'

export async function seedHierarchy(db: PrismaClient) {
  resetCounter()

  // ClassCategory
  for (const cls of CLASSES) {
    await db.classCategory.upsert({
      where: { slug: cls.slug },
      update: { name: cls.name, order: cls.order, icon: cls.icon, color: cls.color, gradient: cls.gradient, isActive: true, deletedAt: null },
      create: { id: deterministicId('cc'), name: cls.name, slug: cls.slug, order: cls.order, icon: cls.icon, color: cls.color, gradient: cls.gradient },
    })
  }

  // Subject
  for (const cls of CLASSES) {
    const classRec = await db.classCategory.findUnique({ where: { slug: cls.slug } })
    if (!classRec) continue
    const subjects = SUBJECTS[cls.slug] || []
    for (const subj of subjects) {
      const subjSlug = `${subj.slug}-${cls.slug}`
      await db.subject.upsert({
        where: { slug_classId: { slug: subjSlug, classId: classRec.id } },
        update: { name: subj.nameBn, order: subj.order, isActive: true, deletedAt: null },
        create: { id: deterministicId('sub'), name: subj.nameBn, slug: subjSlug, classId: classRec.id, order: subj.order },
      })
    }
  }

  // Chapter
  for (const cls of CLASSES) {
    const classRec = await db.classCategory.findUnique({ where: { slug: cls.slug } })
    if (!classRec) continue
    const subjects = SUBJECTS[cls.slug] || []
    for (const subj of subjects) {
      const subjSlug = `${subj.slug}-${cls.slug}`
      const subjRec = await db.subject.findUnique({ where: { slug_classId: { slug: subjSlug, classId: classRec.id } } })
      if (!subjRec) continue
      const chapters = generateChapterNames(subj.slug)
      let order = 1
      for (const chName of chapters) {
        const chSlug = slugifyClass(`${subjSlug}-${slugifyClass(chName)}`)
        await db.chapter.upsert({
          where: { slug_subjectId: { slug: chSlug, subjectId: subjRec.id } },
          update: { name: chName, order, isActive: true, deletedAt: null },
          create: { id: deterministicId('ch'), name: chName, slug: chSlug, subjectId: subjRec.id, order },
        })
        order++
      }
    }
  }

  // Topic
  let allChapters = await db.chapter.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { subjectId: 'asc' } })
  for (const chapter of allChapters) {
    const topics = generateTopicNames(chapter.name, chapter.order)
    let tOrder = 1
    for (const tName of topics) {
      const tSlug = slugifyClass(`${chapter.slug}-${slugifyClass(tName)}`)
      await db.topic.upsert({
        where: { slug_chapterId: { slug: tSlug, chapterId: chapter.id } },
        update: { name: tName, order: tOrder, isActive: true, deletedAt: null },
        create: { id: deterministicId('top'), name: tName, slug: tSlug, chapterId: chapter.id, order: tOrder },
      })
      tOrder++
    }
  }

  // Board
  for (const board of BOARDS) {
    await db.board.upsert({
      where: { slug: board.slug },
      update: { name: board.name, color: board.color, order: board.order, isActive: true, deletedAt: null },
      create: { id: deterministicId('brd'), name: board.name, slug: board.slug, color: board.color, order: board.order },
    })
  }

  // ExamYear
  for (const year of YEARS) {
    const existing = await db.examYear.findUnique({ where: { year } })
    if (existing) {
      await db.examYear.update({ where: { id: existing.id }, data: { isActive: true, deletedAt: null } })
    } else {
      await db.examYear.create({
    data: {
      id: deterministicId('yr'), year, isActive: true
    },
  })
    }
  }

  // BoardYear
  const boards = await db.board.findMany({ where: { isActive: true, deletedAt: null } })
  const years = await db.examYear.findMany({ where: { isActive: true, deletedAt: null } })
  for (const board of boards) {
    for (const year of years) {
      const existing = await db.boardYear.findFirst({ where: { board: board.slug, year: year.year } })
      if (existing) {
        await db.boardYear.update({ where: { id: existing.id }, data: { isActive: true, deletedAt: null } })
      } else {
        await db.boardYear.create({
    data: {
      id: deterministicId('by'), board: board.slug, year: year.year, isActive: true
    },
  })
      }
    }
  }
}

function slugifyClass(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}
