'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Trash2, RotateCcw, X, Search, Filter, AlertTriangle, CheckCircle, Clock, User, FileText, ChevronDown, Loader2, Package, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useTableSelection } from '@/hooks/use-table-selection'

interface TrashItem {
  id: string
  model: string
  modelLabel: string
  displayTitle: string
  deletedAt: string | null
  deletedBy: string | null
  deleteReason: string | null
}

interface TrashFilters {
  models: Array<{ value: string; label: string; count: number }>
  deletedByUsers: string[]
}

interface TrashStats {
  total: number
  byModel: Record<string, number>
}

interface TrashData {
  items: TrashItem[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  filters: TrashFilters
  stats: TrashStats
}

export default function AdminTrashPage() {
  const { toast } = useToast()
  const [data, setData] = useState<TrashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modelFilter, setModelFilter] = useState<string>('all')
  const [deletedByFilter, setDeletedByFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState('deletedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Action states
  const [actionLoading, setActionLoading] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState<{ current: number; total: number; status: string } | null>(null)
  const [forceDeleteProgress, setForceDeleteProgress] = useState<{ current: number; total: number; status: string } | null>(null)
  const [restoreDialog, setRestoreDialog] = useState<{ open: boolean; ids: string[]; mode: 'single' | 'bulk'; cascade: boolean }>({ open: false, ids: [], mode: 'single', cascade: false })
  const [forceDeleteDialog, setForceDeleteDialog] = useState<{
    open: boolean
    ids: string[]
    mode: 'single' | 'bulk'
    cascade: boolean
    confirmText: string
    secondConfirm: boolean
    preview: {
      record: { model: string; id: string; displayTitle: string } | null
      dependencies: Array<{ model: string; label: string; totalCount: number; activeCount: number; deletedCount: number }>
      totalDeleted: number
      totalActive: number
      totalRecords?: number
      riskLevel?: string
      blocked?: boolean
      blockReasons?: string[]
      directChildren?: Array<{ model: string; label: string; totalCount: number; activeCount: number; deletedCount: number }>
      indirectChildren?: Array<{ model: string; label: string; totalCount: number; activeCount: number; deletedCount: number }>
    } | null
    previewLoading: boolean
  }>({
    open: false, ids: [], mode: 'single', cascade: false, confirmText: '',
    secondConfirm: false, preview: null, previewLoading: false,
  })

  const fetchTrash = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '30',
        sortBy,
        sortDir,
      })
      if (search) params.set('q', search)
      if (modelFilter !== 'all') params.set('model', modelFilter)
      if (deletedByFilter !== 'all') params.set('deletedBy', deletedByFilter)

      const res = await fetch(`/api/admin/trash?${params}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        toast({ title: 'ত্রুটি', description: json.error || 'ডাটা লোড করা যায়নি', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search, modelFilter, deletedByFilter, sortBy, sortDir, toast])

  useEffect(() => { fetchTrash() }, [fetchTrash])

  const { selectedIds, selectedSet, toggleOne, toggleAll, clearSelection, count: selectedCount } = useTableSelection(data?.items || [])

  const handleRestore = async (ids: string[], cascade: boolean) => {
    setActionLoading(true)
    setRestoreProgress({ current: 0, total: ids.length, status: 'restoring' })
    try {
      const res = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', ids, cascade }),
      })
      const json = await res.json()
      if (json.success) {
        const cascadeMsg = json.data?.cascadeRestored > 0
          ? ` (${json.data.cascadeRestored}টি চাইল্ড সহ)`
          : ''
        const durationMsg = json.data?.duration
          ? ` (${(json.data.duration / 1000).toFixed(1)}s)`
          : ''
        toast({
          title: 'সফল',
          description: json.message || `${json.data.restored}টি রেকর্ড পুনরুদ্ধার হয়েছে${cascadeMsg}${durationMsg}`,
        })
        clearSelection()
        fetchTrash()
      } else {
        // Show individual errors
        const failed = json.data?.results?.filter((r: { success: boolean }) => !r.success) || []
        if (failed.length > 0) {
          toast({
            title: 'আংশিক সফল',
            description: `${json.data.restored || 0}টি পুনরুদ্ধার হয়েছে, ${failed.length}টি ব্যর্থ: ${failed[0].error}`,
            variant: 'destructive',
          })
        } else {
          toast({ title: 'ত্রুটি', description: json.error || 'পুনরুদ্ধার ব্যর্থ', variant: 'destructive' })
        }
        fetchTrash()
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setActionLoading(false)
      setRestoreProgress(null)
      setRestoreDialog({ open: false, ids: [], mode: 'single', cascade: false })
    }
  }

  const fetchForceDeletePreview = useCallback(async (ids: string[], cascade: boolean) => {
    setForceDeleteDialog(prev => ({ ...prev, previewLoading: true }))
    try {
      const res = await fetch('/api/admin/trash/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, cascade }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        const impact = json.data
        // Normalize impact data for the dialog
        if (impact.combinedModels) {
          // Multi-record impact format
          setForceDeleteDialog(prev => ({
            ...prev,
            preview: {
              record: impact.records?.[0] || null,
              dependencies: impact.combinedModels || [],
              totalDeleted: impact.totalDeleted || 0,
              totalActive: impact.totalActive || 0,
              totalRecords: impact.totalRecords || ids.length,
              riskLevel: impact.riskLevel || 'LOW',
              blocked: impact.blocked || false,
              blockReasons: impact.blockReasons || [],
              directChildren: impact.combinedDirectChildren || [],
              indirectChildren: impact.combinedIndirectChildren || [],
            },
            previewLoading: false,
          }))
        } else {
          // Single-record impact format
          setForceDeleteDialog(prev => ({
            ...prev,
            preview: {
              record: impact.record,
              dependencies: impact.models || [],
              totalDeleted: impact.totalDeleted || 0,
              totalActive: impact.totalActive || 0,
              totalRecords: 1,
              riskLevel: impact.riskLevel || 'LOW',
              blocked: impact.blocked || false,
              blockReasons: impact.blockReasons || [],
              directChildren: impact.directChildren || [],
              indirectChildren: impact.indirectChildren || [],
            },
            previewLoading: false,
          }))
        }
      }
    } catch {
      setForceDeleteDialog(prev => ({ ...prev, previewLoading: false }))
    }
  }, [])

  const handleForceDelete = async (ids: string[], cascade: boolean) => {
    setActionLoading(true)
    setForceDeleteProgress({ current: 0, total: ids.length, status: 'deleting' })
    try {
      const res = await fetch('/api/admin/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forceDelete', ids, cascade }),
      })
      const json = await res.json()
      if (json.success) {
        const cascadeMsg = json.data?.cascadeDeleted > 0
          ? ` (${json.data.cascadeDeleted}টি চাইল্ড সহ)`
          : ''
        const durationMsg = json.data?.duration
          ? ` (${(json.data.duration / 1000).toFixed(1)}s)`
          : ''
        toast({
          title: 'সফল',
          description: json.message || `${json.data.deleted}টি রেকর্ড স্থায়ীভাবে মুছে ফেলা হয়েছে${cascadeMsg}${durationMsg}`,
        })
        clearSelection()
        fetchTrash()
      } else {
        const failed = json.data?.results?.filter((r: { success: boolean }) => !r.success) || []
        if (failed.length > 0) {
          toast({
            title: 'আংশিক সফল',
            description: `${json.data.deleted || 0}টি মুছে ফেলা হয়েছে, ${failed.length}টি ব্যর্থ: ${failed[0].error}`,
            variant: 'destructive',
          })
        } else {
          toast({ title: 'ত্রুটি', description: json.error || 'মুছে ফেলা ব্যর্থ', variant: 'destructive' })
        }
        fetchTrash()
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setActionLoading(false)
      setForceDeleteDialog({
        open: false, ids: [], mode: 'single', cascade: false, confirmText: '',
        secondConfirm: false, preview: null, previewLoading: false,
      })
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const stats = data?.stats
  const topModels = useMemo(() => {
    if (!stats) return []
    return Object.entries(stats.byModel)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
  }, [stats])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-muted-foreground" />
            ট্র্যাশ
          </h1>
          <p className="text-muted-foreground mt-1">
            মুছে ফেলা কন্টেন্ট পুনরুদ্ধার বা স্থায়ীভাবে মুছুন
          </p>
        </div>
        {stats && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {stats.total}টি রেকর্ড
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      {topModels.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {topModels.map(([model, count]) => (
            <Card
              key={model}
              className={`cursor-pointer transition-colors hover:bg-accent ${modelFilter === model ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => { setModelFilter(modelFilter === model ? 'all' : model); setPage(1) }}
            >
              <CardContent className="p-3">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {data?.filters.models.find(m => m.value === model)?.label || model}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="খুঁজুন..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>

        <Select value={modelFilter} onValueChange={(v) => { setModelFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="ধরন" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব ধরন</SelectItem>
            {data?.filters.models.map(m => (
              <SelectItem key={m.value} value={m.value}>
                {m.label} ({m.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={deletedByFilter} onValueChange={(v) => { setDeletedByFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <User className="h-4 w-4 mr-2" />
            <SelectValue placeholder="মুছে ফেলা করেছেন" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব ব্যবহারকারী</SelectItem>
            {data?.filters.deletedByUsers.map(u => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={`${sortBy}-${sortDir}`} onValueChange={(v) => {
          const [field, dir] = v.split('-')
          setSortBy(field)
          setSortDir(dir as 'asc' | 'desc')
        }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="সাজানো" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deletedAt-desc">নতুন মুছে ফেলা</SelectItem>
            <SelectItem value="deletedAt-asc">পুরানো মুছে ফেলা</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <span className="text-sm font-medium">{selectedCount}টি নির্বাচিত</span>
          <Button size="sm" variant="outline" onClick={() => setRestoreDialog({ open: true, ids: selectedIds, mode: 'bulk', cascade: false })}>
            <RotateCcw className="h-4 w-4 mr-1" />
            পুনরুদ্ধার
          </Button>
          <Button size="sm" variant="destructive" onClick={() => {
            setForceDeleteDialog({
              open: true, ids: selectedIds, mode: 'bulk', cascade: false, confirmText: '',
              secondConfirm: false, preview: null, previewLoading: false,
            })
            fetchForceDeletePreview(selectedIds, false)
          }}>
            <Trash2 className="h-4 w-4 mr-1" />
            স্থায়ী মুছুন
          </Button>
          <Button size="sm" variant="ghost" onClick={clearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">ট্র্যাশ খালি</p>
            <p className="text-sm text-muted-foreground mt-1">মুছে ফেলা কোনো কন্টেন্ট নেই</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Select All */}
          <div className="flex items-center gap-2 px-3 py-2">
            <input
              type="checkbox"
              checked={data.items.length > 0 && data.items.every(item => selectedSet.has(item.id))}
              onChange={() => toggleAll()}
              className="rounded"
            />
            <span className="text-sm text-muted-foreground">সব নির্বাচন করুন</span>
          </div>

          {data.items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                selectedSet.has(item.id) ? 'bg-primary/5 border-primary/20' : 'bg-card hover:bg-accent/50'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedSet.has(item.id)}
                onChange={() => toggleOne(item.id)}
                className="rounded"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs shrink-0">
                    {item.modelLabel}
                  </Badge>
                  <span className="font-medium truncate">{item.displayTitle}</span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(item.deletedAt)}
                  </span>
                  {item.deletedBy && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.deletedBy}
                    </span>
                  )}
                  {item.deleteReason && (
                    <span className="flex items-center gap-1 truncate">
                      <FileText className="h-3 w-3" />
                      {item.deleteReason}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRestoreDialog({ open: true, ids: [item.id], mode: 'single', cascade: false })}
                  title="পুনরুদ্ধার"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setForceDeleteDialog({
                      open: true, ids: [item.id], mode: 'single', cascade: false, confirmText: '',
                      secondConfirm: false, preview: null, previewLoading: false,
                    })
                    fetchForceDeletePreview([item.id], false)
                  }}
                  title="স্থায়ী মুছুন"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.pagination.total}টির মধ্যে {((data.pagination.page - 1) * data.pagination.limit) + 1}-
            {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} দেখাচ্ছে
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              পূর্ববর্তী
            </Button>
            <span className="text-sm">
              {data.pagination.page} / {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              পরবর্তী
            </Button>
          </div>
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialog.open} onOpenChange={(open) => {
        if (!open && !actionLoading) setRestoreDialog({ ...restoreDialog, open: false })
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-green-600" />
              {actionLoading ? 'পুনরুদ্ধার হচ্ছে...' : 'পুনরুদ্ধার নিশ্চিত করুন'}
            </DialogTitle>
            <DialogDescription>
              {actionLoading
                ? `${restoreProgress?.current || 0}/${restoreProgress?.total || restoreDialog.ids.length} রেকর্ড প্রক্রিয়াকরণ হচ্ছে...`
                : restoreDialog.mode === 'bulk'
                  ? `${restoreDialog.ids.length}টি রেকর্ড পুনরুদ্ধার করতে চান?`
                  : 'এই রেকর্ডটি পুনরুদ্ধার করতে চান?'
              }
            </DialogDescription>
          </DialogHeader>

          {/* Progress indicator */}
          {actionLoading && restoreProgress && (
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(restoreProgress.current / restoreProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {restoreProgress.current}/{restoreProgress.total} রেকর্ড পুনরুদ্ধার হয়েছে
              </p>
            </div>
          )}

          {/* Cascade restore option */}
          {!actionLoading && (
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <input
                type="checkbox"
                id="cascade-restore"
                checked={restoreDialog.cascade}
                onChange={(e) => setRestoreDialog({ ...restoreDialog, cascade: e.target.checked })}
                className="mt-0.5 rounded"
              />
              <label htmlFor="cascade-restore" className="text-sm">
                <span className="font-medium">চাইল্ড কন্টেন্টও পুনরুদ্ধার করুন</span>
                <p className="text-muted-foreground mt-1">
                  এই অপশন চালু করলে মূল রেকর্ডের সাথে সাথে সকল মুছে ফেলা চাইল্ড কন্টেন্টও পুনরুদ্ধার হবে।
                </p>
              </label>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialog({ ...restoreDialog, open: false })} disabled={actionLoading}>
              {actionLoading ? 'বন্ধ করুন' : 'বাতিল'}
            </Button>
            {!actionLoading && (
              <Button onClick={() => handleRestore(restoreDialog.ids, restoreDialog.cascade)}>
                পুনরুদ্ধার করুন
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Delete Confirmation Dialog */}
      <Dialog open={forceDeleteDialog.open} onOpenChange={(open) => {
        if (!open && !actionLoading) setForceDeleteDialog({
          open: false, ids: [], mode: 'single', cascade: false, confirmText: '',
          secondConfirm: false, preview: null, previewLoading: false,
        })
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {actionLoading ? 'মুছে ফেলা হচ্ছে...' : 'স্থায়ী মুছে ফেলা নিশ্চিত করুন'}
            </DialogTitle>
            <DialogDescription>
              {actionLoading
                ? `${forceDeleteProgress?.current || 0}/${forceDeleteProgress?.total || forceDeleteDialog.ids.length} রেকর্ড প্রক্রিয়াকরণ হচ্ছে...`
                : forceDeleteDialog.mode === 'bulk'
                  ? `${forceDeleteDialog.ids.length}টি রেকর্ড স্থায়ীভাবে মুছে ফেলতে চান?`
                  : 'এই রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Progress indicator */}
            {actionLoading && forceDeleteProgress && (
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-destructive h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(forceDeleteProgress.current / forceDeleteProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {forceDeleteProgress.current}/{forceDeleteProgress.total} রেকর্ড মুছে ফেলা হয়েছে
                </p>
              </div>
            )}

            {/* Cascade option */}
            {!actionLoading && (
              <div className="flex items-start gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <input
                  type="checkbox"
                  id="cascade-force-delete"
                  checked={forceDeleteDialog.cascade}
                  onChange={(e) => {
                    const cascade = e.target.checked
                    setForceDeleteDialog(prev => ({ ...prev, cascade, confirmText: '', secondConfirm: false, preview: null }))
                    fetchForceDeletePreview(forceDeleteDialog.ids, cascade)
                  }}
                  className="mt-0.5 rounded"
                />
                <label htmlFor="cascade-force-delete" className="text-sm">
                  <span className="font-medium text-destructive">ক্যাসকেড মুছে ফেলা</span>
                  <p className="text-muted-foreground mt-1">
                    এই অপশন চালু করলে মূল রেকর্ডের সাথে সাথে সকল মুছে ফেলা চাইল্ড কন্টেন্টও স্থায়ীভাবে মুছে ফেলা হবে।
                  </p>
                </label>
              </div>
            )}

            {/* Preview */}
            {forceDeleteDialog.previewLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                নির্ভরতা গণনা করা হচ্ছে...
              </div>
            )}

            {forceDeleteDialog.preview && !forceDeleteDialog.previewLoading && (
              <div className="space-y-3">
                {/* Risk Level Badge */}
                {forceDeleteDialog.preview.riskLevel && (
                  <div className={`flex items-center gap-2 p-2 rounded-lg ${
                    forceDeleteDialog.preview.riskLevel === 'CRITICAL' ? 'bg-red-100 border border-red-300' :
                    forceDeleteDialog.preview.riskLevel === 'HIGH' ? 'bg-orange-100 border border-orange-300' :
                    forceDeleteDialog.preview.riskLevel === 'MEDIUM' ? 'bg-yellow-100 border border-yellow-300' :
                    'bg-green-100 border border-green-300'
                  }`}>
                    <Shield className={`h-4 w-4 ${
                      forceDeleteDialog.preview.riskLevel === 'CRITICAL' ? 'text-red-600' :
                      forceDeleteDialog.preview.riskLevel === 'HIGH' ? 'text-orange-600' :
                      forceDeleteDialog.preview.riskLevel === 'MEDIUM' ? 'text-yellow-600' :
                      'text-green-600'
                    }`} />
                    <span className="text-sm font-medium">
                      ঝুঁকি: {forceDeleteDialog.preview.riskLevel === 'CRITICAL' ? 'সমালোচনামূলক' :
                               forceDeleteDialog.preview.riskLevel === 'HIGH' ? 'উচ্চ' :
                               forceDeleteDialog.preview.riskLevel === 'MEDIUM' ? 'মাঝারি' : 'কম'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({forceDeleteDialog.preview.totalDeleted + (forceDeleteDialog.preview.totalRecords || 1)}টি রেকর্ড)
                    </span>
                  </div>
                )}

                {/* Blocked warning */}
                {forceDeleteDialog.preview.blocked && forceDeleteDialog.preview.blockReasons && forceDeleteDialog.preview.blockReasons.length > 0 && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
                      <AlertCircle className="h-4 w-4" />
                      মুছে ফেলা ব্লক করা হয়েছে
                    </div>
                    {forceDeleteDialog.preview.blockReasons.map((reason, i) => (
                      <p key={i} className="text-xs text-destructive/80 ml-6">• {reason}</p>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">যা মুছে ফেলা হবে:</p>

                  {/* Show record count for bulk operations */}
                  {forceDeleteDialog.preview.totalRecords && forceDeleteDialog.preview.totalRecords > 1 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="destructive" className="text-xs">{forceDeleteDialog.preview.totalRecords}</Badge>
                      <span>রেকর্ড নির্বাচিত</span>
                    </div>
                  )}

                  {/* Direct Children */}
                  {forceDeleteDialog.preview.directChildren && forceDeleteDialog.preview.directChildren.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">সরাসরি নির্ভরতা:</p>
                      {forceDeleteDialog.preview.directChildren.map((dep, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm ml-2">
                          <Badge variant={dep.activeCount > 0 ? 'destructive' : 'secondary'} className="text-xs">
                            {dep.deletedCount}
                          </Badge>
                          <span>{dep.label}</span>
                          {dep.activeCount > 0 && (
                            <span className="text-destructive text-xs">(সক্রিয়: {dep.activeCount})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Indirect Children */}
                  {forceDeleteDialog.preview.indirectChildren && forceDeleteDialog.preview.indirectChildren.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">পরোক্ষ নির্ভরতা:</p>
                      {forceDeleteDialog.preview.indirectChildren.map((dep, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm ml-2">
                          <Badge variant={dep.activeCount > 0 ? 'destructive' : 'outline'} className="text-xs">
                            {dep.deletedCount}
                          </Badge>
                          <span className="text-muted-foreground">{dep.label}</span>
                          {dep.activeCount > 0 && (
                            <span className="text-destructive text-xs">(সক্রিয়: {dep.activeCount})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total summary */}
                  <div className="pt-2 border-t text-sm font-medium">
                    মোট স্থায়ী মুছে ফেলা: {forceDeleteDialog.preview.totalDeleted + (forceDeleteDialog.preview.totalRecords || 1)}টি
                  </div>

                  {forceDeleteDialog.preview.totalActive > 0 && (
                    <p className="text-sm text-destructive font-medium mt-2">
                      সতর্কতা: {forceDeleteDialog.preview.totalActive}টি সক্রিয় রেকর্ড ব্লক করছে। শুধুমাত্র মুছে ফেলা রেকর্ড মুছে ফেলা যাবে।
                    </p>
                  )}
                </div>
              </div>
            )}

            {forceDeleteDialog.preview && !forceDeleteDialog.previewLoading && forceDeleteDialog.preview.totalActive === 0 && (
              <p className="text-sm text-destructive">
                এটি পূর্বাবস্থায় ফেরানো যাবে না।
              </p>
            )}

            {/* Type-to-confirm */}
            {!actionLoading && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  নিশ্চিত করতে <span className="font-mono bg-muted px-1 rounded">DELETE</span> টাইপ করুন:
                </label>
                <Input
                  placeholder="DELETE"
                  value={forceDeleteDialog.confirmText}
                  onChange={(e) => setForceDeleteDialog(prev => ({ ...prev, confirmText: e.target.value }))}
                  className="font-mono"
                />
              </div>
            )}

            {/* Second confirmation for >100 records */}
            {!actionLoading && forceDeleteDialog.ids.length > 100 && forceDeleteDialog.confirmText === 'DELETE' && (
              <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <input
                  type="checkbox"
                  id="second-confirm"
                  checked={forceDeleteDialog.secondConfirm}
                  onChange={(e) => setForceDeleteDialog(prev => ({ ...prev, secondConfirm: e.target.checked }))}
                  className="mt-0.5 rounded"
                />
                <label htmlFor="second-confirm" className="text-sm">
                  <span className="font-medium text-destructive">
                    আমি বুঝতে পারছি এটি {forceDeleteDialog.ids.length}টি রেকর্ড স্থায়ীভাবে মুছে ফেলবে এবং এটি পূর্বাবস্থায় ফেরানো যাবে না।
                  </span>
                </label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setForceDeleteDialog({
                open: false, ids: [], mode: 'single', cascade: false, confirmText: '',
                secondConfirm: false, preview: null, previewLoading: false,
              })}
              disabled={actionLoading}
            >
              {actionLoading ? 'বন্ধ করুন' : 'বাতিল'}
            </Button>
            {!actionLoading && (
              <Button
                variant="destructive"
                onClick={() => handleForceDelete(forceDeleteDialog.ids, forceDeleteDialog.cascade)}
                disabled={
                  forceDeleteDialog.confirmText !== 'DELETE' ||
                  (forceDeleteDialog.ids.length > 100 && !forceDeleteDialog.secondConfirm)
                }
              >
                স্থায়ীভাবে মুছুন
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
