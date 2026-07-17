import 'dotenv/config'
import { db } from './seed-db'
import { randomBytes } from 'crypto'

// ============================================================================
// COMPREHENSIVE SEED — fills every module with realistic, idempotent data.
// Run with:  npx tsx prisma/seed-comprehensive.ts
// Safe to re-run (checks existing records before creating).
// ============================================================================

const BN = (n: number) => {
  const b = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(n).split('').map((d) => b[+d] || d).join('')
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]+/g, '-').replace(/^-|-$/g, '')

let counters: Record<string, number> = {}
const uniq = (key: string) => {
  counters[key] = (counters[key] || 0) + 1
  return counters[key]
}

async function main() {
  console.log('🌱 Comprehensive seed starting...')

  const classes = await db.classCategory.findMany({ orderBy: { order: 'asc' } })
  const subjects = await db.subject.findMany()
  const chapters = await db.chapter.findMany({ orderBy: { order: 'asc' } })
  const boards = await db.board.findMany()
  const years = await db.examYear.findMany()
  const users = await db.user.findMany({ take: 5 })
  const student = await db.user.findFirst({ where: { role: 'STUDENT' } })
  const admin = await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } }) ||
    await db.user.findFirst({ where: { role: 'ADMIN' } })

  console.log(`   classes=${classes.length} subjects=${subjects.length} chapters=${chapters.length} boards=${boards.length}`)

  // --------------------------------------------------------------------------
  // 1. TOPICS — per chapter
  // --------------------------------------------------------------------------
  let topicCount = 0
  for (const ch of chapters) {
    const existing = await db.topic.count({ where: { chapterId: ch.id } })
    if (existing > 0) continue
    const n = 3
    for (let i = 1; i <= n; i++) {
      await db.topic.create({
        data: {
          name: `${ch.name} - বিষয় ${BN(i)}`,
          slug: `${slugify(ch.slug)}-topic-${i}`,
          chapterId: ch.id,
          order: i,
          description: `${ch.name} এর অধ্যায় ${BN(i)} এর বিষয়বস্তু`,
        },
      })
      topicCount++
    }
  }
  console.log(`✓ Topics: +${topicCount}`)

  // --------------------------------------------------------------------------
  // 2. LECTURES — per chapter (rich HTML), with resources
  // --------------------------------------------------------------------------
  let lectureCount = 0
  for (const ch of chapters) {
    const existing = await db.lecture.count({ where: { chapterId: ch.id } })
    if (existing > 0) continue
    const lec = await db.lecture.create({
      data: {
        title: `${ch.name} - লেকচার`,
        slug: `${slugify(ch.slug)}-lecture`,
        chapterId: ch.id,
        content: `<h2>${ch.name}</h2><p>এই অধ্যায়ের মূল বিষয়বস্তু নিয়ে আলোচনা করা হয়েছে।</p><ul><li>মূল ধারণা</li><li>সমস্যা সমাধান</li><li>পরীক্ষার টিপস</li></ul>`,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: 25 + (ch.order % 20),
        order: 1,
        isPremium: ch.order % 3 === 0,
        viewCount: Math.floor(Math.random() * 500),
      },
    })
    const resExisting = await db.resource.count({ where: { lectureId: lec.id } })
    if (resExisting === 0) {
      await db.resource.create({
        data: { lectureId: lec.id, title: 'নোট (PDF)', type: 'pdf', url: '#', size: '2.5 MB' },
      })
    }
    lectureCount++
  }
  console.log(`✓ Lectures: +${lectureCount}`)

  // --------------------------------------------------------------------------
  // 3. MCQs — ensure every chapter has at least 5 MCQs
  // --------------------------------------------------------------------------
  const classesById = Object.fromEntries(classes.map((c) => [c.id, c]))
  const subjectsById = Object.fromEntries(subjects.map((s) => [s.id, s]))
  let mcqCount = 0
  for (const ch of chapters) {
    const subj = subjectsById[ch.subjectId]
    const cls = subj ? classesById[subj.classId] : null
    const classLevel = cls ? slugify(cls.slug) : 'ssc'
    const have = await db.mCQ.count({ where: { chapterId: ch.id } })
    const need = Math.max(0, 5 - have)
    for (let i = 1; i <= need; i++) {
      const ans = ['A', 'B', 'C', 'D'][i % 4]
      await db.mCQ.create({
        data: {
          question: `${ch.name} সম্পর্কিত প্রশ্ন নং ${BN(i)}?`,
          optionA: `বিকল্প ${BN(1)}`,
          optionB: `বিকল্প ${BN(2)}`,
          optionC: `বিকল্প ${BN(3)}`,
          optionD: `বিকল্প ${BN(4)}`,
          correctAnswer: ans,
          explanation: `সঠিক উত্তর ${ans}। ব্যাখ্যা এখানে দেওয়া হলো।`,
          chapterId: ch.id,
          classLevel,
          subjectId: ch.subjectId,
          board: boards[0]?.slug ?? null,
          year: years[0]?.year ?? null,
          topic: `টপিক ${BN(1)}`,
          difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3],
          isPremium: i % 4 === 0,
          tags: `${ch.name},${subj?.name ?? ''}`,
        },
      })
      mcqCount++
    }
  }
  console.log(`✓ MCQs: +${mcqCount}`)

  // --------------------------------------------------------------------------
  // 4. CQs — ensure every chapter has at least 3 CQs
  // --------------------------------------------------------------------------
  let cqCount = 0
  for (const ch of chapters) {
    const subj = subjectsById[ch.subjectId]
    const cls = subj ? classesById[subj.classId] : null
    const classLevel = cls ? slugify(cls.slug) : 'ssc'
    const have = await db.cQ.count({ where: { chapterId: ch.id } })
    const need = Math.max(0, 3 - have)
    for (let i = 1; i <= need; i++) {
      await db.cQ.create({
        data: {
          uddeepok: `${ch.name} এর উদ্দীপক: এখানে একটি প্যাসেজ থাকবে যা শিক্ষার্থীদের বিশ্লেষণ করতে হবে।`,
          question1: `ক) উদ্দীপকের মূল বিষয় কী?`,
          question2: `খ) ব্যাখ্যা কর।`,
          question3: `গ) সমস্যা নির্ণয় কর।`,
          question4: `ঘ) মতামত দাও।`,
          answer1: `ক) উত্তর ${BN(1)}`,
          answer2: `খ) উত্তর ${BN(2)}`,
          answer3: `গ) উত্তর ${BN(3)}`,
          answer4: `ঘ) উত্তর ${BN(4)}`,
          chapterId: ch.id,
          classLevel,
          subjectId: ch.subjectId,
          board: boards[0]?.slug ?? null,
          year: years[0]?.year ?? null,
          difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3],
          isPremium: i % 3 === 0,
        },
      })
      cqCount++
    }
  }
  console.log(`✓ CQs: +${cqCount}`)

  // --------------------------------------------------------------------------
  // 5. KNOWLEDGE QUESTIONS — per chapter
  // --------------------------------------------------------------------------
  let kqCount = 0
  for (const ch of chapters) {
    const have = await db.knowledgeQuestion.count({ where: { chapterId: ch.id } })
    if (have > 0) continue
    for (const t of ['knowledge', 'comprehension'] as const) {
      await db.knowledgeQuestion.create({
        data: {
          chapterId: ch.id,
          type: t,
          question: `${ch.name} — ${t === 'knowledge' ? 'জ্ঞানমূলক' : 'অনুধাবনমূলক'} প্রশ্ন`,
          answer: `উত্তর: ${ch.name} সম্পর্কিত বিস্তারিত ব্যাখ্যা।`,
          order: t === 'knowledge' ? 1 : 2,
        },
      })
      kqCount++
    }
  }
  console.log(`✓ KnowledgeQuestions: +${kqCount}`)

  // --------------------------------------------------------------------------
  // 6. EXAMS — one MCQ + one CQ + one MIXED exam per subject
  // --------------------------------------------------------------------------
  let examCount = 0
  for (const subj of subjects) {
    const cls = classesById[subj.classId]
    const classLevel = cls ? slugify(cls.slug) : 'ssc'
    for (const type of ['mcq', 'cq', 'mixed'] as const) {
      const title = `${subj.name} - ${type.toUpperCase()} পরীক্ষা`
      const exist = await db.exam.findFirst({ where: { title, classLevel } })
      if (exist) continue
      const exam = await db.exam.create({
        data: {
          title,
          description: `${subj.name} বিষয়ের ${type.toUpperCase()} মডেল পরীক্ষা।`,
          classLevel,
          subjectId: subj.id,
          type,
          duration: type === 'cq' ? 60 : 30,
          totalMarks: type === 'cq' ? 40 : 25,
          marksPerMcq: 1,
          passingPercentage: 40,
          price: 0,
          status: 'PUBLISHED',
          instructions: 'নির্ধারিত সময়ের মধ্যে উত্তর দিন।',
        },
      })
      // attach real questions
      if (type === 'mcq' || type === 'mixed') {
        const mcqs = await db.mCQ.findMany({ where: { subjectId: subj.id }, take: 10 })
        for (let i = 0; i < mcqs.length; i++) {
          await db.examQuestion.create({
            data: { examId: exam.id, questionType: 'mcq', questionId: mcqs[i].id, order: i, marks: 1 },
          })
        }
      }
      if (type === 'cq' || type === 'mixed') {
        const cqs = await db.cQ.findMany({ where: { subjectId: subj.id }, take: 5 })
        for (let i = 0; i < cqs.length; i++) {
          await db.examQuestion.create({
            data: { examId: exam.id, questionType: 'cq', questionId: cqs[i].id, order: i, marks: 8 },
          })
        }
      }
      examCount++
    }
  }
  console.log(`✓ Exams: +${examCount}`)

  // --------------------------------------------------------------------------
  // 7. MCQ EXAM PACKAGES — one published package per class, with sets+questions
  // --------------------------------------------------------------------------
  let pkgCount = 0
  for (const cls of classes) {
    const classLevel = slugify(cls.slug)
    const exist = await db.mCQExamPackage.findFirst({ where: { classId: cls.id, title: { contains: 'মডেল' } } })
    if (exist) continue
    const pkg = await db.mCQExamPackage.create({
      data: {
        title: `${cls.name} MCQ মডেল প্যাকেজ`,
        description: `${cls.name} এর জন্য সম্পূর্ণ MCQ পরীক্ষা প্যাকেজ।`,
        classId: cls.id,
        subjectIds: '[]',
        price: 0,
        isPremium: false,
        status: 'PUBLISHED',
        isActive: true,
        order: 1,
      },
    })
    const mcqs = await db.mCQ.findMany({ where: { classLevel }, take: 30 })
    for (let s = 1; s <= 3; s++) {
      const set = await db.mCQExamSet.create({
        data: {
          packageId: pkg.id,
          title: `${cls.name} সেট ${BN(s)}`,
          scheduledDate: new Date(Date.now() + s * 7 * 86400000),
          startTime: '09:00',
          endTime: '17:00',
          duration: 30,
          marksPerQ: 1,
          totalMarks: 0,
          totalQuestions: 0,
          instructions: 'প্রতি সঠিক উত্তরে ১ নম্বর।',
          allowRetake: false,
          status: 'PUBLISHED',
          order: s,
        },
      })
      const slice = mcqs.slice((s - 1) * 10, s * 10)
      for (let i = 0; i < slice.length; i++) {
        await db.mCQExamSetQuestion.create({
          data: { setId: set.id, mcqId: slice[i].id, marks: 1, order: i },
        })
      }
      const totalQ = slice.length
      await db.mCQExamSet.update({ where: { id: set.id }, data: { totalQuestions: totalQ, totalMarks: totalQ } })
    }
    await db.mCQExamPackage.update({ where: { id: pkg.id }, data: { totalSets: 3 } })
    pkgCount++
  }
  console.log(`✓ MCQExamPackages: +${pkgCount}`)

  // --------------------------------------------------------------------------
  // 8. CQ EXAM PACKAGES — one published package per class, with sets
  // --------------------------------------------------------------------------
  let cqPkgCount = 0
  for (const cls of classes) {
    const classLevel = slugify(cls.slug)
    const exist = await db.cQExamPackage.findFirst({ where: { classId: cls.id, title: { contains: 'মডেল' } } })
    if (exist) continue
    const pkg = await db.cQExamPackage.create({
      data: {
        title: `${cls.name} CQ মডেল প্যাকেজ`,
        description: `${cls.name} এর জন্য সম্পূর্ণ CQ পরীক্ষা প্যাকেজ।`,
        classId: cls.id,
        subjectIds: '[]',
        price: 0,
        isPremium: false,
        status: 'PUBLISHED',
        isActive: true,
        order: 1,
        totalSets: 0,
      },
    })
    const cqs = await db.cQ.findMany({ where: { classLevel }, take: 15 })
    for (let s = 1; s <= 2; s++) {
      const set = await db.cQExamSet.create({
        data: {
          packageId: pkg.id,
          title: `${cls.name} CQ সেট ${BN(s)}`,
          scheduledDate: new Date(Date.now() + s * 7 * 86400000),
          startTime: '10:00',
          endTime: '16:00',
          duration: 60,
          marksPerQ: 8,
          totalMarks: 0,
          totalQuestions: 0,
          instructions: 'প্রতিটি প্রশ্নের পূর্ণ নম্বর ৮।',
          status: 'PUBLISHED',
          allowRetake: false,
          answerMode: 'flexible',
          showAnnotatedImages: true,
          autoPublishResults: false,
          maxImagesPerAnswer: 5,
          passMarks: 0,
          showCorrectAnswers: false,
          enablePartialGrading: true,
          order: s,
        },
      })
      const slice = cqs.slice((s - 1) * 5, s * 5)
      for (let i = 0; i < slice.length; i++) {
        await db.cQExamSetQuestion.create({
          data: { setId: set.id, cqId: slice[i].id, marks: 8, order: i, type: 'cq' },
        })
      }
      const totalQ = slice.length
      await db.cQExamSet.update({ where: { id: set.id }, data: { totalQuestions: totalQ, totalMarks: totalQ * 8 } })
    }
    await db.cQExamPackage.update({ where: { id: pkg.id }, data: { totalSets: 2 } })
    cqPkgCount++
  }
  console.log(`✓ CQExamPackages: +${cqPkgCount}`)

  // --------------------------------------------------------------------------
  // 9. CONTENT PACKAGES (plans) — already some exist; add if <3
  // --------------------------------------------------------------------------
  const pkgTotal = await db.contentPackage.count()
  if (pkgTotal < 3) {
    const plans = [
      { title: 'মাসিক প্যাকেজ', duration: 30, durationLabel: '৩০ দিন', price: 99, originalPrice: 150 },
      { title: '৬ মাসের প্যাকেজ', duration: 180, durationLabel: '৬ মাস', price: 499, originalPrice: 700 },
      { title: 'বার্ষিক প্যাকেজ', duration: 365, durationLabel: '১ বছর', price: 899, originalPrice: 1400 },
    ]
    for (const p of plans) {
      const slug = slugify(p.title)
      const exist = await db.contentPackage.findUnique({ where: { slug } })
      if (exist) continue
      await db.contentPackage.create({
        data: { ...p, slug, description: `${p.title} — সকল কনটেন্ট অ্যাক্সেস।`, isActive: true, order: 1 },
      })
    }
    console.log(`✓ ContentPackages topped up to 3`)
  } else {
    console.log(`✓ ContentPackages already ${pkgTotal}`)
  }

  // --------------------------------------------------------------------------
  // 10. USER SUBSCRIPTIONS — give the student a subscription if none
  // --------------------------------------------------------------------------
  if (student) {
    const pkg0 = await db.contentPackage.findFirst({ where: { isActive: true } })
    if (pkg0) {
      const subExist = await db.userSubscription.findUnique({
        where: { userId_packageId_classLevel: { userId: student.id, packageId: pkg0.id, classLevel: 'ssc' } },
      })
      if (!subExist) {
        const start = new Date()
        const end = new Date(Date.now() + pkg0.duration * 86400000)
        await db.userSubscription.create({
          data: { userId: student.id, packageId: pkg0.id, classLevel: 'ssc', startDate: start, endDate: end, isActive: true },
        })
        console.log(`✓ UserSubscription created for student`)
      }
    }
  }

  // --------------------------------------------------------------------------
  // 11. COURSES — one published course per class with lessons
  // --------------------------------------------------------------------------
  let courseCount = 0
  for (const cls of classes) {
    const classLevel = slugify(cls.slug)
    const exist = await db.course.findFirst({ where: { slug: `course-${cls.slug}` } })
    if (exist) continue
    const course = await db.course.create({
      data: {
        title: `${cls.name} সম্পূর্ণ কোর্স`,
        slug: `course-${cls.slug}`,
        description: `${cls.name} এর বিস্তারিত কোর্স — ভিডিও লেকচার ও লাইভ ক্লাস।`,
        thumbnail: null,
        isPremium: true,
        price: 599,
        originalPrice: 999,
        status: 'PUBLISHED',
        teacherName: 'বিশেষজ্ঞ শিক্ষক',
        features: '<ul><li>ভিডিও লেকচার</li><li>লাইভ ক্লাস</li><li>নোট</li></ul>',
        requirements: '<p>মাধ্যমিক/উচ্চ মাধ্যমিক স্তরের শিক্ষার্থী।</p>',
        targetStudents: '<p>পরীক্ষার্থী。</p>',
        hasCertificate: true,
        duration: 180,
        language: 'bangla',
        difficulty: 'beginner',
        classId: cls.id,
      },
    })
    for (let i = 1; i <= 4; i++) {
      const lessonType = i % 2 === 0 ? 'LIVE' : 'RECORDED'
      await db.courseLesson.create({
        data: {
          courseId: course.id,
          title: `ক্লাস ${BN(i)} — ${cls.name}`,
          description: `এই ক্লাসের বিষয়বস্তু。`,
          lessonType,
          meetingLink: lessonType === 'LIVE' ? 'https://meet.example.com/xyz' : null,
          videoUrl: lessonType === 'RECORDED' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : null,
          duration: lessonType === 'RECORDED' ? 30 : null,
          displayOrder: i,
        },
      })
    }
    courseCount++
  }
  console.log(`✓ Courses: +${courseCount}`)

  // --------------------------------------------------------------------------
  // 12. CERTIFICATES — for enrolled students
  // --------------------------------------------------------------------------
  const enrollments = await db.courseEnrollment.findMany()
  let certCount = 0
  for (const en of enrollments) {
    const existCert = await db.certificate.findUnique({ where: { enrollmentId: en.id } })
    if (existCert) continue
    await db.certificate.create({
      data: {
        userId: en.userId,
        courseId: en.courseId,
        enrollmentId: en.id,
        serial: `CERT-${randomBytes(4).toString('hex').toUpperCase()}`,
      },
    })
    certCount++
  }
  console.log(`✓ Certificates: +${certCount}`)

  // --------------------------------------------------------------------------
  // 13. CONTENT BUNDLES — mixed bundle referencing real content
  // --------------------------------------------------------------------------
  const bundleExist = await db.contentBundle.findFirst({ where: { slug: 'ssc-complete-bundle' } })
  if (!bundleExist) {
    const mcqPkg = await db.mCQExamPackage.findFirst()
    const cqPkg = await db.cQExamPackage.findFirst()
    const course = await db.course.findFirst()
    const bundle = await db.contentBundle.create({
      data: {
        title: 'SSC সম্পূর্ণ বান্ডল',
        slug: 'ssc-complete-bundle',
        description: 'MCQ, CQ ও কোর্স একসাথে。',
        price: 999,
        originalPrice: 1500,
        classLevel: 'ssc',
        type: 'MIXED',
        isActive: true,
        order: 1,
      },
    })
    const items: Array<{ contentType: string; contentId: string }> = []
    if (mcqPkg) items.push({ contentType: 'package', contentId: mcqPkg.id })
    if (cqPkg) items.push({ contentType: 'package', contentId: cqPkg.id })
    if (course) items.push({ contentType: 'course', contentId: course.id })
    for (let i = 0; i < items.length; i++) {
      await db.bundleItem.create({ data: { bundleId: bundle.id, ...items[i], order: i } })
    }
    console.log(`✓ ContentBundle created with ${items.length} items`)
  } else {
    console.log(`✓ ContentBundle already exists`)
  }

  // --------------------------------------------------------------------------
  // 14. FEATURED CONTENT — homepage sections
  // --------------------------------------------------------------------------
  const featLec = await db.lecture.findFirst()
  const featMcq = await db.mCQ.findFirst()
  const featPkg = await db.mCQExamPackage.findFirst()
  const featBundle = await db.contentBundle.findFirst()
  const featItems: Array<{ section: string; contentType: string; contentId: string }> = []
  if (featLec) featItems.push({ section: 'homepage', contentType: 'lecture', contentId: featLec.id })
  if (featMcq) featItems.push({ section: 'homepage', contentType: 'mcq', contentId: featMcq.id })
  if (featPkg) featItems.push({ section: 'homepage', contentType: 'package', contentId: featPkg.id })
  if (featBundle) featItems.push({ section: 'homepage', contentType: 'bundle', contentId: featBundle.id })
  let featCount = 0
  for (const it of featItems) {
    const exist = await db.featuredContent.findUnique({ where: { section_contentType_contentId: { section: it.section, contentType: it.contentType, contentId: it.contentId } } })
    if (exist) continue
    await db.featuredContent.create({ data: { ...it, isActive: true, order: featCount + 1 } })
    featCount++
  }
  console.log(`✓ FeaturedContent: +${featCount}`)

  // --------------------------------------------------------------------------
  // 15. NOTICES / FAQ / TESTIMONIALS / BANNERS / SUGGESTIONS
  // --------------------------------------------------------------------------
  const noticeCount = await db.notice.count()
  if (noticeCount < 5) {
    const notices = [
      { title: 'পরীক্ষার রুটিন প্রকাশিত', content: 'আগামী সপ্তাহ থেকে পরীক্ষা শুরু হবে।', type: 'TEXT', isPinned: true },
      { title: 'নতুন কোর্স চালু', content: 'SSC কম্প্লিট কোর্স এখন উপলব্ধ।', type: 'TEXT', isPinned: false },
      { title: 'সিস্টেম রক্ষণাবেক্ষণ', content: 'রাত ২টা থেকে ৪টা সার্ভার বন্ধ থাকবে।', type: 'TEXT', isPinned: false },
      { title: 'রেজাল্ট প্রকাশ', content: 'MCQ পরীক্ষার ফলাফল প্রকাশিত হয়েছে।', type: 'LINK', linkUrl: '/results', linkLabel: 'ফলাফল দেখুন' },
      { title: 'বৃত্তি তথ্য', content: 'মেধাবৃত্তির আবেদন চলছে।', type: 'PDF', pdfUrl: '#' },
    ]
    for (const n of notices) {
      await db.notice.create({ data: { ...n, isActive: true, order: uniq('notice') } })
    }
    console.log(`✓ Notices topped up`)
  } else console.log(`✓ Notices already ${noticeCount}`)

  const faqCount = await db.fAQ.count()
  if (faqCount < 6) {
    const faqs = [
      { q: 'কিভাবে ভর্তি নেব?', a: 'হোমপেজ থেকে রেজিস্ট্রেশন করুন।', c: 'সাধারণ' },
      { q: 'পেমেন্ট কিভাবে করব?', a: 'বিকাশ/নগদ এর মাধ্যমে পেমেন্ট করুন।', c: 'পেমেন্ট' },
      { q: 'মডেল টেস্ট কী?', a: 'নির্ধারিত সময়ের পরীক্ষা।', c: 'পরীক্ষা' },
      { q: 'রিফান্ড পাব?', a: 'নীতিমালা অনুযায়ী রিফান্ডযোগ্য।', c: 'পেমেন্ট' },
      { q: 'লাইভ ক্লাস কখন?', a: 'সময়সূচি নোটিশে দেওয়া হয়。', c: 'ক্লাস' },
      { q: 'সার্টিফিকেট কীভাবে পাব?', a: 'কোর্স শেষে সার্টিফিকেট দেওয়া হয়。', c: 'কোর্স' },
    ]
    for (const f of faqs) {
      await db.fAQ.create({ data: { question: f.q, answer: f.a, category: f.c, order: uniq('faq'), isActive: true } })
    }
    console.log(`✓ FAQs topped up`)
  } else console.log(`✓ FAQs already ${faqCount}`)

  const testCount = await db.testimonial.count()
  if (testCount < 5) {
    const tests = [
      { name: 'আহমেদ', role: 'SSC ২০২৪', content: 'খুব ভালো প্লাটফর্ম, পরীক্ষায় ভালো করেছি।', rating: 5 },
      { name: 'ফাতিমা', role: 'HSC ২০২৩', content: 'লেকচার গুলো খুব সহায়ক।', rating: 5 },
      { name: 'রহিম', role: 'SSC ২০২৪', content: 'MCQ প্র্যাকটিস করে আত্মবিশ্বাস বাড়লো。', rating: 4 },
      { name: 'সালমা', role: 'HSC ২০২৩', content: 'কোর্সটি খুব গোছানো।', rating: 5 },
      { name: 'করিম', role: 'SSC ২০২২', content: 'দামে সাশ্রয়ী এবং মানসম্মত。', rating: 4 },
    ]
    for (const t of tests) {
      await db.testimonial.create({ data: { ...t, isActive: true, order: uniq('test') } })
    }
    console.log(`✓ Testimonials topped up`)
  } else console.log(`✓ Testimonials already ${testCount}`)

  const bannerCount = await db.banner.count()
  if (bannerCount < 3) {
    const banners = [
      { title: 'SSC পরীক্ষার প্রস্তুতি', subtitle: 'এখনই শুরু করুন', buttonText: 'যোগ দিন', link: '/courses', order: 1 },
      { title: 'মডেল টেস্ট সিরিজ', subtitle: 'ফ্রি রেজিস্ট্রেশন', buttonText: 'দেখুন', link: '/exams', order: 2 },
      { title: 'স্কলারশিপ', subtitle: 'মেধাবৃত্তির সুযোগ', buttonText: 'আবেদন', link: '/scholarship', order: 3 },
    ]
    for (const b of banners) {
      await db.banner.create({ data: { ...b, isActive: true } })
    }
    console.log(`✓ Banners topped up`)
  } else console.log(`✓ Banners already ${bannerCount}`)

  const suggCount = await db.suggestion.count()
  if (suggCount < 3) {
    const suggs = [
      { title: 'সূচনা', content: JSON.stringify([{ type: 'paragraph', content: 'এই অধ্যায়ের সূচনা।' }]), subjectId: subjects[0]?.id },
      { title: 'সারসংক্ষেপ', content: JSON.stringify([{ type: 'paragraph', content: 'গুরুত্বপূর্ণ পয়েন্ট。' }]), subjectId: subjects[1]?.id },
      { title: 'পরীক্ষা টিপস', content: JSON.stringify([{ type: 'paragraph', content: 'পরীক্ষায় কীভাবে লিখবেন。' }]), subjectId: subjects[2]?.id },
    ]
    for (const s of suggs) {
      if (!s.subjectId) continue
      const slug = slugify(s.title) + '-' + uniq('sugg')
      const exist = await db.suggestion.findUnique({ where: { slug } })
      if (exist) continue
      await db.suggestion.create({ data: { ...s, slug, isActive: true, order: uniq('sugg2'), viewCount: 0 } })
    }
    console.log(`✓ Suggestions topped up`)
  } else console.log(`✓ Suggestions already ${suggCount}`)

  // --------------------------------------------------------------------------
  // 16. BOARD-YEARS — cartesian of boards x years
  // --------------------------------------------------------------------------
  let byCount = 0
  for (const b of boards) {
    for (const y of years) {
      const exist = await db.boardYear.findUnique({ where: { board_year: { board: b.slug, year: y.year } } })
      if (exist) continue
      await db.boardYear.create({ data: { board: b.slug, year: y.year, isActive: true } })
      byCount++
    }
  }
  console.log(`✓ BoardYears: +${byCount}`)

  // --------------------------------------------------------------------------
  // 17. ANALYTICS EVENTS — sample events
  // --------------------------------------------------------------------------
  const evCount = await db.analyticsEvent.count()
  if (evCount < 20 && student) {
    const types = ['page_view', 'lecture_view', 'mcq_answer', 'exam_start', 'purchase']
    for (let i = 0; i < 30; i++) {
      await db.analyticsEvent.create({
        data: {
          userId: student.id,
          eventType: types[i % types.length],
          eventName: types[i % types.length],
          entityType: 'content',
          metadata: JSON.stringify({ source: 'seed' }),
          deviceType: 'mobile',
          browser: 'Chrome',
          country: 'Bangladesh',
          createdAt: new Date(Date.now() - i * 3600000),
        },
      })
    }
    console.log(`✓ AnalyticsEvents seeded 30`)
  } else console.log(`✓ AnalyticsEvents already ${evCount}`)

  // --------------------------------------------------------------------------
  // 18. PERMISSIONS + ROLE PERMISSIONS (if empty)
  // --------------------------------------------------------------------------
  const permCount = await db.permission.count()
  if (permCount === 0) {
    const perms = [
      { name: 'content.manage', group: 'content', description: 'Manage content' },
      { name: 'users.manage', group: 'users', description: 'Manage users' },
      { name: 'payment.approve', group: 'payment', description: 'Approve payments' },
      { name: 'system.settings', group: 'system', description: 'System settings' },
    ]
    for (const p of perms) {
      await db.permission.create({ data: p })
    }
    console.log(`✓ Permissions seeded ${perms.length}`)
  } else console.log(`✓ Permissions already ${permCount}`)

  // --------------------------------------------------------------------------
  // 19. NAVIGATION / CONTENT-TYPES / SITE-SETTINGS / FEATURE-FLAGS (top up)
  // --------------------------------------------------------------------------
  const navCount = await db.navigation.count()
  if (navCount < 6) {
    const navs = [
      { label: 'হোম', route: 'home', icon: 'Home', location: 'header', order: 1 },
      { label: 'লেকচার', route: 'lectures', icon: 'PlayCircle', location: 'header', order: 2 },
      { label: 'MCQ', route: 'mcq', icon: 'ListChecks', location: 'header', order: 3 },
      { label: 'CQ', route: 'cq', icon: 'FileText', location: 'header', order: 4 },
      { label: 'পরীক্ষা', route: 'exams', icon: 'GraduationCap', location: 'header', order: 5 },
      { label: 'প্রোফাইল', route: 'profile', icon: 'User', location: 'bottomNav', isAuthOnly: true, order: 1 },
    ]
    for (const n of navs) {
      const exist = await db.navigation.findFirst({ where: { label: n.label, location: n.location } })
      if (exist) continue
      await db.navigation.create({ data: { ...n, isActive: true } })
    }
    console.log(`✓ Navigation topped up`)
  } else console.log(`✓ Navigation already ${navCount}`)

  const ctCount = await db.contentType.count()
  if (ctCount < 6) {
    const cts = [
      { key: 'lecture', labelBn: 'লেকচার', labelEn: 'Lecture', icon: 'PlayCircle', color: 'bg-emerald-500', route: 'lecture-viewer', paramKey: 'lectureId', buttonLabel: 'লেকচার দেখুন', order: 1 },
      { key: 'mcq', labelBn: 'MCQ', labelEn: 'MCQ', icon: 'ListChecks', color: 'bg-sky-500', route: 'mcq-practice', paramKey: 'mcqId', buttonLabel: 'MCQ দেখুন', order: 2 },
      { key: 'cq', labelBn: 'CQ', labelEn: 'CQ', icon: 'FileText', color: 'bg-violet-500', route: 'cq-viewer', paramKey: 'cqId', buttonLabel: 'CQ দেখুন', order: 3 },
      { key: 'exam', labelBn: 'পরীক্ষা', labelEn: 'Exam', icon: 'GraduationCap', color: 'bg-amber-500', route: 'exam', paramKey: 'examId', buttonLabel: 'পরীক্ষা দিন', order: 4 },
      { key: 'suggestion', labelBn: 'সাজেশন', labelEn: 'Suggestion', icon: 'Lightbulb', color: 'bg-rose-500', route: 'suggestion', paramKey: 'suggestionId', buttonLabel: 'সাজেশন দেখুন', order: 5 },
      { key: 'package', labelBn: 'প্যাকেজ', labelEn: 'Package', icon: 'Package', color: 'bg-teal-500', route: 'package', paramKey: 'packageId', buttonLabel: 'প্যাকেজ দেখুন', order: 6 },
    ]
    for (const c of cts) {
      const exist = await db.contentType.findUnique({ where: { key: c.key } })
      if (exist) continue
      await db.contentType.create({ data: { ...c, description: `${c.labelBn} কনটেন্ট`, isActive: true } })
    }
    console.log(`✓ ContentTypes topped up`)
  } else console.log(`✓ ContentTypes already ${ctCount}`)

  const settingCount = await db.siteSetting.count()
  if (settingCount < 5) {
    const settings = [
      { key: 'site_name', value: 'সিক্স', group: 'general', label: 'Site Name' },
      { key: 'site_description', value: 'শিক্ষার সম্পূর্ণ প্লাটফর্ম', group: 'seo', label: 'Site Description' },
      { key: 'contact_email', value: 'support@sikkhs.com', group: 'contact', label: 'Contact Email' },
      { key: 'support_phone', value: '01700000000', group: 'contact', label: 'Support Phone' },
      { key: 'maintenance_mode', value: 'false', group: 'system', label: 'Maintenance Mode' },
    ]
    for (const s of settings) {
      const exist = await db.siteSetting.findUnique({ where: { key: s.key } })
      if (exist) continue
      await db.siteSetting.create({ data: s })
    }
    console.log(`✓ SiteSettings topped up`)
  } else console.log(`✓ SiteSettings already ${settingCount}`)

  // NOTE: No FeatureFlag model exists in schema; feature-flags API uses a different source.
  // Skipping feature-flag seeding to avoid referencing a non-existent table.

  // --------------------------------------------------------------------------
  // 20. COURSE ENROLLMENTS + CERTIFICATES (fill cert module)
  // --------------------------------------------------------------------------
  const coursesAll = await db.course.findMany()
  let enrollCount = 0
  let certCount2 = 0
  for (const course of coursesAll) {
    const students = await db.user.findMany({ where: { role: 'STUDENT' }, take: 3 })
    for (const st of students) {
      const exist = await db.courseEnrollment.findUnique({ where: { userId_courseId: { userId: st.id, courseId: course.id } } })
      if (exist) {
        const c = await db.certificate.findUnique({ where: { enrollmentId: exist.id } })
        if (!c) {
          await db.certificate.create({
            data: { userId: st.id, courseId: course.id, enrollmentId: exist.id, serial: `CERT-${randomBytes(4).toString('hex').toUpperCase()}` },
          })
          certCount2++
        }
        continue
      }
      const en = await db.courseEnrollment.create({
        data: { userId: st.id, courseId: course.id, status: 'ACTIVE', type: 'FREE', completionPercent: 100, completedAt: new Date() },
      })
      enrollCount++
      await db.certificate.create({
        data: { userId: st.id, courseId: course.id, enrollmentId: en.id, serial: `CERT-${randomBytes(4).toString('hex').toUpperCase()}` },
      })
      certCount2++
    }
  }
  console.log(`✓ CourseEnrollments: +${enrollCount}, Certificates: +${certCount2}`)

  console.log('🎉 Comprehensive seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
