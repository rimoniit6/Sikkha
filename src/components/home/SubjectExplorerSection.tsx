'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Atom,
  Calculator,
  Globe,
  Monitor,
  FlaskConical,
  Hash,
  Languages,
  Compass,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useLearningPreference } from '@/providers/LearningPreferenceProvider'
import { useRouterStore } from '@/store/router'

// ─── Constants ──────────────────────────────────────────────────

const CLASS_TABS = ['class-6', 'class-7', 'class-8', 'ssc', 'hsc'] as const

const SUBJECT_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-sky-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-pink-600',
  'from-red-500 to-rose-600',
  'from-teal-500 to-emerald-600',
  'from-orange-500 to-amber-600',
]

// ─── Icon mapping by keyword ────────────────────────────────────

const ICON_KEYWORD_MAP: Array<{ keywords: string[]; icon: LucideIcon }> = [
  { keywords: ['গণিত', 'math', 'calculus'], icon: Calculator },
  { keywords: ['বিজ্ঞান', 'পদার্থ', 'physics', 'science'], icon: Atom },
  { keywords: ['রসায়ন', 'chemistry', 'chem'], icon: FlaskConical },
  { keywords: ['বাংলা', 'bangla', 'bengali'], icon: BookOpen },
  { keywords: ['english', 'English', 'ইংরেজি'], icon: Globe },
  { keywords: ['ict', 'ICT', 'আইসিটি', 'কম্পিউটার', 'computer'], icon: Monitor },
  { keywords: ['জীব', 'biology', 'বায়োলজি'], icon: Compass },
  { keywords: ['হিসাব', 'accounting', 'অর্থনীতি', 'economics'], icon: Hash },
  { keywords: ['ভূগোল', 'geography'], icon: Globe },
  { keywords: ['আরবি', 'arabic', 'সংস্কৃত', 'sanskrit'], icon: Languages },
]

function getSubjectIcon(name: string): LucideIcon {
  const lower = name.toLowerCase()
  for (const { keywords, icon } of ICON_KEYWORD_MAP) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) return icon
    }
  }
  return GraduationCap
}

// ─── Component ──────────────────────────────────────────────────

export default function SubjectExplorerSection() {
  const {
    classOptions,
    getClassName,
    getClassColor,
    subjects,
    chapters,
    loading,
    metadata,
  } = useHierarchyMetadata()
  const navigate = useRouterStore((s) => s.navigate)
  const { learningMode, classLevel } = useLearningPreference()

  const [selectedClass, setSelectedClass] = useState<string>(CLASS_TABS[0])
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // Auto-select user's class when in CLASS_BASED mode
  useEffect(() => {
    if (learningMode === 'CLASS_BASED' && classLevel) {
      setSelectedClass(classLevel)
    }
  }, [learningMode, classLevel])

  // Visibility observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  // Filter class tabs that exist in our data (or fallback to all 5)
  const availableTabs = useMemo(() => {
    const slugs = new Set(classOptions.map((c) => c.value))
    return CLASS_TABS.filter((slug) => slugs.has(slug))
  }, [classOptions])

  // Get the actual class ID for selected class (slug-based matching)
  const selectedClassInfo = useMemo(
    () => classOptions.find((c) => c.value === selectedClass),
    [classOptions, selectedClass]
  )

  // Map class slug -> class id so we can match subjects by their classId (UUID)
  const classSlugToId = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of metadata?.classes ?? []) map.set(c.slug, c.id)
    return map
  }, [metadata?.classes])

  // Filter subjects for the selected class
  const filteredSubjects = useMemo(() => {
    if (!selectedClassInfo) return []
    // Subjects are linked to the class by classId (the class UUID), while
    // the selected tab only exposes the class slug — resolve it first.
    const selectedClassId = classSlugToId.get(selectedClassInfo.value)
    if (!selectedClassId) return []
    return subjects.filter((s) => s.classId === selectedClassId)
  }, [subjects, selectedClassInfo, classSlugToId])

  // Count chapters per subject
  const chapterCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const ch of chapters) {
      counts.set(ch.subjectId, (counts.get(ch.subjectId) || 0) + 1)
    }
    return counts
  }, [chapters])

  // Handlers
  const handleClassSelect = (slug: string) => setSelectedClass(slug)

  const handleViewAll = () => {
    navigate('class-detail', { classSlug: selectedClass })
  }

  const handleSubjectClick = (subjectId: string) => {
    navigate('subject-detail', { subjectId, classSlug: selectedClass })
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-16 md:py-24"
      aria-labelledby="subject-explorer-title"
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-64 w-64 rounded-full bg-emerald-400/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-teal-400/15 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-300/10 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ─────────────────────────────── */}
        <div
          className={`text-center mb-10 md:mb-14 ${
            isVisible ? 'animate-fade-in-up' : 'opacity-0'
          }`}
        >
          <Badge
            variant="secondary"
            className="mb-4 px-4 py-1.5 text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          >
            বিষয় অন্বেষণ
          </Badge>
          <h2
            id="subject-explorer-title"
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground"
          >
            জনপ্রিয় বিষয়সমূহ
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            আপনার শ্রেণি নির্বাচন করে পছন্দের বিষয়ে পড়াশোনা শুরু করুন
          </p>
        </div>

        {/* ── Class Tab Chips ────────────────────────────── */}
        <div
          className={`flex flex-wrap justify-center gap-2 md:gap-3 mb-10 md:mb-14 ${
            isVisible ? 'animate-fade-in-up' : 'opacity-0'
          }`}
          style={{ animationDelay: isVisible ? '0.1s' : '0s' }}
        >
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={`chip-skel-${i}`}
                  className="h-10 w-24 rounded-full"
                />
              ))
            : availableTabs.map((slug) => {
                const isActive = selectedClass === slug
                const colorClass = getClassColor(slug)
                return (
                  <button
                    key={slug}
                    onClick={() => handleClassSelect(slug)}
                    className={`
                      relative rounded-full px-5 py-2.5 text-sm font-semibold
                      transition-all duration-300 ease-out
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 scale-105'
                          : `${colorClass} hover:scale-105 hover:shadow-md`
                      }
                    `}
                    aria-pressed={isActive}
                    aria-label={getClassName(slug)}
                  >
                    {getClassName(slug)}
                    {isActive && (
                      <span className="absolute inset-0 rounded-full bg-white/20 animate-pulse-soft" />
                    )}
                  </button>
                )
              })}
        </div>

        {/* ── Subject Cards Grid ─────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 stagger-children">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={`card-skel-${i}`}
                className="h-52 w-full rounded-2xl"
              />
            ))}
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              কোনো বিষয় পাওয়া যায়নি
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              এই শ্রেণিতে এখনও কোনো বিষয় যোগ করা হয়নি। অনুগ্রহ করে পরে আবার দেখুন অথবা অন্য শ্রেণি নির্বাচন করুন।
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 stagger-children">
              {filteredSubjects.map((subject, index) => {
                const Icon = getSubjectIcon(subject.name)
                const chapterCount =
                  subject._count?.chapters ?? chapterCounts.get(subject.id) ?? 0
                const gradientIndex = index % SUBJECT_GRADIENTS.length
                const gradient = SUBJECT_GRADIENTS[gradientIndex]

                return (
                  <Card
                    key={subject.id}
                    className={`
                      group relative overflow-hidden border-0 shadow-md
                      transition-all duration-300 ease-out
                      hover:shadow-2xl hover:-translate-y-2
                      cursor-pointer
                      bg-white dark:bg-card
                    `}
                    style={{
                      animationDelay: `${index * 0.08}s`,
                    }}
                    onClick={() => handleSubjectClick(subject.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSubjectClick(subject.id)
                      }
                    }}
                    aria-label={`${subject.name} — ${chapterCount}টি অধ্যায়`}
                  >
                    {/* Gradient top accent bar */}
                    <div
                      className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${gradient}`}
                    />

                    <CardContent className="relative p-5 md:p-6">
                      {/* Icon + name row */}
                      <div className="flex items-start gap-4">
                        <div
                          className={`
                            flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl
                            bg-gradient-to-br ${gradient} shadow-lg
                            transition-transform duration-300 group-hover:scale-110
                          `}
                        >
                          <Icon className="h-6 w-6 text-white" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base md:text-lg font-bold text-card-foreground leading-snug truncate">
                            {subject.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {chapterCount}টি অধ্যায়
                          </p>
                        </div>
                      </div>

                      {/* Start button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`
                          mt-4 ml-auto flex items-center gap-1.5 text-sm font-medium
                          text-emerald-600 dark:text-emerald-400
                          hover:text-emerald-700 dark:hover:text-emerald-300
                          hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                          transition-colors duration-200
                        `}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSubjectClick(subject.id)
                        }}
                        tabIndex={-1}
                      >
                        শুরু করুন
                        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Button>

                      {/* Decorative corner gradient */}
                      <div
                        className={`
                          pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full
                          bg-gradient-to-br ${gradient} opacity-[0.07]
                          transition-opacity duration-300 group-hover:opacity-[0.12]
                        `}
                      />
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* ── View All Button ─────────────────────────── */}
            <div
              className={`mt-10 md:mt-14 flex justify-center ${
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: '0.4s' }}
            >
              <Button
                variant="outline"
                size="lg"
                className="group gap-2 rounded-full border-emerald-300 px-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300"
                onClick={handleViewAll}
              >
                সব বিষয় দেখুন
                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}