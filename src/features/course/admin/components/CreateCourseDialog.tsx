'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { courseAdminService } from '@/services/api/course-admin.service'
import { useAutoSlug } from '@/hooks/use-auto-slug'
import SlugField from '@/components/ui/slug-field'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreateCourseDialog({ onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { slug, setSlug } = useAutoSlug(title)

  async function handleCreate() {
    if (!title || !slug) return
    setSaving(true)
    setError('')
    try {
      await courseAdminService.create({ title, slug, description: description || undefined })
      onCreated()
    } catch (e: any) {
      setError(e?.message || 'কোর্স তৈরি করা যায়নি')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>নতুন কোর্স</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>শিরোনাম *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="কোর্সের নাম" />
          </div>
          <SlugField
            value={slug}
            onChange={setSlug}
            sourceText={title}
            previewPrefix="courses"
          />
          <div className="space-y-2">
            <Label>বিবরণ</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="কোর্স সম্পর্কে সংক্ষিপ্ত বিবরণ" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>বাতিল</Button>
          <Button onClick={handleCreate} disabled={!title || !slug || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            তৈরি করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
