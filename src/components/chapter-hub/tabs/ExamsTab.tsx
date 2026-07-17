'use client'

import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'
import { useChapterExams,type ExamItem } from '@/hooks/use-chapter-content'
import { useRouterStore, useRouteParams } from '@/store/router'
import { useState } from 'react'
import { ExamCard } from '../cards/ExamCard'
import { ChapterEmptyState } from '../ChapterEmptyState'
import { Skeleton } from '@/components/ui/skeleton'

interface ExamsTabProps {
  chapterId: string
}

export function ExamsTab({ chapterId }: ExamsTabProps) {
  const [page, _setPage] = useState(1)
  const { data: exams, isLoading, error } = useChapterExams(chapterId, page, 10)
  const navigate = useRouterStore((s) => s.navigate)
  const params = useRouteParams()
  const [unlockTarget, setUnlockTarget] = useState<{
    contentType: string
    contentId: string
    contentTitle: string
    contentPrice: number
  } | null>(null)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error || !exams || exams.length === 0) {
    return <ChapterEmptyState tab="exam" />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {(exams as ExamItem[]).map((exam, i) => (
        <ExamCard
          key={exam.id}
          exam={exam}
          index={i}
          onStart={() => navigate('exam-session', { examId: exam.id })}
          onUnlock={() => setUnlockTarget({
            contentType: 'exam',
            contentId: exam.id,
            contentTitle: exam.title,
            contentPrice: exam.price,
          })}
        />
      ))}
      {unlockTarget && (
        <PurchaseOptionsModal
          open
          onOpenChange={(open) => { if (!open) setUnlockTarget(null) }}
          {...unlockTarget}
          classLevel={params.classSlug}
        />
      )}
    </div>
  )
}
