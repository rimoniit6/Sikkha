import { db } from '@/lib/db'
import BlogHomeClient from './BlogHomeClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ব্লগ - শিক্ষা বাংলা',
  description: 'শিক্ষা টিপস, গাইড ও আপডেট — শিক্ষা বাংলা ব্লগ।',
}

export default async function BlogHomePage() {
  const [featured, posts, categories] = await Promise.all([
    db.blogPost.findFirst({
      where: { status: 'PUBLISHED', isActive: true, deletedAt: null, isFeatured: true, publishedAt: { lte: new Date() } },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      },
      orderBy: { publishedAt: 'desc' },
    }),
    db.blogPost.findMany({
      where: { status: 'PUBLISHED', isActive: true, deletedAt: null, publishedAt: { lte: new Date() } },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true, color: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      take: 12,
    }),
    db.blogCategory.findMany({
      where: { isActive: true, deletedAt: null },
      include: { _count: { select: { posts: { where: { status: 'PUBLISHED', deletedAt: null } } } } },
      orderBy: { order: 'asc' },
    }),
  ])

  const activeCategories = categories.filter(c => c._count.posts > 0)

  return (
    <BlogHomeClient
      featured={JSON.parse(JSON.stringify(featured))}
      posts={JSON.parse(JSON.stringify(posts))}
      categories={JSON.parse(JSON.stringify(activeCategories))}
    />
  )
}
