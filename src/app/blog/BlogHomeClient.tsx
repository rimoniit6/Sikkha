'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import BlogCard from '@/features/blog/components/BlogCard'
import BlogSidebar from '@/features/blog/components/BlogSidebar'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Home, Search, Loader2, TrendingUp, Eye } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import type { BlogPostRecord, BlogCategoryRecord } from '@/features/blog/types/blog'

interface Props {
  featured: BlogPostRecord | null
  posts: BlogPostRecord[]
  categories: BlogCategoryRecord[]
  popularPosts: BlogPostRecord[]
  totalPages: number
}

export default function BlogHomeClient({ featured, posts: initialPosts, categories, popularPosts, totalPages: initialTotalPages }: Props) {
  const [page, setPage] = useState(1)
  const [posts, setPosts] = useState(initialPosts)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 400)
  const initialPostsRef = useRef(initialPosts)

  const fetchPosts = useCallback(async (pageNum: number, search?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '12' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/blog?${params}`)
      const json = await res.json()
      if (json.data) {
        setPosts(json.data)
        setTotalPages(json.pagination?.totalPages || 1)
      }
    } catch {
      // Keep existing posts on error
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch when search changes (reset to page 1)
  useEffect(() => {
    if (debouncedSearch) {
      setPage(1)
      fetchPosts(1, debouncedSearch)
    } else if (page === 1) {
      setPosts(initialPostsRef.current)
    }
  }, [debouncedSearch, fetchPosts, page])

  // Fetch when page changes
  useEffect(() => {
    if (page === 1 && !debouncedSearch) return // SSR data covers page 1 without search
    fetchPosts(page, debouncedSearch || undefined)
  }, [page, debouncedSearch, fetchPosts])

  const displayPosts = debouncedSearch || page > 1 ? posts : initialPostsRef.current

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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">ব্লগ</h1>
            <p className="text-muted-foreground">শিক্ষা টিপস, গাইড ও সর্বশেষ আপডেট</p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ব্লগে খুঁজুন..."
              className="pl-9 h-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Featured — only show on page 1 without search */}
            {page === 1 && !debouncedSearch && featured && (
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

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Posts grid */}
            {!loading && (
              <>
                {displayPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {debouncedSearch ? 'কোনো ব্লগ পোস্ট খুঁজে পাওয়া যায়নি' : 'কোনো ব্লগ পোস্ট নেই'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {displayPosts.map((post) => (
                      <BlogCard key={post.id} post={post} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      পূর্ববর্তী
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const startPage = Math.max(1, page - 2)
                      const p = startPage + i
                      if (p > totalPages) return null
                      return (
                        <Button
                          key={p}
                          variant={p === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      )
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      পরবর্তী
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-6">
            {/* Popular Posts */}
            {popularPosts.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  জনপ্রিয় পোস্ট
                </h3>
                <div className="space-y-3">
                  {popularPosts.map((post, idx) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="flex items-start gap-3 group"
                    >
                      <span className="text-lg font-bold text-muted-foreground/30 min-w-[24px]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2 group-hover:text-emerald-600 transition-colors">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          <span>{post.viewCount}</span>
                          {post.category && (
                            <>
                              <span>·</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4" style={{ borderColor: post.category.color || undefined, color: post.category.color || undefined }}>
                                {post.category.name}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            <BlogSidebar categories={categories} />
          </div>
        </div>
      </div>
    </div>
  )
}
