import { db } from '@/lib/db'
import { apiResponse } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const data = await db.blogCategory.findMany({
      where: { isActive: true, deletedAt: null },
      include: { _count: { select: { posts: { where: { status: 'PUBLISHED', deletedAt: null } } } } },
      orderBy: { order: 'asc' },
    })
    return apiResponse(data.filter(c => c._count.posts > 0))
  } catch (error) {
    return handleApiError(error, 'Get Blog Categories')
  }
}
