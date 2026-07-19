'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, Clock, User, MessageSquare, ExternalLink, Loader2 } from 'lucide-react'
import { WorkflowBadge } from './WorkflowBadge'

interface WorkflowHistoryEntry {
  id: string
  entityType: string
  entityId: string
  fromStatus: string | null
  toStatus: string
  performedBy: string
  performedByName: string | null
  performedByRole: string | null
  comment: string | null
  versionNumber: number | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

interface WorkflowCommentEntry {
  id: string
  entityType: string
  entityId: string
  authorId: string
  authorName: string | null
  authorRole: string | null
  content: string
  action: string | null
  createdAt: string
}

interface WorkflowHistoryPanelProps {
  entityType: string
  entityId: string
  currentStatus?: string | null
  version?: number
  /** Increment to force re-fetch. Prevents stale history after transitions. */
  refreshTrigger?: number
}

export function WorkflowHistoryPanel({ entityType, entityId, currentStatus, version, refreshTrigger }: WorkflowHistoryPanelProps) {
  const [history, setHistory] = useState<WorkflowHistoryEntry[]>([])
  const [comments, setComments] = useState<WorkflowCommentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`/api/admin/workflow?entityType=${entityType}&entityId=${entityId}`, {
        signal: controller.signal,
      })
      const data = await res.json()
      if (data.success && mountedRef.current) {
        setHistory(data.data.history || [])
        setComments(data.data.comments || [])
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      // Silently handle other errors
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [entityType, entityId])

  // Initial fetch + refetch on refreshTrigger change
  useEffect(() => {
    mountedRef.current = true
    setLoading(true)
    fetchData()
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [fetchData, refreshTrigger])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current Status */}
      {currentStatus && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              বর্তমান স্ট্যাটাস
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <WorkflowBadge status={currentStatus} />
              {version !== undefined && (
                <Badge variant="secondary" className="text-xs">v{version}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            কার্যক্রম ইতিহাস ({history.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">কোনো কার্যক্রম নেই</p>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="shrink-0 mt-0.5">
                    <WorkflowBadge status={entry.toStatus} className="text-xs" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        {entry.performedByName || entry.performedBy}
                      </span>
                      {entry.performedByRole && (
                        <Badge variant="secondary" className="text-xs">{entry.performedByRole}</Badge>
                      )}
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                    {entry.comment && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {entry.comment}
                      </p>
                    )}
                    {entry.versionNumber && (
                      <Badge variant="outline" className="text-xs mt-1">v{entry.versionNumber}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Comments */}
      {comments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              পর্যালোচনার মন্তব্য ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-medium">{comment.authorName || comment.authorId}</span>
                    {comment.authorRole && (
                      <Badge variant="secondary" className="text-xs">{comment.authorRole}</Badge>
                    )}
                    {comment.action && (
                      <Badge variant="outline" className="text-xs">
                        {comment.action === 'approve' ? 'অনুমোদন' : 'প্রত্যাখ্যান'}
                      </Badge>
                    )}
                    <span className="text-muted-foreground">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Log Link */}
      <div className="text-center">
        <a href={`/admin/audit-logs?q=${entityId}`} className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1">
          <ExternalLink className="h-3 w-3" />
          অডিট লগে দেখুন
        </a>
      </div>
    </div>
  )
}
