'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, Globe, Check, Loader2, Save, Eye, EyeOff, BookOpen, FileQuestion, Trophy, Bookmark, ShoppingBag, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLearningPreference, type LearningMode } from '@/providers/LearningPreferenceProvider'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useToast } from '@/hooks/use-toast'

const FILTERED_CONTENT = [
  { icon: BookOpen, label: 'Subjects & Chapters' },
  { icon: FileQuestion, label: 'MCQ & CQ Practice' },
  { icon: Trophy, label: 'Exams & Results' },
  { icon: Bookmark, label: 'Bookmarks & Notes' },
  { icon: ShoppingBag, label: 'Courses & Packages' },
  { icon: Lightbulb, label: 'Recommendations' },
]

const UNFILTERED_CONTENT = [
  'Home Banner', 'Announcements', 'News', 'Blog',
  'Teacher Directory', 'FAQ', 'Contact', 'Premium Plans',
]

export default function LearningPreferences() {
  const { learningMode, classLevel, setPreference } = useLearningPreference()
  const { metadata } = useHierarchyMetadata()
  const classList = (metadata?.classes || []) as { id: string; name: string; slug: string }[]
  const { toast } = useToast()

  const [selectedMode, setSelectedMode] = useState<LearningMode>(learningMode || 'CLASS_BASED')
  const [selectedClass, setSelectedClass] = useState(classLevel || '')
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setSelectedMode(learningMode || 'CLASS_BASED')
    setSelectedClass(classLevel || '')
  }, [learningMode, classLevel])

  const currentClass = classList.find(c => c.slug === (classLevel || ''))

  const handleSave = async () => {
    // Show confirmation when switching from CLASS_BASED to GLOBAL
    if (learningMode === 'CLASS_BASED' && selectedMode === 'GLOBAL' && !showConfirm) {
      setShowConfirm(true)
      return
    }

    setSaving(true)
    setShowConfirm(false)
    try {
      await setPreference(selectedMode, selectedMode === 'CLASS_BASED' ? selectedClass : null)
      toast({ title: 'সংরক্ষণ করা হয়েছে', description: 'আপনার লার্নিং প্রেফারেন্স আপডেট করা হয়েছে।' })
    } catch {
      toast({ title: 'ত্রুটি', description: 'সংরক্ষণ করতে সমস্যা হয়েছে।', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges =
    selectedMode !== learningMode ||
    (selectedMode === 'CLASS_BASED' && selectedClass !== classLevel && selectedClass !== '')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-emerald-500" />
          শেখার পছন্দ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Preference */}
        <div className="rounded-xl bg-muted/50 p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">বর্তমান পছন্দ</p>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="gap-1.5 text-sm py-1 px-3">
              {learningMode === 'CLASS_BASED' ? <GraduationCap className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              {learningMode === 'CLASS_BASED' ? 'শ্রেণি অনুযায়ী' : 'সব কন্টেন্ট'}
            </Badge>
            {learningMode === 'CLASS_BASED' && currentClass && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1.5 text-sm py-1 px-3">
                <Check className="h-3.5 w-3.5" />
                {currentClass.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Learning Mode Selection */}
        <div className="space-y-3">
          <p className="text-sm font-medium">লার্নিং মোড</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setSelectedMode('CLASS_BASED')}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                selectedMode === 'CLASS_BASED'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                  : 'border-border hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden="true">🎓</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Study by My Class</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Only show content for my selected class</p>
                </div>
                {selectedMode === 'CLASS_BASED' && <Check className="h-5 w-5 text-emerald-500 ml-auto shrink-0" />}
              </div>
            </button>
            <button
              onClick={() => setSelectedMode('GLOBAL')}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                selectedMode === 'GLOBAL'
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/20'
                  : 'border-border hover:border-sky-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden="true">🌍</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Browse Everything</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Show content from every class</p>
                </div>
                {selectedMode === 'GLOBAL' && <Check className="h-5 w-5 text-sky-500 ml-auto shrink-0" />}
              </div>
            </button>
          </div>
        </div>

        {/* Class Selection (only for CLASS_BASED mode) */}
        {selectedMode === 'CLASS_BASED' && (
          <div className="space-y-3">
            <p className="text-sm font-medium">শ্রেণি নির্বাচন</p>
            <div className="flex flex-wrap gap-2">
              {classList.map((cls) => (
                <Button
                  key={cls.id}
                  variant={selectedClass === cls.slug ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedClass(cls.slug)}
                  className={selectedClass === cls.slug ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  {cls.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Preview Section */}
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Eye className="h-4 w-4 text-muted-foreground" />
            পূর্বরূপ — কী দেখানো হবে
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Filtered content */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {selectedMode === 'CLASS_BASED' && selectedClass
                  ? `${classList.find(c => c.slug === selectedClass)?.name || 'Selected Class'} — শুধু এই শ্রেণি`
                  : 'সব ক্লাসের কন্টেন্ট'}
              </p>
              <div className="space-y-1">
                {FILTERED_CONTENT.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <item.icon className="h-3 w-3 shrink-0" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Always shown */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-sky-600 dark:text-sky-400 flex items-center gap-1">
                <EyeOff className="h-3 w-3" />
                সবসময় দেখানো হবে (Unfiltered)
              </p>
              <div className="flex flex-wrap gap-1">
                {UNFILTERED_CONTENT.map((item) => (
                  <Badge key={item} variant="outline" className="text-[10px] py-0 px-1.5 h-5">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              আপনি কি নিশ্চিত?
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              শ্রেণি মোড থেকে সব কন্টেন্ট মোডে পরিবর্তন করলে সব শ্রেণির কন্টেন্ট দেখানো হবে।
              আপনি পরে আবার শ্রেণি নির্বাচন করতে পারবেন।
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>
                বাতিল
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
                নিশ্চিত করুন
              </Button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-2 border-t">
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            সংরক্ষণ করুন
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
