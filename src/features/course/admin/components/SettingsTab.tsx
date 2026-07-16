'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface Props {
  course: { hasCertificate?: boolean; metaTitle?: string | null; metaDescription?: string | null }
  onSave: (data: { hasCertificate: boolean; metaTitle: string; metaDescription: string }) => Promise<void>
}

export default function SettingsTab({ course, onSave }: Props) {
  const { toast } = useToast()
  const [certificateEnabled, setCertificateEnabled] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setCertificateEnabled(Boolean(course?.hasCertificate))
    setMetaTitle(course?.metaTitle || '')
    setMetaDescription(course?.metaDescription || '')
  }, [course])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        hasCertificate: certificateEnabled,
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
      })
      toast({ title: 'সংরক্ষণ করা হয়েছে' })
    } catch {
      toast({ title: 'ত্রুটি', description: 'সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>সার্টিফিকেট</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Switch checked={certificateEnabled} onCheckedChange={setCertificateEnabled} />
            <Label>সার্টিফিকেট সক্রিয় করুন</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            শিক্ষার্থী কোর্সটি সম্পূর্ণ করলে স্বয়ংক্রিয়ভাবে সার্টিফিকেট তৈরি হবে।
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Meta Title</Label><Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Meta Description</Label><Textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}
      </Button>
    </div>
  )
}
