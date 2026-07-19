'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Trash2, Clock, Play, Eye, Settings, Loader2, CheckCircle, AlertTriangle, Calendar, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

interface CleanupSettings {
  retentionDays: number
  enabled: boolean
  lastCleanup: string | null
  nextCleanup: string | null
  lastCleanupCount: number
  batchSize: number
}

interface CleanupPreview {
  totalRecords: number
  models: Array<{ model: string; label: string; count: number }>
  cutoffDate: string
}

interface CleanupResult {
  success: boolean
  retentionDays: number
  totalDeleted: number
  totalFailed: number
  batchCount: number
  duration: number
  dryRun: boolean
  preview: CleanupPreview
  errors: string[]
}

export default function AdminTrashCleanupTab() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<CleanupSettings | null>(null)
  const [preview, setPreview] = useState<CleanupPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [result, setResult] = useState<CleanupResult | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/trash/cleanup')
      const json = await res.json()
      if (json.success) {
        setSettings(json.data.settings)
        setPreview(json.data.preview)
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'ডাটা লোড করা যায়নি', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpdateSettings = async (updates: Partial<CleanupSettings>) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/trash/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateSettings', ...updates }),
      })
      const json = await res.json()
      if (json.success) {
        setSettings(json.data.settings)
        toast({ title: 'সফল', description: json.message })
        // Refresh preview with new retention days
        if (updates.retentionDays !== undefined) {
          const previewRes = await fetch('/api/admin/trash/cleanup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'preview', retentionDays: updates.retentionDays }),
          })
          const previewJson = await previewRes.json()
          if (previewJson.success) setPreview(previewJson.data)
        }
      } else {
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handlePreview = async () => {
    setActionLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/trash/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview', retentionDays: settings?.retentionDays || 90 }),
      })
      const json = await res.json()
      if (json.success) {
        setPreview(json.data)
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'পূর্বরূপ তৈরি করা যায়নি', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRunCleanup = async (dryRun: boolean) => {
    setActionLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/trash/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'runCleanup', dryRun }),
      })
      const json = await res.json()
      if (json.success) {
        setResult(json.data)
        if (!dryRun) {
          fetchData() // Refresh settings
        }
        toast({
          title: dryRun ? 'পূর্বরূপ' : 'সফল',
          description: json.message,
        })
      } else {
        toast({ title: 'ত্রুটি', description: json.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>লোড হচ্ছে...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            ট্র্যাশ মেয়াদ সেটিংস
          </CardTitle>
          <CardDescription>
            পুরানো মুছে ফেলা রেকর্ড স্বয়ংক্রিয়ভাবে পরিষ্কার করার সেটিংস
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Retention Days */}
            <div className="space-y-2">
              <label className="text-sm font-medium">মেয়াদ (দিন)</label>
              <Select
                value={String(settings?.retentionDays || 90)}
                onValueChange={(v) => handleUpdateSettings({ retentionDays: parseInt(v) })}
                disabled={actionLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">কখনো নয় (0)</SelectItem>
                  <SelectItem value="7">৭ দিন</SelectItem>
                  <SelectItem value="15">১৫ দিন</SelectItem>
                  <SelectItem value="30">৩০ দিন</SelectItem>
                  <SelectItem value="60">৬০ দিন</SelectItem>
                  <SelectItem value="90">৯০ দিন</SelectItem>
                  <SelectItem value="180">১৮০ দিন</SelectItem>
                  <SelectItem value="365">৩৬৫ দিন</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                মুছে ফেলা হয়েছে এমন রেকর্ড এই দিন পর স্বয়ংক্রিয়ভাবে মুছে ফেলা হবে
              </p>
            </div>

            {/* Enable/Disable */}
            <div className="space-y-2">
              <label className="text-sm font-medium">স্বয়ংক্রিয় পরিষ্কার</label>
              <div className="flex items-center gap-2">
                <Button
                  variant={settings?.enabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleUpdateSettings({ enabled: !settings?.enabled })}
                  disabled={actionLoading}
                >
                  {settings?.enabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </Button>
                <Badge variant={settings?.enabled ? 'default' : 'secondary'}>
                  {settings?.enabled ? 'ON' : 'OFF'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">শেষ পরিষ্কার</span>
              <p className="font-medium">{formatDate(settings?.lastCleanup || null)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">পরবর্তী পরিষ্কার</span>
              <p className="font-medium">{formatDate(settings?.nextCleanup || null)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">শেষ পরিষ্কারের গণনা</span>
              <p className="font-medium">{settings?.lastCleanupCount || 0}টি</p>
            </div>
            <div>
              <span className="text-muted-foreground">ব্যাচ সাইজ</span>
              <p className="font-medium">{settings?.batchSize || 500}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            পূর্বরূপ
          </CardTitle>
          <CardDescription>
            বর্তমান মেয়াদ অনুযায়ী কোন রেকর্ডগুলো মুছে ফেলা হবে
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {preview && preview.models.length > 0 ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {settings?.retentionDays || 90} দিনের পুরানো রেকর্ড:
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {preview.models.map((m) => (
                  <div key={m.model} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm">{m.label}</span>
                    <Badge variant="secondary">{m.count}</Badge>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                <span className="font-medium">মোট রেকর্ড</span>
                <Badge variant="destructive" className="text-lg">{preview.totalRecords}</Badge>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              কোনো পুরানো রেকর্ড নেই যা পরিষ্কার করা যায়
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            পরিষ্কার অ্যাকশন
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => handleRunCleanup(true)}
              disabled={actionLoading || !preview || preview.totalRecords === 0}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              পূর্বরূপ দেখুন
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleRunCleanup(false)}
              disabled={actionLoading || !preview || preview.totalRecords === 0}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              এখন পরিষ্কার করুন
            </Button>
          </div>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-destructive/5 border border-destructive/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                )}
                <span className="font-medium">
                  {result.dryRun ? 'পূর্বরূপ ফলাফল' : 'পরিষ্কার ফলাফল'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">মুছে ফেলা হয়েছে</span>
                  <p className="font-medium">{result.totalDeleted}টি</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ব্যর্থ</span>
                  <p className="font-medium">{result.totalFailed}টি</p>
                </div>
                <div>
                  <span className="text-muted-foreground">ব্যাচ</span>
                  <p className="font-medium">{result.batchCount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">সময়</span>
                  <p className="font-medium">{formatDuration(result.duration)}</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 text-sm text-destructive">
                  {result.errors.slice(0, 3).map((e, i) => (
                    <p key={i}>• {e}</p>
                  ))}
                  {result.errors.length > 3 && <p>• ...আরো {result.errors.length - 3}টি ত্রুটি</p>}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
