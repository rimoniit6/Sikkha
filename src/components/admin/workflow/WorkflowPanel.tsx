'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkflowBadge, WorkflowActions, WorkflowHistoryPanel } from './index'
import { Loader2, Workflow } from 'lucide-react'

interface WorkflowPanelProps {
  entityType: string
  entityId: string
  /** Current workflow version - for optimistic concurrency */
  version?: number
  /** Callback when any transition occurs - should trigger data refresh */
  onTransition?: () => void
  /** Show compact or full layout */
  compact?: boolean
}

/**
 * Drop-in workflow panel for any admin content page.
 */
export function WorkflowPanel({ entityType, entityId, version: propVersion, onTransition, compact = false }: WorkflowPanelProps) {
  const [workflow, setWorkflow] = useState<{ status: string; version: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const fetchWorkflow = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`/api/admin/workflow?entityType=${entityType}&entityId=${entityId}`, {
        signal: controller.signal,
      })
      const data = await res.json()
      if (data.success && data.data?.workflow && mountedRef.current) {
        setWorkflow({
          status: data.data.workflow.status,
          version: data.data.workflow.version,
        })
      } else if (mountedRef.current) {
        setWorkflow({ status: 'DRAFT', version: 0 })
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (mountedRef.current) setWorkflow({ status: 'DRAFT', version: 0 })
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [entityType, entityId])

  useEffect(() => {
    mountedRef.current = true
    setLoading(true)
    fetchWorkflow()
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [fetchWorkflow])

  const handleTransition = () => {
    // Single fetch updates workflow state (badge + version)
    fetchWorkflow()
    // Increment trigger to force history re-fetch
    setRefreshTrigger(prev => prev + 1)
    // Notify parent (for content data refresh)
    onTransition?.()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const effectiveVersion = propVersion ?? workflow?.version ?? 0

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
        <Workflow className="h-4 w-4 text-muted-foreground" />
        <WorkflowBadge status={workflow?.status || 'DRAFT'} />
        <div className="flex-1" />
        <WorkflowActions
          entityType={entityType}
          entityId={entityId}
          currentStatus={workflow?.status || 'DRAFT'}
          version={effectiveVersion}
          onTransition={handleTransition}
        />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Workflow className="h-4 w-4" />
          ওয়ার্কফ্লো
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <WorkflowBadge status={workflow?.status || 'DRAFT'} />
          <span className="text-xs text-muted-foreground">v{effectiveVersion}</span>
        </div>

        <WorkflowActions
          entityType={entityType}
          entityId={entityId}
          currentStatus={workflow?.status || 'DRAFT'}
          version={effectiveVersion}
          onTransition={handleTransition}
        />

        <WorkflowHistoryPanel
          entityType={entityType}
          entityId={entityId}
          currentStatus={workflow?.status}
          version={effectiveVersion}
          refreshTrigger={refreshTrigger}
        />
      </CardContent>
    </Card>
  )
}
