import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth, apiResponse, apiError } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

function certificateHtml(cert: any): string {
  const student = cert.user?.fullName || cert.user?.name || 'Student'
  const course = cert.course?.title || 'Course'
  const issued = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8" />
<title>Certificate — ${course}</title>
<style>
  body { margin: 0; font-family: 'Noto Sans Bengali', system-ui, sans-serif; background: #f4f1ea; }
  .cert { max-width: 800px; margin: 40px auto; padding: 56px; border: 8px solid #b8860b;
          background: #fffdf7; border-radius: 12px; text-align: center; color: #2b2b2b; }
  .org { font-size: 14px; letter-spacing: 3px; color: #b8860b; text-transform: uppercase; }
  h1 { font-size: 40px; margin: 18px 0 6px; color: #1a1a1a; }
  .sub { color: #555; margin-bottom: 28px; }
  .name { font-size: 34px; font-weight: 700; color: #0b5; margin: 24px 0 8px; }
  .course { font-size: 26px; color: #b8860b; margin-bottom: 28px; }
  .meta { display: flex; justify-content: space-between; font-size: 13px; color: #777;
          border-top: 1px solid #ddd; padding-top: 18px; margin-top: 30px; }
  .serial { font-family: monospace; }
</style>
</head>
<body>
  <div class="cert">
    <div class="org">সিকখস</div>
    <h1>Certificate of Completion</h1>
    <div class="sub">সম্পন্নতার সনদ</div>
    <div>এই মর্মে সাক্ষ্য প্রদান করা যাচ্ছে যে</div>
    <div class="name">${student}</div>
    <div>নিম্নলিখিত কোর্সটি সফলভাবে সম্পন্ন করেছেন</div>
    <div class="course">${course}</div>
    <div class="meta">
      <span>ইস্যু তারিখ: ${issued}</span>
      <span class="serial">সিরিয়াল: ${cert.serial}</span>
    </div>
  </div>
</body>
</html>`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serial = searchParams.get('serial')
    const enrollmentId = searchParams.get('enrollmentId')
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId')
    const download = searchParams.get('download') === '1'

    if (serial) {
      const cert = await db.certificate.findFirst({
        where: { serial, deletedAt: null },
        include: { course: { select: { title: true } }, user: { select: { name: true } } },
      })
      if (!cert) return apiResponse({ valid: false })
      if (download) {
        await db.certificate.update({ where: { id: cert.id }, data: { downloadCount: { increment: 1 } } })
        return new NextResponse(certificateHtml(cert), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }
      return apiResponse({ valid: true, serial: cert.serial, issuedAt: cert.issuedAt, courseTitle: cert.course.title })
    }

    const auth = await withAuth(request)
    if (auth instanceof NextResponse) return auth

    // No specific identifier → return the user's full certificate list
    if (!serial && !enrollmentId && !courseId && !userId) {
      const certs = await db.certificate.findMany({
        where: { userId: auth.user.id, deletedAt: null },
        include: { course: { select: { id: true, title: true, slug: true, thumbnail: true } } },
        orderBy: { issuedAt: 'desc' },
      })
      return apiResponse({
        certificates: certs.map((c) => ({
          id: c.id,
          serial: c.serial,
          issuedAt: c.issuedAt,
          course: c.course,
        })),
      })
    }

    let where: any = { deletedAt: null }
    if (enrollmentId) where.enrollmentId = enrollmentId
    else if (userId && courseId) where = { ...where, userId, courseId }
    else if (courseId) where = { ...where, userId: auth.user.id, courseId }
    else return apiError('Provide serial, enrollmentId, or userId+courseId', 400)

    if (auth.user.role === 'STUDENT') {
      const owned = await db.certificate.findFirst({ where, select: { userId: true } })
      if (!owned || owned.userId !== auth.user.id) return apiError('Forbidden', 403)
    }

    const cert = await db.certificate.findFirst({
      where,
      include: { course: { select: { title: true, slug: true } }, user: { select: { name: true } } },
    })
    if (!cert) return apiError('Certificate not found', 404)

    if (download) {
      await db.certificate.update({ where: { id: cert.id }, data: { downloadCount: { increment: 1 } } })
      return new NextResponse(certificateHtml(cert), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    return apiResponse({
      id: cert.id,
      serial: cert.serial,
      issuedAt: cert.issuedAt,
      downloadCount: cert.downloadCount,
      course: cert.course,
      student: cert.user?.name,
    })
  } catch (error) {
    return handleApiError(error, 'Certificate')
  }
}
