'use client'

import { useState } from 'react'
import { useAdminBlogCategories } from '@/features/blog/hooks/use-admin-blogs'
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
import type { BlogCategoryRecord } from '@/features/blog/types/blog'

export default function AdminBlogCategoriesPage() {
  const { categories, isLoading, invalidate } = useAdminBlogCategories()
  const [open, setOpen] = useState(false)
  const [editCat, setEditCat] = useState<BlogCategoryRecord | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('')
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setName('')
    setColor('')
    setEditCat(null)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editCat) {
        await blogService.admin.categories.update(editCat.id, { name, color: color || null })
      } else {
        await blogService.admin.categories.create({ name, color: color || null })
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

  const handleEdit = (cat: BlogCategoryRecord) => {
    setEditCat(cat)
    setName(cat.name)
    setColor(cat.color || '')
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ক্যাটাগরিটি মুছে ফেলবেন?')) return
    try {
      await blogService.admin.categories.remove(id)
      invalidate()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ব্লগ ক্যাটাগরি</h1>
          <p className="text-muted-foreground text-sm mt-1">ব্লগ পোস্টের ক্যাটাগরি ব্যবস্থাপনা</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              নতুন ক্যাটাগরি
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editCat ? 'ক্যাটাগরি এডিট' : 'নতুন ক্যাটাগরি'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>নাম</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ক্যাটাগরির নাম" />
              </div>
              <div>
                <Label>রং (হেক্স)</Label>
                <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#6366f1" />
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
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    কোনো ক্যাটাগরি নেই
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                    <TableCell>{(cat as any)._count?.posts || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
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
