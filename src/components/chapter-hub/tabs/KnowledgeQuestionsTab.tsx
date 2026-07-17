'use client'

import { useState } from 'react'
import { useRouterStore } from '@/store/router'
import { useChapterKnowledge, type KnowledgeItem } from '@/hooks/use-chapter-content'
import { KnowledgeCard } from '../cards/KnowledgeCard'
import { ChapterEmptyState } from '../ChapterEmptyState'
import PurchaseOptionsModal from '@/components/shared/PurchaseOptionsModal'
import { Skeleton } from '@/components/ui/skeleton'

interface KnowledgeQuestionsTabProps {
  chapterId: string
}

export function KnowledgeQuestionsTab({ chapterId }: KnowledgeQuestionsTabProps) {
  const { data: items, isLoading, error } = useChapterKnowledge(chapterId)
  const classSlug = useRouterStore((s) => s.params.classSlug)
  const [unlockTarget, setUnlockTarget] = useState<{
    contentType: string
    contentId: string
    contentTitle: string
    contentPrice: number
  } | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error || !items || items.length === 0) {
    return <ChapterEmptyState tab="knowledge" />
  }

  return (
    <div className="space-y-4">
      {(items as KnowledgeItem[]).map((item, i) => (
        <KnowledgeCard key={item.id} item={item} index={i} onUnlock={() => setUnlockTarget({
          contentType: 'knowledge',
          contentId: item.id,
          contentTitle: item.question.replace(/<[^>]*>/g, '').slice(0, 80),
          contentPrice: item.price,
        })} />
      ))}
      {unlockTarget && (
        <PurchaseOptionsModal
          open
          onOpenChange={(open) => { if (!open) setUnlockTarget(null) }}
          {...unlockTarget}
          classLevel={classSlug}
        />
      )}
    </div>
  )
}
