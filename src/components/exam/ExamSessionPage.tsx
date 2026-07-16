'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { cn, toBengaliNumerals } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ChevronLeft,ChevronRight,
  Clock,
  Layers,
  Loader2,
  Send,
  SkipForward,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import RichContentRenderer from '@/components/ui/rich-content-renderer'
import SafeImage from '@/components/ui/safe-image'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchCsrfToken } from '@/lib/api-client'
import { useExamStore } from '@/store/exam'
import { useRouterStore, useRouteParams } from '@/store/router'
import { AnimatePresence,motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'
import { useCallback,useEffect,useMemo,useRef,useState } from 'react'

interface MCQQuestion {
  id: string
  text: string
  questionImage?: string | null
  options: { key: string; text: string; image?: string | null }[]
  correctAnswer?: string
  explanation?: string
  explanationImage?: string | null
  isPremium?: boolean
  price?: number
}

const BATCH_SIZE = 20

interface BatchIndicatorProps {
  totalBatches: number
  currentBatch: number
  currentBatchRange: { start: number; end: number }
}

function BatchIndicator({ totalBatches, currentBatch, currentBatchRange }: BatchIndicatorProps) {
  if (totalBatches <= 1) return null
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Layers className="size-3.5" />
      <span>ব্যাচ {currentBatch + 1}/{totalBatches}</span>
      <span className="text-muted-foreground/60">
        (প্রশ্ন {currentBatchRange.start}-{currentBatchRange.end})
      </span>
    </div>
  )
}

interface QuestionPaletteProps {
  totalBatches: number
  paletteBatch: number
  setPaletteBatch: (fn: (prev: number) => number) => void
  getBatchQuestions: Array<{ q: MCQQuestion; globalIndex: number }>
  answers: Record<string, string>
  visitedQuestions: Set<string>
  currentIndex: number
  setCurrentIndex: (i: number) => void
  setVisitedQuestions: (fn: (prev: Set<string>) => Set<string>) => void
}

function QuestionPalette({
  totalBatches,
  paletteBatch,
  setPaletteBatch,
  getBatchQuestions,
  answers,
  visitedQuestions,
  currentIndex,
  setCurrentIndex,
  setVisitedQuestions,
}: QuestionPaletteProps) {
  return (
    <>
      {totalBatches > 1 && (
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 px-2"
            disabled={paletteBatch === 0}
            onClick={() => setPaletteBatch(prev => Math.max(0, prev - 1))}
          >
            <ChevronLeft className="size-3" />
            আগের
          </Button>
          <span className="text-xs text-muted-foreground font-medium">
            {paletteBatch + 1}/{totalBatches}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 px-2"
            disabled={paletteBatch >= totalBatches - 1}
            onClick={() => setPaletteBatch(prev => Math.min(totalBatches - 1, prev + 1))}
          >
            পরের
            <ChevronRight className="size-3" />
          </Button>
        </div>
      )}
      <div className="grid grid-cols-5 gap-2">
        {getBatchQuestions.map(({ q, globalIndex }) => {
          const isAnswered = !!answers[q.id]
          const isVisited = visitedQuestions.has(q.id)
          const isCurrent = globalIndex === currentIndex
          return (
            <button
              key={q.id}
              className={`flex items-center justify-center size-9 rounded-lg text-sm font-medium transition-colors ${
                isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : isAnswered
                  ? 'bg-emerald-500 text-white'
                  : isVisited
                  ? 'bg-amber-500 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onClick={() => {
                setCurrentIndex(globalIndex)
                setVisitedQuestions(prev => new Set([...prev, q.id]))
                setPaletteBatch(() => Math.floor(globalIndex / BATCH_SIZE))
              }}
            >
              {globalIndex + 1}
            </button>
          )
        })}
      </div>
    </>
  )
}

export default function ExamSessionPage() {
  const params = useRouteParams()
  const navigate = useRouterStore((s) => s.navigate)
  const goBack = useRouterStore((s) => s.goBack)
  const { startExam, setAnswer, setTimeRemaining, endExam, answers, timeRemaining, isExamActive, currentExamId, currentSessionId, setSessionId, setQuestionIds } = useExamStore()
  const [questions, setQuestions] = useState<MCQQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showPalette, setShowPalette] = useState(false)
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set())
  const [examTitle, setExamTitle] = useState<string>('পরীক্ষা')
  const [paletteBatch, setPaletteBatch] = useState(0)
  const [examDuration, setExamDuration] = useState(0)
  const [examMarksPerMcq, setExamMarksPerMcq] = useState(1)
  const [examNegativeMarks, setExamNegativeMarks] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [sessionError, setSessionError] = useState('')

  // Custom exam handling
  const isCustomExam = params.source === 'custom'

  const examIdParam = params.examId || ''
  const examId = examIdParam ? `exam-${examIdParam}` : ''

  const totalBatches = useMemo(() => Math.ceil(questions.length / BATCH_SIZE), [questions.length])
  const currentBatch = useMemo(() => Math.floor(currentIndex / BATCH_SIZE), [currentIndex])
  const currentBatchRange = useMemo(() => {
    const start = currentBatch * BATCH_SIZE + 1
    const end = Math.min((currentBatch + 1) * BATCH_SIZE, questions.length)
    return { start, end }
  }, [currentBatch, questions.length])

  useEffect(() => {
    setPaletteBatch(currentBatch)
  }, [currentBatch])

  const handleGoBack = useCallback(() => {
    goBack()
  }, [goBack])

  // Fetch exam data and start server-side session
  useEffect(() => {
    if (!examIdParam) {
      if (questions.length === 0) setLoading(false)
      return
    }

    const initSession = async () => {
      setLoading(true)
      setSessionError('')
      try {
        // Start or resume server-side session
        const sessionRes = await fetch('/api/exams/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId: examIdParam }),
        })

        if (!sessionRes.ok) {
          const sessionData = await sessionRes.json().catch(() => ({}))
          throw new Error(sessionData.error || 'সেশন শুরু করতে সমস্যা হয়েছে')
        }

        const sessionJson = await sessionRes.json()
        const sessionData = sessionJson.data

        // Store session ID
        setSessionId(sessionData.sessionId)

        // Fetch exam questions
        const examRes = await fetch(`/api/exams/${examIdParam}`)
        if (examRes.ok) {
          const examData = await examRes.json()
          const examObj = examData.data?.exam || examData.exam
          if (examObj && examObj.questions && examObj.questions.length > 0) {
            setQuestions(examObj.questions)
            setExamTitle(examObj.title || 'পরীক্ষা')
            if (examObj.duration) setExamDuration(examObj.duration)
            if (examObj.marksPerMcq) setExamMarksPerMcq(examObj.marksPerMcq)
            if (examObj.negativeMarks !== undefined) setExamNegativeMarks(examObj.negativeMarks)

            // Start exam store with server time
            const serverStartedAt = sessionData.startedAt
            const serverExpiresAt = sessionData.expiresAt
            startExam(examIdParam, examObj.duration || 30, sessionData.sessionId, serverStartedAt, serverExpiresAt)

            // Calculate server-side remaining time
            const now = new Date()
            const expires = new Date(serverExpiresAt)
            const remainingMs = Math.max(0, expires.getTime() - now.getTime())
            const remainingSeconds = Math.ceil(remainingMs / 1000)
            setTimeRemaining(remainingSeconds)

            setLoading(false)
            return
          }
        }
        setQuestions([])
      } catch (e) {
        setSessionError(e instanceof Error ? e.message : 'সেশন শুরু করতে সমস্যা হয়েছে')
      } finally {
        setLoading(false)
      }
    }

    initSession()
  }, [examIdParam])

  // Premium filtering
  const premiumFilteredRef = useRef(false)
  useEffect(() => {
    if (questions.length === 0 || premiumFilteredRef.current) return

    const premiumQuestions = questions.filter(q => q.isPremium)
    if (premiumQuestions.length === 0) return

    const filterPremium = async () => {
      try {
        const res = await fetch('/api/payment/batch-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: premiumQuestions.map(q => ({
              contentType: 'mcq',
              contentId: q.id,
            })),
          }),
        })

        if (res.ok) {
          const result = await res.json()
          const data = result.data || result
          const items = data.items || []
          const unpurchasedPremiumIds = new Set<string>()
          for (const item of items) {
            if (!item.purchased) {
              unpurchasedPremiumIds.add(item.contentId)
            }
          }
          if (unpurchasedPremiumIds.size > 0) {
            const filtered = questions.filter(q => !unpurchasedPremiumIds.has(q.id))
            setQuestions(filtered)
            setCurrentIndex(prevIdx => Math.min(prevIdx, filtered.length - 1))
          }
          premiumFilteredRef.current = true
        }
      } catch (e) {
        console.error('Failed to check premium status:', e)
        const filtered = questions.filter(q => !q.isPremium)
        setQuestions(filtered)
        setCurrentIndex(prevIdx => Math.min(prevIdx, filtered.length - 1))
        premiumFilteredRef.current = true
      }
    }

    filterPremium()
  }, [questions])

  useEffect(() => {
    if (!loading && questions.length > 0) {
      setQuestionIds(questions.map(q => q.id))
      setVisitedQuestions((prev) => new Set([...prev, questions[0]?.id]))
    }
  }, [loading, questions, setQuestionIds])

  // Server-side timer — recalculate from server timestamps
  useEffect(() => {
    if (!isExamActive) return
    const interval = setInterval(() => {
      const state = useExamStore.getState()
      if (state.serverExpiresAt) {
        const now = new Date()
        const expires = new Date(state.serverExpiresAt)
        const remainingMs = Math.max(0, expires.getTime() - now.getTime())
        setTimeRemaining(Math.ceil(remainingMs / 1000))
      } else {
        setTimeRemaining(prev => Math.max(0, prev - 1))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isExamActive, setTimeRemaining])

  // Sync answers to server periodically
  useEffect(() => {
    if (!currentSessionId || !isExamActive) return
    const interval = setInterval(() => {
      const state = useExamStore.getState()
      if (Object.keys(state.answers).length > 0) {
        fetch(`/api/exams/session/${currentSessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: state.answers,
            currentQuestionIndex: currentIndex,
          }),
        }).catch(() => {})
      }
    }, 10000) // Sync every 10 seconds
    return () => clearInterval(interval)
  }, [currentSessionId, isExamActive, currentIndex])

  // Sync on answer change
  useEffect(() => {
    if (!currentSessionId || !isExamActive) return
    const state = useExamStore.getState()
    if (Object.keys(state.answers).length > 0) {
      fetch(`/api/exams/session/${currentSessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: state.answers,
          currentQuestionIndex: currentIndex,
        }),
      }).catch(() => {})
    }
  }, [answers, currentSessionId, isExamActive])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const currentQuestion = questions[currentIndex]
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
  const answeredCount = useMemo(() => questions.filter((q) => answers[q.id]).length, [questions, answers])
  const progressPercent = useMemo(() => questions.length > 0 ? (answeredCount / questions.length) * 100 : 0, [answeredCount, questions.length])

  const advanceToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setVisitedQuestions((prev) => new Set([...prev, questions[nextIndex].id]))
    }
  }, [currentIndex, questions, setCurrentIndex, setVisitedQuestions])

  const handleSelectOption = useCallback(
    (optionKey: string) => {
      if (!currentQuestion) return
      setAnswer(currentQuestion.id, optionKey)
      advanceToNext()
    },
    [currentQuestion, setAnswer, advanceToNext]
  )

  const handleNext = useCallback(() => {
    advanceToNext()
  }, [advanceToNext])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }, [currentIndex, setCurrentIndex])

  const handleSkip = useCallback(() => {
    advanceToNext()
  }, [advanceToNext])

  const handleSubmitRef = useRef<() => void>(() => {})

  const { toast } = useToast()

  const openSubmitDialog = useCallback(() => {
    setSubmitDialogOpen(true)
  }, [])

  const handleSubmit = useCallback(async () => {
    const effectiveExamId = examIdParam || currentExamId?.replace('exam-', '') || ''
    const effectiveSessionId = currentSessionId || ''
    if (!effectiveExamId || !effectiveSessionId || submitting) {
      if (!effectiveSessionId) {
        toast({ title: 'ত্রুটি', description: 'সেশন পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।', variant: 'destructive' })
      }
      return
    }

    setSubmitDialogOpen(false)
    setSubmitting(true)

    const initialDurationSeconds = examDuration ? examDuration * 60 : questions.length * 60
    const timeTaken = Math.max(0, initialDurationSeconds - timeRemaining)

    try {
      const token = await fetchCsrfToken()
      const idempotencyKey = `${effectiveExamId}_${Date.now()}_${Math.random().toString(36).slice(2)}`

      const res = await fetch('/api/exams/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        body: JSON.stringify({
          examId: effectiveExamId,
          sessionId: effectiveSessionId,
          timeTaken,
          answers,
          idempotencyKey,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'পরীক্ষা জমা দিতে ব্যর্থ হয়েছে')
      }

      const resultId = data.data?.resultId
      const returnedExamId = data.data?.examId || effectiveExamId
      endExam()
      navigate('exam-result', {
        resultId: resultId || effectiveExamId,
        examId: returnedExamId,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'পরীক্ষা জমা দিতে ব্যর্থ হয়েছে'
      toast({ title: 'ত্রুটি', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }, [examIdParam, currentExamId, currentSessionId, submitting, questions, answers, examDuration, timeRemaining, endExam, navigate, toast])

  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  }, [handleSubmit])

  // Auto-submit when timer expires
  useEffect(() => {
    if (isExamActive && timeRemaining <= 0 && questions.length > 0) {
      handleSubmitRef.current()
    }
  }, [timeRemaining, isExamActive, questions.length])

  const getBatchQuestions = useMemo(() => {
    const start = paletteBatch * BATCH_SIZE
    const end = Math.min(start + BATCH_SIZE, questions.length)
    return questions.slice(start, end).map((q, i) => ({ q, globalIndex: start + i }))
  }, [paletteBatch, questions])

  const paletteProps = {
    totalBatches,
    paletteBatch,
    setPaletteBatch,
    getBatchQuestions,
    answers,
    visitedQuestions,
    currentIndex,
    setCurrentIndex,
    setVisitedQuestions,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-12 mb-4" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="size-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">{sessionError}</p>
          <Button onClick={handleGoBack} variant="outline">ফিরে যান</Button>
        </Card>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="size-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">কোনো প্রশ্ন পাওয়া যায়নি</p>
          <Button onClick={handleGoBack} variant="outline">ফিরে যান</Button>
        </Card>
      </div>
    )
  }

  const getOptionStyle = (optionKey: string) => {
    const isSelected = selectedAnswer === optionKey
    if (isSelected) return 'border-primary bg-primary/10 text-primary'
    return 'border-border hover:border-primary/50 hover:bg-muted/50'
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-16 z-40 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-2.5 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleGoBack}>
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <p className="font-medium text-sm">{examTitle}</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {answeredCount}/{questions.length} উত্তর দেওয়া হয়েছে
                </p>
                <BatchIndicator totalBatches={totalBatches} currentBatch={currentBatch} currentBatchRange={currentBatchRange} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={timeRemaining < 300 ? 'destructive' : 'secondary'} className="gap-1.5 tabular-nums">
              <Clock className="size-3.5" />
              {formatTime(timeRemaining)}
            </Badge>
          </div>
        </div>
        <Progress value={progressPercent} className="h-1 rounded-none" />
      </div>

      {/* Main */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Question Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion?.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="border-border/50">
                  <CardContent className="p-5 sm:p-6">
                    {/* Question Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="font-mono">
                        প্রশ্ন {currentIndex + 1}
                      </Badge>
                      <span className="text-xs text-muted-foreground">/ {questions.length}</span>
                      {totalBatches > 1 && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Layers className="size-3" />
                          ব্যাচ {currentBatch + 1}
                        </Badge>
                      )}
                    </div>

                    {/* Question Text */}
                    <RichContentRenderer content={currentQuestion?.text || ''} className="text-lg font-medium mb-6 leading-relaxed" />
                    {currentQuestion?.questionImage && (
                      <div className="mb-4">
                        <SafeImage src={currentQuestion.questionImage} alt="প্রশ্ন চিত্র" className="max-w-full rounded-lg border max-h-64 mx-auto" />
                      </div>
                    )}

                    {/* Options */}
                    <div className="space-y-3">
                      {currentQuestion?.options.map((option) => (
                        <button
                          key={option.key}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${getOptionStyle(option.key)}`}
                          onClick={() => handleSelectOption(option.key)}
                        >
                          <span className={`flex items-center justify-center size-8 rounded-full border-2 font-semibold text-sm shrink-0 ${
                            selectedAnswer === option.key
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-current'
                          }`}>
                            {option.key}
                          </span>
                          <RichContentRenderer content={option.text} inline className="text-sm sm:text-base" />
                          {option.image && (
                            <SafeImage src={option.image} alt={`অপশন ${option.key}`} className="ml-auto max-w-full rounded-lg border max-h-20" />
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="gap-2"
              >
                <ChevronLeft className="size-4" />
                আগের
              </Button>

              <div className="flex gap-2 sm:hidden">
                <Button variant="ghost" size="icon" onClick={() => setShowPalette(!showPalette)}>
                  <BookOpen className="size-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={handleSkip} className="gap-1.5">
                  <SkipForward className="size-4" />
                  স্কিপ
                </Button>
                {currentIndex < questions.length - 1 ? (
                  <Button onClick={handleNext} className="gap-2">
                    পরের
                    <ChevronRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    className="gap-2"
                    disabled={submitting}
                    onClick={openSubmitDialog}
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    {submitting ? 'জমা দেওয়া হচ্ছে...' : 'জমা দিন'}
                  </Button>
                )}
              </div>
            </div>

            {totalBatches > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground mr-2">ব্যাচ:</span>
                {Array.from({ length: totalBatches }).map((_, i) => {
                  const batchStart = i * BATCH_SIZE + 1
                  const batchEnd = Math.min((i + 1) * BATCH_SIZE, questions.length)
                  const batchAnswered = questions.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE).filter(q => answers[q.id]).length
                  const isCurrentBatch = i === currentBatch
                  return (
                    <Button
                      key={i}
                      variant={isCurrentBatch ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs gap-1 px-2"
                      onClick={() => {
                        setPaletteBatch(i)
                        setCurrentIndex(i * BATCH_SIZE)
                        setVisitedQuestions((prev) => new Set([...prev, questions[i * BATCH_SIZE]?.id]))
                      }}
                    >
                      {batchStart}-{batchEnd}
                      {batchAnswered > 0 && (
                        <span className="text-[10px] opacity-70">({batchAnswered})</span>
                      )}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Question Palette - Desktop */}
          <div className="hidden lg:block w-64">
            <Card className="sticky top-[5rem]">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3">প্রশ্ন প্যালেট</h4>
                <QuestionPalette {...paletteProps} />
                <Separator className="my-3" />
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded bg-emerald-500" />
                    <span>উত্তর দেওয়া হয়েছে ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded bg-amber-500" />
                    <span>ভিজিট করা হয়েছে</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded bg-muted" />
                    <span>উত্তর দেওয়া হয়নি</span>
                  </div>
                </div>

                <Separator className="my-3" />

                <Button
                  className="w-full gap-2"
                  size="sm"
                  disabled={submitting}
                  onClick={openSubmitDialog}
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {submitting ? 'জমা দেওয়া হচ্ছে...' : 'পরীক্ষা জমা দিন'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Question Palette Sheet */}
        {showPalette && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background border-t rounded-t-2xl p-4 shadow-lg lg:hidden max-h-[70vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">প্রশ্ন প্যালেট</h4>
              <Button variant="ghost" size="icon" onClick={() => setShowPalette(false)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <QuestionPalette {...paletteProps} />
            {totalBatches > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                {Array.from({ length: totalBatches }).map((_, i) => {
                  const batchStart = i * BATCH_SIZE + 1
                  const batchEnd = Math.min((i + 1) * BATCH_SIZE, questions.length)
                  return (
                    <Button
                      key={i}
                      variant={paletteBatch === i ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => setPaletteBatch(i)}
                    >
                      {batchStart}-{batchEnd}
                    </Button>
                  )
                })}
              </div>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded bg-emerald-500" />
                <span>উত্তর ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded bg-amber-500" />
                <span>ভিজিট</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded bg-muted" />
                <span>বাকি</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>পরীক্ষা জমা দিন</DialogTitle>
            <DialogDescription>
              আপনি {toBengaliNumerals(answeredCount)}টি প্রশ্নের উত্তর দিয়েছেন। {toBengaliNumerals(questions.length - answeredCount)}টি প্রশ্ন বাকি আছে।
              আপনি কি নিশ্চিতভাবে জমা দিতে চান?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSubmitDialogOpen(false)}
              disabled={submitting}
            >
              বাতিল
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {submitting ? 'জমা হচ্ছে...' : 'জমা দিন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
