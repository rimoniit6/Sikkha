import { db } from './src/lib/db'

async function main() {
  const count = await db.featuredContent.count({ where: { section: 'homepage' } })
  console.log('Featured count:', count)

  const items = await db.featuredContent.findMany({
    where: { section: 'homepage' },
    take: 5,
    orderBy: { order: 'asc' },
  })
  for (const item of items) {
    console.log(JSON.stringify({
      id: item.id,
      contentType: item.contentType,
      contentId: item.contentId,
      isActive: item.isActive,
      deletedAt: item.deletedAt,
      order: item.order,
    }))
  }

  // Check if content actually exists
  for (const item of items) {
    if (item.contentType === 'lecture') {
      const lecture = await db.lecture.findUnique({ where: { id: item.contentId } })
      console.log(`Lecture ${item.contentId}:`, lecture ? 'EXISTS' : 'MISSING', lecture?.title?.substring(0,50))
    }
    if (item.contentType === 'mcq') {
      const mcq = await db.mCQ.findUnique({ where: { id: item.contentId } })
      console.log(`MCQ ${item.contentId}:`, mcq ? 'EXISTS' : 'MISSING')
    }
  }

  await db.$disconnect()
}

main()
