'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronRight, GraduationCap, Atom, Calculator, Globe, Monitor, FlaskConical, Hash, Languages, Compass, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useLearningPreference } from '@/providers/LearningPreferenceProvider'
import { useRouterStore } from '@/store/router'

const CLASS_TABS = ['class-6', 'class-7', 'class-8', 'ssc', 'hsc'] as const

const ICON_KEYWORD_MAP: Array<{ keywords: string[]; icon: LucideIcon }> = [
  { keywords: ['গণিত', 'math', 'calculus'], icon: Calculator },
  { keywords: ['বিজ্ঞান', 'পদার্থ', 'physics', 'science'], icon: Atom },
  { keywords: ['রসায়ন', 'chemistry', 'chem'], icon: FlaskConical },
  { keywords: ['বাংলা', 'bangla', 'bengali'], icon: BookOpen },
  { keywords: ['english', 'English', 'ইংরেজি'], icon: Globe },
  { keywords: ['ict', 'ICT', 'আইসিটি', 'কম্পিউটার', 'computer'], icon: Monitor },
  { keywords: ['জীব', 'biology', 'বায়োলজি'], icon: Compass },
  { keywords: ['হিসাব', 'accounting', 'অর্থনীতি', 'economics'], icon: Hash },
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

export default function SubjectExplorerSection() {
  const { classOptions, getClassName, getClassColor, subjects, chapters, loading, metadata } = useHierarchyMetadata()
  const navigate = useRouterStore((s) => s.navigate)
  const { learningMode, classLevel } = useLearningPreference()
  const [selectedClass, setSelectedClass] = useState<string>(CLASS_TABS[0])
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => { if (learningMode === 'CLASS_BASED' && classLevel) setSelectedClass(classLevel) }, [learningMode, classLevel])
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() } }, { threshold: 0.1 })
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  const availableTabs = useMemo(() => { const slugs = new Set(classOptions.map((c) => c.value)); return CLASS_TABS.filter((slug) => slugs.has(slug)) }, [classOptions])
  const selectedClassInfo = useMemo(() => classOptions.find((c) => c.value === selectedClass), [classOptions, selectedClass])
  const classSlugToId = useMemo(() => { const map = new Map<string, string>(); for (const c of metadata?.classes ?? []) map.set(c.slug, c.id); return map }, [metadata?.classes])
  const filteredSubjects = useMemo(() => { if (!selectedClassInfo) return []; const selectedClassId = classSlugToId.get(selectedClassInfo.value); if (!selectedClassId) return []; return subjects.filter((s) => s.classId === selectedClassId) }, [subjects, selectedClassInfo, classSlugToId])
  const chapterCounts = useMemo(() => { const counts = new Map<string, number>(); for (const ch of chapters) counts.set(ch.subjectId, (counts.get(ch.subjectId) || 0) + 1); return counts }, [chapters])

  const handleClassSelect = (slug: string) => setSelectedClass(slug)
  const handleViewAll = () => navigate('class-detail', { classSlug: selectedClass })
  const handleSubjectClick = (subjectId: string, subjectSlug: string) => navigate('subject-detail', { subjectId, classSlug: selectedClass, subjectSlug })

  return (
    <section ref={sectionRef} className="py-14 sm:py-16 bg-background" aria-labelledby="subject-explorer-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <Badge variant="secondary" className="mb-3 px-3 py-1 text-xs sm:text-sm font-medium bg-primary/10 text-primary">বিষয় অন্বেষণ</Badge>
          <h2 id="subject-explorer-title" className="text-2xl sm:text-3xl font-bold text-foreground">জনপ্রিয় বিষয়সমূহ</h2>
          <p className="mt-1.5 sm:mt-2 text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto">আপনার শ্রেণি নির্বাচন করে পছন্দের বিষয়ে পড়াশোনা শুরু করুন</p>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
          {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={`chip-skel-${i}`} className="h-9 sm:h-10 w-16 sm:w-20 rounded-full" />) : availableTabs.map((slug) => {
            const isActive = selectedClass === slug
            const colorClass = getClassColor(slug)
            return <button key={slug} onClick={() => handleClassSelect(slug)} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${isActive ? 'bg-primary text-primary-foreground' : `${colorClass} hover:bg-muted`}`} aria-pressed={isActive}>{getClassName(slug)}</button>
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={`card-skel-${i}`} className="h-36 sm:h-40 w-full rounded-xl" />)}</div>
        ) : filteredSubjects.length === 0 ? (
          <div className="text-center py-10 sm:py-12"><p className="text-sm text-muted-foreground">এই শ্রেণিতে কোনো বিষয় পাওয়া যায়নি</p></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredSubjects.slice(0, 6).map((subject) => {
                const Icon = getSubjectIcon(subject.name)
                const chapterCount = chapterCounts.get(subject.id) ?? 0
                return (
                  <Card key={subject.id} className="group cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 rounded-xl sm:rounded-2xl" onClick={() => handleSubjectClick(subject.id, subject.slug)}>
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /></div>
                      <div className="flex-1 min-w-0"><h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 leading-snug">{subject.name}</h3><p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{chapterCount}টি অধ্যায়</p></div>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform group-hover:translate-x-1 shrink-0" />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <div className="mt-6 sm:mt-8 flex justify-center"><Button variant="outline" onClick={handleViewAll} className="gap-2 text-sm">সব বিষয় দেখুন<ChevronRight className="h-4 w-4" /></Button></div>
          </>
        )}
      </div>
    </section>
  )
}
