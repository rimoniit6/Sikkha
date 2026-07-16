'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, Loader2, ArrowLeft, Crown, Layers, BookOpen, X } from 'lucide-react'
import SafeImage from '@/components/ui/safe-image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouterStore } from '@/store/router'
import { courseService, type CourseRecord } from '@/services/api/course.service'

export default function BookmarksPage() {
  const navigate = useRouterStore((s) => s.navigate)
  const goBack = useRouterStore((s) => s.goBack)
  const [courses, setCourses] = useState<CourseRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookmarks()
  }, [])

  async function fetchBookmarks() {
    setLoading(true)
    try {
      const res = await courseService.listBookmarks()
      const ids = (res.bookmarks || []).map((b) => b.contentId).filter(Boolean)
      if (ids.length === 0) {
        setCourses([])
      } else {
        const list = await courseService.list({ ids: ids.join(',') })
        // preserve bookmark order
        const map = new Map((list.courses || []).map((c) => [c.id, c]))
        setCourses(ids.map((id) => map.get(id)).filter(Boolean) as CourseRecord[])
      }
    } catch {
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  async function removeBookmark(courseId: string) {
    try {
      await courseService.removeBookmark(courseId)
      setCourses((prev) => prev.filter((c) => c.id !== courseId))
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold">বুকমার্ক করা কোর্স</h1>
            <p className="text-sm text-muted-foreground">পরে দেখার জন্য সংরক্ষিত কোর্স</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bookmark className="mb-4 h-16 w-16 text-muted-foreground/40" />
            <h3 className="text-lg font-medium">কোনো বুকমার্ক নেই</h3>
            <p className="mt-1 text-sm text-muted-foreground">কোর্স বুকমার্ক করে এখানে পাবেন</p>
            <Button className="mt-4" onClick={() => navigate('course-list')}>কোর্স দেখুন</Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }}>
                <Card className="relative cursor-pointer overflow-hidden transition-all hover:shadow-lg" onClick={() => navigate('course-detail', { courseSlug: course.slug })}>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeBookmark(course.id) }}
                    className="absolute right-2 top-2 z-10 rounded-full bg-background/80 p-1.5 text-muted-foreground hover:text-red-600"
                    title="সরান"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {course.thumbnail && (
                    <div className="h-40 overflow-hidden">
                      <SafeImage src={course.thumbnail} alt={course.title} width={640} height={360} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-2 text-lg">{course.title}</h3>
                      {course.isPremium ? (
                        <Badge className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Crown className="mr-1 h-3 w-3" />প্রিমিয়াম</Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">ফ্রি</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {course.subject && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.subject.name}</span>}
                      {course._count && <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{course._count.lessons || 0}টি ক্লাস</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
