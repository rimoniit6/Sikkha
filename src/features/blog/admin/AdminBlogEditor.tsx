'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAdminBlog, useAdminBlogCategories, useAdminBlogTags } from '@/features/blog/hooks/use-admin-blogs'
import { blogService } from '@/features/blog/services/blog.service'
import { useRouterStore, useRouteParam } from '@/store/router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Save, Send, Clock, Image as ImageIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useToast } from '@/hooks/use-toast'
import { MultiSelect } from '@/components/ui/multi-select'
import ImageUploader from '@/components/ui/image-uploader'
import type { BlogPostInput, BlogPostStatus } from '@/features/blog/types/blog'
import type { ContentBlock } from '@/components/ui/content-block-types'

const RichTextBlockEditor = dynamic(
  () => import('@/components/ui/RichTextBlockEditor').then(m => ({ default: m.RichTextBlockEditor })),
  { ssr: false }
)

const statusLabels: Record<string, string> = {
  DRAFT: 'খসড়া',
  PUBLISHED: 'প্রকাশিত',
  ARCHIVED: 'আর্কাইভড',
}

export default function AdminBlogEditor() {
  const navigate = useRouterStore((s) => s.navigate)
  const postId = useRouteParam('postId')
  const isEdit = !!postId
  const { toast } = useToast()

  const { data: editPost, isLoading: postLoading } = useAdminBlog(postId || '')
  const { categories } = useAdminBlogCategories()
  const { tags } = useAdminBlogTags()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<BlogPostStatus>('DRAFT')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [allowComments, setAllowComments] = useState(true)
  const [featuredImage, setFeaturedImage] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const contentBlock = useMemo(
    () => ({ id: 'blog-editor-content', type: 'richtext' as const, content }),
    [content]
  )

  const handleContentChange = (block: ContentBlock) => {
    if (block.type === 'richtext') setContent(block.content)
  }

  useEffect(() => {
    if (isEdit && editPost) {
      setTitle(editPost.title)
      setSlug(editPost.slug)
      setContent(editPost.content)
      setExcerpt(editPost.excerpt || '')
      setFeaturedImage(editPost.featuredImage || '')
      setCategoryId(editPost.categoryId || '')
      setStatus(editPost.status as BlogPostStatus)
      setIsFeatured(editPost.isFeatured)
      setIsPinned(editPost.isPinned)
      setAllowComments(editPost.allowComments)
      setMetaTitle(editPost.metaTitle || '')
      setMetaDescription(editPost.metaDescription || '')
      setTagIds(editPost.tags?.map((t: { tag: { id: string } }) => t.tag.id) || [])
    }
  }, [isEdit, editPost])

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      toast({ title: 'শিরোনাম দিন', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const input: BlogPostInput = {
        title,
        slug: slug || undefined,
        content,
        excerpt: excerpt || null,
        featuredImage: featuredImage || null,
        categoryId: categoryId || null,
        status: publish ? 'PUBLISHED' : status,
        isFeatured,
        isPinned,
        allowComments,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        tagIds,
      }

      if (isEdit) {
        await blogService.admin.update(postId!, input)
        toast({ title: 'পোস্ট আপডেট হয়েছে' })
      } else {
        await blogService.admin.create(input)
        toast({ title: 'পোস্ট তৈরি হয়েছে' })
      }

      navigate('admin-blog')
    } catch (e) {
      toast({ title: 'সেভ করতে সমস্যা হয়েছে', variant: 'destructive' })
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && postLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('admin-blog')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? 'পোস্ট এডিট করুন' : 'নতুন পোস্ট'}</h1>
            <p className="text-muted-foreground text-sm">{statusLabels[status]}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'সেভ হচ্ছে...' : 'খসড়া সেভ'}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            <Send className="h-4 w-4 mr-2" />
            প্রকাশ
          </Button>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">কন্টেন্ট</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="settings">সেটিংস</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4 pt-4">
          <div>
            <Label>শিরোনাম</Label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (!isEdit && !slug) setSlug(e.target.value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'))
              }}
              placeholder="ব্লগ পোস্টের শিরোনাম"
            />
          </div>

          <div>
            <Label>স্লাগ</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="post-url-slug" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ক্যাটাগরি</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="ক্যাটাগরি নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>স্ট্যাটাস</Label>
              <Select value={status} onValueChange={(v: BlogPostStatus) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">খসড়া</SelectItem>
                  <SelectItem value="PUBLISHED">প্রকাশিত</SelectItem>
                  <SelectItem value="ARCHIVED">আর্কাইভড</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>ফিচারড ইমেজ</Label>
            <ImageUploader
              value={featuredImage}
              onChange={setFeaturedImage}
              onRemove={() => setFeaturedImage('')}
              label=""
            />
          </div>

          <div>
            <Label>ট্যাগ</Label>
            <MultiSelect
              options={tags.map((t) => ({ label: t.name, value: t.id }))}
              selectedValues={tagIds}
              onChange={setTagIds}
              placeholder="ট্যাগ নির্বাচন করুন"
            />
          </div>

          <div>
            <Label>সারসংক্ষেপ</Label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="পোস্টের সংক্ষিপ্ত বিবরণ"
              rows={3}
            />
          </div>

          <div>
            <Label>কন্টেন্ট</Label>
            <div className="min-h-[400px] border rounded-md">
              <RichTextBlockEditor
                block={contentBlock}
                onChange={handleContentChange}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4 pt-4">
          <div>
            <Label>Meta Title</Label>
            <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="SEO টাইটেল" />
          </div>
          <div>
            <Label>Meta Description</Label>
            <Textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="SEO বিবরণ"
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <Label>ফিচার্ড</Label>
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
          </div>
          <div className="flex items-center justify-between">
            <Label>পিন করা</Label>
            <Switch checked={isPinned} onCheckedChange={setIsPinned} />
          </div>
          <div className="flex items-center justify-between">
            <Label>কমেন্ট অনুমতি</Label>
            <Switch checked={allowComments} onCheckedChange={setAllowComments} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
