'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Crown, Layers, TrendingUp, DollarSign, PlayCircle, Loader2, Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import SafeImage from '@/components/ui/safe-image'
import { useToast } from '@/hooks/use-toast'
import { courseAdminService } from '@/services/api/course-admin.service'
import type { CourseRecord, SubjectOption, ClassOption } from '../../ui/filter/types'
import CourseCard from '../../ui/card/CourseCard'
import SearchFilters from '../../ui/filter/SearchFilters'
import { StatsCardSkeleton, LessonCardSkeleton } from '../../ui/skeleton/ModernSkeletons'

interface Props {
  courses: CourseRecord[]
  loading: boolean
  total: number
  page: number
  totalPages: number
  classes: ClassOption[]
  subjects: SubjectOption[]
  search: string
  statusFilter: string
  classFilter: string
  subjectFilter: string
  typeFilter: string
  viewMode: 'table' | 'grid'
  onSearchChange: (v: string) => void
  onStatusFilterChange: (v: string) => void
  onClassFilterChange: (v: string) => void
  onSubjectFilterChange: (v: string) => void
  onTypeFilterChange: (v: string) => void
  onViewModeChange: (v: 'table' | 'grid') => void
  onPageChange: (p: number) => void
  onAdd: () => void
  onEdit: (c: CourseRecord) => void
  onDeleteRequest: (id: string) => void
  onDeleteConfirm: (id: string) => Promise<void>
  onDeleteCancel: () => void
}

const PAGE_SIZE = 20

export default function ModernCourseList({
  courses, loading, total, page, totalPages, classes, subjects,
  search, statusFilter, classFilter, subjectFilter, typeFilter, viewMode,
  onSearchChange, onStatusFilterChange, onClassFilterChange,
  onSubjectFilterChange, onTypeFilterChange, onViewModeChange,
  onPageChange, onAdd, onEdit, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
}: Props) {
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(courses.map(c => c.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const allSelected = courses.length > 0 && selectedIds.size === courses.length
  const someSelected = selectedIds.size > 0 && !allSelected

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    setBulkDeleting(true)
    try {
      await Promise.all([...selectedIds].map(id => courseAdminService.delete(id)))
      toast({ title: `${selectedIds.size}টি কোর্স মুছে ফেলা হয়েছে` })
      setSelectedIds(new Set())
      setDeleteTargetId(null)
    } catch {
      toast({ title: 'কিছু কোর্স মুছে ফেলা যায়নি', variant: 'destructive' })
    } finally { setBulkDeleting(false) }
  }

  const stats = useMemo(() => {
    const published = courses.filter(c => c.status === 'published').length
    const drafts = courses.filter(c => c.status === 'draft').length
    const totalRevenue = courses.reduce((sum, c) => sum + (c.price || 0) * (c._count?.purchases ?? 0), 0)
    return { published, drafts, totalRevenue }
  }, [courses])

  const displayCourses = viewMode === 'grid'
    ? courses.slice(0, PAGE_SIZE)
    : courses

  return (
    <div className="space-y-6">
      <ModernCourseDashboardHeader
        totalCourses={total}
        publishedCount={stats.published}
        draftCount={stats.drafts}
        totalRevenue={stats.totalRevenue}
      />

      <SearchFilters
        search={search} onSearchChange={onSearchChange}
        statusFilter={statusFilter} onStatusFilterChange={v => { onStatusFilterChange(v === 'all' ? '' : v); onPageChange(1) }}
        classFilter={classFilter} onClassFilterChange={v => { onClassFilterChange(v); onSubjectFilterChange(''); onPageChange(1) }}
        subjectFilter={subjectFilter} onSubjectFilterChange={v => { onSubjectFilterChange(v); onPageChange(1) }}
        typeFilter={typeFilter} onTypeFilterChange={v => { onTypeFilterChange(v === 'all' ? '' : v); onPageChange(1) }}
        classes={classes} subjects={subjects}
        total={total}
        viewMode={viewMode} onViewModeChange={onViewModeChange}
        selectedIds={selectedIds} onClearSelection={() => setSelectedIds(new Set())}
        onAdd={onAdd}
      />

      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5"
        >
          <CheckCircle2 className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-sm text-destructive font-medium">
            {selectedIds.size}টি কোর্স নির্বাচিত
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive h-8"
              onClick={() => setSelectedIds(new Set())}
            >
              বাতিল
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              disabled={bulkDeleting}
              onClick={() => setDeleteTargetId('bulk')}
            >
              {bulkDeleting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              সব মুছে ফেলুন
            </Button>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <CourseEmptyState
          icon={<BookOpen className="h-7 w-7" />}
          title="কোনো কোর্স পাওয়া যায়নি"
          description="প্রথম কোর্স তৈরি করুন এবং শেখার যাত্রা শুরু করুন"
          actionLabel="নতুন কোর্স তৈরি করুন"
          onAction={onAdd}
        />
      ) : viewMode === 'grid' ? (
        <motion.div
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          initial={false}
        >
          <AnimatePresence mode="popLayout">
            {displayCourses.map((course, i) => (
              <ModernCourseGridCard
                key={course.id}
                course={course}
                selected={selectedIds.has(course.id)}
                onSelect={toggleSelect}
                onEdit={onEdit}
                onDeleteRequest={id => setDeleteTargetId(id)}
                index={i}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="সব নির্বাচন"
                    />
                  </TableHead>
                  <TableHead className="w-16 text-center">নং</TableHead>
                  <TableHead>কোর্স</TableHead>
                  <TableHead>শ্রেণি / বিষয়</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead>মূল্য</TableHead>
                  <TableHead className="text-center">পাঠ</TableHead>
                  <TableHead className="text-center">ক্রয়</TableHead>
                  <TableHead className="w-24 text-right">কর্ম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayCourses.map((course, i) => (
                  <TableRow
                    key={course.id}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-muted/40',
                      selectedIds.has(course.id) && 'bg-primary/5'
                    )}
                    onClick={() => onEdit(course)}
                  >
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(course.id)}
                        onCheckedChange={v => toggleSelect(course.id, !!v)}
                      />
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground font-mono">
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-16 shrink-0 rounded-lg overflow-hidden bg-muted/60">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                              <BookOpen className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate max-w-[220px]">{course.title}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">/{course.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs">{course.classCategory?.name || '—'}</span>
                        <span className="text-xs text-muted-foreground">{course.subject?.name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={course.status} />
                    </TableCell>
                    <TableCell>
                      <PriceDisplay price={course.price || 0} originalPrice={course.originalPrice} isPremium={course.isPremium} />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-medium">{course._count?.lessons ?? 0}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-medium">{course._count?.purchases ?? 0}</span>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-0.5">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(course)}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => onDeleteRequest(course.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {totalPages > 1 && (
        <ModernPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}

      <AlertDialog open={!!deleteTargetId} onOpenChange={v => { if (!v) { onDeleteCancel(); setDeleteTargetId(null) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>কোর্স মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              এই কোর্স এবং এর সব ডেটা স্থায়ীভাবে মুছে যাবে। এই কাজ:\Cannot পূরণ করা যাবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { onDeleteCancel(); setDeleteTargetId(null) }}>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteTargetId && deleteTargetId !== 'bulk') {
                  await onDeleteConfirm(deleteTargetId)
                  setDeleteTargetId(null)
                }
              }}
              disabled={deleteTargetId === 'bulk'}
              className="bg-red-600 hover:bg-red-700"
            >
              মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {deleteTargetId === 'bulk' && (
        <AlertDialog open onOpenChange={v => { if (!v) setDeleteTargetId(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>নির্বাচিত কোর্সসমূহ মুছে ফেলবেন?</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedIds.size}টি কোর্স এবং তাদের সব ডেটা স্থায়ীভাবে মুছে যাবে।
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteTargetId(null)}>বাতিল</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                {bulkDeleting ? 'মুছে ফেলছে...' : 'সব মুছে ফেলুন'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

function ModernCourseDashboardHeader({
  totalCourses, publishedCount, draftCount, totalRevenue,
}: {
  totalCourses: number
  publishedCount: number
  draftCount: number
  totalRevenue: number
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">কোর্স ব্যবস্থাপনা</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            আপনার কোর্স ক্যাটালগ পরিচালনা করুন ও নতুন কোর্স তৈরি করুন
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="মোট কোর্স" value={totalCourses} color="blue" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="পাবলিশড" value={publishedCount} color="green" />
        <StatCard icon={<Layers className="h-5 w-5" />} label="ড্রাফট" value={draftCount} color="amber" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="মোট আয়" value={`৳${totalRevenue.toLocaleString('bn-BD')}`} color="rose" />
      </div>
    </div>
  )
}

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  color: 'blue' | 'green' | 'amber' | 'rose'
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-600',
  }
  return (
    <div className="flex items-center gap-3.5 rounded-xl border bg-card p-4 transition-colors hover:shadow-sm">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  )
}

function ModernCourseGridCard({ course, selected, onSelect, onEdit, onDeleteRequest, index }: {
  course: CourseRecord
  selected?: boolean
  onSelect?: (id: string, selected: boolean) => void
  onEdit: (c: CourseRecord) => void
  onDeleteRequest: (id: string) => void
  index: number
}) {
  return (
    <Card className={cn(
      'group relative overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer',
      selected && 'border-primary ring-1 ring-primary/30 bg-primary/5'
    )} onClick={() => onEdit(course)}>
      <CardContent className="p-0">
        <div className="relative h-36 bg-muted/40 overflow-hidden">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/30">
              <BookOpen className="h-10 w-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
            <div className="flex gap-1.5">
              <StatusBadge status={course.status} />
              <PriceDisplay price={course.price || 0} originalPrice={course.originalPrice} isPremium={course.isPremium} />
            </div>
            {onSelect && (
              <div onClick={e => e.stopPropagation()}>
                <Checkbox
                  checked={selected}
                  onCheckedChange={v => onSelect(course.id, !!v)}
                />
              </div>
            )}
          </div>
        </div>
        <div className="p-3.5 space-y-2">
          <h3 className="font-semibold text-sm truncate" title={course.title}>{course.title}</h3>
          <p className="text-xs text-muted-foreground font-mono truncate">/{course.slug}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {course.classCategory?.name && (
              <span className="text-[11px] rounded-md bg-muted/60 px-1.5 py-0.5">{course.classCategory.name}</span>
            )}
            {course.subject?.name && (
              <span className="text-[11px] rounded-md bg-muted/40 px-1.5 py-0.5">{course.subject.name}</span>
            )}
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{course._count?.lessons ?? 0}</span>
              <span>{course._count?.purchases ?? 0} ক্রয়</span>
            </div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(course)}>
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDeleteRequest(course.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ModernPagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  const pages = useMemo(() => {
    const result: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) result.push(i)
    } else {
      result.push(1)
      if (page > 3) result.push('...')
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) result.push(i)
      if (page < totalPages - 2) result.push('...')
      result.push(totalPages)
    }
    return result
  }, [page, totalPages])

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => page > 1 && onPageChange(page - 1)}
            className={cn(!page || page <= 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer')}
          />
        </PaginationItem>
        {pages.map((p, i) =>
          p === '...' ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <span className="px-3 text-muted-foreground">...</span>
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                onClick={() => onPageChange(p as number)}
                isActive={page === p}
                className="cursor-pointer"
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            onClick={() => page < totalPages && onPageChange(page + 1)}
            className={cn(page >= totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer')}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

