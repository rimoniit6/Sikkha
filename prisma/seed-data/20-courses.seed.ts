import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter, BN, CLASSES } from './00-helpers'

export async function seedCourses(db: PrismaClient) {
  resetCounter()

  const coursesData = [
    { title: 'এসএসসি পদার্থবিজ্ঞান মাস্টারকোর্স', slug: 'ssc-physics-mastercourse', classSlug: 'ssc', subjectSlug: 'physics-ssc', price: 499, originalPrice: 999, teacherName: 'প্রফেসর ড. আব্দুল্লাহ আল মামুন', hasCertificate: true, duration: 90, difficulty: 'intermediate' },
    { title: 'এসএসসি গণিত বুটক্যাম্প', slug: 'ssc-math-bootcamp', classSlug: 'ssc', subjectSlug: 'mathematics-ssc', price: 399, originalPrice: 799, teacherName: 'মোছা. শামীমা আক্তার', hasCertificate: true, duration: 60, difficulty: 'beginner' },
    { title: 'এইচএসসি রসায়ন কোর্স', slug: 'hsc-chemistry-course', classSlug: 'hsc', subjectSlug: 'chemistry-hsc', price: 599, originalPrice: 1199, teacherName: 'মো. রাশেদুল ইসলাম', hasCertificate: true, duration: 120, difficulty: 'advanced' },
    { title: 'এইচএসসি ইংরেজি গ্রামার কোর্স', slug: 'hsc-english-grammar', classSlug: 'hsc', subjectSlug: 'english-hsc', price: 299, originalPrice: 599, teacherName: 'সানজিদা করিম', hasCertificate: false, duration: 45, difficulty: 'beginner' },
    { title: 'এসএসসি জীববিজ্ঞান কোর্স', slug: 'ssc-biology-course', classSlug: 'ssc', subjectSlug: 'biology-ssc', price: 449, originalPrice: 899, teacherName: 'মো. কামরুল হাসান', hasCertificate: true, duration: 75, difficulty: 'intermediate' },
  ]

  const students = await db.user.findMany({ where: { role: 'STUDENT', isVerified: true } })

  for (const cd of coursesData) {
    const classRec = await db.classCategory.findUnique({ where: { slug: cd.classSlug } })
    if (!classRec) continue
    const subject = await db.subject.findFirst({ where: { slug: cd.subjectSlug } })
    if (!subject) continue

    const existing = await db.course.findUnique({ where: { slug: cd.slug } })
    if (existing) {
      await db.course.update({ where: { id: existing.id }, data: { status: 'PUBLISHED', deletedAt: null } })
      continue
    }

    const course = await db.course.create({
    data: {
      id: deterministicId('crs'),
      title: cd.title,
      slug: cd.slug,
      description: `${cd.title} - ${cd.duration} দিনের সম্পূর্ণ কোর্স। ${cd.difficulty === 'beginner' ? 'শিক্ষানবিশ থেকে শুরু করতে পারেন।' : cd.difficulty === 'intermediate' ? 'মাধ্যমিক স্তরের শিক্ষার্থীদের জন্য।' : 'উন্নত স্তরের শিক্ষার্থীদের জন্য।'}`,
      isPremium: true,
      price: cd.price,
      originalPrice: cd.originalPrice,
      status: 'PUBLISHED',
      teacherName: cd.teacherName,
      features: '<ul><li>ভিডিও লেকচার</li><li>পিডিএফ নোট</li><li>মডেল টেস্ট</li><li>সার্টিফিকেট</li></ul>',
      hasCertificate: cd.hasCertificate,
      duration: cd.duration,
      difficulty: cd.difficulty,
      language: 'bangla',
      classId: classRec.id,
      subjectId: subject.id,
    },
  })

    // Create lessons
    const chapters = await db.chapter.findMany({
      where: { subjectId: subject.id, isActive: true, deletedAt: null },
      orderBy: { order: 'asc' },
      take: 6,
    })

    for (let li = 0; li < chapters.length; li++) {
      const ch = chapters[li]
      const lesson = await db.courseLesson.create({
    data: {
      id: deterministicId('clsn'),
      courseId: course.id,
      title: `${ch.name} - লেসন ${BN(li + 1)}`,
      description: `${ch.name} অধ্যায়ের বিস্তারিত আলোচনা`,
      lessonType: 'RECORDED',
      videoUrl: null,
      previewVideo: null,
      duration: 30 + li * 10,
      displayOrder: li + 1,
    },
  })

      // Lesson notes
      await db.lessonNote.create({
    data: {
      id: deterministicId('ln'),
      lessonId: lesson.id,
      title: `${ch.name} - নোট`,
      type: 'richtext',
      content: `<h3>${ch.name} - গুরুত্বপূর্ণ নোট</h3><p>এই লেসনের মূল বিষয়সমূহ:</p><ul><li>মূল ধারণা</li><li>গুরুত্বপূর্ণ সূত্র</li><li>উদাহরণ</li></ul>`,
      displayOrder: 1,
    },
  })

      // Lesson resources
      await db.lessonResource.create({
    data: {
      id: deterministicId('lr'),
      lessonId: lesson.id,
      title: `${ch.name} - রিসোর্স`,
      type: 'file',
      fileUrl: `/files/courses/${cd.slug}/lesson-${li + 1}.pdf`,
      displayOrder: 1,
    },
  })

      // Lesson schedule
      await db.lessonSchedule.upsert({
        where: { lessonId: lesson.id },
        update: {},
        create: {
          id: deterministicId('ls'),
          lessonId: lesson.id,
          date: new Date(2025, 0, 1 + li * 7),
          startTime: `${10 + li % 8}:00`,
          endTime: `${11 + li % 8}:00`,
        },
      })

      // Assignments
      if (li < 4) {
        const assignment = await db.lessonAssignment.create({
    data: {
      id: deterministicId('la'),
      lessonId: lesson.id,
      title: `${ch.name} - এসাইনমেন্ট`,
      description: `এই অধ্যায়ের উপর নির্ধারিত এসাইনমেন্ট জমা দাও।`,
      deadline: new Date(2025, 0, 15 + li * 7),
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

        // Submissions for first assignment
        if (li === 0) {
          for (let si = 0; si < Math.min(students.length, 3); si++) {
            const student = students[si]
            await db.assignmentSubmission.upsert({
              where: { assignmentId_userId: { assignmentId: assignment.id, userId: student.id } },
              update: {},
              create: {
                id: deterministicId('as'),
                assignmentId: assignment.id,
                userId: student.id,
                content: `এটি ${student.name} এর উত্তর। অধ্যায়টির মূল ধারণাগুলো ভালোভাবে বোঝা গেছে।`,
                status: si === 0 ? 'graded' : 'submitted',
                marks: si === 0 ? 8 : null,
                feedback: si === 0 ? 'ভালো উত্তর। আরও বিস্তারিত দিতে পারতে।' : null,
                gradedBy: si === 0 ? (await db.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } }))?.id ?? null : null,
                gradedAt: si === 0 ? new Date() : null,
              },
            })
          }
        }
      }
    }

    // Course enrollments
    for (let si = 0; si < Math.min(students.length, 4); si++) {
      const student = students[si]
      const isCompleted = si === 0
      await db.courseEnrollment.upsert({
        where: { userId_courseId: { userId: student.id, courseId: course.id } },
        update: {},
        create: {
          id: deterministicId('ce'),
          userId: student.id,
          courseId: course.id,
          status: isCompleted ? 'COMPLETED' : 'ACTIVE',
          type: 'FREE',
          completionPercent: isCompleted ? 100 : 30 + si * 15,
          completedAt: isCompleted ? new Date() : null,
        },
      })

      // Course purchase
      await db.coursePurchase.upsert({
        where: { userId_courseId: { userId: student.id, courseId: course.id } },
        update: {},
        create: {
          id: deterministicId('cpu'),
          userId: student.id,
          courseId: course.id,
          paymentId: null,
        },
      })

      // Lesson progress
      const lessons = await db.courseLesson.findMany({ where: { courseId: course.id }, orderBy: { displayOrder: 'asc' }, take: isCompleted ? undefined : 3 + si })
      for (const lesson of lessons) {
        await db.lessonProgress.upsert({
          where: { userId_lessonId: { userId: student.id, lessonId: lesson.id } },
          update: {},
          create: {
            id: deterministicId('lp'),
            userId: student.id,
            lessonId: lesson.id,
            courseId: course.id,
            completed: true,
            completedAt: new Date(),
          },
        })
      }

      // Certificate for completed
      if (isCompleted && cd.hasCertificate) {
        const enrollment = await db.courseEnrollment.findUnique({
          where: { userId_courseId: { userId: student.id, courseId: course.id } },
        })
        if (enrollment) {
          await db.certificate.upsert({
            where: { enrollmentId: enrollment.id },
            update: {},
            create: {
              id: deterministicId('cert'),
              userId: student.id,
              courseId: course.id,
              enrollmentId: enrollment.id,
              serial: `CERT-${course.slug}-${student.id.slice(0, 8)}`,
            },
          })
        }
      }
    }

    // Course exam schedule
    const mcqPkg = await db.mCQExamPackage.findFirst({ where: { classId: classRec.id } })
    if (mcqPkg) {
      const mcqSet = await db.mCQExamSet.findFirst({ where: { packageId: mcqPkg.id } })
      if (mcqSet) {
        await db.courseExamSchedule.create({
    data: {
      id: deterministicId('cesch'),
      courseId: course.id,
      examType: 'MCQ',
      packageId: mcqPkg.id,
      examDate: new Date(2025, 2, 15),
      startTime: '10:00',
      endTime: '11:00',
    },
  })
      }
    }

    // Lesson exam (deprecated - for backward compat)
    const lessonOne = await db.courseLesson.findFirst({ where: { courseId: course.id }, orderBy: { displayOrder: 'asc' } })
    if (lessonOne && mcqPkg) {
      await db.lessonExam.create({
    data: {
      id: deterministicId('le'),
      lessonId: lessonOne.id,
      examType: 'MCQ',
      packageId: mcqPkg.id,
      displayOrder: 1,
    },
  })
    }
  }
}
