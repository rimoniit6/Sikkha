'use client'

import { useState, useCallback } from 'react'

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

interface VersionData {
  versions: VersionItem[]
  total: number
  totalPages: number
}

interface VersionFilters {
  search?: string
  action?: string
  severity?: string
  dateFrom?: string
  dateTo?: string
}

export function useVersionHistory() {
  const [data, setData] = useState<VersionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<VersionFilters>({})
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(null)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)

  const fetchVersions = useCallback(async (entityType: string, entityId: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        entityType,
        entityId,
        page: String(page),
        limit: '20',
      })
      if (filters.search) params.set('q', filters.search)
      if (filters.action) params.set('action', filters.action)
      if (filters.dateFrom) params.set('from', filters.dateFrom)
      if (filters.dateTo) params.set('to', filters.dateTo)

      const res = await fetch(`/api/admin/version-history?${params}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch {
      // Error handled
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  const openVersion = useCallback((version: VersionItem) => {
    setSelectedVersion(version)
    setSidePanelOpen(true)
  }, [])

  const closeSidePanel = useCallback(() => {
    setSidePanelOpen(false)
    setSelectedVersion(null)
  }, [])

  return {
    data,
    loading,
    page,
    setPage,
    filters,
    setFilters,
    selectedVersion,
    sidePanelOpen,
    fetchVersions,
    openVersion,
    closeSidePanel,
  }
}
