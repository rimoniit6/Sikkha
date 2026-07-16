'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Edit3, Trash2, Crown, Layers, BookOpen,
  ChevronUp, ChevronDown, Copy, CheckCircle2, MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { CourseRecord } from '@/services/api/course.service'
import StatusBadge from '../shared/StatusBadge'
import PriceDisplay from '../shared/PriceDisplay'

interface CourseCardProps {
  course: CourseRecord
  selected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onEdit: (c: CourseRecord) => void
  onDeleteRequest: (id: string) => void
  index: number
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export default memo(function CourseCard({
  course, selected, onSelect, onEdit, onDeleteRequest, index,
}: CourseCardProps) {
  const lessonCount = course._count?.lessons ?? 0
  const purchaseCount = course._count?.purchases ?? 0

  return (
    <motion.div variants={item} layout>
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-200',
          'hover:shadow-md border',
          selected ? 'border-primary ring-1 ring-primary/30 bg-primary/5' : 'hover:border-primary/30'
        )}
      >
        <CardContent className="p-0">
          <div className="flex gap-4 p-4">
            {onSelect && (
              <div className="flex items-center">
                <Checkbox
                  checked={selected}
                  onCheckedChange={v => onSelect(course.id, !!v)}
                  aria-label={`${course.title} নির্বাচন`}
                />
              </div>
            )}

            <div
              className="flex h-20 w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-muted/60"
              onClick={() => onEdit(course)}
            >
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <BookOpen className="h-7 w-7 text-muted-foreground/40" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <button
                    onClick={() => onEdit(course)}
                    className="text-left font-semibold text-sm truncate hover:text-primary transition-colors"
                    title={course.title}
                  >
                    {course.title}
                  </button>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">/{course.slug}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StatusBadge status={course.status} />
                  <PriceDisplay price={course.price || 0} originalPrice={course.originalPrice} isPremium={course.isPremium} />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {course.classCategory?.name && (
                  <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5">
                    {course.classCategory.name}
                  </span>
                )}
                {course.subject?.name && (
                  <span className="inline-flex items-center rounded-md bg-muted/40 px-2 py-0.5">
                    {course.subject.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {lessonCount} পাঠ
                </span>
                <span>{purchaseCount} ক্রয়</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onEdit(course)}
                title="সম্পাদনা"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(course)}>
                    <Edit3 className="h-3.5 w-3.5 mr-2" />
                    সম্পাদনা করুন
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(course.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    কপি আইডি
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDeleteRequest(course.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    মুছে ফেলুন
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

import { cn } from '@/lib/utils'
