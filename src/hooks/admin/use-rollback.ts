'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJSON } from '@/lib/fetch-json'

// ─── Types ───

export interface RollbackResult {
  success: boolean
  newVersionNumber: number
  message: string
}

// ─── Hook ───

/**
 * Rollback an entity to a specific version.
 */
export function useRollbackVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      entityType: string
      entityId: string
      targetVersion: number
      comment?: string
    }) => {
      const { entityType, entityId, targetVersion, comment } = params
      const url = `/api/admin/version-history/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}/rollback`

      const json = await fetchJSON<{ data: RollbackResult }>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersion, comment }),
      })

      return json.data
    },
    onSuccess: () => {
      // Invalidate version history queries to refetch
      queryClient.invalidateQueries({ queryKey: ['admin', 'version-history'] })
    },
  })
}
