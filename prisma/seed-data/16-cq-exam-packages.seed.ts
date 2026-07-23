import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter, BN } from './00-helpers'

export async function seedCQExamPackages(db: PrismaClient) {
  resetCounter()

  const classes = await db.classCategory.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { order: 'asc' } })
  const students = await db.user.findMany({ where: { role: 'STUDENT', isVerified: true } })

  for (const cls of classes) {
    const existingCount = await db.cQExamPackage.count({ where: { classId: cls.id } })
    if (existingCount >= 1) continue

    const subjects = await db.subject.findMany({ where: { classId: cls.id, isActive: true, deletedAt: null } })
    if (subjects.length === 0) continue

    const primarySubject = subjects[0]
    const cqs = await db.cQ.findMany({
      where: { classLevel: cls.slug, deletedAt: null, isActive: true },
      take: 6,
      orderBy: { createdAt: 'asc' },
    })
    if (cqs.length < 2) continue

    const pkg = await db.cQExamPackage.create({
    data: {
      id: deterministicId('cep'),
      title: `${cls.name} - সৃজনশীল মডেল টেস্ট`,
      description: `${cls.name} শিক্ষার্থীদের জন্য সৃজনশীল প্রশ্নের মডেল টেস্ট।`,
      classId: cls.id,
      subjectIds: JSON.stringify(subjects.map(s => s.id)),
      price: 149,
      originalPrice: 299,
      thumbnail: null,
      totalSets: 2,
      status: 'PUBLISHED',
      order: cls.order,
    },
  })

    for (let setI = 0; setI < 2; setI++) {
      const set = await db.cQExamSet.create({
    data: {
      id: deterministicId('ces'),
      packageId: pkg.id,
      title: `${cls.name} সৃজনশীল - সেট ${BN(setI + 1)}`,
      scheduledDate: new Date(2025, 0, 15 + setI * 90),
      startTime: '00:00',
      endTime: '23:59',
      duration: 60,
      totalMarks: cqs.length * 10,
      totalQuestions: cqs.length,
      status: 'PUBLISHED',
      order: setI + 1,
      marksPerQ: 10,
      instructions: 'প্রতিটি প্রশ্নের উত্তর নির্দিষ্ট স্থানে লিখ। উত্তর দেওয়ার সময় ৬০ মিনিট।',
      answerMode: 'flexible',
      passMarks: cqs.length * 10 * 0.4,
      enablePartialGrading: true,
    },
  })

      for (let qi = 0; qi < cqs.length; qi++) {
        await db.cQExamSetQuestion.create({
    data: {
      id: deterministicId('cesq'),
      setId: set.id,
      cqId: cqs[qi].id,
      marks: 10,
      order: qi + 1,
    },
  })
      }

      // Create submissions + answers
      if (students.length > 0 && setI === 0) {
        for (let si = 0; si < Math.min(students.length, 2); si++) {
          const student = students[si]
          const submission = await db.cQExamSubmission.create({
            data: {
              id: deterministicId('cesub'),
              userId: student.id,
              setId: set.id,
              totalMarks: cqs.length * 10,
              obtainedMarks: cqs.length * 5 + Math.floor(Math.random() * cqs.length * 3),
              timeTaken: 2400 + Math.floor(Math.random() * 1200),
              status: 'GRADED',
              startedAt: new Date(Date.now() - 3600000),
              submittedAt: new Date(Date.now() - 1800000),
              gradedAt: new Date(),
              gradedBy: (await db.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } }))?.id ?? null,
            },
          })

          for (let qi = 0; qi < cqs.length; qi++) {
            const answer = await db.cQExamAnswer.create({
    data: {
      id: deterministicId('cea'),
      submissionId: submission.id,
      questionId: (await db.cQExamSetQuestion.findFirst({ where: { setId: set.id, order: qi + 1 } }))?.id ?? '',
      subIndex: 0,
      answerText: `উত্তর ${qi + 1}: এটি একটি নমুনা উত্তর। শিক্ষার্থী তার জ্ঞান অনুযায়ী উত্তর দিয়েছে।`,
      obtainedMarks: 5 + Math.floor(Math.random() * 6),
      maxMarks: 10,
      feedback: 'ভালো উত্তর। আরও বিস্তারিত দিতে পারতে।',
      gradedAt: new Date(),
    },
  })

            await db.cQExamAnswerImage.create({
    data: {
      id: deterministicId('ceaimg'),
      answerId: answer.id,
      imageUrl: '/uploads/sample-answer.jpg',
      order: 0,
    },
  })
          }
        }
      }
    }

    // Create purchase
    if (students.length > 1) {
      await db.cQExamPackagePurchase.upsert({
        where: { userId_packageId: { userId: students[1].id, packageId: pkg.id } },
        update: {},
        create: {
          id: deterministicId('cepp'),
          userId: students[1].id,
          packageId: pkg.id,
          paymentId: null,
        },
      })
    }

    // Create retake request
    if (students.length > 0) {
      const firstSet = await db.cQExamSet.findFirst({ where: { packageId: pkg.id }, orderBy: { order: 'asc' } })
      if (firstSet) {
        await db.cQExamRetakeRequest.upsert({
          where: { userId_setId: { userId: students[0].id, setId: firstSet.id } },
          update: {},
          create: {
            id: deterministicId('cerr'),
            userId: students[0].id,
            setId: firstSet.id,
            reason: 'পুনরায় পরীক্ষা দেওয়ার অনুমতি চাই।',
            status: 'PENDING',
          },
        })
      }
    }
  }
}
