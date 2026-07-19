'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  History, Clock, User, Search, Filter, ChevronLeft, ChevronRight,
  RotateCcw, AlertTriangle, CheckCircle, Eye, X, Loader2, Shield,
  ArrowDown, ArrowUp, ArrowRight, ChevronDown, ChevronRight as ChevronRightIcon,
  GitCompare, Calendar, ExternalLink, Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

// ─── Types ───

interface VersionItem {
  id: string
  entityType: string
  entityId: string
  versionNumber: number
  snapshot: Record<string, unknown>
  changedFields: string[]
  changeType: string
  rollbackFromVersion: number | null
  rollbackComment: string | null
  performedBy: string
  performedByName: string | null
  performedByRole: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

interface DiffChange {
  fieldPath: string
  changeType: 'ADDED' | 'REMOVED' | 'UPDATED'
  oldValue: unknown
  newValue: unknown
  label: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  fileType?: string
  truncated?: boolean
}

// ─── Constants ───

const CHANGE_TYPE_COLORS: Record<string, string> = {
  ADDED: 'bg-green-100 text-green-800 border-green-200',
  REMOVED: 'bg-red-100 text-red-800 border-red-200',
  UPDATED: 'bg-orange-100 text-orange-800 border-orange-200',
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  ADDED: 'যোগ',
  REMOVED: 'সরানো',
  UPDATED: 'পরিবর্তিত',
}

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'কম',
  MEDIUM: 'মাঝারি',
  HIGH: 'উচ্চ',
  CRITICAL: 'সমালোচনামূলক',
}

const ACTION_LABELS: Record<string, string> = {
  create: 'তৈরি',
  update: 'আপডেট',
  restore: 'পুনরুদ্ধার',
  import: 'ইমপোর্ট',
}

// Field grouping for organized display
const FIELD_GROUPS: Record<string, string[]> = {
  'মৌলিক তথ্য': ['title', 'slug', 'description', 'name', 'key', 'label', 'status', 'type', 'order', 'isActive', 'classLevel', 'subjectId', 'chapterId', 'courseId', 'board', 'year', 'topic', 'tags', 'difficulty', 'correctAnswer', 'explanation'],
  'বিষয়বস্তু': ['content', 'question', 'uddeepok', 'question1', 'question2', 'question3', 'question4', 'answer1', 'answer2', 'answer3', 'answer4', 'optionA', 'optionB', 'optionC', 'optionD'],
  'মূল্য': ['price', 'originalPrice', 'isPremium', 'duration', 'durationLabel'],
  'মিডিয়া': ['thumbnail', 'videoUrl', 'audioUrl', 'pdfUrl', 'questionImage', 'optionAImage', 'optionBImage', 'optionCImage', 'optionDImage', 'explanationImage'],
  'মেটাডেটা': ['features', 'requirements', 'targetStudents', 'teacherName', 'hasCertificate', 'language', 'subjectIds', 'totalSets', 'value', 'group'],
}

// ─── Main Component ───

export default function AdminVersionHistoryPage() {
  const { toast } = useToast()
  const [data, setData] = useState<{ versions: VersionItem[]; total: number; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(null)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())

  // Comparison mode
  const [compareMode, setCompareMode] = useState(false)
  const [compareVersionA, setCompareVersionA] = useState<VersionItem | null>(null)
  const [compareVersionB, setCompareVersionB] = useState<VersionItem | null>(null)
  const [compareDialogOpen, setCompareDialogOpen] = useState(false)

  // Virtual scrolling
  const listRef = useRef<HTMLDivElement>(null)
  const [visibleStart, setVisibleStart] = useState(0)
  const ITEM_HEIGHT = 80
  const BUFFER = 5

  const fetchVersions = useCallback(async () => {
    if (!entityType || !entityId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        entityType,
        entityId,
        page: String(page),
        limit: '20',
      })
      if (search) params.set('q', search)
      if (actionFilter !== 'all') params.set('action', actionFilter)

      const res = await fetch(`/api/admin/version-history?${params}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        toast({ title: 'ত্রুটি', description: json.error || 'ডাটা লোড করা যায়নি', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId, page, search, actionFilter])

  // Virtual scrolling handler
  const handleScroll = useCallback(() => {
    if (!listRef.current) return
    const scrollTop = listRef.current.scrollTop
    const newStart = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER)
    setVisibleStart(newStart)
  }, [])

  const toggleField = (field: string) => {
    setExpandedFields(prev => {
      const next = new Set(prev)
      if (next.has(field)) next.delete(field)
      else next.add(field)
      return next
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  // Group versions by time period
  const groupedVersions = useMemo(() => {
    if (!data) return []
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 7)

    const groups: { label: string; versions: VersionItem[] }[] = [
      { label: 'আজ', versions: [] },
      { label: 'গতকাল', versions: [] },
      { label: 'গত ৭ দিন', versions: [] },
      { label: 'পুরানো', versions: [] },
    ]

    for (const version of data.versions) {
      const date = new Date(version.createdAt)
      if (date >= today) groups[0].versions.push(version)
      else if (date >= yesterday) groups[1].versions.push(version)
      else if (date >= last7Days) groups[2].versions.push(version)
      else groups[3].versions.push(version)
    }

    return groups.filter(g => g.versions.length > 0)
  }, [data])

  // Group changed fields by category
  const groupedFields = useMemo(() => {
    if (!selectedVersion) return []
    const groups: { label: string; fields: string[] }[] = []

    for (const [groupLabel, groupFields] of Object.entries(FIELD_GROUPS)) {
      const matching = selectedVersion.changedFields.filter(f => groupFields.some(gf => f.startsWith(gf)))
      if (matching.length > 0) {
        groups.push({ label: groupLabel, fields: matching })
      }
    }

    // Fields not in any group
    const grouped = new Set(groups.flatMap(g => g.fields))
    const ungrouped = selectedVersion.changedFields.filter(f => !grouped.has(f))
    if (ungrouped.length > 0) {
      groups.push({ label: 'অন্যান্য', fields: ungrouped })
    }

    return groups
  }, [selectedVersion])

  // Open compare dialog
  const openCompareDialog = useCallback(() => {
    setCompareVersionA(null)
    setCompareVersionB(null)
    setCompareDialogOpen(true)
  }, [])

  // Render text diff with highlighting
  const renderTextDiff = (oldVal: string, newVal: string) => {
    const oldWords = oldVal.split(/(\s+)/)
    const newWords = newVal.split(/(\s+)/)

    // Simple word-level diff
    const maxLen = Math.max(oldWords.length, newWords.length)
    const parts: { text: string; type: 'same' | 'old' | 'new' }[] = []

    for (let i = 0; i < maxLen; i++) {
      const oldWord = oldWords[i] || ''
      const newWord = newWords[i] || ''

      if (oldWord === newWord) {
        parts.push({ text: oldWord, type: 'same' })
      } else {
        if (oldWord) parts.push({ text: oldWord, type: 'old' })
        if (newWord) parts.push({ text: newWord, type: 'new' })
      }
    }

    return (
      <span className="text-xs">
        {parts.map((part, i) => {
          if (part.type === 'old') return <span key={i} className="bg-red-100 text-red-800 px-0.5 rounded">{part.text}</span>
          if (part.type === 'new') return <span key={i} className="bg-green-100 text-green-800 px-0.5 rounded">{part.text}</span>
          return <span key={i}>{part.text}</span>
        })}
      </span>
    )
  }

  // Render a single change
  const renderChange = (change: DiffChange, index: number) => {
    const isExpanded = expandedFields.has(change.fieldPath)
    const isLongValue = (typeof change.oldValue === 'string' && change.oldValue.length > 100) ||
                        (typeof change.newValue === 'string' && change.newValue.length > 100)

    // Check if it's an image/file URL
    const isImage = change.fileType === 'image'
    const isUrl = typeof change.oldValue === 'string' && (change.oldValue.startsWith('http') || change.oldValue.startsWith('https'))

    return (
      <div key={index} className={`p-3 rounded-lg border ${CHANGE_TYPE_COLORS[change.changeType]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{CHANGE_TYPE_LABELS[change.changeType]}</Badge>
            <span className="text-sm font-medium">{change.label}</span>
            <span className="text-xs text-muted-foreground font-mono">{change.fieldPath}</span>
          </div>
          <Badge className={`text-xs ${SEVERITY_COLORS[change.severity]}`}>
            {SEVERITY_LABELS[change.severity]}
          </Badge>
        </div>

        {change.changeType === 'UPDATED' && (
          <div className="mt-2 space-y-1">
            {isImage ? (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-red-600 font-medium mb-1">পুরানো:</p>
                  {change.oldValue && typeof change.oldValue === 'string' ? (
                    <img src={change.oldValue} alt="Old" className="w-20 h-20 object-cover rounded border" loading="lazy" />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-xs text-green-600 font-medium mb-1">নতুন:</p>
                  {change.newValue && typeof change.newValue === 'string' ? (
                    <img src={change.newValue} alt="New" className="w-20 h-20 object-cover rounded border" loading="lazy" />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            ) : isUrl ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-red-600 font-medium">পুরানো:</span>
                  <a href={String(change.oldValue)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[300px] flex items-center gap-1">
                    <Link2 className="h-3 w-3 shrink-0" />
                    {String(change.oldValue).substring(0, 50)}...
                  </a>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-600 font-medium">নতুন:</span>
                  <a href={String(change.newValue)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[300px] flex items-center gap-1">
                    <Link2 className="h-3 w-3 shrink-0" />
                    {String(change.newValue).substring(0, 50)}...
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-red-600 font-medium">পুরানো:</span>
                  {isLongValue ? renderTextDiff(String(change.oldValue), String(change.oldValue)) : (
                    <span className="text-muted-foreground break-all">{String(change.oldValue)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-green-600 font-medium">নতুন:</span>
                  {isLongValue ? renderTextDiff(String(change.oldValue), String(change.newValue)) : (
                    <span className="text-muted-foreground break-all">{String(change.newValue)}</span>
                  )}
                </div>
                {isLongValue && (
                  <button
                    onClick={() => toggleField(change.fieldPath)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {isExpanded ? 'সংক্ষিপ্ত করুন' : 'বিস্তারিত দেখুন'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {change.changeType === 'ADDED' && (
          <div className="mt-2 text-xs">
            <span className="text-green-600 font-medium">মান:</span>
            <span className="text-muted-foreground ml-2 break-all">{String(change.newValue)}</span>
          </div>
        )}

        {change.changeType === 'REMOVED' && (
          <div className="mt-2 text-xs">
            <span className="text-red-600 font-medium">পুরানো মান:</span>
            <span className="text-muted-foreground ml-2 break-all">{String(change.oldValue)}</span>
          </div>
        )}

        {change.fileType && (
          <div className="mt-1 text-xs text-muted-foreground">
            ফাইল টাইপ: {change.fileType}
          </div>
        )}
      </div>
    )
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sidePanelOpen || !data) return

      if (e.key === 'Escape') {
        setSidePanelOpen(false)
        setSelectedVersion(null)
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const currentIndex = data.versions.findIndex(v => v.id === selectedVersion?.id)
        if (currentIndex === -1) return

        const newIndex = e.key === 'ArrowDown'
          ? Math.min(currentIndex + 1, data.versions.length - 1)
          : Math.max(currentIndex - 1, 0)

        if (newIndex !== currentIndex) {
          setSelectedVersion(data.versions[newIndex])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidePanelOpen, data, selectedVersion])

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-muted-foreground" />
            ভার্সন হিস্ট্রি
          </h1>
          <p className="text-muted-foreground mt-1">
            কন্টেন্ট পরিবর্তনের সম্পূর্ণ ইতিহাস
          </p>
        </div>

        {/* Entity Selector */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-1 block">এন্টিটি টাইপ</label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="এন্টিটি নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lecture">লেকচার</SelectItem>
                    <SelectItem value="mCQ">MCQ</SelectItem>
                    <SelectItem value="cQ">CQ</SelectItem>
                    <SelectItem value="course">কোর্স</SelectItem>
                    <SelectItem value="exam">এক্সাম</SelectItem>
                    <SelectItem value="suggestion">সাজেশন</SelectItem>
                    <SelectItem value="knowledgeQuestion">সংক্ষিপ্ত প্রশ্ন</SelectItem>
                    <SelectItem value="contentPackage">প্যাকেজ</SelectItem>
                    <SelectItem value="contentBundle">বান্ডেল</SelectItem>
                    <SelectItem value="siteSetting">সেটিংস</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-1 block">এন্টিটি আইডি</label>
                <Input
                  placeholder="এন্টিটি আইডি"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                />
              </div>
              <Button onClick={fetchVersions} disabled={!entityType || !entityId || loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                খুঁজুন
              </Button>
              {data && data.versions.length >= 2 && (
                <Button variant="outline" onClick={openCompareDialog}>
                  <GitCompare className="h-4 w-4 mr-2" />
                  তুলনা করুন
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        {data && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ভার্সন খুঁজুন..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="অ্যাকশন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব অ্যাকশন</SelectItem>
                <SelectItem value="update">আপডেট</SelectItem>
                <SelectItem value="create">তৈরি</SelectItem>
                <SelectItem value="restore">পুনরুদ্ধার</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {data.total}টি ভার্সন
            </span>
          </div>
        )}

        {/* Timeline View */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : !data || data.versions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {entityType && entityId ? 'কোনো ভার্সন পাওয়া যায়নি' : 'এন্টিটি নির্বাচন করে খুঁজুন'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div ref={listRef} onScroll={handleScroll} className="space-y-4">
            {groupedVersions.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">{group.label}</h3>
                  <span className="text-xs text-muted-foreground">({group.versions.length})</span>
                </div>
                <div className="space-y-2">
                  {group.versions.map((version) => (
                    <div
                      key={version.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors ${selectedVersion?.id === version.id ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => { setSelectedVersion(version); setSidePanelOpen(true) }}
                      tabIndex={0}
                      role="button"
                      aria-label={`ভার্সন ${version.versionNumber} দেখুন`}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedVersion(version); setSidePanelOpen(true) } }}
                    >
                      <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">v{version.versionNumber}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {ACTION_LABELS[version.changeType] || version.changeType}
                          </Badge>
                          {version.rollbackFromVersion && (
                            <Badge variant="secondary" className="text-xs">
                              <RotateCcw className="h-3 w-3 mr-1" />
                              রোলব্যাক
                            </Badge>
                          )}
                          {/* Restore eligibility indicator */}
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            পুনরুদ্ধার যোগ্য
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {version.performedByName || version.performedBy}
                          </span>
                          {version.performedByRole && (
                            <Badge variant="secondary" className="text-xs">{version.performedByRole}</Badge>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(version.createdAt)}
                          </span>
                          {version.changedFields.length > 0 && (
                            <span className="text-xs">
                              {version.changedFields.length}টি পরিবর্তন
                            </span>
                          )}
                          {/* Activity Timeline link */}
                          <a
                            href={`/admin/audit-logs?q=${version.id}`}
                            className="text-blue-600 hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                            অডিট লগ
                          </a>
                        </div>
                      </div>

                      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {data.total}টির মধ্যে {((page - 1) * 20) + 1}-
              {Math.min(page * 20, data.total)} দেখাচ্ছে
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">{page} / {data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Side Panel - Version Detail */}
      {sidePanelOpen && selectedVersion && (
        <div className="w-[450px] border-l bg-card overflow-auto" role="complementary" aria-label="ভার্সন বিস্তারিত">
          <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <History className="h-5 w-5" />
              ভার্সন v{selectedVersion.versionNumber}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => { setSidePanelOpen(false); setSelectedVersion(null) }} aria-label="বন্ধ করুন">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* General Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">সাধারণ তথ্য</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ভার্সন</span>
                  <span className="font-medium">v{selectedVersion.versionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">অ্যাকশন</span>
                  <Badge variant="outline">{ACTION_LABELS[selectedVersion.changeType]}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ব্যবহারকারী</span>
                  <span className="font-medium">{selectedVersion.performedByName || selectedVersion.performedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ভূমিকা</span>
                  <span>{selectedVersion.performedByRole || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">তারিখ</span>
                  <span>{formatDate(selectedVersion.createdAt)}</span>
                </div>
                {selectedVersion.rollbackFromVersion && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">রোলব্যাক</span>
                    <Badge variant="secondary">v{selectedVersion.rollbackFromVersion} থেকে</Badge>
                  </div>
                )}
                {/* Restore eligibility */}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">পুনরুদ্ধার</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    যোগ্য
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Changed Fields Summary - Grouped */}
            {selectedVersion.changedFields.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">পরিবর্তিত ফিল্ড ({selectedVersion.changedFields.length}টি)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {groupedFields.map((group) => (
                    <div key={group.label}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{group.label}</p>
                      <div className="flex flex-wrap gap-1">
                        {group.fields.map((field, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{field}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Diff View */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">পরিবর্তনের বিস্তারিত</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedVersion.changedFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">কোনো পরিবর্তন নেই</p>
                ) : (
                  <div className="space-y-2">
                    {selectedVersion.changedFields.map((field, i) => (
                      <div key={i} className="p-2 bg-muted/50 rounded text-sm">
                        <span className="font-mono text-xs">{field}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Compare Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              ভার্সন তুলনা
            </DialogTitle>
            <DialogDescription>
              দুটি ভার্সনের মধ্যে পার্থক্য দেখুন
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">ভার্সন A</label>
                <Select
                  value={compareVersionA?.id || ''}
                  onValueChange={(v) => {
                    const version = data?.versions.find(vers => vers.id === v)
                    setCompareVersionA(version || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ভার্সন নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.versions.map(vers => (
                      <SelectItem key={vers.id} value={vers.id}>
                        v{vers.versionNumber} — {ACTION_LABELS[vers.changeType]} ({formatDate(vers.createdAt)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">ভার্সন B</label>
                <Select
                  value={compareVersionB?.id || ''}
                  onValueChange={(v) => {
                    const version = data?.versions.find(vers => vers.id === v)
                    setCompareVersionB(version || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ভার্সন নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.versions.map(vers => (
                      <SelectItem key={vers.id} value={vers.id}>
                        v{vers.versionNumber} — {ACTION_LABELS[vers.changeType]} ({formatDate(vers.createdAt)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Side-by-Side Comparison */}
            {compareVersionA && compareVersionB && (
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">ভার্সন A: v{compareVersionA.versionNumber}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{formatDate(compareVersionA.createdAt)}</p>
                  <div className="space-y-1">
                    {Object.entries(compareVersionA.snapshot).slice(0, 10).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="font-mono text-muted-foreground">{key}:</span>{' '}
                        <span className="break-all">{String(value).substring(0, 50)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <h4 className="font-medium text-sm mb-2">ভার্সন B: v{compareVersionB.versionNumber}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{formatDate(compareVersionB.createdAt)}</p>
                  <div className="space-y-1">
                    {Object.entries(compareVersionB.snapshot).slice(0, 10).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="font-mono text-muted-foreground">{key}:</span>{' '}
                        <span className="break-all">{String(value).substring(0, 50)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
