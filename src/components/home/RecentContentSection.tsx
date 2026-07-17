'use client'

import { useEffect, useState } from 'react'
import { Clock, ArrowRight, Eye, FileQuestion, Inbox } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouterStore } from '@/store/router'
import { useLearningPreference } from '@/providers/LearningPreferenceProvider'

interface McqItem {
  id: string
  question?: string
  text?: string
  questionType?: string
  difficulty?: string
  subjectName?: string
  chapterName?: string
  classLevelName?: string
  board?: string
  year?: string
}

function getTypeBadgeColor(type: string): string {
  switch (type?.toUpperCase()) {
    case 'MCQ':
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0'
    case 'CQ':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-0'
    case 'SQ':
      return 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-0'
    default:
      return 'bg-muted text-muted-foreground border-0'
  }
}

function getTypeLabel(type: string): string {
  switch (type?.toUpperCase()) {
    case 'MCQ':
      return 'MCQ'
    case 'CQ':
      return 'CQ'
    case 'SQ':
      return 'সংক্ষিপ্ত'
    default:
      return type || 'অন্যান্য'
  }
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="snap-center min-w-[280px] sm:min-w-0"
        >
          <Card className="h-full">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-24 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </>
  )
}

export default function RecentContentSection() {
  const navigate = useRouterStore((s) => s.navigate)
  const { learningMode, classLevel } = useLearningPreference()
  const [mcqs, setMcqs] = useState<McqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchRecent() {
      try {
        const params = new URLSearchParams({ limit: '10' })
        if (learningMode === 'CLASS_BASED' && classLevel) {
          params.set('classLevel', classLevel)
        }
        const res = await fetch(`/api/mcq?${params.toString()}`)
        if (!res.ok) throw new Error('ফেচ করতে সমস্যা হয়েছে')
        const json = await res.json()
        if (!cancelled) {
          // Handle various API response shapes
          let items: McqItem[] = []
          if (Array.isArray(json)) {
            items = json
          } else if (json.data) {
            if (Array.isArray(json.data)) {
              items = json.data
            } else if (Array.isArray(json.data.questions)) {
              items = json.data.questions
            } else if (Array.isArray(json.data.mcqs)) {
              items = json.data.mcqs
            } else if (Array.isArray(json.data.items)) {
              items = json.data.items
            }
          } else if (Array.isArray(json.items)) {
            items = json.items
          }
          setMcqs(items)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'কিছু একটা সমস্যা হয়েছে')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRecent()
    return () => { cancelled = true }
  }, [learningMode, classLevel])

  return (
    <section className="py-16 sm:py-20 bg-background relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-teal-200/25 dark:bg-teal-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── Section Header ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
              <Clock className="w-3.5 h-3.5" />
              সাম্প্রতিক
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              সাম্প্রতিক কন্টেন্ট
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              নতুন যোগ করা কন্টেন্টসমূহ
            </p>
          </div>

          <button
            onClick={() => navigate('board-questions')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group shrink-0"
          >
            সব দেখুন
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* ── Content ──────────────────────────────────────────────── */}
        {loading ? (
          <div
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 sm:pb-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5 scrollbar-thin"
          >
            <LoadingSkeleton />
          </div>
        ) : error ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 flex items-center justify-center mb-3">
                <Inbox className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : mcqs.length === 0 ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/40 flex items-center justify-center mb-3">
                <FileQuestion className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                এখনো কোনো কন্টেন্ট যোগ করা হয়নি
              </p>
              <p className="text-xs text-muted-foreground">
                নতুন কন্টেন্ট যোগ হলে এখানে দেখাবে
              </p>
            </CardContent>
          </Card>
        ) : (
          <div
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 sm:pb-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5 scrollbar-thin stagger-children"
          >
            {mcqs.map((mcq) => (
              <div
                key={mcq.id}
                className="snap-center min-w-[280px] sm:min-w-0 group"
              >
                <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800/50">
                  <CardContent className="p-4 flex flex-col gap-3">
                    {/* Subject & Chapter info */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                      {mcq.classLevelName && (
                        <>
                          <span className="font-medium text-foreground/70">{mcq.classLevelName}</span>
                          <span>•</span>
                        </>
                      )}
                      {mcq.subjectName && (
                        <span>{mcq.subjectName}</span>
                      )}
                      {mcq.chapterName && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">{mcq.chapterName}</span>
                        </>
                      )}
                    </div>

                    {/* Question text — truncated to 2 lines */}
                    <p className="text-sm text-foreground/90 leading-relaxed line-clamp-2">
                      {mcq.text || mcq.question}
                    </p>

                    {/* Type badge + View button */}
                    <div className="flex items-center justify-between pt-1">
                      <Badge
                        variant="secondary"
                        className={`text-[11px] font-semibold px-2 py-0.5 ${getTypeBadgeColor(mcq.questionType || 'MCQ')}`}
                      >
                        {mcq.board && mcq.year ? `${mcq.board} ${mcq.year}` : getTypeLabel(mcq.questionType || 'MCQ')}
                      </Badge>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate('board-questions')}
                        className="h-8 gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-2.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        দেখুন
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}