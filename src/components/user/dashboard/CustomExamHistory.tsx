'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import EmptyState from '@/components/shared/EmptyState'
import { useRouterStore } from '@/store/router'
import { useIsAuthenticated } from '@/store/auth'
import { toBengaliNumerals } from '@/lib/utils'
import {
  BookOpen, Clock, FileQuestion, Sparkles, Trophy, CheckCircle2, XCircle, MinusCircle,
} from 'lucide-react'

interface ResultItem {
  id: string
  examId: string
  examTitle: string
  totalQuestions: number
  attemptNumber: number
  correct: number
  wrong: number
  skipped: number
  score: number
  totalMarks: number
  percentage: number
  isPassed: boolean | null
  timeTaken: number
  completedAt: string
  duration: number
}

export default function CustomExamHistory() {
  const navigate = useRouterStore((s) => s.navigate)
  const isAuthenticated = useIsAuthenticated()

  const [results, setResults] = useState<ResultItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchResults = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return }
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '20')
      const res = await fetch(`/api/exams/results?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      if (json.success) setResults(json.results || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => { fetchResults() }, [fetchResults])

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return d }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex gap-4"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-20" /></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="কোনো পরীক্ষার ফলাফল নেই"
        description="আপনি এখনো কোনো পরীক্ষা সম্পন্ন করেননি। নতুন পরীক্ষা শুরু করতে নিচের বাটনে ক্লিক করুন।"
        actionLabel="পরীক্ষা শুরু করুন"
        onAction={() => navigate('exam-center')}
      />
    )
  }

  return (
    <div className="space-y-3">
      {results.slice(0, 10).map((r) => (
        <Card key={r.id} className="border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Sparkles className="size-3" />
                    কাস্টম
                  </Badge>
                  {r.isPassed === true && (
                    <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0">
                      পাস
                    </Badge>
                  )}
                  {r.isPassed === false && (
                    <Badge className="text-[10px] bg-destructive/10 text-destructive border-0">
                      ফেল
                    </Badge>
                  )}
                </div>
                <h4 className="font-semibold text-sm line-clamp-1">{r.examTitle}</h4>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <FileQuestion className="size-3" />
                    {toBengaliNumerals(r.totalQuestions)}টি প্রশ্ন
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {toBengaliNumerals(r.duration)} মিনিট
                  </span>
                  <span className="flex items-center gap-1">
                    {formatDate(r.completedAt)}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-emerald-600">{toBengaliNumerals(Math.round(r.percentage))}%</p>
                <p className="text-[10px] text-muted-foreground">স্কোর</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="size-3" />
                {toBengaliNumerals(r.correct)} সঠিক
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <XCircle className="size-3" />
                {toBengaliNumerals(r.wrong)} ভুল
              </span>
              <span className="flex items-center gap-1 text-amber-500">
                <MinusCircle className="size-3" />
                {toBengaliNumerals(r.skipped)} বাদ
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate('exam-session', { examId: r.examId, source: 'custom' })}>
                <BookOpen className="size-3" />
                পুনরায় পরীক্ষা দিন
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => navigate('exam-result', { resultId: r.id })}>
                বিস্তারিত
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {results.length > 10 && (
        <div className="text-center pt-2">
          <Button variant="link" size="sm" onClick={() => navigate('exam-creator-history')}>
            সকল {toBengaliNumerals(results.length)}টি ফলাফল দেখুন
          </Button>
        </div>
      )}
    </div>
  )
}