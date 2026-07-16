import { db } from '@/lib/db'
import crypto from 'crypto'

function generateSerial(courseId: string, userId: string): string {
  const year = new Date().getFullYear()
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase()
  const tail = (courseId + userId).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()
  return `SK-${year}-${tail}-${rand}`
}

/**
 * Recompute a user's progress for a course from lesson-progress rows and
 * persist it on the enrollment. Marks the enrollment COMPLETED (and stamps
 * completedAt) once every lesson is done, then issues a certificate when the
 * course is certificate-enabled. Survives refresh: reads whatever progress
 * already exists, so re-running is idempotent.
 */
export async function recomputeEnrollmentProgress(courseId: string, userId: string) {
  const enrollment = await db.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  })
  if (!enrollment) return null

   const [lessons, lessonProgress] = await Promise.all([
    db.courseLesson.findMany({
      where: { courseId },
      select: { id: true },
    }),
    db.lessonProgress.findMany({
      where: { courseId, userId },
      select: { lessonId: true, completed: true },
    }),
  ])

  const total = lessons.length
  const watched = lessonProgress.filter((p) => p.completed).length
  const completionPercent = total === 0 ? 0 : Math.min(100, Math.round((watched / total) * 100))
  const nowCompleted = completionPercent >= 100
  const alreadyCompleted = Boolean(enrollment.completedAt)

  await db.courseEnrollment.update({
    where: { id: enrollment.id },
    data: {
      completionPercent,
      completedAt: nowCompleted ? (enrollment.completedAt ?? new Date()) : enrollment.completedAt,
      status: nowCompleted ? 'COMPLETED' : enrollment.status === 'COMPLETED' ? 'COMPLETED' : enrollment.status,
    },
  })

  if (nowCompleted && !alreadyCompleted) {
    await issueCertificateForEnrollment(enrollment.id, courseId, userId)
  }

  return completionPercent
}

/**
 * Issue a certificate for a completed enrollment, but only when the course
 * actually grants certificates and one does not already exist. Retries once on
 * a serial-collision to respect the unique constraint.
 */
export async function issueCertificateForEnrollment(
  enrollmentId: string,
  courseId: string,
  userId: string,
) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { hasCertificate: true },
  })
  if (!course?.hasCertificate) return null

  const existing = await db.certificate.findUnique({ where: { enrollmentId } })
  if (existing) return existing

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.certificate.create({
        data: { userId, courseId, enrollmentId, serial: generateSerial(courseId, userId) },
      })
    } catch (error: any) {
      if (error?.code === 'P2002' && attempt < 2) continue
      throw error
    }
  }
  return null
}
