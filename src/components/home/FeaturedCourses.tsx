'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Thumbnail from '@/components/ui/thumbnail'
import { useContentTypes } from '@/hooks/use-content-types'
import { useFeaturedCourses, type FeaturedItem } from '@/hooks/use-home-data'
import { useSiteConfig } from '@/hooks/use-metadata'
import { useRouterStore } from '@/store/router'
import { ArrowRight, Lock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function FeaturedCourses() {
  const navigate = useRouterStore((s) => s.navigate)
  const { getLabel, getIcon } = useContentTypes()
  const { config } = useSiteConfig()
  const { data: items = [], isLoading: loading } = useFeaturedCourses()

  if (!loading && items.length === 0) return null

  const handleCardClick = (item: FeaturedItem) => {
    const classSlug = item.extra.classSlug as string | undefined
    const subjectId = item.extra.subjectId as string | undefined
    const chapterId = item.extra.chapterId as string | undefined
    const subjectSlug = item.extra.subjectSlug as string | undefined
    const chapterSlug = item.extra.chapterSlug as string | undefined

    switch (item.contentType) {
      case 'lecture':
        const lectureId = item.extra.lectureId as string | undefined
        if (lectureId) navigate('lecture-viewer', { lectureId, chapterId: chapterId || '', subjectId: subjectId || '', classSlug: classSlug || '' })
        else if (chapterId && classSlug && subjectSlug && chapterSlug) navigate('chapter-detail', { chapterId, subjectId: subjectId || '', classSlug, subjectSlug, chapterSlug })
        else if (subjectId && classSlug && subjectSlug) navigate('subject-detail', { subjectId, classSlug, subjectSlug })
        break
      case 'cq':
        const cqId = item.extra.cqId as string | undefined
        if (cqId && chapterId && subjectId) navigate('cq-viewer', { cqId, chapterId, subjectId, classSlug: classSlug || '' })
        else if (chapterId && subjectId) navigate('cq-list', { chapterId, subjectId, classSlug: classSlug || '' })
        else if (subjectId && classSlug && subjectSlug) navigate('subject-detail', { subjectId, classSlug, subjectSlug })
        break
      case 'bundle':
      case 'package':
        navigate('premium')
        break
      case 'suggestion':
        navigate('suggestion-detail', { suggestionId: item.id })
        break
      case 'exam':
        navigate('exam-center')
        break
      case 'course':
        const courseSlug = item.extra.courseSlug as string | undefined
        if (courseSlug) navigate('course-detail', { courseSlug })
        break
    }
  }

  return (
    <section className="py-14 sm:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{config?.homepageFeaturedTitle || 'ফিচার্ড কন্টেন্ট'}</h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">{config?.homepageFeaturedSubtitle || 'আমাদের সেরা কন্টেন্টসমূহ'}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52 sm:h-56 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {items.map((item) => {
              const Icon = getIcon(item.contentType)
              const label = getLabel(item.contentType)
              return (
                <div key={`${item.contentType}-${item.id}`} role="button" tabIndex={0} className="cursor-pointer group" onClick={() => handleCardClick(item)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(item) } }}>
                  <Card className="h-full border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden rounded-xl sm:rounded-2xl">
                    <CardContent className="p-0">
                      <div className="aspect-video relative bg-muted flex items-center justify-center overflow-hidden">
                        {item.thumbnail ? (
                              <Thumbnail
                                src={item.thumbnail}
                                alt={item.title}
                                size="full"
                                className="rounded-none transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <Icon className="w-10 h-10 text-muted-foreground/50" />
                            )}
                        {item.isPremium && <div className="absolute top-2 right-2"><Badge className="bg-amber-500 text-white text-[10px] sm:text-xs shadow-sm"><Lock className="w-3 h-3 mr-0.5" />প্রিমিয়াম</Badge></div>}
                      </div>
                      <div className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-1.5 sm:mb-2"><Badge variant="outline" className="text-[10px] sm:text-xs">{label}</Badge></div>
                        <h3 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2 mb-2 sm:mb-3 leading-snug">{item.title}</h3>
                        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground h-8 sm:h-9 gap-1">দেখুন<ArrowRight className="w-3 h-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
