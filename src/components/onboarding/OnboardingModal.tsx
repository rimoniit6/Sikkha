'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Globe, Check, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import type { LearningMode } from '@/providers/LearningPreferenceProvider'

interface Props {
  open: boolean
  onComplete: (mode: LearningMode, classLevel?: string | null) => Promise<void>
  onSkip: () => void
}

type Step = 'choose-mode' | 'pick-class' | 'saving'

function ClassIcon({ slug }: { slug: string }) {
  const icons: Record<string, string> = {
    'class-6': '🎯', 'class-7': '🎯', 'class-8': '🎯',
    'ssc': '📚', 'hsc': '🎓',
  }
  return <span className="text-3xl" aria-hidden="true">{icons[slug] || '📖'}</span>
}

function SkeletonClassCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl border-2 border-border p-5 text-center">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="mx-auto mt-3 h-5 w-24" />
          <Skeleton className="mx-auto mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

export function OnboardingModal({ open, onComplete, onSkip }: Props) {
  const [step, setStep] = useState<Step>('choose-mode')
  const [selectedMode, setSelectedMode] = useState<LearningMode | null>(null)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const modeCardRef = useRef<HTMLButtonElement>(null)
  const classButtonRefs = useRef<(HTMLButtonElement | null)[]>([])

  const { metadata, loading: metaLoading } = useHierarchyMetadata()
  const classList = (metadata?.classes || []) as { id: string; name: string; slug: string; description?: string; gradient?: string; icon?: string; _count?: { chapters?: number; subjects?: number } }[]

  useEffect(() => {
    if (open) {
      setStep('choose-mode')
      setSelectedMode(null)
      setSelectedClassId('')
      setSaving(false)
      setError('')
    }
  }, [open])

  // Focus management: auto-focus first interactive element on step change
  useEffect(() => {
    if (!open) return
    if (step === 'choose-mode' && modeCardRef.current) {
      modeCardRef.current.focus()
    }
    if (step === 'pick-class' && classButtonRefs.current[0]) {
      classButtonRefs.current[0]?.focus()
    }
  }, [open, step])

  // Keyboard navigation for class cards
  const handleClassKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const buttons = classButtonRefs.current
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = buttons[index + 1] || buttons[0]
      next?.focus()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = buttons[index - 1] || buttons[buttons.length - 1]
      prev?.focus()
    }
  }, [])

  // Escape to go back
  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step === 'pick-class' && !saving) {
        setStep('choose-mode')
        setSelectedMode(null)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, step, saving])

  if (!open) return null

  const handleModeSelect = (mode: LearningMode) => {
    setSelectedMode(mode)
    if (mode === 'GLOBAL') {
      handleSave('GLOBAL')
    } else {
      setStep('pick-class')
    }
  }

  const handleSave = async (mode: LearningMode, classId?: string) => {
    setSaving(true)
    setError('')
    try {
      await onComplete(mode, classId || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <AnimatePresence mode="wait">
        {step === 'choose-mode' && (
          <motion.div
            key="choose-mode"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl"
          >
            <Card className="border-0 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white text-center">
                <GraduationCap className="mx-auto h-12 w-12 mb-3 opacity-90" aria-hidden="true" />
                <h2 id="onboarding-title" className="text-2xl font-bold">আপনার শেখার পথ বেছে নিন</h2>
                <p className="mt-2 text-emerald-100 text-sm">
                  আপনি কিভাবে প্ল্যাটফর্মটি ব্যবহার করতে চান?
                </p>
              </div>
              <CardContent className="p-6 space-y-4">
                <button
                  ref={modeCardRef}
                  onClick={() => handleModeSelect('CLASS_BASED')}
                  className="w-full text-left group"
                  aria-describedby="class-based-desc"
                >
                  <div className="relative rounded-xl border-2 border-transparent hover:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-5 transition-all hover:shadow-md outline-none">
                    <div className="flex items-start gap-4">
                      <span className="text-4xl shrink-0" aria-hidden="true">🎓</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">Study by My Class</h3>
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded-full">Recommended</span>
                        </div>
                        <p id="class-based-desc" className="mt-1 text-sm text-muted-foreground">
                          Only show content for my selected class. This includes Subjects, Chapters, Lectures, MCQ, CQ, Knowledge Questions, Board Questions, Assignments, Notes, Study Progress, Recommendations, Courses, and Packages.
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 mt-1 text-emerald-500 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" aria-hidden="true" />
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleModeSelect('GLOBAL')}
                  className="w-full text-left group"
                  aria-describedby="global-desc"
                >
                  <div className="relative rounded-xl border-2 border-transparent hover:border-sky-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30 p-5 transition-all hover:shadow-md outline-none">
                    <div className="flex items-start gap-4">
                      <span className="text-4xl shrink-0" aria-hidden="true">🌍</span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg">Browse Everything</h3>
                        <p id="global-desc" className="mt-1 text-sm text-muted-foreground">
                          Show content from every class. Recommended for Teachers, Parents, General Learners, and Administrators.
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 mt-1 text-sky-500 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" aria-hidden="true" />
                    </div>
                  </div>
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'pick-class' && (
          <motion.div
            key="pick-class"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-3xl"
          >
            <Card className="border-0 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
                <h2 id="onboarding-title" className="text-xl font-bold">আপনার শ্রেণি নির্বাচন করুন</h2>
                <p className="mt-1 text-emerald-100 text-sm">
                  কোন শ্রেণির কন্টেন্ট দেখতে চান?
                </p>
              </div>
              <CardContent className="p-6">
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 text-sm" role="alert">
                    {error}
                  </div>
                )}

                <div aria-live="polite" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {metaLoading ? (
                    <SkeletonClassCards />
                  ) : (
                    classList.map((cls, index) => (
                      <button
                        key={cls.id}
                        ref={(el) => { classButtonRefs.current[index] = el }}
                        onClick={() => { setSelectedClassId(cls.slug); handleSave('CLASS_BASED', cls.slug) }}
                        onKeyDown={(e) => handleClassKeyDown(e, index)}
                        disabled={saving}
                        className="group relative"
                        aria-label={`${cls.name} - ${cls._count?.subjects || 0} subjects, ${cls._count?.chapters || 0} chapters`}
                        aria-pressed={selectedClassId === cls.slug}
                      >
                        <div className={`rounded-xl border-2 p-5 text-center transition-all hover:shadow-lg focus:ring-2 focus:ring-emerald-500/20 outline-none ${
                          selectedClassId === cls.slug
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'border-border bg-card hover:border-emerald-300'
                        }`}>
                          <ClassIcon slug={cls.slug} />
                          <h3 className="mt-3 font-bold text-lg">{cls.name}</h3>
                          {cls._count && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {cls._count.subjects || 0} subjects · {cls._count.chapters || 0} chapters
                            </p>
                          )}
                          {selectedClassId === cls.slug && (
                            <div className="mt-2">
                              <Check className="mx-auto h-5 w-5 text-emerald-500" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {saving && (
          <motion.div
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40"
            role="status"
            aria-live="polite"
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 flex flex-col items-center gap-3 shadow-2xl">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" aria-hidden="true" />
              <p className="text-sm font-medium text-muted-foreground">Setting up your experience...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
