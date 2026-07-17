'use client'

import { BookOpen, SearchX, GraduationCap, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLearningPreference } from '@/providers/LearningPreferenceProvider'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useRouterStore } from '@/store/router'

const emptyContent: Record<string, { icon: React.ElementType; title: string; subtitle: string }> = {
  all: {
    icon: BookOpen,
    title: 'এখনো কোনো কন্টেন্ট যোগ করা হয়নি',
    subtitle: 'এই অধ্যায়ে এখনো কোনো শেখার উপকরণ যোগ করা হয়নি।',
  },
  lecture: {
    icon: BookOpen,
    title: 'এখনো কোনো ভিডিও লেকচার নেই',
    subtitle: 'এই অধ্যায়ের ভিডিও লেকচার শীঘ্রই যোগ করা হবে।',
  },
  mcq: {
    icon: BookOpen,
    title: 'এখনো কোনো MCQ নেই',
    subtitle: 'এই অধ্যায়ের MCQ প্রশ্ন শীঘ্রই যোগ করা হবে।',
  },
  cq: {
    icon: BookOpen,
    title: 'এখনো কোনো সৃজনশীল প্রশ্ন নেই',
    subtitle: 'এই অধ্যায়ের সৃজনশীল প্রশ্ন শীঘ্রই যোগ করা হবে।',
  },
  board: {
    icon: BookOpen,
    title: 'এখনো কোনো বোর্ড প্রশ্ন নেই',
    subtitle: 'আপনার বর্তমান ফিল্টারে কোনো বোর্ড প্রশ্ন পাওয়া যায়নি।',
  },
  knowledge: {
    icon: BookOpen,
    title: 'এখনো কোনো জ্ঞানমূলক প্রশ্ন নেই',
    subtitle: 'এই অধ্যায়ের জ্ঞানমূলক প্রশ্ন শীঘ্রই যোগ করা হবে।',
  },
  suggestion: {
    icon: BookOpen,
    title: 'এখনো কোনো সাজেশন নেই',
    subtitle: 'এই অধ্যায়ের সাজেশন শীঘ্রই যোগ করা হবে।',
  },
  exam: {
    icon: BookOpen,
    title: 'এখনো কোনো পরীক্ষা নেই',
    subtitle: 'এই অধ্যায়ের পরীক্ষা শীঘ্রই যোগ করা হবে।',
  },
}

interface ChapterEmptyStateProps {
  tab: string
  hasFilters?: boolean
  onClearFilters?: () => void
}

export function ChapterEmptyState({ tab, hasFilters = false, onClearFilters = () => {} }: ChapterEmptyStateProps) {
  const content = emptyContent[tab] || emptyContent.all
  const Icon = hasFilters ? SearchX : content.icon
  const { learningMode, classLevel, setPreference } = useLearningPreference()
  const { classLevelLabels } = useHierarchyMetadata()
  const navigate = useRouterStore((s) => s.navigate)

  const isClassBased = learningMode === 'CLASS_BASED' && !!classLevel
  const currentClassName = classLevel ? (classLevelLabels[classLevel] || classLevel) : null

  return (
    <div className="animate-fade-in-up">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-muted mb-5">
            <Icon className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {hasFilters ? 'কোনো ফলাফল পাওয়া যায়নি' : content.title}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            {hasFilters ? 'আপনার ফিল্টার বা সার্চ কোয়েরি পরিবর্তন করে দেখুন।' : content.subtitle}
          </p>

          {isClassBased && currentClassName && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-4">
              <GraduationCap className="h-3.5 w-3.5" />
              {currentClassName}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-2">
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters} className="rounded-xl">
                সব ফিল্টার মুছুন
              </Button>
            )}
            {isClassBased && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreference('GLOBAL')}
                  className="rounded-xl gap-1.5"
                >
                  <Globe className="h-3.5 w-3.5" />
                  সব ক্লাস দেখুন
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('user-dashboard')}
                  className="rounded-xl gap-1.5 text-muted-foreground"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  শ্রেণি পরিবর্তন করুন
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
