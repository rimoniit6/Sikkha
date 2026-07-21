'use client'

import { useState } from 'react'
import { useAdminBlogs } from '@/features/blog/hooks/use-admin-blogs'
import { blogService } from '@/features/blog/services/blog.service'
import { useRouterStore } from '@/store/router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2, Eye, Search, Send, Archive, RotateCcw } from 'lucide-react'
import type { BlogPostRecord } from '@/features/blog/types/blog'

const statusColors: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'খসড়া',
  PUBLISHED: 'প্রকাশিত',
  ARCHIVED: 'আর্কাইভড',
}

export default function AdminBlogPage() {
  const navigate = useRouterStore((s) => s.navigate)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { blogs, isLoading, total, totalPages, page: currentPage, invalidate } = useAdminBlogs({ page, search: search || undefined })

  const handleDelete = async (id: string) => {
    if (!confirm('ব্লগ পোস্টটি মুছে ফেলবেন?')) return
    try {
      await blogService.admin.remove(id)
      invalidate()
    } catch (e) {
      console.error('Delete failed', e)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await blogService.admin.publish(id)
      invalidate()
    } catch (e) {
      console.error('Publish failed', e)
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await blogService.admin.archive(id)
      invalidate()
    } catch (e) {
      console.error('Archive failed', e)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await blogService.admin.restore(id)
      invalidate()
    } catch (e) {
      console.error('Restore failed', e)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ব্লগ ব্যবস্থাপনা</h1>
          <p className="text-muted-foreground text-sm mt-1">ব্লগ পোস্ট তৈরি, সম্পাদনা ও প্রকাশ করুন</p>
        </div>
        <Button onClick={() => navigate('admin-blog-editor')}>
          <Plus className="h-4 w-4 mr-2" />
          নতুন পোস্ট
        </Button>
      </div>

      <Separator />

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="পোস্ট খুঁজুন..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>শিরোনাম</TableHead>
                <TableHead>ক্যাটাগরি</TableHead>
                <TableHead>স্ট্যাটাস</TableHead>
                <TableHead>তারিখ</TableHead>
                <TableHead>দেখা</TableHead>
                <TableHead className="w-[180px]">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    কোনো ব্লগ পোস্ট পাওয়া যায়নি
                  </TableCell>
                </TableRow>
              ) : (
                blogs.map((post: BlogPostRecord) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-xs truncate">{post.title}</TableCell>
                    <TableCell>
                      {post.category && (
                        <Badge variant="outline" style={{ borderColor: post.category.color || undefined }}>
                          {post.category.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[post.status]} variant="secondary">
                        {statusLabels[post.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('bn-BD')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {post.viewCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => window.open(`/blog/${post.slug}`, '_blank')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {post.status === 'DRAFT' && (
                          <Button variant="ghost" size="icon" onClick={() => handlePublish(post.id)} title="প্রকাশ">
                            <Send className="h-4 w-4 text-emerald-600" />
                          </Button>
                        )}
                        {post.status === 'PUBLISHED' && (
                          <Button variant="ghost" size="icon" onClick={() => handleArchive(post.id)} title="আর্কাইভ">
                            <Archive className="h-4 w-4 text-gray-600" />
                          </Button>
                        )}
                        {post.status === 'ARCHIVED' && (
                          <Button variant="ghost" size="icon" onClick={() => handleRestore(post.id)} title="পুনরুদ্ধার">
                            <RotateCcw className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => navigate('admin-blog-editor', { postId: post.id })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            মোট {total}টি পোস্ট — পৃষ্ঠা {currentPage} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              পূর্ববর্তী
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              পরবর্তী
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
