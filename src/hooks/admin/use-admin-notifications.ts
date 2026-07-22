'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJSON } from '@/lib/fetch-json'

/**
 * Hook that provides the admin notification unread count with automatic polling.
 *
 * Queries notifications with `userId: null` (admin-targeted system notifications)
 * and `isRead: false`. Polls every 30 seconds so admins see new feedback,
 * payments, and contact messages without manual refresh.
 *
 * Cache is also invalidated via `invalidateContentCache('notification')`
 * on the server side when mutations occur.
 */
export function useAdminUnreadNotificationCount() {
  return useQuery({
    queryKey: ['admin', 'notifications', 'unread'],
    queryFn: async (): Promise<number> => {
      const json = await fetchJSON<{
        data: { pagination: { total: number } }
      }>('/api/admin/notifications?isRead=false&adminOnly=true&limit=1')
      return json.data.pagination.total
    },
    refetchInterval: 30_000, // Poll every 30 seconds — same as student notification polling
  })
}
