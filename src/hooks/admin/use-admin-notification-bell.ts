'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJSON } from '@/lib/fetch-json'

export interface AdminNotificationItem {
  id: string
  userId: string | null
  title: string
  message: string
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

interface AdminNotificationResponse {
  success: boolean
  data: AdminNotificationItem[]
  pagination: {
    total: number
    unread: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

const QUERY_KEY = ['admin', 'admin-notifications', 'bell'] as const

/**
 * Fetches admin-targeted notifications (feedback, contact, payments)
 * Polls every 30 seconds so admins see new items without refreshing.
 */
export function useAdminNotificationBell() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<AdminNotificationResponse> => {
      const json = await fetchJSON<AdminNotificationResponse>(
        '/api/admin/admin-notifications?limit=15'
      )
      return json
    },
    refetchInterval: 30_000,
  })
}

/**
 * Unread count derived from the bell query (no extra network request).
 */
export function useAdminBellUnreadCount(): number {
  const { data } = useAdminNotificationBell()
  return data?.pagination?.unread ?? 0
}

/**
 * Mark specific notifications as read, or mark all as read.
 */
export function useMarkAdminNotificationsRead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (params: { ids?: string[]; markAll?: boolean }) => {
      await fetchJSON('/api/admin/admin-notifications', {
        method: 'PATCH',
        body: JSON.stringify(params),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'admin-notifications', 'bell'] })
    },
  })
}
