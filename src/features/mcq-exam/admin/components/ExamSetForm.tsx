'use client'

import { useState } from 'react'
import { ArrowLeft, Timer, Calendar, Tag, Loader2, Save, GraduationCap, RefreshCw, Eye, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { MCQExamSetRecord } from '@/types/admin-mcq-exam'
import { formatDate } from './MCQExamConstants'

interface ValidationErrors {
  [key: string]: string
}

function validateExamSetForm(fields: {
  setTitle: string; setDuration: string; setMarksPerQ: string; setMaxAttempts: string; setOrder: string;
  setPracticeMode: boolean; setAllowUnlimitedAttempts: boolean
}): ValidationErrors {
  const errors: ValidationErrors = {}
  if (!fields.setTitle?.trim()) errors.title = 'শিরোনাম প্রয়োজন'
  if (fields.setDuration === '' || isNaN(Number(fields.setDuration)) || Number(fields.setDuration) <= 0) {
    errors.duration = 'বৈধ সময়কাল দিন'
  }
  if (fields.setMarksPerQ !== '' && (isNaN(Number(fields.setMarksPerQ)) || Number(fields.setMarksPerQ) <= 0)) {
    errors.marksPerQ = 'বৈধ নম্বর দিন'
  }
  if (fields.setPracticeMode && !fields.setAllowUnlimitedAttempts) {
    if (fields.setMaxAttempts === '' || isNaN(Number(fields.setMaxAttempts)) || !Number.isInteger(Number(fields.setMaxAttempts)) || Number(fields.setMaxAttempts) < 1) {
      errors.maxAttempts = 'বৈধ সংখ্যা দিন'
    }
  }
  if (fields.setOrder !== '' && (isNaN(Number(fields.setOrder)) || !Number.isInteger(Number(fields.setOrder)) || Number(fields.setOrder) < 0)) {
    errors.order = 'বৈধ ক্রম নম্বর দিন'
  }
  return errors
}

interface ExamSetFormProps {
  editId: string | null
  currentSet: (MCQExamSetRecord & { questions?: any[] }) | null
  setTitle: string
  setSetTitle: (v: string) => void
  setDescription: string
  setSetDescription: (v: string) => void
  setScheduledDate: string
  setSetScheduledDate: (v: string) => void
  setStartTime: string
  setSetStartTime: (v: string) => void
  setEndTime: string
  setSetEndTime: (v: string) => void
  setDuration: string
  setSetDuration: (v: string) => void
  setMarksPerQ: string
  setSetMarksPerQ: (v: string) => void
  setNegativeMarks: string
  setSetNegativeMarks: (v: string) => void
  setInstructions: string
  setSetInstructions: (v: string) => void
  setAllowRetake: boolean
  setSetAllowRetake: (v: boolean) => void
  setPracticeMode: boolean
  setSetPracticeMode: (v: boolean) => void
  setAllowUnlimitedAttempts: boolean
  setSetAllowUnlimitedAttempts: (v: boolean) => void
  setMaxAttempts: string
  setSetMaxAttempts: (v: string) => void
  setReviewAnswers: boolean
  setSetReviewAnswers: (v: boolean) => void
  setShowExplanations: boolean
  setSetShowExplanations: (v: boolean) => void
  setShowCorrectAnswers: boolean
  setSetShowCorrectAnswers: (v: boolean) => void
  setAutoPublishResults: boolean
  setSetAutoPublishResults: (v: boolean) => void
  setPassMarks: string
  setSetPassMarks: (v: string) => void
  setOrder: string
  setSetOrder: (v: string) => void
  setStatus: string
  setSetStatus: (v: string) => void
  saving: boolean
  onSave: () => void
  onCancel: () => void
}

export function ExamSetForm({
  editId, currentSet, setTitle, setSetTitle, setDescription, setSetDescription,
  setScheduledDate, setSetScheduledDate, setStartTime, setSetStartTime,
  setEndTime, setSetEndTime, setDuration, setSetDuration, setMarksPerQ, setSetMarksPerQ,
  setNegativeMarks, setSetNegativeMarks, setInstructions, setSetInstructions,
  setAllowRetake, setSetAllowRetake,
  setPracticeMode, setSetPracticeMode,
  setAllowUnlimitedAttempts, setSetAllowUnlimitedAttempts,
  setMaxAttempts, setSetMaxAttempts,
  setReviewAnswers, setSetReviewAnswers,
  setShowExplanations, setSetShowExplanations,
  setShowCorrectAnswers, setSetShowCorrectAnswers,
  setAutoPublishResults, setSetAutoPublishResults,
  setPassMarks, setSetPassMarks,
  setOrder, setSetOrder, setStatus, setSetStatus,
  saving, onSave, onCancel
}: ExamSetFormProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})

  function handleSave() {
    const validationErrors = validateExamSetForm({
      setTitle, setDuration, setMarksPerQ, setMaxAttempts, setOrder,
      setPracticeMode, setAllowUnlimitedAttempts
    })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length === 0) {
      onSave()
    }
  }
  const questionCount = currentSet?.totalQuestions || 0
  const autoTotalMarks = parseFloat(setMarksPerQ || '1') * questionCount

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{editId ? 'এক্সাম সেট সম্পাদনা' : 'নতুন এক্সাম সেট'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">সেটের তথ্য পূরণ করুন</p>
        </div>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 px-4 py-3 border-b border-border/30">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Timer className="h-4 w-4 text-emerald-600" /> সেটের তথ্য
          </Label>
        </div>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>শিরোনাম *</Label>
            <Input
              placeholder="যেমন: মডেল টেস্ট ১"
              value={setTitle}
              onChange={(e) => setSetTitle(e.target.value)}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label>বিবরণ</Label>
            <Textarea
              placeholder="সেটের বিবরণ লিখুন..."
              value={setDescription}
              onChange={(e) => setSetDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" /> নির্ধারিত তারিখ *
              </Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !setScheduledDate && 'text-muted-foreground')}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {setScheduledDate ? formatDate(setScheduledDate) : 'তারিখ নির্বাচন করুন'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={setScheduledDate ? new Date(setScheduledDate) : undefined}
                    onSelect={(date) => {
                      setSetScheduledDate(date ? date.toISOString().split('T')[0] : '')
                      setDatePickerOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>স্ট্যাটাস</Label>
              <Select value={setStatus} onValueChange={setSetStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">ড্রাফট</SelectItem>
                  <SelectItem value="PUBLISHED">প্রকাশিত</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>শুরুর সময়</Label>
              <Input type="time" value={setStartTime} onChange={(e) => setSetStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>শেষ সময়</Label>
              <Input type="time" value={setEndTime} onChange={(e) => setSetEndTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-emerald-600" /> সময়কাল (মিনিট)
              </Label>
              <Input type="number" placeholder="30" value={setDuration} onChange={(e) => setSetDuration(e.target.value)} />
              {errors.duration && <p className="text-sm text-red-500">{errors.duration}</p>}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-600" /> নম্বর বিবরণ
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>প্রতি প্রশ্নে নম্বর</Label>
                <Input type="number" step="0.5" value={setMarksPerQ} onChange={(e) => setSetMarksPerQ(e.target.value)} />
                {errors.marksPerQ && <p className="text-sm text-red-500">{errors.marksPerQ}</p>}
              </div>
              <div className="space-y-2">
                <Label>নেগেটিভ মার্কস</Label>
                <Input type="number" step="0.25" value={setNegativeMarks} onChange={(e) => setSetNegativeMarks(e.target.value)} />
              </div>
            </div>

            {questionCount > 0 && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">প্রশ্ন সংখ্যা: <span className="font-semibold text-emerald-700 dark:text-emerald-300">{questionCount}</span></span>
                  <span className="text-muted-foreground">মোট নম্বর: <span className="font-semibold text-emerald-700 dark:text-emerald-300">{autoTotalMarks}</span></span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>নির্দেশনা</Label>
            <Textarea placeholder="পরীক্ষার্থীদের জন্য নির্দেশনা লিখুন..." value={setInstructions} onChange={(e) => setSetInstructions(e.target.value)} rows={3} />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowRetake"
              checked={setAllowRetake}
              onChange={(e) => setSetAllowRetake(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <Label htmlFor="allowRetake" className="cursor-pointer">পুনরায় পরীক্ষা অনুমতি দিন (Retake)</Label>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600" /> প্র্যাকটিস মোড
            </Label>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50/60 to-violet-50/60 dark:from-purple-950/20 dark:to-violet-950/20 border border-purple-200/30 dark:border-purple-800/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                  <RefreshCw className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <Label className="text-sm font-medium">প্র্যাকটিস মোড</Label>
                  <p className="text-xs text-muted-foreground">সক্রিয় থাকলে শিক্ষার্থীরা প্র্যাকটিস মোডে পরীক্ষা দিতে পারবে</p>
                </div>
              </div>
              <Switch checked={setPracticeMode} onCheckedChange={setSetPracticeMode} />
            </div>

            {setPracticeMode && (
              <div className="pl-4 space-y-3 border-l-2 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50/60 to-indigo-50/60 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/30 dark:border-blue-800/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">সীমাহীন প্রচেষ্টা</Label>
                      <p className="text-xs text-muted-foreground">সীমাহীন সংখ্যকবার পরীক্ষা দেওয়ার অনুমতি দিন</p>
                    </div>
                  </div>
                  <Switch checked={setAllowUnlimitedAttempts} onCheckedChange={setSetAllowUnlimitedAttempts} />
                </div>

                {!setAllowUnlimitedAttempts && (
                  <div className="space-y-2">
                    <Label>সর্বোচ্চ প্রচেষ্টা</Label>
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      placeholder="সর্বোচ্চ সংখ্যা"
                      value={setMaxAttempts}
                      onChange={(e) => setSetMaxAttempts(e.target.value)}
                    />
                    {errors.maxAttempts && <p className="text-sm text-red-500">{errors.maxAttempts}</p>}
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-50/60 to-teal-50/60 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                      <Eye className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">উত্তর পর্যালোচনা</Label>
                      <p className="text-xs text-muted-foreground">প্রত্যেক প্রচেষ্টার পর উত্তর দেখার অনুমতি দিন</p>
                    </div>
                  </div>
                  <Switch checked={setReviewAnswers} onCheckedChange={setSetReviewAnswers} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-50/60 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/30 dark:border-amber-800/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                      <MessageSquare className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">ব্যাখ্যা দেখান</Label>
                      <p className="text-xs text-muted-foreground">উত্তর পর্যালোচনার সময় ব্যাখ্যা দেখান</p>
                    </div>
                  </div>
                  <Switch checked={setShowExplanations} onCheckedChange={setSetShowExplanations} />
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-violet-600" /> উত্তর ও মূল্যায়ন সেটিংস
            </Label>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-violet-50/60 to-purple-50/60 dark:from-violet-950/20 dark:to-purple-950/20 border border-violet-200/30 dark:border-violet-800/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40">
                  <Eye className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <Label className="text-sm font-medium">সঠিক উত্তর দেখান</Label>
                  <p className="text-xs text-muted-foreground">মূল্যায়নের পর শিক্ষার্থীদের সঠিক উত্তর দেখানো হবে</p>
                </div>
              </div>
              <Switch checked={setShowCorrectAnswers} onCheckedChange={setSetShowCorrectAnswers} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-teal-50/60 to-emerald-50/60 dark:from-teal-950/20 dark:to-emerald-950/20 border border-teal-200/30 dark:border-teal-800/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40">
                  <Eye className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <Label className="text-sm font-medium">স্বয়ংক্রিয়ভাবে ফলাফল প্রকাশ</Label>
                  <p className="text-xs text-muted-foreground">পরীক্ষা শেষ হলে স্বয়ংক্রিয়ভাবে ফলাফল প্রকাশিত হবে</p>
                </div>
              </div>
              <Switch checked={setAutoPublishResults} onCheckedChange={setSetAutoPublishResults} />
            </div>

            <div className="space-y-2">
              <Label>পাস মার্কস</Label>
              <Input type="number" step="0.5" min="0" value={setPassMarks} onChange={(e) => setSetPassMarks(e.target.value)} />
              <p className="text-xs text-muted-foreground">ফাঁকা রাখলে ৪০% ধরা হবে</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>ক্রম (Order)</Label>
            <Input type="number" placeholder="0" value={setOrder} onChange={(e) => setSetOrder(e.target.value)} />
            {errors.order && <p className="text-sm text-red-500">{errors.order}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'সংরক্ষণ হচ্ছে...' : editId ? 'আপডেট করুন' : 'তৈরি করুন'}
            </Button>
            <Button variant="outline" onClick={onCancel}>বাতিল</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
