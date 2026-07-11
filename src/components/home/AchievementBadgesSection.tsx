'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BookOpen,
  Target,
  BookMarked,
  GraduationCap,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Award,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { usePublicStats, useSiteConfig } from '@/hooks/use-metadata'

// ─── Helpers ───────────────────────────────────────────────────────────

const bengaliNumber = (num: number): string =>
  new Intl.NumberFormat('bn-BD').format(num)

// ─── Badge Data ────────────────────────────────────────────────────────

interface AchievementBadge {
  id: string
  icon: LucideIcon
  emoji: string
  label: string
  /** If a dynamicValue key is given, it replaces the static count */
  dynamicValue?: 'students' | 'mcqs'
  staticCount?: string
  /** Gradient pair for the icon background circle */
  gradientFrom: string
  gradientTo: string
}

const badges: AchievementBadge[] = [
  {
    id: 'students',
    icon: Trophy,
    emoji: '🏆',
    label: 'শিক্ষার্থী',
    dynamicValue: 'students',
    staticCount: '৫০০০+',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
  },
  {
    id: 'mcqs',
    icon: BookOpen,
    emoji: '📚',
    label: 'MCQ প্রশ্ন',
    dynamicValue: 'mcqs',
    staticCount: '১০০০০+',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-500',
  },
  {
    id: 'boards',
    icon: Target,
    emoji: '🎯',
    label: 'শিক্ষা বোর্ড',
    staticCount: '৯টি',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-500',
  },
  {
    id: 'chapters',
    icon: BookMarked,
    emoji: '📖',
    label: 'অধ্যায়',
    staticCount: '৯০+',
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-cyan-500',
  },
  {
    id: 'teachers',
    icon: GraduationCap,
    emoji: '👨\u200D🏫',
    label: 'শিক্ষক',
    staticCount: '১০+',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-500',
  },
  {
    id: 'free',
    icon: CheckCircle2,
    emoji: '✅',
    label: 'বিনামূল্যে অ্যাক্সেস',
    staticCount: '১০০%',
    gradientFrom: 'from-lime-500',
    gradientTo: 'to-green-500',
  },
  {
    id: 'secure',
    icon: ShieldCheck,
    emoji: '🔒',
    label: 'নিরাপদ পেমেন্ট',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-indigo-500',
  },
  {
    id: 'mobile',
    icon: Smartphone,
    emoji: '📱',
    label: 'মোবাইল ফ্রেন্ডলি',
    gradientFrom: 'from-fuchsia-500',
    gradientTo: 'to-pink-500',
  },
]

// ─── Stagger delay for each badge ──────────────────────────────────────

const STAGGER_MS = 80

// ─── Component ─────────────────────────────────────────────────────────

export default function AchievementBadgesSection() {
  const { stats } = usePublicStats()
  const { config } = useSiteConfig()
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-gradient-to-b from-emerald-50/60 via-teal-50/40 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 py-14 md:py-20"
      aria-labelledby="achievement-badges-title"
    >
      {/* Decorative blurred orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-800/20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 right-1/4 h-48 w-48 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-800/20"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 text-center md:mb-10">
          <Badge
            variant="secondary"
            className="mb-3 px-4 py-1.5 text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          >
            <Award className="mr-1.5 h-4 w-4" />
            আমাদের অর্জন
          </Badge>
          <h2
            id="achievement-badges-title"
            className="text-2xl font-bold text-foreground md:text-3xl lg:text-4xl"
          >
            বিশ্বাসের প্রতীক
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            {config?.statsSubtitle ?? 'আমাদের প্ল্যাটফর্মের সাফল্যের চিত্র'}
          </p>
        </div>

        {/* Badges row — horizontal scroll on mobile, flex-wrap on desktop */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:flex-wrap md:justify-center md:overflow-visible md:pb-0 no-scrollbar">
          {badges.map((badge, index) => {
            const Icon = badge.icon
            // Resolve the display count
            let countText: string | undefined
            if (badge.dynamicValue && stats) {
              const val = stats[badge.dynamicValue]
              if (val > 0) {
                countText = `${bengaliNumber(val)}+`
              }
            }
            if (!countText) {
              countText = badge.staticCount
            }

            return (
              <div
                key={badge.id}
                className={`
                  group inline-flex shrink-0 items-center gap-2.5 rounded-full
                  border border-emerald-200/60 bg-white/80 px-4 py-2.5
                  shadow-sm backdrop-blur-sm
                  transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-lg hover:border-emerald-300/80
                  dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:hover:border-emerald-700/60
                  ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}
                `}
                style={{
                  animationDelay: isVisible ? `${index * STAGGER_MS}ms` : '0s',
                }}
              >
                {/* Gradient icon circle */}
                <span
                  className={`
                    inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                    bg-gradient-to-br ${badge.gradientFrom} ${badge.gradientTo}
                    shadow-sm transition-transform duration-300 group-hover:scale-110
                  `}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4 text-white" strokeWidth={2.2} />
                </span>

                {/* Text content */}
                <span className="flex flex-col leading-tight">
                  {countText && (
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {countText}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {badge.label}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}