import { db } from '@/lib/db'
import { toDecimal } from '@/lib/decimal'
import { Prisma } from '@prisma/client'

// ============ TYPES ============

export interface CreateExamInput {
  chapterIds: string[]
  questionCount?: number
  duration?: number
  negativeMarks?: number
  marksPerMcq?: number
  title?: string
  freeOnly?: boolean
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED'
}

export interface CreateExamResult {
  examId: string
  hadPremiumFilter: boolean
  hasSubscription: boolean
  classSlug: string
}

export interface SessionStartResult {
  sessionId: string
  examId: string
  startedAt: Date
  expiresAt: Date
  durationMinutes: number
}

export interface SessionState {
  sessionId: string
  examId: string
  userId: string
  startedAt: Date
  expiresAt: Date
  status: string
  currentQuestionIndex: number
  answers: Record<string, string>
  lastActivityAt: Date
}

export interface SubmitResult {
  resultId: string
  examId: string
  attemptNumber: number
  score: number
  totalMarks: number
  percentage: number
  isPassed: boolean | null
  correct: number
  wrong: number
  skipped: number
}

export interface ExamWithQuestions {
  id: string
  title: string
  description: string | null
  type: string
  duration: number
  totalMarks: number
  marksPerMcq: number
  negativeMarks: number
  passingPercentage: number | null
  questions: Array<{
    id: string
    text: string
    options: Array<{ key: string; text: string; image?: string | null }>
    correctAnswer: string
    explanation: string
    marks: number
    order: number
  }>
  totalQuestions: number
}

// ============ EXAM CREATION ============

export async function createCustomExam(
  userId: string,
  input: CreateExamInput
): Promise<CreateExamResult> {
  const { chapterIds, questionCount: requestedCount, duration, negativeMarks, marksPerMcq, title, freeOnly, difficulty } = input

  if (!chapterIds || chapterIds.length === 0) {
    throw new ExamError('অন্তত একটি অধ্যায় নির্বাচন করুন', 400)
  }

  if (chapterIds.length > 20) {
    throw new ExamError('সর্বোচ্চ ২০টি অধ্যায় নির্বাচন করা যাবে', 400)
  }

  // Resolve class slug from first chapter
  const chapter = await db.chapter.findFirst({
    where: { id: chapterIds[0] },
    select: {
      subject: {
        select: {
          class: { select: { slug: true } },
        },
      },
    },
  })
  const classSlug = chapter?.subject?.class?.slug || ''

  // Check subscription
  let hasSubscription = false
  if (classSlug && !freeOnly) {
    const subscription = await db.userSubscription.findFirst({
      where: {
        userId,
        classLevel: classSlug,
        isActive: true,
        endDate: { gte: new Date() },
      },
    })
    hasSubscription = !!subscription
  }

  const maxQuestions = 30

  // Build MCQ query with optional difficulty filter
  const mcqWhere: Prisma.MCQWhereInput = {
    chapterId: { in: chapterIds },
    isActive: true,
  }
  if (!hasSubscription) {
    mcqWhere.isPremium = false
  }
  if (difficulty && difficulty !== 'MIXED') {
    mcqWhere.difficulty = difficulty
  }

  // True random: fetch all matching MCQs, then shuffle in memory
  const allMcqs = await db.mCQ.findMany({
    where: mcqWhere,
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  })

  if (allMcqs.length === 0) {
    throw new ExamError(
      'নির্বাচিত অধ্যায়ে কোনো' + (hasSubscription ? '' : ' ফ্রি') + ' MCQ পাওয়া যায়নি' +
      (difficulty && difficulty !== 'MIXED' ? ' (এই কঠিনতার জন্য)' : ''),
      404
    )
  }

  const userCount = requestedCount ? Math.min(requestedCount, maxQuestions) : maxQuestions
  const questionCount = Math.min(allMcqs.length, userCount)

  // Fisher-Yates shuffle for unbiased randomization
  const shuffled = [...allMcqs]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const selected = shuffled.slice(0, questionCount)

  const examTitle = title || `কাস্টম MCQ পরীক্ষা (${chapterIds.length}টি অধ্যায়)`
  const examDuration = duration || Math.ceil(questionCount / 2)
  const examMarksPerMcq = marksPerMcq ?? 1
  const examNegativeMarks = negativeMarks ?? 0

  const result = await db.exam.create({
    data: {
      title: examTitle,
      type: 'MCQ',
      classLevel: classSlug,
      duration: examDuration,
      marksPerMcq: examMarksPerMcq,
      negativeMarks: examNegativeMarks,
      totalMarks: Math.round(questionCount * examMarksPerMcq),
      isPremium: false,
      price: 0,
      isActive: true,
      status: 'PUBLISHED',
      questions: {
        create: selected.map((mcq, index) => ({
          questionType: 'mcq',
          questionId: mcq.id,
          order: index + 1,
          marks: examMarksPerMcq,
        })),
      },
    },
  })

  return {
    examId: result.id,
    hadPremiumFilter: !hasSubscription,
    hasSubscription,
    classSlug,
  }
}

// ============ SESSION MANAGEMENT ============

export async function startExamSession(
  userId: string,
  examId: string
): Promise<SessionStartResult> {
  // Validate exam exists and is active
  const exam = await db.exam.findUnique({
    where: { id: examId, isActive: true, status: 'PUBLISHED' },
    select: { id: true, duration: true },
  })
  if (!exam) {
    throw new ExamError('পরীক্ষা খুঁজে পাওয়া যায়নি', 404)
  }

  // Check for existing active session
  const existingSession = await db.examSession.findFirst({
    where: {
      userId,
      examId,
      status: 'IN_PROGRESS',
    },
  })

  if (existingSession) {
    // Check if session has expired
    if (new Date() > existingSession.expiresAt) {
      // Mark as expired
      await db.examSession.update({
        where: { id: existingSession.id },
        data: { status: 'EXPIRED' },
      })
    } else {
      // Resume existing session
      return {
        sessionId: existingSession.id,
        examId: existingSession.examId,
        startedAt: existingSession.startedAt,
        expiresAt: existingSession.expiresAt,
        durationMinutes: exam.duration,
      }
    }
  }

  // Create new session
  const now = new Date()
  const expiresAt = new Date(now.getTime() + exam.duration * 60 * 1000)

  const session = await db.examSession.create({
    data: {
      userId,
      examId,
      startedAt: now,
      expiresAt,
      status: 'IN_PROGRESS',
      currentQuestionIndex: 0,
      answers: '{}',
      lastActivityAt: now,
    },
  })

  return {
    sessionId: session.id,
    examId: session.examId,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    durationMinutes: exam.duration,
  }
}

export async function getSessionState(
  userId: string,
  sessionId: string
): Promise<SessionState> {
  const session = await db.examSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) {
    throw new ExamError('সেশন পাওয়া যায়নি', 404)
  }

  // Ownership check
  if (session.userId !== userId) {
    throw new ExamError('এই সেশনে অ্যাক্সেস নেই', 403)
  }

  // Check if expired
  if (session.status === 'IN_PROGRESS' && new Date() > session.expiresAt) {
    await db.examSession.update({
      where: { id: sessionId },
      data: { status: 'EXPIRED' },
    })
    session.status = 'EXPIRED'
  }

  return {
    sessionId: session.id,
    examId: session.examId,
    userId: session.userId,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    status: session.status,
    currentQuestionIndex: session.currentQuestionIndex,
    answers: typeof session.answers === 'string'
      ? JSON.parse(session.answers)
      : session.answers as Record<string, string>,
    lastActivityAt: session.lastActivityAt,
  }
}

export async function updateSessionActivity(
  userId: string,
  sessionId: string,
  updates: {
    currentQuestionIndex?: number
    answers?: Record<string, string>
  }
): Promise<void> {
  const session = await db.examSession.findUnique({
    where: { id: sessionId },
  })

  if (!session) {
    throw new ExamError('সেশন পাওয়া যায়নি', 404)
  }

  if (session.userId !== userId) {
    throw new ExamError('এই সেশনে অ্যাক্সেস নেই', 403)
  }

  if (session.status !== 'IN_PROGRESS') {
    throw new ExamError('সেশন আর সক্রিয় নেই', 400)
  }

  if (new Date() > session.expiresAt) {
    await db.examSession.update({
      where: { id: sessionId },
      data: { status: 'EXPIRED' },
    })
    throw new ExamError('সেশনের সময় শেষ হয়ে গেছে', 400)
  }

  const data: Prisma.ExamSessionUpdateInput = {
    lastActivityAt: new Date(),
  }

  if (updates.currentQuestionIndex !== undefined) {
    data.currentQuestionIndex = updates.currentQuestionIndex
  }
  if (updates.answers !== undefined) {
    data.answers = JSON.stringify(updates.answers)
  }

  await db.examSession.update({
    where: { id: sessionId },
    data,
  })
}

// ============ TIME CALCULATION ============

export function calculateRemainingTime(
  startedAt: Date,
  expiresAt: Date,
  durationMinutes: number
): { remainingSeconds: number; isExpired: boolean; totalSeconds: number } {
  const now = new Date()
  const totalSeconds = durationMinutes * 60
  const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000)
  const remainingSeconds = Math.max(0, totalSeconds - elapsed)
  const isExpired = now > expiresAt

  return { remainingSeconds, isExpired, totalSeconds }
}

// ============ SCORING ============

export async function calculateScore(
  examId: string,
  answers: Record<string, string>
): Promise<{
  score: number
  totalMarks: number
  percentage: number
  correct: number
  wrong: number
  skipped: number
}> {
  // Fetch exam config
  const exam = await db.exam.findUnique({
    where: { id: examId },
    select: { marksPerMcq: true, negativeMarks: true, passingPercentage: true },
  })
  if (!exam) {
    throw new ExamError('পরীক্ষা পাওয়া যায়নি', 404)
  }

  // Fetch exam questions
  const examQuestions = await db.examQuestion.findMany({
    where: { examId, questionType: 'mcq' },
  })

  // Batch-fetch all MCQ correct answers
  const mcqIds = examQuestions.map(eq => eq.questionId)
  const mcqs = mcqIds.length > 0
    ? await db.mCQ.findMany({
        where: { id: { in: mcqIds } },
        select: { id: true, correctAnswer: true },
      })
    : []
  const correctAnswerMap = new Map(mcqs.map(m => [m.id, m.correctAnswer]))

  let correct = 0
  let wrong = 0

  for (const eq of examQuestions) {
    const ua = answers[eq.questionId]
    if (!ua) continue
    if (ua === correctAnswerMap.get(eq.questionId)) correct++
    else wrong++
  }

  const marksPerMcq = toDecimal(exam.marksPerMcq ?? 1)
  const negativeMarks = toDecimal(exam.negativeMarks ?? 0)
  const calculatedScore = correct * marksPerMcq - wrong * negativeMarks
  const totalMarks = examQuestions.length * marksPerMcq
  const score = Math.max(0, calculatedScore)
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0

  return { score, totalMarks, percentage, correct, wrong, skipped: examQuestions.length - correct - wrong }
}

// ============ SUBMISSION ============

export async function submitExam(
  userId: string,
  examId: string,
  sessionId: string,
  clientTimeTaken: number,
  answers: Record<string, string>,
  idempotencyKey?: string
): Promise<SubmitResult> {
  // 1. Validate exam
  const exam = await db.exam.findUnique({
    where: { id: examId, isActive: true, status: 'PUBLISHED' },
    select: {
      id: true,
      duration: true,
      marksPerMcq: true,
      negativeMarks: true,
      passingPercentage: true,
    },
  })
  if (!exam) {
    throw new ExamError('পরীক্ষা পাওয়া যায়নি', 404)
  }

  // 2. Validate session
  const session = await db.examSession.findUnique({
    where: { id: sessionId },
  })
  if (!session) {
    throw new ExamError('সেশন পাওয়া যায়নি', 404)
  }
  if (session.userId !== userId) {
    throw new ExamError('এই সেশনে অ্যাক্সেস নেই', 403)
  }
  if (session.examId !== examId) {
    throw new ExamError('সেশন এই পরীক্ষার সাথে সম্পর্কিত নয়', 403)
  }
  if (session.status !== 'IN_PROGRESS') {
    throw new ExamError('সেশন আর সক্রিয় নেই', 400)
  }

  // 3. Calculate server-side time
  const { remainingSeconds, isExpired, totalSeconds } = calculateRemainingTime(
    session.startedAt,
    session.expiresAt,
    exam.duration
  )
  const serverTimeTaken = Math.max(0, totalSeconds - remainingSeconds)

  // 4. Idempotency check
  if (idempotencyKey) {
    const existingByIdempotency = await db.examResult.findUnique({
      where: { idempotencyKey },
    })
    if (existingByIdempotency) {
      return {
        resultId: existingByIdempotency.id,
        examId: existingByIdempotency.examId,
        attemptNumber: existingByIdempotency.attemptNumber,
        score: existingByIdempotency.score,
        totalMarks: existingByIdempotency.totalMarks,
        percentage: existingByIdempotency.percentage,
        isPassed: existingByIdempotency.isPassed,
        correct: 0,
        wrong: 0,
        skipped: 0,
      }
    }
  }

  // 5. Calculate score server-side
  const scoreResult = await calculateScore(examId, answers)

  // 6. Determine attempt number
  const lastResult = await db.examResult.findFirst({
    where: { userId, examId },
    orderBy: { attemptNumber: 'desc' },
    select: { attemptNumber: true },
  })
  const attemptNumber = (lastResult?.attemptNumber ?? 0) + 1

  // 7. Determine pass/fail
  const isPassed = exam.passingPercentage != null
    ? scoreResult.percentage >= exam.passingPercentage
    : null

  // 8. Create result
  const result = await db.examResult.create({
    data: {
      userId,
      examId,
      attemptNumber,
      score: scoreResult.score,
      totalMarks: scoreResult.totalMarks,
      percentage: scoreResult.percentage,
      isPassed,
      correct: scoreResult.correct,
      wrong: scoreResult.wrong,
      skipped: scoreResult.skipped,
      timeTaken: serverTimeTaken,
      answers: JSON.stringify(answers),
      idempotencyKey: idempotencyKey || undefined,
    },
  })

  // 9. Mark session as submitted
  await db.examSession.update({
    where: { id: sessionId },
    data: { status: 'SUBMITTED' },
  })

  return {
    resultId: result.id,
    examId,
    attemptNumber,
    score: scoreResult.score,
    totalMarks: scoreResult.totalMarks,
    percentage: scoreResult.percentage,
    isPassed,
    correct: scoreResult.correct,
    wrong: scoreResult.wrong,
    skipped: scoreResult.skipped,
  }
}

// ============ EXAM DATA ============

export async function getExamWithQuestions(
  examId: string,
  includeAnswers: boolean,
  userId?: string
): Promise<ExamWithQuestions> {
  const exam = await db.exam.findUnique({
    where: { id: examId, isActive: true },
    include: {
      questions: { orderBy: { order: 'asc' } },
    },
  })

  if (!exam) {
    throw new ExamError('পরীক্ষা খুঁজে পাওয়া যায়নি', 404)
  }

  // Batch-fetch all MCQs
  const mcqIds = exam.questions.filter(eq => eq.questionType === 'mcq').map(eq => eq.questionId)
  const mcqs = mcqIds.length > 0
    ? await db.mCQ.findMany({
        where: { id: { in: mcqIds } },
      })
    : []
  const mcqMap = new Map(mcqs.map(m => [m.id, m]))

  // Premium access check — batch (no N+1)
  const accessiblePremiumMcqIds = new Set<string>()
  if (userId) {
    const premiumMcqs = mcqs.filter(m => m.isPremium)
    if (premiumMcqs.length > 0) {
      const { batchCheckContentAccess } = await import('@/lib/access-control')
      const accessResults = await batchCheckContentAccess({
        userId,
        items: premiumMcqs.map(m => ({ contentType: 'mcq' as const, contentId: m.id })),
      })
      for (const m of premiumMcqs) {
        const result = accessResults.get(m.id)
        if (result?.hasAccess) {
          accessiblePremiumMcqIds.add(m.id)
        }
      }
    }
  }

  const questions = exam.questions
    .filter(eq => eq.questionType === 'mcq')
    .map(eq => {
      const mcq = mcqMap.get(eq.questionId)
      if (!mcq) return null
      if (mcq.isPremium && !exam.isPremium && !accessiblePremiumMcqIds.has(mcq.id)) return null
      return {
        id: mcq.id,
        text: mcq.question,
        options: [
          { key: 'A', text: mcq.optionA, image: mcq.optionAImage },
          { key: 'B', text: mcq.optionB, image: mcq.optionBImage },
          { key: 'C', text: mcq.optionC, image: mcq.optionCImage },
          { key: 'D', text: mcq.optionD, image: mcq.optionDImage },
        ],
        correctAnswer: includeAnswers ? mcq.correctAnswer : '',
        explanation: includeAnswers ? (mcq.explanation || '') : '',
        marks: Number(eq.marks),
        order: eq.order,
      }
    })
    .filter(Boolean) as ExamWithQuestions['questions']

  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    type: exam.type,
    duration: exam.duration,
    totalMarks: exam.totalMarks,
    marksPerMcq: Number(exam.marksPerMcq),
    negativeMarks: Number(exam.negativeMarks),
    passingPercentage: exam.passingPercentage,
    questions,
    totalQuestions: questions.length,
  }
}

// ============ HISTORY ============

export async function getMyExams(
  userId: string,
  page: number,
  limit: number,
  search?: string
) {
  const skip = (page - 1) * limit
  const where: Prisma.ExamWhereInput = {
    creatorId: userId,
  }
  if (search) {
    where.title = { contains: search }
  }

  const [exams, total] = await Promise.all([
    db.exam.findMany({
      where,
      include: {
        _count: { select: { questions: true, results: true } },
        results: {
          select: {
            score: true,
            totalMarks: true,
            percentage: true,
            isPassed: true,
            timeTaken: true,
            completedAt: true,
            attemptNumber: true,
          },
          orderBy: { completedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.exam.count({ where }),
  ])

  return {
    exams: exams.map(exam => {
      const attemptCount = exam.results.length
      const scores = exam.results.map(r =>
        toDecimal(r.totalMarks) > 0 ? (toDecimal(r.score) / toDecimal(r.totalMarks)) * 100 : 0
      )
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0
      const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0
      const lastAttempt = exam.results[0]?.completedAt || null
      const latestResult = exam.results[0] || null

      return {
        id: exam.id,
        title: exam.title,
        classLevel: exam.classLevel,
        duration: exam.duration,
        totalQuestions: exam._count.questions,
        totalMarks: exam.totalMarks,
        passingPercentage: exam.passingPercentage,
        attempts: attemptCount,
        highestScore: Math.round(highestScore),
        averageScore: Math.round(averageScore),
        lastAttempt,
        latestResult,
        status: exam.status,
        createdAt: exam.createdAt,
      }
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ============ USER RESULTS ============

export async function getUserResults(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit

  const [results, total] = await Promise.all([
    db.examResult.findMany({
      where: { userId, deletedAt: null },
      orderBy: { completedAt: 'desc' },
      skip,
      take: limit,
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            duration: true,
            _count: { select: { questions: true } },
          },
        },
      },
    }),
    db.examResult.count({ where: { userId, deletedAt: null } }),
  ])

  return {
    results: results.map((r) => ({
      id: r.id,
      examId: r.examId,
      examTitle: r.exam.title,
      totalQuestions: r.exam._count.questions,
      attemptNumber: r.attemptNumber,
      correct: r.correct,
      wrong: r.wrong,
      skipped: r.skipped,
      score: r.score,
      totalMarks: r.totalMarks,
      percentage: r.percentage,
      isPassed: r.isPassed,
      timeTaken: r.timeTaken,
      completedAt: r.completedAt,
      duration: r.exam.duration,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

// ============ RESULT DETAIL ============

export async function getResultDetail(userId: string, resultId: string, isAdmin: boolean) {
  const result = await db.examResult.findUnique({
    where: { id: resultId },
    include: {
      exam: {
        include: {
          questions: { orderBy: { order: 'asc' } },
        },
      },
    },
  })

  if (!result) {
    throw new ExamError('ফলাফল খুঁজে পাওয়া যায়নি', 404)
  }

  // Ownership check
  if (result.userId !== userId && !isAdmin) {
    throw new ExamError('আপনি শুধুমাত্র নিজের ফলাফল দেখতে পারবেন', 403)
  }

  // Batch-fetch MCQs
  const mcqIds = result.exam.questions
    .filter(eq => eq.questionType === 'mcq')
    .map(eq => eq.questionId)

  const mcqs = mcqIds.length > 0
    ? await db.mCQ.findMany({
        where: { id: { in: mcqIds } },
        select: {
          id: true,
          question: true,
          questionImage: true,
          optionA: true,
          optionAImage: true,
          optionB: true,
          optionBImage: true,
          optionC: true,
          optionCImage: true,
          optionD: true,
          optionDImage: true,
          correctAnswer: true,
          explanation: true,
          explanationImage: true,
          chapterId: true,
          difficulty: true,
        },
      })
    : []

  const mcqMap = new Map(mcqs.map(m => [m.id, m]))
  const answers = (typeof result.answers === 'string'
    ? JSON.parse(result.answers)
    : result.answers) as Record<string, string> || {}

  const questions = result.exam.questions
    .filter(eq => eq.questionType === 'mcq')
    .map(eq => {
      const mcq = mcqMap.get(eq.questionId)
      if (!mcq) return null
      const userAnswer = answers[eq.questionId] || null
      return {
        id: eq.questionId,
        questionText: mcq.question,
        questionImage: mcq.questionImage,
        options: [
          { key: 'A', text: mcq.optionA, image: mcq.optionAImage },
          { key: 'B', text: mcq.optionB, image: mcq.optionBImage },
          { key: 'C', text: mcq.optionC, image: mcq.optionCImage },
          { key: 'D', text: mcq.optionD, image: mcq.optionDImage },
        ],
        correctAnswer: mcq.correctAnswer,
        userAnswer,
        isCorrect: userAnswer === mcq.correctAnswer,
        isSkipped: !userAnswer,
        explanation: mcq.explanation || '',
        explanationImage: mcq.explanationImage,
        order: eq.order,
        marks: eq.marks,
        chapterId: mcq.chapterId,
        difficulty: mcq.difficulty,
      }
    })
    .filter(Boolean)

  return {
    result: {
      id: result.id,
      score: result.score,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      isPassed: result.isPassed,
      timeTaken: result.timeTaken,
      attemptNumber: result.attemptNumber,
      completedAt: result.completedAt,
    },
    exam: {
      id: result.exam.id,
      title: result.exam.title,
      description: result.exam.description,
      duration: result.exam.duration,
      totalMarks: result.exam.totalMarks,
      marksPerMcq: result.exam.marksPerMcq,
      negativeMarks: result.exam.negativeMarks,
      passingPercentage: result.exam.passingPercentage,
    },
    questions,
  }
}

// ============ ANALYTICS ============

export async function getExamAnalytics(userId: string, examId: string) {
  // Verify exam ownership
  const exam = await db.exam.findUnique({
    where: { id: examId, creatorId: userId },
    select: { id: true, title: true },
  })
  if (!exam) {
    throw new ExamError('পরীক্ষা পাওয়া যায়নি', 404)
  }

  // Get all results for this exam by this user
  const results = await db.examResult.findMany({
    where: { userId, examId },
    orderBy: { attemptNumber: 'asc' },
  })

  if (results.length === 0) {
    return {
      examId,
      examTitle: exam.title,
      totalAttempts: 0,
      latestResult: null,
      improvementTrend: [],
      chapterPerformance: [],
      averageScore: 0,
      averageTime: 0,
      bestScore: 0,
      completionRate: 0,
    }
  }

  // Get questions for chapter/difficulty analysis
  const examQuestions = await db.examQuestion.findMany({
    where: { examId, questionType: 'mcq' },
  })
  const mcqIds = examQuestions.map(eq => eq.questionId)
  const mcqs = mcqIds.length > 0
    ? await db.mCQ.findMany({
        where: { id: { in: mcqIds } },
        select: { id: true, correctAnswer: true, chapterId: true, difficulty: true },
      })
    : []

  const mcqMap = new Map(mcqs.map(m => [m.id, m]))

  // Analyze latest result
  const latestResult = results[results.length - 1]
  const latestAnswers = typeof latestResult.answers === 'string'
    ? JSON.parse(latestResult.answers)
    : latestResult.answers as Record<string, string>

  // Chapter performance
  const chapterStats: Record<string, { correct: number; total: number; name: string }> = {}
  for (const eq of examQuestions) {
    const mcq = mcqMap.get(eq.questionId)
    if (!mcq) continue
    const chId = mcq.chapterId
    if (!chapterStats[chId]) {
      const chapter = await db.chapter.findUnique({
        where: { id: chId },
        select: { name: true },
      })
      chapterStats[chId] = { correct: 0, total: 0, name: chapter?.name || chId }
    }
    chapterStats[chId].total++
    if (latestAnswers[eq.questionId] === mcq.correctAnswer) {
      chapterStats[chId].correct++
    }
  }

  const chapterPerformance = Object.entries(chapterStats).map(([id, stats]) => ({
    chapterId: id,
    chapterName: stats.name,
    correct: stats.correct,
    total: stats.total,
    percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }))

  // Weak/strong topics
  const sortedChapters = [...chapterPerformance].sort((a, b) => a.percentage - b.percentage)
  const weakTopics = sortedChapters.filter(c => c.percentage < 50).slice(0, 5)
  const strongTopics = sortedChapters.filter(c => c.percentage >= 70).slice(0, 5)

  // Improvement trend
  const improvementTrend = results.map(r => ({
    attemptNumber: r.attemptNumber,
    score: r.score,
    totalMarks: r.totalMarks,
    percentage: r.percentage,
    isPassed: r.isPassed,
    timeTaken: r.timeTaken,
    completedAt: r.completedAt,
  }))

  // Aggregate stats
  const totalAttempts = results.length
  const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / totalAttempts
  const averageTime = results.reduce((sum, r) => sum + r.timeTaken, 0) / totalAttempts
  const bestScore = Math.max(...results.map(r => r.percentage))

  return {
    examId,
    examTitle: exam.title,
    totalAttempts,
    latestResult: {
      score: latestResult.score,
      totalMarks: latestResult.totalMarks,
      percentage: latestResult.percentage,
      isPassed: latestResult.isPassed,
      attemptNumber: latestResult.attemptNumber,
    },
    improvementTrend,
    chapterPerformance,
    weakTopics,
    strongTopics,
    averageScore: Math.round(averageScore),
    averageTime: Math.round(averageTime),
    bestScore: Math.round(bestScore),
    completionRate: 100,
  }
}

// ============ DELETE EXAM ============

export async function deleteExam(userId: string, examId: string, isAdmin: boolean) {
  const exam = await db.exam.findUnique({
    where: { id: examId },
    select: { id: true, creatorId: true },
  })

  if (!exam) {
    throw new ExamError('পরীক্ষা পাওয়া যায়নি', 404)
  }

  // Ownership check
  if (exam.creatorId !== userId && !isAdmin) {
    throw new ExamError('এই পরীক্ষা মুছতে অনুমতি নেই', 403)
  }

  // Soft delete
  await db.exam.update({
    where: { id: examId },
    data: { isActive: false, status: 'ARCHIVED' },
  })

  return { deleted: true }
}

// ============ ACCESS CHECK ============

export async function checkSubscriptionAccess(userId: string, classSlug: string) {
  const subscription = await db.userSubscription.findFirst({
    where: {
      userId,
      classLevel: classSlug,
      isActive: true,
      endDate: { gte: new Date() },
    },
    include: {
      package: { select: { title: true, durationLabel: true } },
    },
  })

  const packages = await db.contentPackage.findMany({
    where: {
      isActive: true,
      OR: [{ classLevel: classSlug }, { classLevel: null }],
    },
    orderBy: [{ order: 'asc' }, { price: 'asc' }],
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      originalPrice: true,
      duration: true,
      durationLabel: true,
      description: true,
    },
  })

  return {
    hasAccess: !!subscription,
    classSlug,
    subscription: subscription
      ? {
          id: subscription.id,
          packageName: subscription.package.title,
          durationLabel: subscription.package.durationLabel,
          endDate: subscription.endDate,
        }
      : null,
    packages,
  }
}

// ============ ERROR CLASS ============

export class ExamError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'EXAM_ERROR'
  ) {
    super(message)
    this.name = 'ExamError'
  }
}
