import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter, BN } from './00-helpers'

export async function seedMCQExamPackages(db: PrismaClient) {
  resetCounter()

  const classes = await db.classCategory.findMany({ where: { isActive: true, deletedAt: null } })
  const students = await db.user.findMany({ where: { role: 'STUDENT', isVerified: true } })
  const admin = await db.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } })

  for (const cls of classes) {
    const existingCount = await db.mCQExamPackage.count({ where: { classId: cls.id } })
    if (existingCount >= 1) continue

    const subjects = await db.subject.findMany({ where: { classId: cls.id, isActive: true, deletedAt: null } })
    if (subjects.length === 0) continue

    const primarySubject = subjects[0]
    const mcqs = await db.mCQ.findMany({
      where: { classLevel: cls.slug, deletedAt: null, isActive: true },
      take: 15,
      orderBy: { createdAt: 'asc' },
    })
    if (mcqs.length < 5) continue

    const packageTitle = `${cls.name} - এমসিকিউ মডেল টেস্ট`
    const pkg = await db.mCQExamPackage.create({
    data: {
      id: deterministicId('mep'),
      title: packageTitle,
      description: `${cls.name} শিক্ষার্থীদের জন্য এমসিকিউ মডেল টেস্ট। মোট ${Math.min(mcqs.length, 10)} টি প্রশ্ন।`,
      classId: cls.id,
      subjectIds: JSON.stringify(subjects.map(s => s.id)),
      price: cls.slug === 'ssc' || cls.slug === 'hsc' ? 99 : 49,
      originalPrice: cls.slug === 'ssc' || cls.slug === 'hsc' ? 199 : 99,
      thumbnail: null,
      totalSets: 2,
      status: 'PUBLISHED',
      order: cls.order,
    },
  })

    for (let setI = 0; setI < 2; setI++) {
      const set = await db.mCQExamSet.create({
    data: {
      id: deterministicId('mes'),
      packageId: pkg.id,
      title: `${packageTitle} - সেট ${BN(setI + 1)}`,
      scheduledDate: new Date(2025, 0, 1 + setI * 90),
      startTime: '00:00',
      endTime: '23:59',
      duration: 30,
      marksPerQ: 1,
      totalMarks: Math.min(mcqs.length - setI * 5, 10),
      totalQuestions: Math.min(mcqs.length - setI * 5, 10),
      status: 'PUBLISHED',
      order: setI + 1,
    },
  })

      const setMcqs = mcqs.slice(setI * 5, setI * 5 + 10)
      for (let qi = 0; qi < setMcqs.length; qi++) {
        await db.mCQExamSetQuestion.create({
    data: {
      id: deterministicId('mesq'),
      setId: set.id,
      mcqId: setMcqs[qi].id,
      marks: 1,
      order: qi + 1,
    },
  })
      }

      // Create results for some students
      if (students.length > 0) {
        for (let si = 0; si < Math.min(students.length, 3); si++) {
          const student = students[si]
          const corrects = 4 + Math.floor(Math.random() * (setMcqs.length - 4))
          await db.mCQExamSetResult.create({
            data: {
              id: deterministicId('mesr'),
              userId: student.id,
              setId: set.id,
              answers: '{}',
              totalCorrect: corrects,
              totalWrong: setMcqs.length - corrects,
              totalSkipped: 0,
              marksObtained: corrects,
              totalMarks: setMcqs.length,
              timeTaken: 1200 + Math.floor(Math.random() * 600),
              status: 'COMPLETED',
              submittedAt: new Date(),
            },
          })
        }
      }

      // Create retake request
      if (setI === 0 && students.length > 0) {
        await db.mCQExamRetakeRequest.upsert({
          where: { userId_setId: { userId: students[0].id, setId: set.id } },
          update: {},
          create: {
            id: deterministicId('merr'),
            userId: students[0].id,
            setId: set.id,
            reason: 'আমি ভালো করতে পারিনি। আবার দেওয়ার সুযোগ চাই।',
            status: 'PENDING',
          },
        })
      }
    }

    // Create purchase
    if (students.length > 0) {
      await db.mCQExamPackagePurchase.upsert({
        where: { userId_packageId: { userId: students[0].id, packageId: pkg.id } },
        update: {},
        create: {
          id: deterministicId('mepp'),
          userId: students[0].id,
          packageId: pkg.id,
          paymentId: null,
        },
      })
    }
  }
}
