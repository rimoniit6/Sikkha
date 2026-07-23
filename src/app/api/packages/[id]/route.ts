import { db } from '@/lib/db'
import { toDecimal } from '@/lib/decimal'
import { apiResponse, apiError } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const pkg = await db.contentPackage.findUnique({
      where: { id },
    })

    if (!pkg || !pkg.isActive) {
      return apiError('প্যাকেজ খুঁজে পাওয়া যায়নি', 404)
    }

    // Count premium content for the target class
    const targetClass = pkg.classLevel || ''
    const mcqCount = targetClass
      ? await db.mCQ.count({ where: { isActive: true, isPremium: true, classLevel: targetClass } })
      : 0
    const cqCount = targetClass
      ? await db.cQ.count({ where: { isActive: true, isPremium: true, classLevel: targetClass } })
      : 0

    // Count lectures for this class
    let lectureCount = 0
    if (targetClass) {
      const classCats = await db.classCategory.findMany({
        where: { slug: targetClass },
        select: { id: true },
      })
      if (classCats.length > 0) {
        lectureCount = await db.lecture.count({
          where: {
            isActive: true,
            isPremium: true,
            chapter: {
              subject: {
                classId: { in: classCats.map(c => c.id) },
              },
            },
          },
        })
      }
    }

    const totalContent = mcqCount + cqCount + lectureCount

    const discount =
      toDecimal(pkg.originalPrice) > 0
        ? Math.round(((toDecimal(pkg.originalPrice) - toDecimal(pkg.price)) / toDecimal(pkg.originalPrice)) * 100)
        : 0

    return apiResponse({
      id: pkg.id,
      title: pkg.title,
      slug: pkg.slug,
      description: pkg.description,
      thumbnail: pkg.thumbnail,
      price: pkg.price,
      originalPrice: pkg.originalPrice,
      discount,
      duration: pkg.duration,
      durationLabel: pkg.durationLabel,
      classLevel: pkg.classLevel,
      mcqCount,
      cqCount,
      lectureCount,
      totalContent,
      isActive: pkg.isActive,
      order: pkg.order,
      createdAt: pkg.createdAt,
    })
  } catch (error) {
    return handleApiError(error, 'Get Package Detail error:')
  }
}
