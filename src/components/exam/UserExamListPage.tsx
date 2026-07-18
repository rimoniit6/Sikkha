'use client'

import EmptyState from '@/components/shared/EmptyState'
import ClassContextBanner from '@/components/shared/ClassContextBanner'
import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'
import { Badge } from '@/components/ui/badge'
import {
Breadcrumb,
BreadcrumbItem,
BreadcrumbLink,
BreadcrumbList,
BreadcrumbPage,
BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { cn } from '@/lib/utils'
import { useRouterStore, useRouteParams } from '@/store/router'
import { useLearningPreference } from '@/providers/LearningPreferenceProvider'
import {
AlignLeft,
ArrowLeft,
Award,
BookOpen,
ClipboardCheck,
Clock,
Crown,
FileQuestion,
Filter,
GraduationCap,
Play,
Search,
Target,
Sparkles,
} from 'lucide-react'
import { useCallback,useEffect,useRef,useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PublicExam {
  id: string
  title: string
  description: string | null
  classLevel: string
  type: string // mcq, cq, mixed
  duration: number // minutes
  totalMarks: number
  marksPerMcq: number
  negativeMarks: number
  isPremium: boolean
  price: number
  instructions: string | null
  totalQuestions: number
}

interface ExamListResponse {
  data: PublicExam[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  mcq: 'MCQ',
  cq: 'সৃজনশীল প্রশ্ন',
  mixed: 'মিশ্র',
}

const TYPE_COLORS: Record<string, string> = {
  mcq: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cq: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  mixed: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
}

// ─── Skeleton Card ───────────────────────────────────────────────────────────

function ExamCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50 rounded-xl">
      <CardContent className="p-0">
        <Skeleton className="h-1.5 w-full" />
        <div className="p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Exam Card ───────────────────────────────────────────────────────────────

function ExamCard({
  exam,
  onStart,
  onPremiumClick,
  classLevelLabels,
  classLevelColors,
  index,
}: {
  exam: PublicExam
  onStart: (exam: PublicExam) => void
  onPremiumClick: (exam: PublicExam) => void
  classLevelLabels: Record<string, string>
  classLevelColors: Record<string, string>
  index: number
}) {
  const classLabel = classLevelLabels[exam.classLevel] || exam.classLevel
  const typeLabel = TYPE_LABELS[exam.type] || exam.type
  const typeColor = TYPE_COLORS[exam.type] || TYPE_COLORS.mixed
  const classColor = classLevelColors[exam.classLevel] || classLevelColors['class-6']

  return (
    <div className="animate-fade-in-up h-full" style={{ animationDelay: `${index * 0.05}s` }}>
      <Card className="overflow-hidden border-border/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 h-full flex flex-col rounded-xl sm:rounded-2xl group">
        <CardContent className="p-0 flex flex-col flex-1">
          {/* Top accent bar */}
          <div
            className={cn(
              'h-1.5 w-full',
              exam.isPremium
                ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                : 'bg-gradient-to-r from-emerald-400 to-teal-500'
            )}
          />

          <div className="p-4 sm:p-5 flex flex-col flex-1">
            {/* Title + Premium badge */}
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <h3 className="font-semibold text-foreground leading-snug line-clamp-2 flex-1 text-sm sm:text-base">
                {exam.title}
              </h3>
              {exam.isPremium && (
                <Badge
                  className={cn(
                    'shrink-0 gap-1 text-[10px] sm:text-xs bg-amber-100 text-amber-700 border-amber-200',
                    'dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
                  )}
                >
                  <Crown className="size-3 fill-amber-500/30" />
                  প্রিমিয়াম
                </Badge>
              )}
            </div>

            {/* Class + Type badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2.5 flex-wrap">
              <Badge variant="outline" className={cn('text-[10px] sm:text-xs font-medium', classColor)}>
                {classLabel}
              </Badge>
              <Badge variant="outline" className={cn('text-[10px] sm:text-xs font-medium', typeColor)}>
                {typeLabel}
              </Badge>
              {exam.negativeMarks > 0 && (
                <Badge variant="outline" className="text-[10px] sm:text-xs font-medium text-destructive border-destructive/30">
                  -{exam.negativeMarks} নেগেটিভ
                </Badge>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-emerald-500" />
                {exam.duration} মিনিট
              </span>
              <span className="flex items-center gap-1.5">
                <Target className="size-3.5 text-teal-500" />
                {exam.totalMarks} নম্বর
              </span>
              <span className="flex items-center gap-1.5">
                <FileQuestion className="size-3.5 text-cyan-500" />
                {exam.totalQuestions} প্রশ্ন
              </span>
            </div>

            {/* Description */}
            {exam.description && (
              <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                <RichContentRenderer content={exam.description} />
              </div>
            )}

            {/* Spacer pushes button to bottom */}
            <div className="mt-auto" />

            {/* Action button */}
            {exam.isPremium ? (
              <Button
                className={cn(
                  'w-full gap-2 h-10 sm:h-11 rounded-lg sm:rounded-xl',
                  'bg-gradient-to-r from-amber-500 to-amber-600',
                  'hover:from-amber-600 hover:to-amber-700 text-white border-0'
                )}
                onClick={() => onPremiumClick(exam)}
              >
                <Crown className="size-4" />
                প্রিমিয়াম — ৳{exam.price}
              </Button>
            ) : (
              <Button
                className="w-full gap-2 h-10 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
                onClick={() => onStart(exam)}
              >
                <Play className="size-4" />
                পরীক্ষা শুরু করুন
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UserExamListPage() {
  const navigate = useRouterStore((s) => s.navigate)
  const goBack = useRouterStore((s) => s.goBack)
  const routeParams = useRouteParams()
  const { classLevelLabels: CLASS_LEVEL_LABELS, classLevelColors: CLASS_COLORS, classOptions } = useHierarchyMetadata()

  // Chapter-level context from route params (when navigating from chapter detail)
  const chapterId = routeParams.chapterId || ''
  const subjectId = routeParams.subjectId || ''
  const classSlug = routeParams.classSlug || ''

  // Is this page accessed from a chapter context?
  const isChapterContext = !!chapterId

  // Chapter info for breadcrumb (fetched when navigating from chapter)
  const [chapterInfo, setChapterInfo] = useState<{ name: string; subjectName: string; className: string } | null>(null)

  const { classLevel: learningClassLevel, learningMode: lMode } = useLearningPreference()
  const classLevel = !isChapterContext && lMode === 'CLASS_BASED' && learningClassLevel ? learningClassLevel : 'all'

  // State
  const [exams, setExams] = useState<PublicExam[]>([])
  const [loading, setLoading] = useState(true)
  const [examType, setExamType] = useState<string>('mcq')
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })

  // Instructions dialog
  const [instructionsExam, setInstructionsExam] = useState<PublicExam | null>(null)
  const [instructionsOpen, setInstructionsOpen] = useState(false)

  // Premium dialog
  const [premiumExam, setPremiumExam] = useState<PublicExam | null>(null)
  const [premiumOpen, setPremiumOpen] = useState(false)

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch chapter info for breadcrumb
  useEffect(() => {
    if (!chapterId) return
    const fetchChapterInfo = async () => {
      try {
        const res = await fetch(`/api/chapters/${chapterId}`)
        if (res.ok) {
          const data = await res.json()
          setChapterInfo({
            name: data.name || '',
            subjectName: data.subjectName || '',
            className: data.className || '',
          })
        }
      } catch { /* ignore */ }
    }
    fetchChapterInfo()
  }, [chapterId])

  // ─── Fetch Exams ─────────────────────────────────────────────────────────

  const fetchExams = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(pagination.limit))
        params.set('isActive', 'true')
        params.set('status', 'PUBLISHED')

        if (chapterId) {
          params.set('chapterId', chapterId)
        } else if (classLevel && classLevel !== 'all') {
          params.set('classLevel', classLevel)
        }
        if (examType && examType !== 'all') {
          params.set('type', examType)
        }
        if (searchQuery.trim()) {
          params.set('q', searchQuery.trim())
        }

        const res = await fetch(`/api/exams?${params.toString()}`)
        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
          throw new Error(errorBody.error || `HTTP ${res.status}`)
        }

        const json = await res.json().catch(() => null) as ExamListResponse | null
        if (!json) throw new Error('সার্ভার থেকে অপ্রত্যাশিত রেসপন্স')
        setExams(Array.isArray(json.data) ? json.data : [])
        if (json.pagination) {
          setPagination((prev) => ({ ...prev, ...json.pagination }))
        }
      } catch (err) {
        console.error('পরীক্ষার তালিকা লোড করতে সমস্যা:', err)
        setExams([])
      } finally {
        setLoading(false)
      }
    },
    [chapterId, classLevel, examType, searchQuery, pagination.limit]
  )
  const fetchExamsRef = useRef(fetchExams)
  useEffect(() => {
    fetchExamsRef.current = fetchExams
  }, [fetchExams])

  // Fetch on filter change or chapter context change
  useEffect(() => {
    fetchExamsRef.current(1)
  }, [classLevel, examType, chapterId])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchExamsRef.current(1)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  // Initial fetch
  useEffect(() => {
    fetchExamsRef.current(1)
  }, [])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleStartExam = (exam: PublicExam) => {
    if (exam.type === 'mcq' || exam.type === 'mixed') {
      // Show instructions dialog first
      setInstructionsExam(exam)
      setInstructionsOpen(true)
    } else {
      // CQ exams — navigate to CQ viewer or exam page
      navigate('exam-session', { examId: exam.id })
    }
  }

  const handleConfirmStart = () => {
    if (instructionsExam) {
      navigate('exam-session', { examId: instructionsExam.id })
    }
    setInstructionsOpen(false)
    setInstructionsExam(null)
  }

  const handlePremiumClick = (exam: PublicExam) => {
    setPremiumExam(exam)
    setPremiumOpen(true)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  // Page title
  const pageTitle = isChapterContext
    ? `${chapterInfo?.name || 'অধ্যায়'} - পরীক্ষা`
    : 'এক্সাম সেন্টার'

  return (
    <div className="min-h-screen bg-background">
      <ClassContextBanner />
      {/* Hero - only show when in chapter context */}
      {isChapterContext && (
        <div className="relative h-28 sm:h-32 bg-gradient-to-r from-sky-500 via-sky-600 to-cyan-600 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.12),transparent)]" />
          <div className="relative z-10 flex items-center h-full max-w-5xl mx-auto px-4">
            <div className="flex items-center gap-3 animate-fade-in">
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 -ml-2 min-h-[44px] min-w-[44px]" onClick={goBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">{pageTitle}</h1>
                {chapterInfo?.subjectName && <p className="text-sky-100 text-sm mt-0.5">{chapterInfo.subjectName}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb - only when in chapter context */}
      {isChapterContext && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('home')}>হোম</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {classSlug && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('class-detail', { classSlug })}>
                      {chapterInfo?.className || classSlug}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              {subjectId && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('subject-detail', { subjectId, classSlug })}>
                      {chapterInfo?.subjectName || 'বিষয়'}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              {chapterId && chapterInfo?.name && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer" onClick={() => navigate('chapter-detail', { chapterId, subjectId, classSlug })}>
                      {chapterInfo.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>পরীক্ষা</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}

      {/* Header Section - standalone mode (not from chapter) */}
      {!isChapterContext && (
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 py-3 sm:py-4">
              <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 min-h-[44px] min-w-[44px]">
                <ArrowLeft className="size-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="size-5 sm:size-6 text-emerald-500" />
                  এক্সাম সেন্টার
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  সময় নির্ধারিত পরীক্ষায় অংশ নিয়ে নিজেকে যাচাই করুন
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Award className="size-3" />
                  {pagination.total}টি পরীক্ষা
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={cn("px-4 sm:px-6 lg:px-8 py-5 sm:py-6", isChapterContext ? "max-w-5xl mx-auto" : "max-w-7xl mx-auto")}>
        {/* Exam Package Promo Banners - only in standalone mode */}
        {!isChapterContext && (
        <>
        <div className="mb-3 sm:mb-4 animate-fade-in-up">
          <Card
            className="border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 cursor-pointer hover:shadow-md transition-all overflow-hidden rounded-xl"
            onClick={() => navigate('create-exam')}
          >
            <CardContent className="p-3.5 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm sm:text-base">কাস্টম MCQ পরীক্ষা তৈরি করুন</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">আপনার পছন্দের অধ্যায় নির্বাচন করুন, সময় ও নেগেটিভ মার্কিং সেট করুন</p>
                </div>
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-[10px] sm:text-xs shrink-0">
                  নতুন
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-3 sm:mb-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <Card
            className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 cursor-pointer hover:shadow-md transition-all overflow-hidden rounded-xl"
            onClick={() => navigate('mcq-exam-package-list')}
          >
            <CardContent className="p-3.5 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm sm:text-base">MCQ এক্সাম প্যাকেজ</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">তারিখ অনুযায়ী নির্ধারিত এক্সাম প্যাকেজ — কিনুন, এক্সাম দিন, ফলাফল দেখুন</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[10px] sm:text-xs shrink-0">
                  নতুন
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-5 sm:mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card
            className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 cursor-pointer hover:shadow-md transition-all overflow-hidden rounded-xl"
            onClick={() => navigate('cq-exam-package-list')}
          >
            <CardContent className="p-3.5 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                  <AlignLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm sm:text-base">CQ এক্সাম প্যাকেজ</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">সৃজনশীল প্রশ্নের প্যাকেজ — কিনুন, উত্তর লিখুন, ফলাফল দেখুন</p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-[10px] sm:text-xs shrink-0">
                  নতুন
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        </>
        )}

        {/* Filter Bar - only in standalone mode */}
        {!isChapterContext && (
        <div className="mb-5 sm:mb-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <Card className="border-border/50 shadow-sm rounded-xl">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Class Badge (auto-inferred) */}
                {lMode === 'CLASS_BASED' && classLevel && classLevel !== 'all' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-edu-primary/10 text-edu-primary text-sm font-medium whitespace-nowrap">
                    <GraduationCap className="size-4" />
                    {CLASS_LEVEL_LABELS[classLevel] || classLevel}
                  </div>
                )}

                {/* Exam Type Filter */}
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger className="w-full sm:w-[130px] h-10">
                    <SelectValue placeholder="ধরন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সকল ধরন</SelectItem>
                    <SelectItem value="mcq">MCQ</SelectItem>
                  </SelectContent>
                </Select>

                {/* Search Input */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="পরীক্ষা খুঁজুন..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-9 w-full h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Content Area */}
        {loading ? (
          // Loading Skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <ExamCardSkeleton key={i} />
            ))}
          </div>
        ) : exams.length === 0 ? (
          // Empty State
          <EmptyState
            icon={FileQuestion}
            title="কোনো পরীক্ষা পাওয়া যায়নি"
            description="আপনার ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন অথবা পরে আসুন।"
            actionLabel="ফিল্টার রিসেট করুন"
            onAction={() => {
              setExamType('mcq')
              setSearchQuery('')
            }}
          />
        ) : (
          // Exam Cards Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {exams.map((exam, idx) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onStart={handleStartExam}
                onPremiumClick={handlePremiumClick}
                classLevelLabels={CLASS_LEVEL_LABELS}
                classLevelColors={CLASS_COLORS}
                index={idx}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchExams(pagination.page - 1)}
              className="min-h-[40px]"
            >
              আগের
            </Button>
            <span className="text-sm text-muted-foreground px-3">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchExams(pagination.page + 1)}
              className="min-h-[40px]"
            >
              পরের
            </Button>
          </div>
        )}
      </div>

      {/* ─── Instructions Dialog ──────────────────────────────────────────── */}
      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlignLeft className="size-5 text-emerald-500" />
              পরীক্ষার নির্দেশনা
            </DialogTitle>
            <DialogDescription>
              পরীক্ষা শুরু করার আগে নিচের নির্দেশনাগুলো পড়ুন
            </DialogDescription>
          </DialogHeader>

          {instructionsExam && (
            <div className="space-y-4">
              {/* Exam Info */}
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <h4 className="font-semibold text-foreground">
                  {instructionsExam.title}
                </h4>
                <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {instructionsExam.duration} মিনিট
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="size-3.5" />
                    {instructionsExam.totalMarks} নম্বর
                  </span>
                  <span className="flex items-center gap-1">
                    <FileQuestion className="size-3.5" />
                    {instructionsExam.totalQuestions} প্রশ্ন
                  </span>
                </div>
              </div>

              {/* Default Instructions (always shown) */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-foreground">সাধারণ নিয়মাবলী:</h5>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>পরীক্ষা শুরু হলে নির্দিষ্ট সময়ের মধ্যে উত্তর দিতে হবে</li>
                  <li>একবার পরীক্ষা শুরু করলে আর ফিরে যাওয়া যাবে না</li>
                  <li>প্রতিটি সঠিক উত্তরের জন্য {instructionsExam.marksPerMcq} নম্বর পাবেন</li>
                  {instructionsExam.negativeMarks > 0 && (
                    <li className="text-destructive font-medium">
                      প্রতিটি ভুল উত্তরের জন্য -{instructionsExam.negativeMarks} নম্বর কাটা যাবে
                    </li>
                  )}
                  <li>পরীক্ষা শেষে আপনার ফলাফল দেখা যাবে</li>
                </ul>
              </div>

              {/* Custom Instructions (if provided) */}
              {instructionsExam.instructions && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-foreground">বিশেষ নির্দেশনা:</h5>
                  <div className="text-sm text-muted-foreground bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                    {instructionsExam.instructions}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setInstructionsOpen(false)}>
              বাতিল
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
              onClick={handleConfirmStart}
            >
              <Play className="size-4" />
              পরীক্ষা শুরু করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Purchase Options Modal ───────────────────────────────────────────── */}
      {premiumExam && (
        <PurchaseOptionsModal
          open={premiumOpen}
          onOpenChange={(open) => {
            setPremiumOpen(open)
            if (!open) {
              setPremiumExam(null)
            }
          }}
          contentType="exam"
          contentId={premiumExam.id}
          contentTitle={premiumExam.title}
          contentPrice={premiumExam.price}
          classLevel={premiumExam.classLevel}
        />
      )}
    </div>
  )
}
