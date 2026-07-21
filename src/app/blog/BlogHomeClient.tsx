'use client'

import { useState } from 'react'
import Link from 'next/link'
import BlogCard from '@/features/blog/components/BlogCard'
import BlogSidebar from '@/features/blog/components/BlogSidebar'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Home } from 'lucide-react'
import type { BlogPostRecord, BlogCategoryRecord } from '@/features/blog/types/blog'

interface Props {
  featured: BlogPostRecord | null
  posts: BlogPostRecord[]
  categories: BlogCategoryRecord[]
}

export default function BlogHomeClient({ featured, posts, categories }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
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
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-3xl font-bold mb-2">ব্লগ</h1>
        <p className="text-muted-foreground mb-8">শিক্ষা টিপস, গাইড ও সর্বশেষ আপডেট</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {featured && (
              <Link href={`/blog/${featured.slug}`} className="block group">
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
                  <div className="p-8 md:p-12">
                    {featured.category && (
                      <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-sm mb-4">
                        {featured.category.name}
                      </span>
                    )}
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:underline">
                      {featured.title}
                    </h2>
                    <p className="text-white/80 line-clamp-2 mb-4">
                      {featured.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-white/70">
                      {featured.author && <span>{featured.author.name}</span>}
                      {featured.publishedAt && (
                        <span>{new Date(featured.publishedAt).toLocaleDateString('bn-BD')}</span>
                      )}
                      {featured.readingTime && <span>{featured.readingTime} মিনিট পড়া</span>}
                    </div>
                  </div>
                </div>
              </Link>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>

          <div>
            <BlogSidebar categories={categories} />
          </div>
        </div>
      </div>
    </div>
  )
}
