import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import BlogDetailClient from './BlogDetailClient'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await db.blogPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, featuredImage: true, metaTitle: true, metaDescription: true, ogImage: true, canonicalUrl: true, publishedAt: true },
  })

  if (!post) return { title: 'পোস্ট পাওয়া যায়নি' }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      images: post.ogImage || post.featuredImage ? [{ url: post.ogImage || post.featuredImage! }] : [],
    },
    twitter: { card: 'summary_large_image', title: post.title },
    alternates: { canonical: post.canonicalUrl || `/blog/${slug}` },
  }
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params

  const post = await db.blogPost.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, avatar: true } },
      category: { select: { id: true, name: true, slug: true, color: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
    },
  })

  if (!post || post.status !== 'PUBLISHED' || post.deletedAt) {
    notFound()
  }

  const relatedPosts = post.categoryId
    ? await db.blogPost.findMany({
        where: {
          id: { not: post.id },
          status: 'PUBLISHED',
          isActive: true,
          deletedAt: null,
          publishedAt: { lte: new Date() },
          categoryId: post.categoryId,
        },
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true, color: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 3,
      })
    : []

  // Increment view count
  db.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})

  return (
    <BlogDetailClient
      post={JSON.parse(JSON.stringify(post))}
      relatedPosts={JSON.parse(JSON.stringify(relatedPosts))}
    />
  )
}
