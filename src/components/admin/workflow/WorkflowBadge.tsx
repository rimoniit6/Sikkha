'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock, Eye, CheckCircle, Send, Archive, RotateCcw, Calendar, FileText } from 'lucide-react'

export type WorkflowStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'ARCHIVED'

const STATUS_CONFIG: Record<WorkflowStatus, {
  label: string
  color: string
  icon: React.ElementType
}> = {
  DRAFT: {
    label: 'খসড়া',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: FileText,
  },
  IN_REVIEW: {
    label: 'পর্যালোচনায়',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Eye,
  },
  APPROVED: {
    label: 'অনুমোদিত',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'প্রত্যাখ্যাত',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: RotateCcw,
  },
  SCHEDULED: {
    label: 'নির্ধারিত',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Calendar,
  },
  PUBLISHED: {
    label: 'প্রকাশিত',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Send,
  },
  ARCHIVED: {
    label: 'আর্কাইভ',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Archive,
  },
}

interface WorkflowBadgeProps {
  status: WorkflowStatus | string | null
  className?: string
}

export function WorkflowBadge({ status, className = '' }: WorkflowBadgeProps) {
  const config = STATUS_CONFIG[(status as WorkflowStatus) || 'DRAFT']
  if (!config) return null

  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={`${config.color} ${className}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  )
}
