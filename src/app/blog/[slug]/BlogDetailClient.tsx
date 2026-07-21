'use client'

import Link from 'next/link'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Home, Calendar, User, Clock, Eye, ArrowRight } from 'lucide-react'
import { sanitizeHtml } from '@/lib/sanitize'
import Image from 'next/image'
import type { BlogPostRecord } from '@/features/blog/types/blog'

interface Props {
  post: BlogPostRecord
  relatedPosts: BlogPostRecord[]
}

export default function BlogDetailClient({ post, relatedPosts }: Props) {
  const content = sanitizeHtml(post.content)

  return (
    <div className="min-h-screen bg-background">
      <article className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Home className="h-4 w-4 mr-1 inline" />
                হোম
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/blog">ব্লগ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{post.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {post.featuredImage && (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {post.category && (
              <Badge
                variant="outline"
                style={{ borderColor: post.category.color || undefined, color: post.category.color || undefined }}
              >
                {post.category.name}
              </Badge>
            )}
            {post.tags?.map(({ tag }) => (
              <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                  #{tag.name}
                </Badge>
              </Link>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 flex-wrap">
            {post.author && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.author.name}
              </span>
            )}
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(post.publishedAt).toLocaleDateString('bn-BD', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
            )}
            {post.readingTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {post.readingTime} মিনিট পড়া
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.viewCount} বার দেখা
            </span>
          </div>

          {post.excerpt && (
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <Separator className="mb-8" />

          <div
            className="prose prose-lg dark:prose-invert max-w-none blog-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <Separator className="mb-8" />
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">সম্পর্কিত পোস্ট</h2>
            <Link href="/blog" className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
              সবগুলো দেখুন <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rp) => (
              <Link key={rp.id} href={`/blog/${rp.slug}`}>
                <Card className="group h-full overflow-hidden hover:shadow-lg transition-shadow">
                  {rp.featuredImage && (
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={rp.featuredImage}
                        alt={rp.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="p-4">
                    {rp.category && (
                      <Badge
                        variant="outline"
                        style={{ borderColor: rp.category.color || undefined, color: rp.category.color || undefined }}
                        className="mb-2"
                      >
                        {rp.category.name}
                      </Badge>
                    )}
                    <h3 className="font-semibold line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {rp.title}
                    </h3>
                    {rp.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{rp.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                      {rp.author && <span>{rp.author.name}</span>}
                      {rp.readingTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {rp.readingTime} মিনিট
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
