'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Star, ChevronLeft, ChevronRight, Quote, GraduationCap, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTestimonials, useSiteConfig } from '@/hooks/use-metadata'
import type { MetadataTestimonial } from '@/hooks/use-metadata'

// ─── Constants ───────────────────────────────────────────────────────
const AUTO_ROTATE_MS = 5000
const RESUME_DELAY_MS = 8000

// ─── Helpers ─────────────────────────────────────────────────────────
function getVisibleCount(): number {
  if (typeof window === 'undefined') return 3
  const w = window.innerWidth
  if (w < 640) return 1
  if (w < 1024) return 2
  return 3
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return parts[0][0] + parts[1][0]
  return name.slice(0, 2)
}

function getMaxIndex(length: number, visible: number): number {
  return Math.max(0, length - visible)
}

// ─── Star Rating ─────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 transition-colors ${
            i < rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted/30 text-muted/40'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Skeleton Card ───────────────────────────────────────────────────
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`rounded-2xl p-[2px] bg-gradient-to-br from-muted/50 via-muted to-muted/30 ${className || ''}`}>
      <div className="rounded-[14px] bg-card p-6 space-y-5">
        {/* Quote decoration */}
        <Skeleton className="h-10 w-10 rounded-lg" />
        {/* Stars */}
        <Skeleton className="h-4 w-28" />
        {/* Text lines */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        {/* Divider */}
        <Skeleton className="h-px w-full" />
        {/* Name & role */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Loading State ───────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonCard />
      <SkeletonCard className="hidden sm:block" />
      <SkeletonCard className="hidden lg:block" />
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-5">
        <GraduationCap className="w-8 h-8 text-emerald-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        এখনো কোনো মতামত যোগ করা হয়নি
      </h3>
      <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
        আমাদের সফল শিক্ষার্থীদের মতামত শীঘ্রই এখানে যোগ করা হবে।
        আপনিও আমাদের প্ল্যাটফর্মের অংশ হয়ে আপনার অভিজ্ঞতা শেয়ার করতে পারেন!
      </p>
    </div>
  )
}

// ─── Testimonial Card ────────────────────────────────────────────────
function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: MetadataTestimonial
  index: number
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Gradient border wrapper */}
      <div
        className={`rounded-2xl p-[2px] transition-all duration-500 ${
          isHovered
            ? 'bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 shadow-lg shadow-emerald-500/20'
            : 'bg-gradient-to-br from-emerald-200/60 via-teal-200/40 to-cyan-200/60 dark:from-emerald-800/40 dark:via-teal-800/30 dark:to-cyan-800/40'
        }`}
      >
        {/* Glass-morphism card */}
        <Card
          className={`rounded-[14px] border-0 bg-white/70 dark:bg-card/70 backdrop-blur-xl shadow-sm transition-all duration-500 ${
            isHovered
              ? '-translate-y-2 shadow-xl shadow-emerald-500/10'
              : 'translate-y-0'
          }`}
        >
          <CardContent className="p-6 relative overflow-hidden">
            {/* Background decorative gradient orb */}
            <div
              className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-100/60 to-teal-100/40 dark:from-emerald-900/20 dark:to-teal-900/10 blur-2xl transition-opacity duration-500 ${
                isHovered ? 'opacity-100' : 'opacity-50'
              }`}
            />

            {/* Large quote decoration */}
            <div className="relative">
              <span className="absolute -top-1 -left-1 text-5xl leading-none select-none bg-gradient-to-br from-emerald-300 to-teal-400 dark:from-emerald-600 dark:to-teal-700 bg-clip-text text-transparent font-serif">
                ❝
              </span>
            </div>

            {/* Quote icon */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Quote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <StarRating rating={testimonial.rating} />
            </div>

            {/* Testimonial text */}
            <p className="text-foreground/90 text-sm leading-relaxed mb-6 relative z-10 min-h-[3.5rem]">
              {stripHtml(testimonial.content)}
            </p>

            {/* Decorative divider */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-300/40 dark:via-emerald-700/30 to-transparent mb-5" />

            {/* Student info */}
            <div className="flex items-center gap-3 relative z-10">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/20">
                <span className="text-white text-sm font-bold">
                  {getInitials(testimonial.name)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">
                  {testimonial.name}
                </p>
                {testimonial.role ? (
                  <p className="text-xs text-muted-foreground truncate">
                    {testimonial.role}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                    শিক্ষার্থী
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Carousel ────────────────────────────────────────────────────────
function ShowcaseCarousel({
  testimonials,
}: {
  testimonials: MetadataTestimonial[]
}) {
  const [current, setCurrent] = useState(0)
  const [visibleCount, setVisibleCount] = useState(3)
  const [isPaused, setIsPaused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxIndex = getMaxIndex(testimonials.length, visibleCount)

  // Clamp current so it never exceeds maxIndex (derived, no effect needed)
  const safeCurrent = current > maxIndex ? maxIndex : current

  // Responsive visible count
  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount())
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-rotation
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrent((prev) => {
        const mx = getMaxIndex(testimonials.length, visibleCount)
        return prev >= mx ? 0 : prev + 1
      })
    }, AUTO_ROTATE_MS)
    return () => clearInterval(timer)
  }, [isPaused, testimonials.length, visibleCount])

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setIsPaused(true)
      setCurrent(index)

      // Resume auto-rotation after delay
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = setTimeout(() => {
        setIsPaused(false)
        setIsTransitioning(false)
      }, RESUME_DELAY_MS)
    },
    [isTransitioning]
  )

  const goNext = useCallback(() => {
    const mx = getMaxIndex(testimonials.length, visibleCount)
    goTo(current >= mx ? 0 : current + 1)
  }, [current, visibleCount, testimonials.length, goTo])

  const goPrev = useCallback(() => {
    const mx = getMaxIndex(testimonials.length, visibleCount)
    goTo(current <= 0 ? mx : current - 1)
  }, [current, visibleCount, testimonials.length, goTo])

  // Cleanup
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    }
  }, [])

  const visibleTestimonials = testimonials.slice(safeCurrent, safeCurrent + visibleCount)
  const totalDots = Math.max(1, testimonials.length - visibleCount + 1)

  return (
    <div className="relative">
      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleTestimonials.map((t, i) => (
          <TestimonialCard
            key={t.id}
            testimonial={t}
            index={i}
          />
        ))}
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-5 mt-8">
        {/* Prev button */}
        <Button
          variant="outline"
          size="icon"
          onClick={goPrev}
          className="rounded-full w-10 h-10 border-muted hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
          aria-label="আগের মতামত"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Dot indicators */}
        <div className="flex items-center gap-2" role="tablist" aria-label="ক্যারোসেল ন্যাভিগেশন">
          {Array.from({ length: totalDots }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              role="tab"
              aria-selected={i === safeCurrent}
              aria-label={`পৃষ্ঠা ${i + 1}`}
              className={`rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                i === safeCurrent
                  ? 'bg-emerald-500 dark:bg-emerald-400 w-7 h-2.5'
                  : 'bg-muted-foreground/25 hover:bg-muted-foreground/40 w-2.5 h-2.5'
              }`}
            />
          ))}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          className="rounded-full w-10 h-10 border-muted hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
          aria-label="পরের মতামত"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Auto-rotation indicator */}
      {isPaused && (
        <div className="flex justify-center mt-3">
          <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            অটো-রোটেশন সাময়িক বিরতিতে
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Main Section ────────────────────────────────────────────────────
export default function StudentShowcaseSection() {
  const { testimonials, loading } = useTestimonials()
  const { config } = useSiteConfig()

  const sectionTitle = 'সফল শিক্ষার্থীরা'
  const sectionSubtitle =
    config?.homepageTestimonialsSubtitle || 'আমাদের প্ল্যাটফর্ম থেকে উপকৃত শিক্ষার্থীদের মতামত ও অভিজ্ঞতা'

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-background via-emerald-50/30 to-background dark:via-emerald-950/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-100/30 dark:bg-emerald-900/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-100/20 dark:bg-teal-900/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-12 sm:mb-14">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-5">
            <GraduationCap className="w-4 h-4" />
            <span>সাফল্যের গল্প</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {config?.homepageTestimonialsTitle || sectionTitle}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {sectionSubtitle}
          </p>

          {/* Decorative accent line */}
          <div className="mt-6 mx-auto w-24 h-1 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
        </div>

        {/* Content */}
        {loading ? (
          <LoadingState />
        ) : testimonials.length === 0 ? (
          <EmptyState />
        ) : (
          <ShowcaseCarousel testimonials={testimonials} />
        )}
      </div>
    </section>
  )
}