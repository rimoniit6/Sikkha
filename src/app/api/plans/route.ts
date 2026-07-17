import { apiResponse } from '@/lib/api-utils'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/errors'
import { getClassLevelForRequest } from '@/lib/class-filter'

export async function GET(request: Request) {
  try {
    const classLevel = await getClassLevelForRequest(request)

    const where: Record<string, unknown> = { isActive: true }
    // Packages with classLevel=null are offered to all classes; a student's
    // classLevel should match either their own class or a global (null) package.
    if (classLevel) {
      where.OR = [{ classLevel }, { classLevel: null }]
    }

    const packages = await db.contentPackage.findMany({
      where,
      orderBy: { price: 'asc' },
    })

    const parsedPlans = packages.map((pkg) => ({
      id: pkg.slug,
      name: pkg.title.replace(/ প্যাকেজ$/, ''),
      price: pkg.price,
      originalPrice: pkg.originalPrice,
      duration: pkg.durationLabel,
      durationDays: pkg.duration,
      durationLabel: pkg.durationLabel,
      description: pkg.description,
      thumbnail: pkg.thumbnail,
      isRecommended: pkg.order === 0,
    }))

    return apiResponse({ plans: parsedPlans })
  } catch (error) {
    return handleApiError(error, 'Get plans error')
  }
}
