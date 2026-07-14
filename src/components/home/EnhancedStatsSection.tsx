'use client'

import { useEffect, useRef, useState } from 'react'
import { usePublicStats, useSiteConfig } from '@/hooks/use-metadata'
import { Users, FileQuestion, PlayCircle, PenTool, ClipboardCheck } from 'lucide-react'
import { Loader2 } from 'lucide-react'

// ─── Animated Counter (requestAnimationFrame) ───────────────────────────────

function AnimatedCounter({
  value,
  duration = 2000,
}: {
  value: number
  duration?: number
}) {
  // Initialize to final value so the component always renders the correct number
  // even before animation kicks in. Animation is progressive enhancement.
  const [display, setDisplay] = useState(value)
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef<number | null>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (value === 0 || hasAnimated.current) return
    hasAnimated.current = true

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(eased * value))

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setDisplay(value)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  const formatted =
    value === 0
      ? '০'
      : new Intl.NumberFormat('bn-BD').format(display)

  return (
    <span className="tabular-nums">
      {formatted}{value > 0 ? '+' : ''}
    </span>
  )
}

// ─── Stat Card Config ────────────────────────────────────────────────────────

interface StatCardConfig {
  icon: React.ElementType
  label: string
  value: number
  accentColor: string
  accentBg: string
  accentBorder: string
  iconBg: string
  gradientFrom: string
  gradientTo: string
}

const STAT_DEFINITIONS: Omit<StatCardConfig, 'value'>[] = [
  {
    icon: Users,
    label: 'শিক্ষার্থী',
    accentColor: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/20',
    gradientFrom: 'from-emerald-500/20',
    gradientTo: 'to-emerald-500/5',
  },
  {
    icon: FileQuestion,
    label: 'MCQ প্রশ্ন',
    accentColor: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/20',
    iconBg: 'bg-amber-500/20',
    gradientFrom: 'from-amber-500/20',
    gradientTo: 'to-amber-500/5',
  },
  {
    icon: PlayCircle,
    label: 'লেকচার',
    accentColor: 'text-sky-400',
    accentBg: 'bg-sky-500/10',
    accentBorder: 'border-sky-500/20',
    iconBg: 'bg-sky-500/20',
    gradientFrom: 'from-sky-500/20',
    gradientTo: 'to-sky-500/5',
  },
  {
    icon: PenTool,
    label: 'সৃজনশীল প্রশ্ন',
    accentColor: 'text-rose-400',
    accentBg: 'bg-rose-500/10',
    accentBorder: 'border-rose-500/20',
    iconBg: 'bg-rose-500/20',
    gradientFrom: 'from-rose-500/20',
    gradientTo: 'to-rose-500/5',
  },
  {
    icon: ClipboardCheck,
    label: 'পরীক্ষা',
    accentColor: 'text-violet-400',
    accentBg: 'bg-violet-500/10',
    accentBorder: 'border-violet-500/20',
    iconBg: 'bg-violet-500/20',
    gradientFrom: 'from-violet-500/20',
    gradientTo: 'to-violet-500/5',
  },
]

// ─── Stat Card Component ─────────────────────────────────────────────────────

function StatCard({
  config,
  index,
}: {
  config: StatCardConfig
  index: number
}) {
  const Icon = config.icon

  return (
    <div
      className={`animate-scale-in group relative rounded-2xl border ${config.accentBorder} bg-gradient-to-b ${config.gradientFrom} ${config.gradientTo} backdrop-blur-xl p-5 sm:p-6 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-black/20`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 rounded-2xl bg-white/[0.03] pointer-events-none" />

      {/* Icon container */}
      <div className={`relative inline-flex items-center justify-center w-14 h-14 rounded-xl ${config.iconBg} mb-4 transition-transform duration-300 group-hover:scale-110`}>
        <Icon className={`w-7 h-7 ${config.accentColor}`} />
      </div>

      {/* Counter */}
      <div className={`relative text-3xl sm:text-4xl font-bold ${config.accentColor} mb-2`}>
        <AnimatedCounter value={config.value} />
      </div>

      {/* Label */}
      <p className="relative text-sm sm:text-base text-slate-300 font-medium">
        {config.label}
      </p>
    </div>
  )
}

// ─── Content Coverage Progress Bar ───────────────────────────────────────────

function CoverageBar({ stats }: { stats: { students: number; mcqs: number; lectures: number; cqs: number; exams: number } }) {
  const [width, setWidth] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)
  const animated = useRef(false)

  // Calculate a coverage percentage based on total content
  const totalContent = stats.mcqs + stats.lectures + stats.cqs + stats.exams
  // Arbitrary "target" for visual effect — we'll use a percentage that looks meaningful
  const coveragePercent = Math.min(95, Math.round((totalContent / 500) * 100))

  useEffect(() => {
    if (animated.current || coveragePercent === 0) return
    animated.current = true

    const duration = 2000
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setWidth(Math.floor(eased * coveragePercent))

      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }

    requestAnimationFrame(tick)
  }, [coveragePercent])

  const formattedPercent = new Intl.NumberFormat('bn-BD').format(coveragePercent)

  return (
    <div className="animate-fade-in-up mt-12 sm:mt-16 max-w-2xl mx-auto" style={{ animationDelay: '0.6s' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400 font-medium">কন্টেন্ট কভারেজ</span>
        <span className="text-sm font-bold text-emerald-400">{formattedPercent}%</span>
      </div>
      <div className="relative h-3 rounded-full bg-slate-700/60 overflow-hidden border border-slate-600/30">
        {/* Animated fill */}
        <div
          ref={barRef}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 transition-none"
          style={{ width: `${width}%` }}
        />
        {/* Shimmer overlay */}
        <div className="absolute inset-0 rounded-full animate-shimmer" />
      </div>
      <p className="text-xs text-slate-500 mt-2 text-center">
        ধারাবাহিকভাবে নতুন কন্টেন্ট যোগ হচ্ছে
      </p>
    </div>
  )
}

// ─── Main Enhanced Stats Section ─────────────────────────────────────────────

export default function EnhancedStatsSection() {
  const { stats, loading } = usePublicStats()
  const { config } = useSiteConfig()

  // Build stat cards with live data
  const statCards: StatCardConfig[] = stats
    ? STAT_DEFINITIONS.map((def, i) => ({
        ...def,
        value: [
          stats.students,
          stats.mcqs,
          stats.lectures,
          stats.cqs,
          stats.exams,
        ][i] ?? 0,
      }))
    : []

  // Don't render if no data and not loading
  if (!loading && stats && statCards.every((s) => s.value === 0)) {
    return null
  }

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden" aria-label="পরিসংখ্যান">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radial glow accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-14 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            {config?.homepageStatsTitle || 'পরিসংখ্যান'}
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            {config?.homepageStatsSubtitle || config?.statsSubtitle || 'সারা বাংলাদেশের শিক্ষার্থীদের সাথে আমরা এগিয়ে যাচ্ছি'}
          </p>
          {/* Decorative accent line */}
          <div className="mt-4 mx-auto w-20 h-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
        </div>

        {/* Stats grid */}
        {loading || !stats ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
            {statCards.map((card, i) => (
              <StatCard key={i} config={card} index={i} />
            ))}
          </div>
        )}

        {/* Coverage progress bar */}
        {stats && !loading && (
          <CoverageBar stats={stats} />
        )}
      </div>
    </section>
  )
}