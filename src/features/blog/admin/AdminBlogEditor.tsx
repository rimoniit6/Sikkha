'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAdminBlog, useAdminBlogCategories, useAdminBlogTags } from '@/features/blog/hooks/use-admin-blogs'
import { blogService } from '@/features/blog/services/blog.service'
import { useRouterStore, useRouteParam } from '@/store/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowLeft, Save, Send, Clock, Eye, Tablet, Smartphone, Monitor, Image as ImageIcon, FileText, Download, ExternalLink, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useToast } from '@/hooks/use-toast'
import { MultiSelect } from '@/components/ui/multi-select'
import ImageUploader from '@/components/ui/image-uploader'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import SlugField from '@/components/ui/slug-field'
import { cn } from '@/lib/utils'
import { slugify } from '@/lib/slug'
import { useAutoSlug } from '@/hooks/use-auto-slug'
import { useUploadThing } from '@/lib/upload/client'
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

const AUTOSAVE_KEY_PREFIX = 'blog-editor-draft-'
const AUTOSAVE_DELAY = 3000 // 3 seconds

export default function AdminBlogEditor() {
  const navigate = useRouterStore((s) => s.navigate)
  const postId = useRouteParam('postId')
  const isEdit = !!postId
  const { toast } = useToast()

  const { data: editPost, isLoading: postLoading } = useAdminBlog(postId || '')
  const { categories } = useAdminBlogCategories()
  const { tags } = useAdminBlogTags()

  const [title, setTitle] = useState('')
  const [slug, setSlugState] = useState('')
  const [slugError, setSlugError] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<BlogPostStatus>('DRAFT')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [allowComments, setAllowComments] = useState(true)
  const [featuredImage, setFeaturedImage] = useState('')
  const [ogImage, setOgImage] = useState('')
  const [canonicalUrl, setCanonicalUrl] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [readingTime, setReadingTime] = useState(0)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showPreview, setShowPreview] = useState(false)
  const [draftRecovered, setDraftRecovered] = useState(false)

  // File attachments
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string; type: string }>>([])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const { startUpload: uploadAttachment } = useUploadThing('mediaUploader', {
    onClientUploadComplete: (res) => {
      if (res?.length) {
        setAttachments((prev) => [
          ...prev,
          ...res.map((r) => ({ url: r.url, name: r.name, type: r.type })),
        ])
      }
      setUploadingAttachment(false)
    },
    onUploadError: () => {
      setUploadingAttachment(false)
      toast({ title: 'ফাইল আপলোডে সমস্যা হয়েছে', variant: 'destructive' })
    },
  })

  const autosaveKey = useMemo(() => `${AUTOSAVE_KEY_PREFIX}${postId || 'new'}`, [postId])
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const contentBlock = useMemo(
    () => ({ id: 'blog-editor-content', type: 'richtext' as const, content }),
    [content]
  )

  const handleContentChange = (block: ContentBlock) => {
    if (block.type === 'richtext') {
      setContent(block.content)
      // Calculate reading time
      const text = block.content.replace(/<[^>]*>/g, '')
      const words = text.split(/\s+/).length
      setReadingTime(Math.max(1, Math.ceil(words / 200)))
    }
  }

  // ─── Auto-save ───

  const saveToLocalStorage = useCallback(() => {
    const draft = { title, slug, content, excerpt, categoryId, status, featuredImage, ogImage, metaTitle, metaDescription, tagIds, isFeatured, isPinned, allowComments, canonicalUrl }
    try {
      localStorage.setItem(autosaveKey, JSON.stringify(draft))
      setLastSaved(new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }))
    } catch { /* quota exceeded — silently ignore */ }
  }, [title, slug, content, excerpt, categoryId, status, featuredImage, ogImage, metaTitle, metaDescription, tagIds, isFeatured, isPinned, allowComments, canonicalUrl, autosaveKey])

  // Debounced auto-save
  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(saveToLocalStorage, AUTOSAVE_DELAY)
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
  }, [title, slug, content, excerpt, categoryId, status, featuredImage, ogImage, metaTitle, metaDescription, tagIds, isFeatured, isPinned, allowComments, canonicalUrl, saveToLocalStorage])

  // Recover draft on load
  useEffect(() => {
    if (isEdit && editPost) return // Don't recover for existing posts being edited
    if (postLoading) return

    try {
      const saved = localStorage.getItem(autosaveKey)
      if (!saved) return

      const draft = JSON.parse(saved)
      if (!draft.content && !draft.title) return // empty draft — skip

      // Only recover if there's meaningful content
      if (draft.content || draft.title) {
        setTitle(draft.title || '')
        setSlug(draft.slug || '')
        setContent(draft.content || '')
        setExcerpt(draft.excerpt || '')
        setFeaturedImage(draft.featuredImage || '')
        setOgImage(draft.ogImage || '')
        setCategoryId(draft.categoryId || '')
        setStatus(draft.status || 'DRAFT')
        setIsFeatured(draft.isFeatured || false)
        setIsPinned(draft.isPinned || false)
        setAllowComments(draft.allowComments ?? true)
        setMetaTitle(draft.metaTitle || '')
        setMetaDescription(draft.metaDescription || '')
        setCanonicalUrl(draft.canonicalUrl || '')
        setTagIds(draft.tagIds || [])
        setDraftRecovered(true)
      }
    } catch { /* ignore parse errors */ }
  }, [isEdit, editPost, postLoading, autosaveKey])

  // Load edit post
  useEffect(() => {
    if (isEdit && editPost) {
      setTitle(editPost.title)
      setSlug(editPost.slug)
      setContent(editPost.content)
      setExcerpt(editPost.excerpt || '')
      setFeaturedImage(editPost.featuredImage || '')
      setOgImage(editPost.ogImage || '')
      setCategoryId(editPost.categoryId || '')
      setStatus(editPost.status as BlogPostStatus)
      setIsFeatured(editPost.isFeatured)
      setIsPinned(editPost.isPinned)
      setAllowComments(editPost.allowComments)
      setMetaTitle(editPost.metaTitle || '')
      setMetaDescription(editPost.metaDescription || '')
      setCanonicalUrl(editPost.canonicalUrl || '')
      setReadingTime(editPost.readingTime || 0)
      setTagIds(editPost.tags?.map((t: { tag: { id: string } }) => t.tag.id) || [])
    }
  }, [isEdit, editPost])

  // ─── Auto-slug ───
  const autoSlugInitRef = useRef(false)
  const { slug: autoSlug, isManuallyEdited: slugManuallyEdited, setSlug: setAutoSlug, reset: resetAutoSlug } = useAutoSlug(title, '')

  // Sync slug state with autoSlug
  useEffect(() => {
    setSlugState(autoSlug)
  }, [autoSlug])

  // Override initial slug from edit post
  useEffect(() => {
    if (isEdit && editPost && !autoSlugInitRef.current) {
      autoSlugInitRef.current = true
      const editSlug = editPost.slug || slugify(editPost.title)
      setAutoSlug(editSlug)
    }
  }, [isEdit, editPost, setAutoSlug])

  // ─── Slug validation via API ───
  const validateSlug = useCallback(async (): Promise<boolean> => {
    if (!slug) {
      setSlugError('স্লাগ প্রয়োজন')
      return false
    }

    try {
      const params = new URLSearchParams({ model: 'blogPost', slug })
      if (isEdit && postId) params.set('excludeId', postId)

      const res = await fetch(`/api/admin/check-slug?${params}`)
      const body = await res.json()

      if (!body.data?.available) {
        setSlugError('এই শিরোনামের জন্য তৈরি হওয়া স্লাগটি ইতিমধ্যে ব্যবহৃত হয়েছে। অনুগ্রহ করে অন্য একটি শিরোনাম দিন।')
        return false
      }

      setSlugError('')
      return true
    } catch {
      // If the API fails, allow save — backend will validate
      return true
    }
  }, [slug, isEdit, postId])

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      toast({ title: 'শিরোনাম দিন', variant: 'destructive' })
      return
    }

    // Validate slug before saving (includes soft-deleted records via findSlugConflict on server)
    const slugValid = await validateSlug()
    if (!slugValid) {
      toast({ title: slugError || 'স্লাগ ইতিমধ্যে ব্যবহৃত হয়েছে', variant: 'destructive' })
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
        ogImage: ogImage || null,
        canonicalUrl: canonicalUrl || null,
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

      // Clear auto-save draft after successful save
      try { localStorage.removeItem(autosaveKey) } catch { /* ignore */ }
      setDraftRecovered(false)
      navigate('admin-blog')
    } catch (e) {
      toast({ title: 'সেভ করতে সমস্যা হয়েছে', variant: 'destructive' })
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploadingAttachment(true)
    await uploadAttachment(Array.from(files))
    e.target.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('admin-blog')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{isEdit ? 'পোস্ট এডিট করুন' : 'নতুন পোস্ট'}</h1>
              <Badge variant="outline" className="text-[10px]">{statusLabels[status]}</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {draftRecovered && (
                <span className="text-amber-600 font-medium">পূর্ববর্তী খসড়া পুনরুদ্ধার করা হয়েছে</span>
              )}
              {lastSaved && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lastSaved} এ অটোসেভ
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="h-4 w-4 mr-1" />
                  প্রিভিউ
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">পোস্ট প্রিভিউ দেখুন</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'সেভ হচ্ছে...' : 'খসড়া সেভ'}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            <Send className="h-4 w-4 mr-2" />
            প্রকাশ
          </Button>
        </div>
      </div>

      <Separator />

      {showPreview && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">প্রিভিউ:</span>
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
              {(['desktop', 'tablet', 'mobile'] as const).map((mode) => {
                const Icon = mode === 'desktop' ? Monitor : mode === 'tablet' ? Tablet : Smartphone
                return (
                  <button
                    key={mode}
                    type="button"
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      previewMode === mode ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-muted-foreground hover:bg-muted/60'
                    )}
                    onClick={() => setPreviewMode(mode)}
                    title={mode === 'desktop' ? 'ডেস্কটপ' : mode === 'tablet' ? 'ট্যাবলেট' : 'মোবাইল'}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>
          <div
            className={cn(
              'border rounded-xl bg-white dark:bg-zinc-950 overflow-auto mx-auto transition-all',
              previewMode === 'desktop' && 'max-w-4xl',
              previewMode === 'tablet' && 'max-w-[768px]',
              previewMode === 'mobile' && 'max-w-[375px]',
            )}
          >
            <div className="p-6">
              {featuredImage && (
                <img src={featuredImage} alt={title} className="w-full max-h-64 object-cover rounded-lg mb-6" />
              )}
              <h1 className="text-3xl font-bold mb-2">{title || '(শিরোনাম ছাড়া)'}</h1>
              {excerpt && <p className="text-muted-foreground mb-4">{excerpt}</p>}
              <RichContentRenderer content={content || ''} className="text-base leading-relaxed" />
            </div>
          </div>
          <Separator />
        </div>
      )}

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
                setSlugError('') // Clear slug error on title change
              }}
              placeholder="ব্লগ পোস্টের শিরোনাম"
              className={cn(slugError && 'border-destructive')}
            />
          </div>

          <SlugField
            value={slug}
            onChange={(v) => {
              setAutoSlug(v)
              setSlugError('')
            }}
            sourceText={title}
            isManuallyEdited={slugManuallyEdited}
            onReset={() => {
              resetAutoSlug()
              setSlugError('')
            }}
            previewPrefix="blog"
            error={slugError}
            siteUrl={typeof window !== 'undefined' ? window.location.origin : undefined}
          />

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
            <Label>OG ইমেজ (শেয়ার করার সময়)</Label>
            <ImageUploader
              value={ogImage}
              onChange={setOgImage}
              onRemove={() => setOgImage('')}
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
            <Label>ফাইল সংযুক্তি</Label>
            <div className="space-y-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">
                    <ExternalLink className="h-3.5 w-3.5 inline mr-1" />
                    খুলুন
                  </a>
                  <button type="button" onClick={() => removeAttachment(idx)} className="text-xs text-destructive hover:underline shrink-0">
                    মুছুন
                  </button>
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                {uploadingAttachment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span>{uploadingAttachment ? 'আপলোড হচ্ছে...' : 'ফাইল সংযুক্ত করুন (PDF, DOC, PPT, ZIP)'}</span>
                <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.zip" className="hidden" onChange={handleAttachmentUpload} disabled={uploadingAttachment} />
              </label>
            </div>
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span>পঠন সময়: <strong>{readingTime}</strong> মিনিট</span>
          </div>
          <div>
            <Label>Meta Title</Label>
            <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="SEO টাইটেল (ডিফল্ট: শিরোনাম)" />
          </div>
          <div>
            <Label>Meta Description</Label>
            <Textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="SEO বিবরণ — ১৫০-১৬০ অক্ষরের মধ্যে রাখুন"
              rows={3}
            />
          </div>
          <div>
            <Label>Canonical URL</Label>
            <Input value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} placeholder="https://example.com/original-post" />
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
