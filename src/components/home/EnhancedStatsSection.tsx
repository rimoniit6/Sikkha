'use client'

import { useEffect, useRef, useState } from 'react'
import { usePublicStats, useSiteConfig } from '@/hooks/use-metadata'
import { Users, FileQuestion, PlayCircle, PenTool, ClipboardCheck } from 'lucide-react'
import { Loader2 } from 'lucide-react'

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (value === 0 || hasAnimated.current) return
    hasAnimated.current = true
    const duration = 1500
    const start = performance.now()
    const animate = (timestamp: number) => {
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(eased * value))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])

  return <span className="tabular-nums">{new Intl.NumberFormat('bn-BD').format(display)}{value > 0 ? '+' : ''}</span>
}

interface StatConfig { icon: React.ElementType; label: string; value: number; color: string; bg: string }

const STATS: StatConfig[] = [
  { icon: Users, label: 'শিক্ষার্থী', value: 0, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  { icon: FileQuestion, label: 'MCQ প্রশ্ন', value: 0, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  { icon: PlayCircle, label: 'লেকচার', value: 0, color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/40' },
  { icon: PenTool, label: 'সৃজনশীল', value: 0, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/40' },
  { icon: ClipboardCheck, label: 'পরীক্ষা', value: 0, color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/40' },
]

export default function EnhancedStatsSection() {
  const { stats, loading } = usePublicStats()
  const { config } = useSiteConfig()

  const statCards: StatConfig[] = stats
    ? [
        { ...STATS[0], value: stats.students },
        { ...STATS[1], value: stats.mcqs },
        { ...STATS[2], value: stats.lectures },
        { ...STATS[3], value: stats.cqs },
        { ...STATS[4], value: stats.exams },
      ]
    : STATS

  if (!loading && stats && statCards.every((s) => s.value === 0)) return null

  return (
    <section className="py-14 sm:py-16 bg-slate-50 dark:bg-slate-950/30" aria-label="পরিসংখ্যান">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{config?.homepageStatsTitle || 'পরিসংখ্যান'}</h2>
          <p className="text-muted-foreground text-sm sm:text-base">{config?.homepageStatsSubtitle || config?.statsSubtitle || 'সারা বাংলাদেশের শিক্ষার্থীদের সাথে আমরা এগিয়ে যাচ্ছি'}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
            {statCards.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="bg-card border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 text-center hover:shadow-md hover:border-border transition-all duration-200">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 ${stat.color}`} />
                  </div>
                  <div className={`text-lg sm:text-xl md:text-2xl font-bold ${stat.color}`}><AnimatedCounter value={stat.value} /></div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{stat.label}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
