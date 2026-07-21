import { db } from '@/lib/db'
import { apiResponse } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const data = await db.blogTag.findMany({
      include: { _count: { select: { posts: { where: { post: { status: 'PUBLISHED', deletedAt: null, publishedAt: { lte: new Date() } } } } } } },
      orderBy: { name: 'asc' },
    })
    return apiResponse(data.filter(t => t._count.posts > 0))
  } catch (error) {
    return handleApiError(error, 'Get Blog Tags')
  }
}
