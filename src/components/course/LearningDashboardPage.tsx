'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Crown, Loader2, Layers, Award, RotateCcw, ArrowLeft, Bookmark, GraduationCap } from 'lucide-react'
import Thumbnail from '@/components/ui/thumbnail'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { useRouterStore } from '@/store/router'
import { courseService, type CourseRecord } from '@/services/api/course.service'

interface EnrollmentItem {
  enrollment: { id: string; status: string; type: string; enrolledAt: string; completedAt: string | null }
  course: CourseRecord
  progress: { total: number; completed: number; percent: number }
  certificate: { id: string; serial: string } | null
}

export default function LearningDashboardPage() {
  const navigate = useRouterStore((s) => s.navigate)
  const goBack = useRouterStore((s) => s.goBack)
  const [items, setItems] = useState<EnrollmentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnrollments()
  }, [])

  async function fetchEnrollments() {
    setLoading(true)
    try {
      const res = await courseService.enrollments()
      setItems(res.enrollments || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const continueLearning = items.filter((i) => i.progress.percent < 100)
  const completed = items.filter((i) => i.progress.percent >= 100)

  function renderCard(i: EnrollmentItem) {
    const c = i.course
    const pct = i.progress.percent
    return (
      <motion.div key={i.enrollment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex gap-4 p-4">
              {c.thumbnail && (
                <Thumbnail src={c.thumbnail} alt={c.title} width={112} height={80} className="rounded-lg shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-2">{c.title}</h3>
                  {pct >= 100 && (
                    <Badge className="shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                      <Award className="mr-1 h-3 w-3" />সম্পন্ন
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {c.subject && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{c.subject.name}</span>}
                  {c._count && <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{c._count.lessons || 0}টি ক্লাস</span>}
                  {c.isPremium && <span className="flex items-center gap-1 text-amber-600"><Crown className="h-3 w-3" />প্রিমিয়াম</span>}
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">অগ্রগতি</span>
                    <span className="font-medium">{i.progress.completed}/{i.progress.total} ({pct}%)</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-2">
              <Button size="sm" variant="ghost" onClick={() => navigate('course-detail', { courseSlug: c.slug })}>
                {pct >= 100 ? 'দেখুন' : 'চালিয়ে যান'} →
              </Button>
              {pct < 100 && (
                <Button size="sm" className="gap-1.5" onClick={() => navigate('course-detail', { courseSlug: c.slug })}>
                  <RotateCcw className="h-3.5 w-3.5" />আবার শুরু করুন
                </Button>
              )}
              {i.certificate && (
                <a
                  href={`/api/courses/certificate?download=1&courseId=${c.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                >
                  <Award className="h-3.5 w-3.5" />সার্টিফিকেট
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold">আমার শেখা</h1>
            <p className="text-sm text-muted-foreground">আপনার কোর্স ও অগ্রগতি</p>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <button onClick={() => navigate('my-courses')} className="rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary">
            <RotateCcw className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-medium">চলমান শেখা</p>
            <p className="text-xs text-muted-foreground">{continueLearning.length}টি কোর্স</p>
          </button>
          <button onClick={() => navigate('certificates')} className="rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary">
            <Award className="mb-2 h-5 w-5 text-amber-600" />
            <p className="text-sm font-medium">সার্টিফিকেট</p>
            <p className="text-xs text-muted-foreground">{completed.length}টি অর্জিত</p>
          </button>
          <button onClick={() => navigate('bookmarks')} className="rounded-xl border bg-background p-4 text-left transition-colors hover:border-primary">
            <Bookmark className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-medium">বুকমার্ক</p>
            <p className="text-xs text-muted-foreground">কোর্স সংরক্ষণ</p>
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <GraduationCap className="mb-4 h-16 w-16 text-muted-foreground/40" />
            <h3 className="text-lg font-medium">এখনও কোনো কোর্সে এনরোল করেননি</h3>
            <p className="mt-1 text-sm text-muted-foreground">কোর্স ব্রাউজ করে এনরোল করুন</p>
            <Button className="mt-4" onClick={() => navigate('course-list')}>কোর্স দেখুন</Button>
          </div>
        ) : (
          <div className="space-y-8">
            {continueLearning.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold">চলমান শেখা</h2>
                <div className="space-y-4">{continueLearning.map(renderCard)}</div>
              </section>
            )}
            {completed.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold">সম্পন্ন কোর্স</h2>
                <div className="space-y-4">{completed.map(renderCard)}</div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
