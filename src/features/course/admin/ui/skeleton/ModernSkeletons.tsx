'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex gap-4">
        <Skeleton className="h-20 w-28 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border p-4 flex items-center gap-4">
      <Skeleton className="h-11 w-11 rounded-full shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3.5 w-24" />
      </div>
    </div>
  )
}

export function LessonCardSkeleton() {
  return (
    <div className="rounded-xl border p-3 flex items-start gap-3">
      <div className="flex flex-col items-center gap-1 pt-1">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-3 w-4" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  )
}
