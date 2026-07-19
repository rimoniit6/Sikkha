'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJSON } from '@/lib/fetch-json'
import { queryKeys } from '@/lib/query-keys'

// ─── Types ───

export interface WorkflowAnalytics {
  totalWorkflows: number
  averageVersion: number
  statusDistribution: {
    draft: number
    inReview: number
    approved: number
    rejected: number
    scheduled: number
    published: number
    archived: number
  }
  recentTransitions: {
    period: string
    total: number
    byAction: Record<string, number>
  }
  publish: {
    successRate: number
    pendingScheduled: number
    totalPublished: number
    averageRetries: number
    totalRetries: number
    workflowsWithRetries: number
  }
  contentTypes: Record<string, number>
}

// ─── Hooks ───

/**
 * Fetch workflow analytics for admin dashboard.
 */
export function useWorkflowAnalytics(days?: number) {
  const params = days ? { days } : undefined

  return useQuery({
    queryKey: queryKeys.admin.workflowAnalytics(params),
    queryFn: async () => {
      const url = days
        ? `/api/admin/workflow/analytics?days=${days}`
        : '/api/admin/workflow/analytics'
      const json = await fetchJSON<{ data: WorkflowAnalytics }>(url)
      return json.data
    },
  })
}
