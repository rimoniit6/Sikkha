'use client'

import { useEffect, useRef, useState } from 'react'
import { Award, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { usePublicStats, useSiteConfig } from '@/hooks/use-metadata'

const bengaliNumber = (num: number): string =>
  new Intl.NumberFormat('bn-BD').format(num)

interface AchievementBadge {
  id: string
  icon: LucideIcon
  label: string
  dynamicValue?: 'students' | 'mcqs'
  staticCount?: string
}

const badges: AchievementBadge[] = [
  { id: 'students', icon: Award, label: 'শিক্ষার্থী', dynamicValue: 'students', staticCount: '১০,০০০+' },
  { id: 'mcqs', icon: Award, label: 'MCQ প্রশ্ন', dynamicValue: 'mcqs', staticCount: '৫০,০০০+' },
  { id: 'boards', icon: Award, label: 'বোর্ড পরীক্ষা', staticCount: '৩টি' },
  { id: 'chapters', icon: Award, label: 'অধ্যায়', staticCount: '৫০০+' },
  { id: 'teachers', icon: Award, label: 'শিক্ষক', staticCount: '৫০+' },
  { id: 'free', icon: Award, label: 'ফ্রি কন্টেন্ট', staticCount: '৮০%' },
]

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
    <section ref={sectionRef} className="py-12 md:py-16 bg-muted/20" aria-labelledby="achievement-badges-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-3 px-3 py-1 text-sm font-medium bg-primary/10 text-primary">
            আমাদের সাফল্য
          </Badge>
          <h2 id="achievement-badges-title" className="text-2xl font-bold text-foreground md:text-3xl">
            প্ল্যাটফর্ম পরিসংখ্যান
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground text-sm">
            {config?.statsSubtitle ?? 'সারা বাংলাদেশের শিক্ষার্থীদের সাথে আমরা এগিয়ে যাচ্ছি'}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {badges.map((badge) => {
            let countText: string | undefined
            if (badge.dynamicValue && stats) {
              const val = stats[badge.dynamicValue]
              if (val > 0) countText = `${bengaliNumber(val)}+`
            }
            if (!countText) countText = badge.staticCount

            return (
              <div key={badge.id} className="flex items-center gap-3 rounded-full border bg-card px-5 py-3 hover:bg-muted/50 transition-colors">
                <span className="text-lg font-semibold text-foreground">{countText}</span>
                <span className="text-sm text-muted-foreground">{badge.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}