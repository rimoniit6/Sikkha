'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Eye } from 'lucide-react'
import type { BlogPostRecord } from '@/features/blog/types/blog'

interface Props {
  post: BlogPostRecord
}

export default function BlogCard({ post }: Props) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="group h-full overflow-hidden hover:shadow-lg transition-shadow">
        {post.featuredImage && (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            {post.category && (
              <Badge
                variant="outline"
                style={{ borderColor: post.category.color || undefined, color: post.category.color || undefined }}
              >
                {post.category.name}
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {post.author && <span>{post.author.name}</span>}
            {post.publishedAt && (
              <span>{new Date(post.publishedAt).toLocaleDateString('bn-BD')}</span>
            )}
            {post.readingTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readingTime} মিনিট
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.viewCount}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
