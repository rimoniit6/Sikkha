'use client'

import { useState } from 'react'
import { useAdminBlogTags } from '@/features/blog/hooks/use-admin-blogs'
import { blogService } from '@/features/blog/services/blog.service'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { BlogTagRecord } from '@/features/blog/types/blog'

export default function AdminBlogTagsPage() {
  const { tags, isLoading, invalidate } = useAdminBlogTags()
  const [open, setOpen] = useState(false)
  const [editTag, setEditTag] = useState<BlogTagRecord | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const resetForm = () => { setName(''); setEditTag(null) }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editTag) {
        await blogService.admin.tags.update(editTag.id, { name })
      } else {
        await blogService.admin.tags.create({ name })
      }
      invalidate()
      setOpen(false)
      resetForm()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (tag: BlogTagRecord) => {
    setEditTag(tag); setName(tag.name); setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ট্যাগটি মুছে ফেলবেন?')) return
    try {
      await blogService.admin.tags.remove(id)
      invalidate()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ব্লগ ট্যাগ</h1>
          <p className="text-muted-foreground text-sm mt-1">ব্লগ পোস্টের ট্যাগ ব্যবস্থাপনা</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              নতুন ট্যাগ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editTag ? 'ট্যাগ এডিট' : 'নতুন ট্যাগ'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>নাম</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ট্যাগের নাম" />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'সেভ হচ্ছে...' : 'সেভ'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <Card>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>নাম</TableHead>
                <TableHead>স্লাগ</TableHead>
                <TableHead>পোস্ট সংখ্যা</TableHead>
                <TableHead className="w-[100px]">অ্যাকশন</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    কোনো ট্যাগ নেই
                  </TableCell>
                </TableRow>
              ) : (
                tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell className="text-muted-foreground">{tag.slug}</TableCell>
                    <TableCell>{(tag as any)._count?.posts || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(tag)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tag.id)}>
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
    </div>
  )
}
