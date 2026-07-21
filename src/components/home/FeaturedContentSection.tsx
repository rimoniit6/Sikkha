'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFeaturedCourses, type FeaturedItem } from '@/hooks/use-home-data'
import { useSiteConfig } from '@/hooks/use-metadata'
import { useRouterStore } from '@/store/router'
import { getFeaturedRegistration } from '@/lib/featured-content-registry'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Clock,
  Lock,
  Sparkles,
} from 'lucide-react'
import Image from 'next/image'

function getTypeLabel(type: string): string {
  const reg = getFeaturedRegistration(type)
  return reg?.labelBn || type
}

function getTypeColor(type: string): string {
  const reg = getFeaturedRegistration(type)
  return reg?.color || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
}

// ─── CTA text per content type ───

const CTA_LABELS: Record<string, string> = {
  lecture: 'দেখুন',
  mcq: 'অনুশীলন করুন',
  cq: 'অনুশীলন করুন',
  blog: 'পড়ুন',
  course: 'শুরু করুন',
  notice: 'বিস্তারিত',
  exam: 'পরীক্ষা দিন',
  suggestion: 'খুলুন',
  bundle: 'দেখুন',
  package: 'দেখুন',
  boardQuestion: 'অনুশীলন করুন',
  knowledgeQuestion: 'অনুশীলন করুন',
  mcqExamPackage: 'দেখুন',
  cqExamPackage: 'দেখুন',
  customLink: 'যান',
}

function getCTALabel(type: string): string {
  return CTA_LABELS[type] || 'দেখুন'
}

// ─── Navigation handler ───

function navigateToItem(
  item: FeaturedItem,
  navigate: ReturnType<typeof useRouterStore.getState>['navigate'],
) {
  // For types that need direct URL navigation (no RoutePath match)
  const navigateToUrl = (url: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = url
    }
  }

  switch (item.contentType) {
    case 'lecture': {
      const lectureId = item.extra.lectureId as string | undefined
      const chapterId = item.extra.chapterId as string | undefined
      const subjectId = item.extra.subjectId as string | undefined
      const classSlug = item.extra.classSlug as string | undefined
      if (lectureId) {
        navigate('lecture-viewer', { lectureId, chapterId: chapterId || '', subjectId: subjectId || '', classSlug: classSlug || '' })
      } else if (chapterId && subjectId) {
        navigate('chapter-detail', { chapterId, subjectId, classSlug: classSlug || '' })
      } else if (subjectId) {
        navigate('subject-detail', { subjectId, classSlug: classSlug || '' })
      }
      break
    }
    case 'mcq': {
      const mcqChapterId = item.extra.chapterId as string | undefined
      const mcqSubjectId = item.extra.subjectId as string | undefined
      const mcqClassSlug = item.extra.classSlug as string | undefined
      if (mcqChapterId && mcqSubjectId) {
        navigate('chapter-detail', { chapterId: mcqChapterId, subjectId: mcqSubjectId, classSlug: mcqClassSlug || '' })
      } else if (mcqSubjectId) {
        navigate('subject-detail', { subjectId: mcqSubjectId, classSlug: mcqClassSlug || '' })
      }
      break
    }
    case 'cq': {
      const cqChapterId = item.extra.chapterId as string | undefined
      const cqSubjectId = item.extra.subjectId as string | undefined
      const cqClassSlug = item.extra.classSlug as string | undefined
      if (cqChapterId && cqSubjectId) {
        navigate('cq-list', { chapterId: cqChapterId, subjectId: cqSubjectId, classSlug: cqClassSlug || '' })
      } else if (cqSubjectId) {
        navigate('subject-detail', { subjectId: cqSubjectId, classSlug: cqClassSlug || '' })
      }
      break
    }
    case 'blog': {
      const slug = item.extra.slug as string | undefined
      if (slug) {
        navigateToUrl(`/blog/${slug}`)
      } else {
        navigate('blog')
      }
      break
    }
    case 'course': {
      const courseSlug = item.extra.slug as string | undefined
      if (courseSlug) navigate('course-detail', { courseSlug })
      break
    }
    case 'notice':
      navigate('notices')
      break
    case 'exam':
      navigate('exam-center')
      break
    case 'suggestion':
      navigate('suggestion-detail', { suggestionId: item.id })
      break
    case 'bundle':
    case 'package':
      navigate('premium')
      break
    case 'boardQuestion':
      navigate('board-questions')
      break
    case 'knowledgeQuestion':
      navigate('short-questions')
      break
    case 'mcqExamPackage':
      navigate('mcq-exam-package-list')
      break
    case 'cqExamPackage':
      navigate('cq-exam-package-list')
      break
    case 'customLink': {
      const url = item.extra.url as string | undefined
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      break
    }
    default:
      break
  }
}

// ─── Skeleton loader ───

function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[16/10] w-full rounded-xl" />
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───

export default function FeaturedContentSection() {
  const navigate = useRouterStore((s) => s.navigate)
  const { config } = useSiteConfig()
  const { data: items = [], isLoading: loading } = useFeaturedCourses()

  const sectionTitle = config?.homepageFeaturedTitle || 'আজকের নির্বাচিত কনটেন্ট'
  const sectionSubtitle = config?.homepageFeaturedSubtitle || 'আমাদের নির্বাচিত গুরুত্বপূর্ণ কনটেন্ট'

  // Don't render if no items and not loading
  if (!loading && items.length === 0) return null

  const handleClick = (item: FeaturedItem) => {
    navigateToItem(item, navigate)
  }

  return (
    <section
      className="py-16 sm:py-20 bg-gradient-to-b from-background via-emerald-50/30 to-background dark:from-background dark:via-emerald-950/10 dark:to-background"
      aria-labelledby="featured-content-title"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0">
            <Sparkles className="w-4 h-4 mr-1.5 inline-block" />
            ফিচার্ড
          </Badge>
          <h2 id="featured-content-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            {sectionTitle}
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            {sectionSubtitle}
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <FeaturedSkeleton />
        ) : (
          /* Item Grid — schema.org ItemList */
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
            role="list"
            itemScope
            itemType="https://schema.org/ItemList"
          >
            {items.map((item, idx) => {
              const label = getTypeLabel(item.contentType)
              const colorClass = getTypeColor(item.contentType)
              const ctaLabel = getCTALabel(item.contentType)

              return (
                <motion.div
                  key={`${item.contentType}-${item.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  role="listitem"
                  itemProp="itemListElement"
                  itemScope
                  itemType="https://schema.org/ListItem"
                >
                  <meta itemProp="position" content={String(idx + 1)} />
                  <div
                    onClick={() => handleClick(item)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(item); } }}
                    role="button"
                    tabIndex={0}
                    className="w-full text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-2xl"
                    aria-label={`${label}: ${item.title}${item.isPremium ? ' (প্রিমিয়াম)' : ''}`}
                  >
                    <Card className="h-full border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-lg hover:shadow-emerald-500/5 dark:hover:shadow-emerald-900/20 transition-all duration-300 overflow-hidden rounded-2xl bg-card/80 backdrop-blur-sm">
                      <CardContent className="p-0">
                        {/* Thumbnail */}
                        <div
                          className="aspect-[16/10] relative bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 flex items-center justify-center overflow-hidden"
                          itemProp="image"
                        >
                          {item.thumbnail ? (
                            <Image
                              src={item.thumbnail}
                              alt={item.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                              unoptimized
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-emerald-400/50 dark:text-emerald-600/50">
                              <BookOpen className="w-10 h-10" />
                              <span className="text-[10px] font-medium">{label}</span>
                            </div>
                          )}

                          {/* Overlay gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Top badges */}
                          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1">
                            <Badge className={`${colorClass} text-[10px] sm:text-xs px-2 py-0.5 font-medium border-0 shadow-sm`}>
                              {label}
                            </Badge>
                            {item.isPremium && (
                              <Badge className="bg-amber-500/90 text-white text-[10px] sm:text-xs px-2 py-0.5 border-0 shadow-sm backdrop-blur-sm">
                                <Lock className="w-3 h-3 mr-0.5" />
                                প্রিমিয়াম
                              </Badge>
                            )}
                          </div>

                          {/* Bottom metadata overlay */}
                          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {item.extra.readingTime ? (
                              <span className="text-[10px] text-white/90 bg-black/40 px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
                                <Clock className="w-3 h-3" />
                                {String(item.extra.readingTime)} মিনিট
                              </span>
                            ) : null}
                            {item.extra.duration ? (
                              <span className="text-[10px] text-white/90 bg-black/40 px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
                                <Clock className="w-3 h-3" />
                                {String(item.extra.duration)} মিনিট
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-5">
                          {/* Type badge (repeated for visual hierarchy) */}
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-[10px] sm:text-xs font-normal text-muted-foreground border-muted-foreground/20">
                              {label}
                            </Badge>
                            {!item.isPremium && (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px] border-0">
                                ফ্রি
                              </Badge>
                            )}
                          </div>

                          {/* Title */}
                          <h3
                            className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 mb-3 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                            itemProp="name"
                          >
                            {item.title}
                          </h3>

                          {/* Subtitle */}
                          {item.subtitle && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                              {item.subtitle}
                            </p>
                          )}

                          {/* CTA Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs sm:text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 h-9 gap-1.5 group/btn transition-all"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleClick(item)
                            }}
                          >
                            {ctaLabel}
                            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
