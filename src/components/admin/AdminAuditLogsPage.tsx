'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Download, Clock, User, FileText, ChevronLeft, ChevronRight, Loader2, Eye, Activity, Monitor, Globe, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface AuditLog {
  id: string
  adminId: string
  admin: { id: string; name: string; email: string; role: string } | null
  action: string
  entityType: string
  entityId: string
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  userName: string | null
  userRole: string | null
  status: string | null
  duration: number | null
  os: string | null
  browser: string | null
  country: string | null
  createdAt: string
}

interface AuditData {
  items: AuditLog[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

// Action display names
const ACTION_LABELS: Record<string, string> = {
  // Authentication
  login: 'লগইন',
  logout: 'লগআউট',
  login_failed: 'লগইন ব্যর্থ',

  // User self-service
  user_register: 'নতুন ব্যবহারকারী নিবন্ধন',
  user_profile_update: 'প্রোফাইল আপডেট',
  user_password_reset: 'পাসওয়ার্ড রিসেট',
  user_password_change: 'পাসওয়ার্ড পরিবর্তন',
  user_avatar_update: 'অ্যাভাটার আপডেট',
  user_learning_preference_update: 'শেখার পছন্দ আপডেট',

  // Purchase actions
  payment_submit: 'পেমেন্ট জমা',
  payment_approve: 'পেমেন্ট অনুমোদন',
  payment_reject: 'পেমেন্ট প্রত্যাখ্যান',
  payment_refund: 'পেমেন্ট রিফান্ড',
  subscription_purchase: 'সাবস্ক্রিপশন ক্রয়',
  course_purchase: 'কোর্স ক্রয়',
  bundle_purchase: 'বান্ডেল ক্রয়',
  package_purchase: 'প্যাকেজ ক্রয়',
  mcq_exam_package_purchase: 'MCQ এক্সাম ক্রয়',
  cq_exam_package_purchase: 'CQ এক্সাম ক্রয়',

  // Course actions
  course_enroll: 'কোর্সে ভর্তি',
  course_complete: 'কোর্স সম্পন্ন',
  course_lesson_complete: 'লেসন সম্পন্ন',
  course_assignment_submit: 'অ্যাসাইনমেন্ট জমা',

  // Exam actions
  exam_start: 'এক্সাম শুরু',
  exam_submit: 'এক্সাম জমা',
  exam_result_view: 'ফলাফল দেখা',
  mcq_exam_start: 'MCQ এক্সাম শুরু',
  mcq_exam_submit: 'MCQ এক্সাম জমা',
  cq_exam_submit: 'CQ এক্সাম জমা',

  // Content interaction
  content_view: 'কন্টেন্ট দেখা',
  content_bookmark: 'বুকমার্ক যোগ',
  content_unbookmark: 'বুকমার্ক সরানো',
  note_create: 'নোট তৈরি',
  note_update: 'নোট আপডেট',
  note_delete: 'নোট মুছে ফেলা',

  // Feedback
  feedback_submit: 'ফিডব্যাক জমা',
  feedback_message_send: 'ফিডব্যাক বার্তা পাঠানো',

  // Contact
  contact_message_send: 'যোগাযোগ বার্তা পাঠানো',

  // Search
  search_execute: 'অনুসন্ধান',

  // Notification
  notification_read: 'নোটিফিকেশন পঠিত',
  notification_mark_all_read: 'সব নোটিফিকেশন পঠিত',

  // Admin actions
  grade_update: 'গ্রেড আপডেট',
  grade_bulk: 'বাল্ক গ্রেড',
  user_create: 'ব্যবহারকারী তৈরি',
  user_update: 'ব্যবহারকারী আপডেট',
  user_delete: 'ব্যবহারকারী মুছে ফেলা',
  user_ban: 'ব্যবহারকারী নিষিদ্ধ',
  user_unban: 'ব্যবহারকারী অনুমোদিত',
  role_change: 'ভূমিকা পরিবর্তন',
  retake_approve: 'রিটেক অনুমোদন',
  retake_reject: 'রিটেক প্রত্যাখ্যান',
  content_create: 'কন্টেন্ট তৈরি',
  content_update: 'কন্টেন্ট আপডেট',
  content_delete: 'কন্টেন্ট মুছে ফেলা',
  content_soft_delete: 'কন্টেন্ট আর্কাইভ',
  content_restore: 'কন্টেন্ট পুনরুদ্ধার',
  content_force_delete: 'কন্টেন্ট স্থায়ী মুছে ফেলা',
  bulk_soft_delete: 'বাল্ক আর্কাইভ',
  bulk_restore: 'বাল্ক পুনরুদ্ধার',
  bulk_force_delete: 'বাল্ক স্থায়ী মুছে ফেলা',
  import: 'ইমপোর্ট',
  export: 'এক্সপোর্ট',
  database_import: 'ডাটাবেজ ইমপোর্ট',
  database_export: 'ডাটাবেজ এক্সপোর্ট',
  bulk_import: 'বাল্ক ইমপোর্ট',
  restore: 'পুনরুদ্ধার',
  force_delete: 'স্থায়ী মুছে ফেলা',
  trash_cleanup: 'ট্র্যাশ পরিষ্কার',
  trash_cleanup_preview: 'ট্র্যাশ পরিষ্কার পূর্বরূপ',
  settings_update: 'সেটিংস আপডেট',
  settings_create: 'সেটিংস তৈরি',
  settings_batch_update: 'সেটিংস বাল্ক আপডেট',
  permission_update: 'অনুমতি আপডেট',
  navigation_create: 'নেভিগেশন তৈরি',
  navigation_update: 'নেভিগেশন আপডেট',
  navigation_delete: 'নেভিগেশন মুছে ফেলা',
  navigation_seed: 'নেভিগেশন সিড',
  lecture_create: 'লেকচার তৈরি',
  lecture_update: 'লেকচার আপডেট',
  lecture_delete: 'লেকচার মুছে ফেলা',
  mcq_create: 'MCQ তৈরি',
  mcq_update: 'MCQ আপডেট',
  mcq_delete: 'MCQ মুছে ফেলা',
  cq_create: 'CQ তৈরি',
  cq_update: 'CQ আপডেট',
  cq_delete: 'CQ মুছে ফেলা',
  course_create: 'কোর্স তৈরি',
  course_update: 'কোর্স আপডেট',
  course_delete: 'কোর্স মুছে ফেলা',
  package_create: 'প্যাকেজ তৈরি',
  package_update: 'প্যাকেজ আপডেট',
  package_delete: 'প্যাকেজ মুছে ফেলা',
  bundle_create: 'বান্ডেল তৈরি',
  bundle_update: 'বান্ডেল আপডেট',
  bundle_delete: 'বান্ডেল মুছে ফেলা',
  exam_create: 'এক্সাম তৈরি',
  exam_update: 'এক্সাম আপডেট',
  exam_delete: 'এক্সাম মুছে ফেলা',
  class_create: 'শ্রেণি তৈরি',
  class_update: 'শ্রেণি আপডেট',
  class_delete: 'শ্রেণি মুছে ফেলা',
  subject_create: 'বিষয় তৈরি',
  subject_update: 'বিষয় আপডেট',
  subject_delete: 'বিষয় মুছে ফেলা',
  chapter_create: 'অধ্যায় তৈরি',
  chapter_update: 'অধ্যায় আপডেট',
  chapter_delete: 'অধ্যায় মুছে ফেলা',
  topic_create: 'টপিক তৈরি',
  topic_update: 'টপিক আপডেট',
  topic_delete: 'টপিক মুছে ফেলা',
  board_create: 'বোর্ড তৈরি',
  board_update: 'বোর্ড আপডেট',
  board_delete: 'বোর্ড মুছে ফেলা',
  year_create: 'সাল তৈরি',
  year_update: 'সাল আপডেট',
  year_delete: 'সাল মুছে ফেলা',
  banner_create: 'ব্যানার তৈরি',
  banner_update: 'ব্যানার আপডেট',
  banner_delete: 'ব্যানার মুছে ফেলা',
  faq_create: 'FAQ তৈরি',
  faq_update: 'FAQ আপডেট',
  faq_delete: 'FAQ মুছে ফেলা',
  testimonial_create: 'টেস্টিমোনিয়াল তৈরি',
  testimonial_update: 'টেস্টিমোনিয়াল আপডেট',
  testimonial_delete: 'টেস্টিমোনিয়াল মুছে ফেলা',
  notice_create: 'নোটিশ তৈরি',
  notice_update: 'নোটিশ আপডেট',
  notice_delete: 'নোটিশ মুছে ফেলা',
}

// Entity type display names
const ENTITY_LABELS: Record<string, string> = {
  payment: 'পেমেন্ট',
  user: 'ব্যবহারকারী',
  lecture: 'লেকচার',
  mcq: 'MCQ',
  cq: 'CQ',
  knowledge_question: 'সংক্ষিপ্ত প্রশ্ন',
  suggestion: 'সাজেশন',
  resource: 'রিসোর্স',
  class_category: 'শ্রেণি',
  subject: 'বিষয়',
  chapter: 'অধ্যায়',
  topic: 'টপিক',
  course: 'কোর্স',
  course_lesson: 'কোর্স লেসন',
  content_package: 'প্যাকেজ',
  content_bundle: 'বান্ডেল',
  exam: 'এক্সাম',
  mcq_exam_package: 'MCQ এক্সাম প্যাকেজ',
  cq_exam_package: 'CQ এক্সাম প্যাকেজ',
  banner: 'ব্যানার',
  faq: 'FAQ',
  testimonial: 'টেস্টিমোনিয়াল',
  notice: 'নোটিশ',
  featured_content: 'ফিচার্ড কন্টেন্ট',
  teacher_moderator: 'শিক্ষক',
  navigation: 'নেভিগেশন',
  content_type: 'কন্টেন্ট টাইপ',
  board: 'বোর্ড',
  exam_year: 'পরীক্ষার সাল',
  board_year: 'বোর্ড সাল',
  subscription: 'সাবস্ক্রিপশন',
  notification: 'নোটিফিকেশন',
  note: 'নোট',
  contact_message: 'যোগাযোগ বার্তা',
  feedback: 'ফিডব্যাক',
  site_setting: 'সেটিংস',
  permission: 'অনুমতি',
  database: 'ডাটাবেজ',
  trash: 'ট্র্যাশ',
}

// Action color mapping
const ACTION_COLORS: Record<string, string> = {
  login: 'bg-green-100 text-green-800',
  logout: 'bg-gray-100 text-gray-800',
  login_failed: 'bg-red-100 text-red-800',
  payment_approve: 'bg-green-100 text-green-800',
  payment_reject: 'bg-red-100 text-red-800',
  content_create: 'bg-blue-100 text-blue-800',
  content_update: 'bg-yellow-100 text-yellow-800',
  content_delete: 'bg-red-100 text-red-800',
  content_soft_delete: 'bg-orange-100 text-orange-800',
  content_restore: 'bg-green-100 text-green-800',
  content_force_delete: 'bg-red-100 text-red-800',
  bulk_soft_delete: 'bg-orange-100 text-orange-800',
  bulk_restore: 'bg-green-100 text-green-800',
  bulk_force_delete: 'bg-red-100 text-red-800',
  import: 'bg-blue-100 text-blue-800',
  export: 'bg-purple-100 text-purple-800',
  settings_update: 'bg-yellow-100 text-yellow-800',
  permission_update: 'bg-purple-100 text-purple-800',
  role_change: 'bg-purple-100 text-purple-800',
  user_create: 'bg-green-100 text-green-800',
  user_update: 'bg-yellow-100 text-yellow-800',
  user_delete: 'bg-red-100 text-red-800',
}

export default function AdminAuditLogsPage() {
  const { toast } = useToast()
  const [data, setData] = useState<AuditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (search) params.set('q', search)
      if (actionFilter !== 'all') params.set('action', actionFilter)
      if (entityTypeFilter !== 'all') params.set('entityType', entityTypeFilter)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)

      const res = await fetch(`/api/admin/audit-logs?${params}`)
      const json = await res.json()
      if (json.success) {
        setData({ items: json.data, pagination: json.pagination })
      } else {
        toast({ title: 'ত্রুটি', description: json.error || 'ডাটা লোড করা যায়নি', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search, actionFilter, entityTypeFilter, dateFrom, dateTo, toast])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ limit: '10000' })
      if (search) params.set('q', search)
      if (actionFilter !== 'all') params.set('action', actionFilter)
      if (entityTypeFilter !== 'all') params.set('entityType', entityTypeFilter)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)

      const res = await fetch(`/api/admin/audit-logs?${params}`)
      const json = await res.json()
      if (json.success) {
        // Convert to CSV
        const headers = ['তারিখ', 'ব্যবহারকারী', 'অ্যাকশন', 'এন্টিটি', 'এন্টিটি আইডি', 'আইপি', 'পুরানো ডাটা', 'নতুন ডাটা']
        const rows = json.data.items.map((log: AuditLog) => [
          new Date(log.createdAt).toLocaleString('bn-BD'),
          log.admin?.name || log.adminId,
          ACTION_LABELS[log.action] || log.action,
          ENTITY_LABELS[log.entityType] || log.entityType,
          log.entityId,
          log.ipAddress || '',
          log.oldData ? JSON.stringify(log.oldData) : '',
          log.newData ? JSON.stringify(log.newData) : '',
        ])

        const csv = [headers, ...rows].map(row => row.map((cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)

        toast({ title: 'সফল', description: `${json.data.items.length}টি লগ এক্সপোর্ট করা হয়েছে` })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'এক্সপোর্ট ব্যর্থ', variant: 'destructive' })
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const uniqueActions = [...new Set(data?.items?.map(log => log.action) || [])]
  const uniqueEntityTypes = [...new Set(data?.items?.map(log => log.entityType) || [])]



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-muted-foreground" />
            অডিট লগ
          </h1>
          <p className="text-muted-foreground mt-1">
            সকল অ্যাডমিন কার্যকলাপের স্থায়ী রেকর্ড
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {data.pagination.total}টি লগ
            </Badge>
          )}
          <Button variant="outline" onClick={handleExport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            এক্সপোর্ট
          </Button>
        </div>
      </div>

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

        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="অ্যাকশন" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব অ্যাকশন</SelectItem>
            {uniqueActions.map(a => (
              <SelectItem key={a} value={a}>{ACTION_LABELS[a] || a}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={entityTypeFilter} onValueChange={(v) => { setEntityTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <FileText className="h-4 w-4 mr-2" />
            <SelectValue placeholder="এন্টিটি" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব এন্টিটি</SelectItem>
            {uniqueEntityTypes.map(e => (
              <SelectItem key={e} value={e}>{ENTITY_LABELS[e] || e}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="w-[150px]"
          placeholder="থেকে"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="w-[150px]"
          placeholder="পর্যন্ত"
        />
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">কোনো অডিট লগ নেই</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.items.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => { setSelectedLog(log); setDetailOpen(true) }}
            >
              {/* Status indicator */}
              <div className="shrink-0">
                {log.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}>
                    {ACTION_LABELS[log.action] || log.action}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {ENTITY_LABELS[log.entityType] || log.entityType}
                  </Badge>
                  {log.userRole && (
                    <Badge variant="secondary" className="text-xs">
                      {log.userRole}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {log.userName || log.admin?.name || log.adminId}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(log.createdAt)}
                  </span>
                  {log.os && (
                    <span className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {log.os}
                    </span>
                  )}
                  {log.browser && (
                    <span className="text-xs">{log.browser}</span>
                  )}
                  {log.ipAddress && (
                    <span className="font-mono text-xs">{log.ipAddress}</span>
                  )}
                  {log.duration && (
                    <span className="text-xs">{log.duration}ms</span>
                  )}
                </div>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground" />
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
              <ChevronLeft className="h-4 w-4" />
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
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => { if (!open) { setDetailOpen(false); setSelectedLog(null) } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              অডিট লগ বিস্তারিত
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                {selectedLog.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                <span className="font-medium">
                  {selectedLog.status === 'failed' ? 'ব্যর্থ' : 'সফল'}
                </span>
                {selectedLog.duration && (
                  <Badge variant="secondary" className="text-xs">{selectedLog.duration}ms</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">অ্যাকশন</label>
                  <Badge className={`mt-1 ${ACTION_COLORS[selectedLog.action] || 'bg-gray-100 text-gray-800'}`}>
                    {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">এন্টিটি টাইপ</label>
                  <Badge variant="outline" className="mt-1">
                    {ENTITY_LABELS[selectedLog.entityType] || selectedLog.entityType}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">এন্টিটি আইডি</label>
                  <p className="text-sm font-mono">{selectedLog.entityId}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">ব্যবহারকারী</label>
                  <p className="text-sm">{selectedLog.userName || selectedLog.admin?.name || selectedLog.adminId}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">ভূমিকা</label>
                  <p className="text-sm">{selectedLog.userRole || selectedLog.admin?.role || '—'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">তারিখ</label>
                  <p className="text-sm">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">আইপি</label>
                  <p className="text-sm font-mono">{selectedLog.ipAddress || '—'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">অপারেটিং সিস্টেম</label>
                  <p className="text-sm">{selectedLog.os || '—'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">ব্রাউজার</label>
                  <p className="text-sm">{selectedLog.browser || '—'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">দেশ</label>
                  <p className="text-sm">{selectedLog.country || '—'}</p>
                </div>
              </div>

              {selectedLog.oldData && (
                <div>
                  <label className="text-xs text-muted-foreground">পুরানো ডাটা</label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.oldData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newData && (
                <div>
                  <label className="text-xs text-muted-foreground">নতুন ডাটা</label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.newData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <label className="text-xs text-muted-foreground">সম্পূর্ণ User-Agent</label>
                  <p className="text-xs text-muted-foreground break-all">{selectedLog.userAgent}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDetailOpen(false); setSelectedLog(null) }}>
              বন্ধ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
