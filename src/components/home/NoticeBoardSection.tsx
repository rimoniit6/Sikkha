'use client'

import { useEffect, useRef, useState, type LucideIcon } from 'react'
import {
  Bell,
  Megaphone,
  ClipboardList,
  AlertTriangle,
  Info,
  ArrowRight,
  Pin,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotices, type NoticeItem } from '@/hooks/use-home-data'
import { useSiteConfig } from '@/hooks/use-metadata'
import { useRouterStore } from '@/store/router'

/* ─── Type → icon / color mapping ──────────────────────────────────── */

type NoticeType = 'announcement' | 'exam' | 'general' | 'urgent'

function getTypeConfig(type: string): {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  badge: string
  label: string
} {
  const map: Record<NoticeType, { icon: LucideIcon; iconBg: string; iconColor: string; badge: string; label: string }> = {
    announcement: {
      icon: Megaphone,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0',
      label: 'ঘোষণা',
    },
    exam: {
      icon: ClipboardList,
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-0',
      label: 'পরীক্ষা',
    },
    general: {
      icon: Info,
      iconBg: 'bg-sky-100 dark:bg-sky-900/40',
      iconColor: 'text-sky-600 dark:text-sky-400',
      badge: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-0',
      label: 'সাধারণ',
    },
    urgent: {
      icon: AlertTriangle,
      iconBg: 'bg-rose-100 dark:bg-rose-900/40',
      iconColor: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-0',
      label: 'জরুরি',
    },
  }

  return map[type as NoticeType] ?? map.general
}

/* ─── Ticker (CSS-only marquee for pinned notices) ──────────────────── */

function PinnedTicker({ notices }: { notices: NoticeItem[] }) {
  if (notices.length === 0) return null

  const tickerContent = notices.map((n) => n.title).join('  ★  ')

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/40 border border-emerald-200/60 dark:border-emerald-800/30 mb-8">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-emerald-50 dark:from-emerald-950/40 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-emerald-50 dark:from-emerald-950/40 to-transparent z-10 pointer-events-none" />

      <div className="flex items-center gap-3 py-3 pl-4">
        <span className="shrink-0 flex items-center gap-1.5">
          <Pin className="w-4 h-4 text-rose-500 animate-notice-pulse" />
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wide">
            পিন করা
          </span>
        </span>

        <div className="overflow-hidden flex-1 relative">
          <div
            className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite]"
            aria-hidden="false"
          >
            {/* Duplicate for seamless loop */}
            <span className="text-sm text-emerald-800 dark:text-emerald-200 font-medium pr-8">
              {tickerContent}
            </span>
            <span className="text-sm text-emerald-800 dark:text-emerald-200 font-medium pr-8">
              {tickerContent}
            </span>
          </div>
        </div>
      </div>

      {/* Inline keyframes for the marquee — CSS-only, no JS lib */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

/* ─── Skeleton loader ──────────────────────────────────────────────── */

function NoticeSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Single notice card ───────────────────────────────────────────── */

function NoticeCard({
  notice,
  index,
  onDetails,
}: {
  notice: NoticeItem
  index: number
  onDetails: (id: string) => void
}) {
  const typeConfig = getTypeConfig(notice.type)
  const Icon = typeConfig.icon

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <Card className="card-glow group h-full transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1 hover:border-emerald-200 dark:hover:border-emerald-800/50">
        <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
          {/* Icon + badges row */}
          <div className="flex items-start gap-3">
            <div
              className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${typeConfig.iconBg}`}
            >
              <Icon className={`w-5 h-5 ${typeConfig.iconColor}`} strokeWidth={2} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Type badge + Pinned badge */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <Badge
                  variant="secondary"
                  className={`text-[11px] font-semibold px-2 py-0.5 ${typeConfig.badge}`}
                >
                  {typeConfig.label}
                </Badge>
                {notice.isPinned && (
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-semibold px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-0 flex items-center gap-1"
                  >
                    <Pin className="w-3 h-3" />
                    পিন করা
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h3 className="text-sm sm:text-base font-semibold text-card-foreground leading-snug line-clamp-2">
                {notice.title}
              </h3>
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center justify-end pt-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDetails(notice.id)}
              className="h-8 gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-3"
            >
              বিস্তারিত
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Main section component ───────────────────────────────────────── */

export default function NoticeBoardSection() {
  const { data: notices = [], isLoading, error } = useNotices(9)
  const { config } = useSiteConfig()
  const navigate = useRouterStore((s) => s.navigate)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  /* Scroll-triggered visibility */
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
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const pinnedNotices = notices.filter((n) => n.isPinned)
  const sectionTitle = config?.homepageBoardTitle || 'সর্বশেষ নোটিশ'

  const handleDetails = (noticeId: string) => {
    navigate('notice-detail', { noticeId })
  }

  return (
    <section
      ref={sectionRef}
      className="relative py-16 sm:py-20 bg-gradient-to-b from-slate-50/80 via-background to-background dark:from-slate-950/40 dark:via-background dark:to-background overflow-hidden"
      aria-labelledby="notice-board-title"
    >
      {/* ── Decorative blur blobs ──────────────────────────────── */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-200/25 dark:bg-emerald-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-64 h-64 bg-teal-200/20 dark:bg-teal-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-cyan-200/15 dark:bg-cyan-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ─────────────────────────────────── */}
        <div
          className={`text-center mb-10 sm:mb-12 transition-all duration-500 ${
            isVisible ? 'animate-fade-in-up' : 'opacity-0'
          }`}
        >
          <Badge
            variant="secondary"
            className="mb-4 px-4 py-1.5 text-sm font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 inline-flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            নোটিশ বোর্ড
          </Badge>
          <h2
            id="notice-board-title"
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground"
          >
            {sectionTitle}
          </h2>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            প্ল্যাটফর্মের সকল গুরুত্বপূর্ণ নোটিশ এখানে পাবেন
          </p>
        </div>

        {/* ── Pinned ticker ──────────────────────────────────── */}
        {isVisible && !isLoading && !error && pinnedNotices.length > 0 && (
          <div className="animate-fade-in-up delay-200">
            <PinnedTicker notices={pinnedNotices} />
          </div>
        )}

        {/* ── Content area ───────────────────────────────────── */}
        {isLoading ? (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 ${
              isVisible ? 'animate-fade-in-up delay-300' : 'opacity-0'
            }`}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <NoticeSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <Card className="border-dashed border-border/60 animate-fade-in-up">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                নোটিশ লোড করতে সমস্যা হয়েছে
              </p>
              <p className="text-xs text-muted-foreground">
                দয়া করে পরে আবার চেষ্টা করুন
              </p>
            </CardContent>
          </Card>
        ) : notices.length === 0 ? (
          <Card className="border-dashed border-border/60 animate-fade-in-up">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/40 flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                এখনো কোনো নোটিশ নেই
              </p>
              <p className="text-xs text-muted-foreground">
                নতুন নোটিশ প্রকাশিত হলে এখানে দেখাবে
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 stagger-children">
              {notices.map((notice, index) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  index={index}
                  onDetails={handleDetails}
                />
              ))}
            </div>

            {/* ── View All button ─────────────────────────────── */}
            <div className="flex justify-center mt-10 animate-fade-in-up delay-500">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('notices')}
                className="gap-2 font-semibold border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-700/50 px-6"
              >
                সব নোটিশ দেখুন
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}