import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter, BN } from './00-helpers'

export async function seedExams(db: PrismaClient) {
  resetCounter()

  const users = await db.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } })
  const adminUser = users[0]
  const students = await db.user.findMany({ where: { role: 'STUDENT', isVerified: true } })

  const examDefs = [
    { title: 'এসএসসি পদার্থবিজ্ঞান মডেল টেস্ট', classLevel: 'ssc', subjectSlug: 'physics-ssc', type: 'mcq', duration: 30, totalMarks: 30, marksPerMcq: 1 },
    { title: 'এসএসসি রসায়ন মডেল টেস্ট', classLevel: 'ssc', subjectSlug: 'chemistry-ssc', type: 'mcq', duration: 25, totalMarks: 25, marksPerMcq: 1 },
    { title: 'এসএসসি গণিত মডেল টেস্ট', classLevel: 'ssc', subjectSlug: 'mathematics-ssc', type: 'mcq', duration: 30, totalMarks: 25, marksPerMcq: 1 },
    { title: 'এইচএসসি পদার্থবিজ্ঞান মডেল টেস্ট', classLevel: 'hsc', subjectSlug: 'physics-hsc', type: 'mcq', duration: 30, totalMarks: 30, marksPerMcq: 1 },
    { title: 'এইচএসসি রসায়ন মডেল টেস্ট', classLevel: 'hsc', subjectSlug: 'chemistry-hsc', type: 'mcq', duration: 25, totalMarks: 25, marksPerMcq: 1 },
    { title: 'এসএসসি পদার্থবিজ্ঞান সৃজনশীল পরীক্ষা', classLevel: 'ssc', subjectSlug: 'physics-ssc', type: 'cq', duration: 60, totalMarks: 40, marksPerMcq: 0 },
    { title: 'অষ্টম শ্রেণি বিজ্ঞান মডেল টেস্ট', classLevel: 'class-8', subjectSlug: 'science-class-8', type: 'mixed', duration: 40, totalMarks: 30, marksPerMcq: 1 },
    { title: 'এসএসসি বাংলা মডেল টেস্ট', classLevel: 'ssc', subjectSlug: 'bangla-ssc', type: 'mcq', duration: 20, totalMarks: 20, marksPerMcq: 1 },
    { title: 'এসএসসি ইংরেজি মডেল টেস্ট', classLevel: 'ssc', subjectSlug: 'english-ssc', type: 'mcq', duration: 20, totalMarks: 20, marksPerMcq: 1 },
    { title: 'এইচএসসি জীববিজ্ঞান মডেল টেস্ট', classLevel: 'hsc', subjectSlug: 'biology-hsc', type: 'mcq', duration: 25, totalMarks: 25, marksPerMcq: 1 },
  ]

  const createdExams: Array<{ examId: string; classLevel: string; subjectId: string }> = []

  for (const def of examDefs) {
    const subject = await db.subject.findFirst({ where: { slug: def.subjectSlug, deletedAt: null } })
    if (!subject) continue

    const existingExam = await db.exam.findFirst({ where: { title: def.title, deletedAt: null } })
    if (existingExam) {
      createdExams.push({ examId: existingExam.id, classLevel: def.classLevel, subjectId: subject.id })
      continue
    }

    const exam = await db.exam.create({
    data: {
      id: deterministicId('exam'),
      title: def.title,
      description: `${def.title} - ${def.duration} মিনিট, ${def.totalMarks} নম্বর`,
      classLevel: def.classLevel,
      subjectId: subject.id,
      type: def.type,
      duration: def.duration,
      totalMarks: def.totalMarks,
      marksPerMcq: def.marksPerMcq,
      isPremium: false,
      status: 'PUBLISHED',
      startsAt: new Date('2025-01-01'),
      endsAt: new Date('2026-12-31'),
      creatorId: adminUser?.id ?? null,
      instructions: 'সব প্রশ্নের উত্তর দিতে হবে। প্রতিটি প্রশ্নের জন্য ১ নম্বর। কোনো নেতিবাচক মার্কিং নেই।',
      passingPercentage: 40,
    },
  })

    createdExams.push({ examId: exam.id, classLevel: def.classLevel, subjectId: subject.id })

    // Add MCQs to MCQ/mixed exams
    if (def.type === 'mcq' || def.type === 'mixed') {
      const mcqs = await db.mCQ.findMany({
        where: { classLevel: def.classLevel, subjectId: subject.id, deletedAt: null, isActive: true },
        take: def.totalMarks,
        orderBy: { createdAt: 'asc' },
      })
      let qOrder = 1
      for (const mcq of mcqs) {
        await db.examQuestion.create({
    data: {
      id: deterministicId('eq'),
      examId: exam.id,
      questionType: 'mcq',
      questionId: mcq.id,
      order: qOrder,
      marks: 1,
    },
  })
        qOrder++
      }
    }

    // Add CQs to CQ/mixed exams
    if (def.type === 'cq' || def.type === 'mixed') {
      const cqs = await db.cQ.findMany({
        where: { classLevel: def.classLevel, subjectId: subject.id, deletedAt: null, isActive: true },
        take: def.type === 'mixed' ? 2 : 4,
        orderBy: { createdAt: 'asc' },
      })
      let qOrder = 1
      for (const cq of cqs) {
        await db.examQuestion.create({
    data: {
      id: deterministicId('eq'),
      examId: exam.id,
      questionType: 'cq',
      questionId: cq.id,
      order: qOrder,
      marks: 10,
    },
  })
        qOrder++
      }
    }
  }

  // Create exam sessions and results for students
  if (students.length > 0 && createdExams.length > 0) {
    const now = new Date()
    for (let si = 0; si < Math.min(students.length, 5); si++) {
      const student = students[si]
      const examInfo = createdExams[si % createdExams.length]

      // Exam sessions
      for (let e = 0; e < 2; e++) {
        const exam = await db.exam.findUnique({ where: { id: examInfo.examId } })
        if (!exam) continue
        const esId = deterministicId('es')
        await db.examSession.upsert({
          where: { id: esId },
          update: {},
          create: {
            id: esId,
            userId: student.id,
            examId: exam.id,
            expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
            status: e === 0 ? 'SUBMITTED' : 'IN_PROGRESS',
            answers: e === 0 ? '{"q1":"A","q2":"B","q3":"C"}' : '{}',
          },
        })

        if (e === 0) {
          const corrects = 15 + Math.floor(Math.random() * 10)
          await db.examResult.upsert({
          where: { userId_examId_attemptNumber: { userId: student.id, examId: exam.id, attemptNumber: 1 } },
          update: {},
          create: {
      id: deterministicId('er'),
      userId: student.id,
      examId: exam.id,
      attemptNumber: 1,
      score: corrects,
      totalMarks: exam.totalMarks,
      percentage: (corrects / exam.totalMarks) * 100,
      isPassed: (corrects / exam.totalMarks) * 100 >= 40,
      correct: corrects,
      wrong: 25 - corrects,
      skipped: 0,
      timeTaken: 1200 + Math.floor(Math.random() * 600),
      answers: '{"q1":"A","q2":"B","q3":"C"}',
    },
  })
        }
      }
    }
  }
}
