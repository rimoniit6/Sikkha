'use client'

import { Badge } from '@/components/ui/badge'
import { STATUS_META } from '../use-course-constants'

interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status] || { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <Badge
      variant="outline"
      className={cn('text-[11px] font-medium border', meta.className)}
    >
      {meta.label}
    </Badge>
  )
}

import { cn } from '@/lib/utils'
