'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, Crown, Loader2, Layers, Search, X, Award } from 'lucide-react'
import SafeImage from '@/components/ui/safe-image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouterStore } from '@/store/router'
import { courseService, type CourseRecord } from '@/services/api/course.service'

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'বিগিনার',
  intermediate: 'ইন্টারমিডিয়েট',
  advanced: 'এডভান্সড',
}

function FilterChips({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Button key={o.value} variant={value === o.value ? 'default' : 'outline'} size="sm" onClick={() => onChange(o.value)}>
          {o.label}
        </Button>
      ))}
    </div>
  )
}

export default function CourseListPage() {
  const navigate = useRouterStore((s) => s.navigate)
  const goBack = useRouterStore((s) => s.goBack)

  const [courses, setCourses] = useState<CourseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPrice, setFilterPrice] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [sort, setSort] = useState('newest')

  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    fetchCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPrice, filterDifficulty, sort, debouncedSearch])

  async function fetchCourses() {
    setLoading(true)
    try {
      const result = await courseService.list({
        q: debouncedSearch || undefined,
        price: filterPrice || undefined,
        difficulty: filterDifficulty || undefined,
        sort: sort || undefined,
      })
      setCourses(result.courses || [])
    } catch {
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  function clearFilters() {
    setFilterPrice('')
    setFilterDifficulty('')
    setSort('newest')
    setSearch('')
  }

  const hasActiveFilters = !!filterPrice || !!filterDifficulty || !!search

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold">কোর্স সমূহ</h1>
            <p className="text-sm text-muted-foreground">আপনার পছন্দের কোর্স বেছে নিন</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('my-courses')}>
              <Award className="h-4 w-4" />আমার শেখা
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('bookmarks')}>
              <BookOpen className="h-4 w-4" />বুকমার্ক
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="কোর্স খুঁজুন..."
            className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Price + Difficulty + Sort */}
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">মূল্য</p>
            <FilterChips
              value={filterPrice}
              onChange={setFilterPrice}
              options={[{ value: '', label: 'সব' }, { value: 'free', label: 'ফ্রি' }, { value: 'paid', label: 'প্রিমিয়াম' }]}
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">স্তর</p>
            <FilterChips
              value={filterDifficulty}
              onChange={setFilterDifficulty}
              options={[{ value: '', label: 'সব' }, ...Object.entries(DIFFICULTY_LABEL).map(([v, label]) => ({ value: v, label }))]}
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">সাজান</p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="newest">নতুন</option>
              <option value="popular">জনপ্রিয়</option>
              <option value="price_asc">মূল্য: কম → বেশি</option>
              <option value="price_desc">মূল্য: বেশি → কম</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" />ফিল্টার মুছুন
            </Button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/40" />
            <h3 className="text-lg font-medium">কোর্স পাওয়া যায়নি</h3>
            <p className="mt-1 text-sm text-muted-foreground">অনুগ্রহ করে ফিল্টার পরিবর্তন করুন</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }}>
                <Card className="cursor-pointer transition-all hover:shadow-lg overflow-hidden" onClick={() => navigate('course-detail', { courseSlug: course.slug })}>
                  {course.thumbnail && (
                    <div className="h-40 overflow-hidden">
                      <SafeImage src={course.thumbnail} alt={course.title} width={640} height={360} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-2 text-lg">{course.title}</h3>
                      {course.isPremium ? <Badge className="shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Crown className="mr-1 h-3 w-3" />প্রিমিয়াম</Badge>
                        : <Badge variant="secondary" className="shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">ফ্রি</Badge>}
                    </div>
                    {course.description && <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {course.subject && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{course.subject.name}</span>}
                      {course._count && <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{course._count.lessons || 0}টি ক্লাস</span>}
                      {course.hasCertificate && <span className="flex items-center gap-1 text-amber-600"><Award className="h-3 w-3" />সার্টিফিকেট</span>}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      {course.isPremium ? (
                        <span className="text-lg font-bold text-amber-600">৳{course.price}</span>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">ফ্রি</Badge>
                      )}
                      <Button size="sm" variant="ghost">বিস্তারিত →</Button>
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
