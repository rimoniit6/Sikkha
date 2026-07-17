'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronUp, ChevronDown, Copy, Trash2,
  Video, Radio, Link, Clock, FileText, StickyNote, Paperclip, Pencil, Save, X,
  Check, Loader2, Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import type {
  CourseLessonRecord,
  LessonNoteRecord,
  LessonResourceRecord,
  LessonScheduleRecord,
} from '@/features/course/types'
import { LESSON_TYPE_META } from '../ui/use-course-constants'

export type EditorStep = 'basic' | 'setup' | 'schedule' | 'resources'
const EDITOR_STEPS: { id: EditorStep; label: string }[] = [
  { id: 'basic', label: 'মৌলিক তথ্য' },
  { id: 'setup', label: 'সেটআপ' },
  { id: 'schedule', label: 'সময়সূচী' },
  { id: 'resources', label: 'নোট ও রিসোর্স' },
]

interface Props {
  courseId: string
  lesson: CourseLessonRecord
  index: number
  total: number
  isEditing: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onEdit: () => void
  onEditEnd: () => void
  onDelete: () => void
  onDuplicate: () => void
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>
  onAddNote: (data: Record<string, unknown>) => Promise<void>
  onRemoveNote: (id: string) => Promise<void>
  onAddResource: (data: Record<string, unknown>) => Promise<void>
  onRemoveResource: (id: string) => Promise<void>
  onSetSchedule: (lessonId: string, date?: string, startTime?: string, endTime?: string) => Promise<void>
  onRemoveSchedule: (lessonId: string) => Promise<void>
}

export default function LessonCard({
  courseId, lesson, index, total, isEditing,
  onMoveUp, onMoveDown, onEdit, onEditEnd, onDelete, onDuplicate,
  onUpdate, onAddNote, onRemoveNote, onAddResource, onRemoveResource,
  onSetSchedule, onRemoveSchedule,
}: Props) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [currentStep, setCurrentStep] = useState<EditorStep>('basic')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formType, setFormType] = useState<'LIVE' | 'RECORDED'>('LIVE')
  const [meetingLink, setMeetingLink] = useState('')
  const [meetingId, setMeetingId] = useState('')
  const [platform, setPlatform] = useState('')
  const [password, setPassword] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [previewVideo, setPreviewVideo] = useState('')
  const [videoDuration, setVideoDuration] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteType, setNoteType] = useState('link')
  const [noteContent, setNoteContent] = useState('')
  const [noteFileUrl, setNoteFileUrl] = useState('')
  const [noteLink, setNoteLink] = useState('')
  const [resTitle, setResTitle] = useState('')
  const [resType, setResType] = useState('link')
  const [resFileUrl, setResFileUrl] = useState('')
  const [resLink, setResLink] = useState('')

  const schedule = lesson.schedules?.[0]

  function openEditor() {
    setFormTitle(lesson.title)
    setFormDesc(lesson.description || '')
    setFormType((lesson.lessonType === 'RECORDED' ? 'RECORDED' : 'LIVE'))
    setMeetingLink(lesson.meetingLink || '')
    setMeetingId(lesson.meetingId || '')
    setPlatform(lesson.platform || '')
    setPassword(lesson.password || '')
    setVideoUrl(lesson.videoUrl || '')
    setPreviewVideo(lesson.previewVideo || '')
    setVideoDuration(lesson.duration?.toString() || '')
    setScheduleDate(lesson.schedules?.[0]?.date?.slice(0, 10) || '')
    setStartTime(lesson.schedules?.[0]?.startTime || '')
    setEndTime(lesson.schedules?.[0]?.endTime || '')
    setCurrentStep('basic')
    setSaveError(null)
    onEdit()
  }

  async function handleSaveStep() {
    setSaving(true)
    setSaveError(null)
    try {
      if (currentStep === 'basic') {
        if (!formTitle.trim()) { setSaveError('শিরোনাম আবশ্যক'); setSaving(false); return }
        await onUpdate(lesson.id, {
          title: formTitle.trim(),
          description: formDesc || null,
          lessonType: formType,
        })
        setCurrentStep('setup')
      } else if (currentStep === 'setup') {
        await onUpdate(lesson.id, formType === 'LIVE'
          ? { meetingLink: meetingLink || null, meetingId: meetingId || null, platform: platform || null, password: password || null }
          : { videoUrl: videoUrl || null, previewVideo: previewVideo || null, duration: videoDuration ? parseInt(videoDuration) : null }
        )
        setCurrentStep('schedule')
      } else if (currentStep === 'schedule') {
        await onSetSchedule(lesson.id, scheduleDate || undefined, startTime || undefined, endTime || undefined)
        setCurrentStep('resources')
      }
    } catch {
      setSaveError('সংরক্ষণে সমস্যা হয়েছে')
    } finally { setSaving(false) }
  }

  async function handleAddNote() {
    if (!noteTitle.trim()) return
    await onAddNote({
      lessonId: lesson.id,
      title: noteTitle.trim(),
      type: noteType,
      content: noteContent || null,
      fileUrl: noteFileUrl || null,
      link: noteLink || null,
    })
    setNoteTitle(''); setNoteContent(''); setNoteFileUrl(''); setNoteLink('')
  }

  async function handleAddResource() {
    if (!resTitle.trim()) return
    await onAddResource({
      lessonId: lesson.id,
      title: resTitle.trim(),
      type: resType,
      fileUrl: resFileUrl || null,
      link: resLink || null,
    })
    setResTitle(''); setResFileUrl(''); setResLink('')
  }

  const isStepDone = (stepId: EditorStep) => {
    if (stepId === 'basic') return !!(lesson.title)
    if (stepId === 'setup') {
      if (lesson.lessonType === 'LIVE') return !!(lesson.meetingLink || lesson.meetingId)
      return !!(lesson.videoUrl)
    }
    return false
  }

  return (
    <>
      <Card className={cn(
        'overflow-hidden transition-all duration-200',
        isEditing ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'hover:shadow-sm border',
      )}>
        {!isEditing ? (
          <CardContent className="flex items-start gap-3 p-3.5">
            <div className="flex flex-col items-center gap-0.5 pt-0.5">
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onMoveUp} disabled={index === 0}>
                <ChevronUp className="h-3 w-3" />
              </Button>
              <span className="text-xs font-semibold text-muted-foreground tabular-nums w-5 text-center">{index + 1}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onMoveDown} disabled={index === total - 1}>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="truncate font-medium text-sm">{lesson.title}</span>
                <TypeBadge lessonType={lesson.lessonType} />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {schedule?.date && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(schedule.date).toLocaleDateString('bn-BD')}
                  </span>
                )}
                {schedule?.startTime && <span>{schedule.startTime}{schedule.endTime ? `-${schedule.endTime}` : ''}</span>}
                {lesson.lessonType === 'LIVE' && lesson.meetingLink && (
                  <span className="flex items-center gap-1"><Link className="h-3 w-3" />লিংক</span>
                )}
                {lesson.lessonType === 'RECORDED' && lesson.videoUrl && (
                  <span className="flex items-center gap-1"><Video className="h-3 w-3" />ভিডিও</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(lesson.assignments || []).map(a => (
                  <Badge key={a.id} variant="outline" className="text-[10px] border-amber-300 text-amber-700">অ্যাসাইনমেন্ট</Badge>
                ))}
                {(lesson.notes || []).length > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600">
                    <StickyNote className="h-3 w-3" />{lesson.notes.length}
                  </span>
                )}
                {(lesson.resources || []).length > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600">
                    <Paperclip className="h-3 w-3" />{lesson.resources.length}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <Button variant="ghost" size="sm" onClick={openEditor} className="gap-1 h-8">
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">সম্পাদনা</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={onDuplicate} title="ডুপ্লিকেট">
                <Copy className="h-4 w-4" />
              </Button>
              <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>পাঠ মুছবেন?</AlertDialogTitle>
                    <AlertDialogDescription>
                      "{lesson.title}" এবং এর সাথে সংযুক্ত সব ডেটা স্থায়ীভাবে মুছে যাবে।
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>বাতিল</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">মুছুন</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-4">
            <EditorStepIndicator currentStep={currentStep} steps={EDITOR_STEPS} isStepDone={isStepDone} />
            {saveError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {saveError}
              </div>
            )}
            <ScrollArea className="mt-4 max-h-[calc(100vh-320px)]">
              <AnimatePresence mode="wait">
                {currentStep === 'basic' && (
                  <motion.div key="basic" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
                    <EditorBasicStep
                      title={formTitle} onTitleChange={setFormTitle}
                      description={formDesc} onDescriptionChange={setFormDesc}
                      lessonType={formType} onLessonTypeChange={setFormType}
                    />
                  </motion.div>
                )}
                {currentStep === 'setup' && (
                  <motion.div key="setup" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
                    <EditorSetupStep
                      lessonType={formType}
                      meetingLink={meetingLink} onMeetingLinkChange={setMeetingLink}
                      meetingId={meetingId} onMeetingIdChange={setMeetingId}
                      platform={platform} onPlatformChange={setPlatform}
                      password={password} onPasswordChange={setPassword}
                      videoUrl={videoUrl} onVideoUrlChange={setVideoUrl}
                      previewVideo={previewVideo} onPreviewVideoChange={setPreviewVideo}
                      duration={videoDuration} onDurationChange={setVideoDuration}
                    />
                  </motion.div>
                )}
                {currentStep === 'schedule' && (
                  <motion.div key="schedule" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
                    <EditorScheduleStep
                      date={scheduleDate} onDateChange={setScheduleDate}
                      startTime={startTime} onStartTimeChange={setStartTime}
                      endTime={endTime} onEndTimeChange={setEndTime}
                    />
                  </motion.div>
                )}
                {currentStep === 'resources' && (
                  <motion.div key="resources" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
                    <EditorResourcesStep
                      notes={lesson.notes || []} onAddNote={handleAddNote} onRemoveNote={onRemoveNote}
                      resources={lesson.resources || []} onAddResource={handleAddResource} onRemoveResource={onRemoveResource}
                      noteTitle={noteTitle} onNoteTitleChange={setNoteTitle}
                      noteType={noteType} onNoteTypeChange={setNoteType}
                      noteContent={noteContent} onNoteContentChange={setNoteContent}
                      noteFileUrl={noteFileUrl} onNoteFileUrlChange={setNoteFileUrl}
                      noteLink={noteLink} onNoteLinkChange={setNoteLink}
                      resTitle={resTitle} onResTitleChange={setResTitle}
                      resType={resType} onResTypeChange={setResType}
                      resFileUrl={resFileUrl} onResFileUrlChange={setResFileUrl}
                      resLink={resLink} onResLinkChange={setResLink}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>

            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <Button variant="ghost" onClick={onEditEnd} className="gap-1.5 h-9">
                <X className="h-4 w-4" />
                বাতিল
              </Button>
              <div className="flex items-center gap-2">
                {currentStep !== 'basic' && (
                  <Button variant="outline" onClick={() => setCurrentStep(p => {
                    const idx = EDITOR_STEPS.findIndex(s => s.id === p)
                    return EDITOR_STEPS[Math.max(0, idx - 1)].id
                  })} className="h-9">
                    পূর্ববর্তী
                  </Button>
                )}
                <Button onClick={handleSaveStep} disabled={saving} className="gap-1.5 h-9">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {currentStep === EDITOR_STEPS[EDITOR_STEPS.length - 1].id ? 'সম্পন্ন' : 'পরবর্তী'}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </>
  )
}

function EditorStepIndicator({ currentStep, steps, isStepDone }: {
  currentStep: EditorStep
  steps: { id: EditorStep; label: string }[]
  isStepDone: (id: EditorStep) => boolean
}) {
  const currentIdx = steps.findIndex(s => s.id === currentStep)
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => {
        const done = i < currentIdx || isStepDone(s.id)
        const active = s.id === currentStep
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className={cn(
              'flex items-center justify-center rounded-full text-[11px] font-bold h-7 w-7 shrink-0 transition-all',
              active && 'ring-4 ring-primary/20 scale-110',
              done ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/15 text-muted-foreground',
            )}>
              {done && i < currentIdx ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={cn('text-[10px] ml-1.5 hidden sm:inline', active ? 'text-foreground font-medium' : 'text-muted-foreground')}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={cn(
                'mx-2 h-0.5 flex-1',
                done ? 'bg-primary/50' : 'bg-muted-foreground/10',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function EditorBasicStep({
  title, onTitleChange, description, onDescriptionChange, lessonType, onLessonTypeChange,
}: {
  title: string; onTitleChange: (v: string) => void
  description: string; onDescriptionChange: (v: string) => void
  lessonType: 'LIVE' | 'RECORDED'
  onLessonTypeChange: (v: 'LIVE' | 'RECORDED') => void
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">শিরোনাম <span className="text-destructive">*</span></Label>
        <Input value={title} onChange={e => onTitleChange(e.target.value)} placeholder="যেমন: বীজগণিতের পরিচিতি" className="h-10" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">পাঠের ধরন</Label>
        <RadioGroup
          value={lessonType}
          onValueChange={v => onLessonTypeChange(v as 'LIVE' | 'RECORDED')}
          className="grid grid-cols-2 gap-3"
        >
          <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
            <RadioGroupItem value="LIVE" />
            <Radio className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">লাইভ ক্লাস</span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
            <RadioGroupItem value="RECORDED" />
            <Video className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">রেকর্ডেড ক্লাস</span>
          </label>
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">বিবরণ</Label>
        <Textarea value={description} onChange={e => onDescriptionChange(e.target.value)} rows={3} className="resize-none" />
      </div>
    </div>
  )
}

function EditorSetupStep({
  lessonType, meetingLink, onMeetingLinkChange, meetingId, onMeetingIdChange,
  platform, onPlatformChange, password, onPasswordChange,
  videoUrl, onVideoUrlChange, previewVideo, onPreviewVideoChange, duration, onDurationChange,
}: {
  lessonType: 'LIVE' | 'RECORDED'
  meetingLink: string; onMeetingLinkChange: (v: string) => void
  meetingId: string; onMeetingIdChange: (v: string) => void
  platform: string; onPlatformChange: (v: string) => void
  password: string; onPasswordChange: (v: string) => void
  videoUrl: string; onVideoUrlChange: (v: string) => void
  previewVideo: string; onPreviewVideoChange: (v: string) => void
  duration: string; onDurationChange: (v: string) => void
}) {
  return (
    <div className="space-y-5">
      {lessonType === 'LIVE' ? (
        <>
          <div className="flex items-center gap-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 px-4 py-2.5">
            <Radio className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-700 dark:text-blue-300">লাইভ ক্লাসের মিটিং তথ্য দিন</p>
          </div>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">মিটিং লিংক</Label>
              <Input value={meetingLink} onChange={e => onMeetingLinkChange(e.target.value)} placeholder="https://meet.google.com/..." className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">মিটিং ID</Label>
                <Input value={meetingId} onChange={e => onMeetingIdChange(e.target.value)} placeholder="xyz-abc-123" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">প্ল্যাটফর্ম</Label>
                <Input value={platform} onChange={e => onPlatformChange(e.target.value)} placeholder="Google Meet, Zoom..." className="h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">পাসওয়ার্ড</Label>
              <Input value={password} onChange={e => onPasswordChange(e.target.value)} placeholder="ঐচ্ছিক" className="h-10" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 px-4 py-2.5">
            <Video className="h-4 w-4 text-purple-600" />
            <p className="text-sm text-purple-700 dark:text-purple-300">রেকর্ডেড ক্লাসের ভিডিও তথ্য দিন</p>
          </div>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">ভিডিও URL</Label>
              <Input value={videoUrl} onChange={e => onVideoUrlChange(e.target.value)} placeholder="https://youtube.com/..." className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">প্রিভিউ ভিডিও</Label>
                <Input value={previewVideo} onChange={e => onPreviewVideoChange(e.target.value)} placeholder="https://youtube.com/..." className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">মেয়াদ (মিনিট)</Label>
                <Input type="number" value={duration} onChange={e => onDurationChange(e.target.value)} placeholder="৩০" className="h-10" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function EditorScheduleStep({
  date, onDateChange, startTime, onStartTimeChange, endTime, onEndTimeChange,
}: {
  date: string; onDateChange: (v: string) => void
  startTime: string; onStartTimeChange: (v: string) => void
  endTime: string; onEndTimeChange: (v: string) => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5">
        <Clock className="h-4 w-4 text-amber-600" />
        <p className="text-sm text-amber-700 dark:text-amber-300">পাঠের তারিখ ও সময় নির্ধারণ (ঐচ্ছিক)</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">তারিখ</Label>
          <Input type="date" value={date} onChange={e => onDateChange(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">শুরুর সময়</Label>
          <Input type="time" value={startTime} onChange={e => onStartTimeChange(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">শেষের সময়</Label>
          <Input type="time" value={endTime} onChange={e => onEndTimeChange(e.target.value)} className="h-10" />
        </div>
      </div>
    </div>
  )
}

function EditorResourcesStep({
  notes, onAddNote, onRemoveNote, resources, onAddResource, onRemoveResource,
  noteTitle, onNoteTitleChange, noteType, onNoteTypeChange,
  noteContent, onNoteContentChange, noteFileUrl, onNoteFileUrlChange, noteLink, onNoteLinkChange,
  resTitle, onResTitleChange, resType, onResTypeChange,
  resFileUrl, onResFileUrlChange, resLink, onResLinkChange,
}: {
  notes: LessonNoteRecord[]; onAddNote: () => Promise<void>; onRemoveNote: (id: string) => Promise<void>
  resources: LessonResourceRecord[]; onAddResource: () => Promise<void>; onRemoveResource: (id: string) => Promise<void>
  noteTitle: string; onNoteTitleChange: (v: string) => void
  noteType: string; onNoteTypeChange: (v: string) => void
  noteContent: string; onNoteContentChange: (v: string) => void
  noteFileUrl: string; onNoteFileUrlChange: (v: string) => void
  noteLink: string; onNoteLinkChange: (v: string) => void
  resTitle: string; onResTitleChange: (v: string) => void
  resType: string; onResTypeChange: (v: string) => void
  resFileUrl: string; onResFileUrlChange: (v: string) => void
  resLink: string; onResLinkChange: (v: string) => void
}) {
  const [addingNoteTitle, setAddingNoteTitle] = useState(true)
  const [addingResTitle, setAddingResTitle] = useState(true)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-sky-50/50 dark:bg-sky-950/10 p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <StickyNote className="h-5 w-5 text-sky-600" />
          <h4 className="text-sm font-semibold">নোট</h4>
          <Badge variant="outline" className="text-[10px]">{notes.length}টি</Badge>
        </div>
        {notes.length > 0 && (
          <div className="space-y-1.5">
            {notes.map(n => (
              <div key={n.id} className="flex items-center justify-between rounded-lg bg-background border px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{n.title}</p>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{n.type}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemoveNote(n.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="নোটের শিরোনাম" value={noteTitle} onChange={e => onNoteTitleChange(e.target.value)} className="h-9 text-sm" />
            <Select value={noteType} onValueChange={onNoteTypeChange}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="link">লিংক</SelectItem>
                <SelectItem value="richtext">রিচ টেক্সট</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {noteType === 'link' && <Input placeholder="https://..." value={noteLink} onChange={e => onNoteLinkChange(e.target.value)} className="h-9 text-sm" />}
          {noteType === 'pdf' && <Input placeholder="https://example.com/file.pdf" value={noteFileUrl} onChange={e => onNoteFileUrlChange(e.target.value)} className="h-9 text-sm" />}
          {noteType === 'richtext' && <Textarea placeholder="HTML কন্টেন্ট লিখুন..." value={noteContent} onChange={e => onNoteContentChange(e.target.value)} rows={2} className="resize-none text-sm" />}
          <Button size="sm" disabled={!noteTitle.trim()} onClick={onAddNote} className="gap-1.5 h-9">
            <Plus className="h-3.5 w-3.5" />নোট যোগ করুন
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/10 p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <Paperclip className="h-5 w-5 text-emerald-600" />
          <h4 className="text-sm font-semibold">রিসোর্স</h4>
          <Badge variant="outline" className="text-[10px]">{resources.length}টি</Badge>
        </div>
        {resources.length > 0 && (
          <div className="space-y-1.5">
            {resources.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-background border px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{r.title}</p>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{r.type}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onRemoveResource(r.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="রিসোর্সের শিরোনাম" value={resTitle} onChange={e => onResTitleChange(e.target.value)} className="h-9 text-sm" />
            <Select value={resType} onValueChange={onResTypeChange}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="link">লিংক</SelectItem>
                <SelectItem value="file">ফাইল</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder={resType === 'link' ? 'https://...' : 'https://example.com/file.pdf'}
            value={resType === 'link' ? resLink : resFileUrl}
            onChange={e => resType === 'link' ? onResLinkChange(e.target.value) : onResFileUrlChange(e.target.value)}
            className="h-9 text-sm"
          />
          <Button size="sm" disabled={!resTitle.trim()} onClick={onAddResource} className="gap-1.5 h-9">
            <Plus className="h-3.5 w-3.5" />
            রিসোর্স যোগ করুন
          </Button>
        </div>
      </div>
    </div>
  )
}

function TypeBadge({ lessonType }: { lessonType: string }) {
  const meta = LESSON_TYPE_META[lessonType]
  if (!meta) return null
  const Icon = meta.icon
  return (
    <Badge variant={lessonType === 'LIVE' ? 'default' : 'secondary'} className={cn('shrink-0 text-[10px] gap-0.5', meta.className)}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  )
}

function createPlaceholder(courseId: string, index: number): Partial<CourseLessonRecord> {
  return {
    id: `__new_${Date.now()}_${index}`,
    courseId,
    title: '',
    description: '',
    lessonType: 'LIVE',
    meetingLink: null,
    meetingId: null,
    platform: null,
    password: null,
    videoUrl: null,
    previewVideo: null,
    duration: null,
    displayOrder: index,
    assignments: [],
    schedules: [],
    notes: [],
    resources: [],
  }
}

import { cn } from '@/lib/utils'
