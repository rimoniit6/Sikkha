'use client'

import { useEffect, useState } from 'react'
import { Clock, CalendarDays, BookOpen, ArrowRight, GraduationCap, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouterStore } from '@/store/router'

/* ── helpers ── */

const bnFmt = new Intl.NumberFormat('bn-BD')

function toBn(n: number): string {
  return bnFmt.format(n)
}

interface ExamConfig {
  id: string
  name: string
  nameBn: string
  date: Date
  dateLabel: string
  accentFrom: string
  accentTo: string
  icon: React.ReactNode
}

const HSC_2026_DATE = new Date('2026-04-06T09:00:00+06:00')
const SSC_2026_DATE = new Date('2026-02-15T09:00:00+06:00')

const EXAMS: ExamConfig[] = [
  {
    id: 'hsc-2026',
    name: 'HSC 2026',
    nameBn: 'এইচএসসি পরীক্ষা ২০২৬',
    date: HSC_2026_DATE,
    dateLabel: '৬ এপ্রিল ২০২৬',
    accentFrom: 'from-amber-500',
    accentTo: 'to-orange-600',
    icon: <GraduationCap className="h-6 w-6" />,
  },
  {
    id: 'ssc-2026',
    name: 'SSC 2026',
    nameBn: 'এসএসসি পরীক্ষা ২০২৬',
    date: SSC_2026_DATE,
    dateLabel: '১৫ ফেব্রুয়ারি ২০২৬',
    accentFrom: 'from-sky-500',
    accentTo: 'to-cyan-600',
    icon: <BookOpen className="h-6 w-6" />,
  },
]

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function getTimeLeft(target: Date): TimeLeft {
  const now = Date.now()
  const diff = Math.max(0, target.getTime() - now)
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  }
}

/* ── sub-components ── */

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 animate-scale-in">
      <div className="relative">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-amber-400/30 to-orange-500/20 blur-sm" />
        <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-amber-50 to-orange-50 border border-amber-200/60 shadow-lg shadow-amber-900/5 dark:from-amber-950/40 dark:to-orange-950/40 dark:border-amber-800/30 dark:shadow-amber-900/20">
          <span className="text-3xl sm:text-4xl font-extrabold tabular-nums bg-gradient-to-b from-amber-700 to-orange-700 bg-clip-text text-transparent dark:from-amber-300 dark:to-orange-300">
            {toBn(value)}
          </span>
        </div>
        {/* subtle pulse ring */}
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400/60 animate-pulse-soft" />
      </div>
      <span className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-300">
        {label}
      </span>
    </div>
  )
}

function ExamCountdownCard({ exam, isPrimary }: { exam: ExamConfig; isPrimary: boolean }) {
  const navigate = useRouterStore((s) => s.navigate)
  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft(exam.date))

  useEffect(() => {
    const id = setInterval(() => {
      setTime(getTimeLeft(exam.date))
    }, 1000)
    return () => clearInterval(id)
  }, [exam.date])

  const isExpired = time.total <= 0

  return (
    <Card
      className={`relative overflow-hidden border-0 shadow-xl animate-fade-in-up ${
        isPrimary ? 'md:col-span-1' : ''
      }`}
    >
      {/* gradient top bar */}
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${exam.accentFrom} ${exam.accentTo}`}
      />

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${exam.accentFrom} ${exam.accentTo} text-white shadow-lg`}
            >
              {exam.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">{exam.nameBn}</h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{exam.dateLabel}</span>
              </div>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={`shrink-0 ${
              isExpired
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}
          >
            {isExpired ? (
              <><AlertCircle className="h-3 w-3" /> শেষ</>
            ) : (
              <><Clock className="h-3 w-3" /> চলমান</>
            )}
          </Badge>
        </div>

        {/* countdown boxes */}
        {isExpired ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
            <p className="text-sm text-muted-foreground">
              এই পরীক্ষার সময়সূচি শীঘ্রই আপডেট করা হবে
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <CountdownBox value={time.days} label="দিন" />
            <CountdownBox value={time.hours} label="ঘণ্টা" />
            <CountdownBox value={time.minutes} label="মিনিট" />
            <CountdownBox value={time.seconds} label="সেকেন্ড" />
          </div>
        )}

        {/* CTA */}
        <Button
          onClick={() => navigate('exam-center')}
          className={`w-full bg-gradient-to-r ${exam.accentFrom} ${exam.accentTo} hover:opacity-90 text-white font-semibold shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.01]`}
        >
          প্রস্তুতি শুরু করুন
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

/* ── main component ── */

export default function ExamCountdownSection() {
  const primaryExam = EXAMS[0]
  const secondaryExam = EXAMS[1]

  return (
    <section
      className="relative overflow-hidden py-14 sm:py-16 md:py-20"
      aria-label="পরবর্তী পরীক্ষা কাউন্টডাউন"
    >
      {/* ── background: warm amber gradient ── */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-amber-50/80 via-orange-50/60 to-background dark:from-amber-950/20 dark:via-orange-950/10 dark:to-background" />

      {/* ── dot-grid pattern ── */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgb(180 130 60 / 0.3) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* ── decorative blur blobs ── */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl dark:bg-amber-500/10" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-500/10" />
        <div className="absolute top-1/2 left-10 h-48 w-48 rounded-full bg-yellow-300/15 blur-3xl dark:bg-yellow-500/8" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* ── section header ── */}
        <div className="text-center mb-10 sm:mb-12 animate-fade-in-up">
          <Badge
            variant="secondary"
            className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/30"
          >
            <Clock className="h-3.5 w-3.5" />
            পরবর্তী পরীক্ষা
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            পরীক্ষার কাউন্টডাউন
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            আপনার পরবর্তী বোর্ড পরীক্ষার জন্য প্রস্তুত হন — প্রতিটি সেকেন্ড মূল্যবান
          </p>
        </div>

        {/* ── cards grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ExamCountdownCard exam={primaryExam} isPrimary />
          <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <ExamCountdownCard exam={secondaryExam} isPrimary={false} />
          </div>
        </div>

        {/* ── bottom note ── */}
        <p className="mt-8 text-center text-xs text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <AlertCircle className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
          পরীক্ষার তারিখ শিক্ষা মন্ত্রণালয়ের ঘোষণা অনুযায়ী আপডেট করা হবে
        </p>
      </div>
    </section>
  )
}