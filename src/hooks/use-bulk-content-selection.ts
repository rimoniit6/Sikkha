'use client'

import { useCallback, useMemo, useState } from 'react'
import type { SelectedContentItem } from '@/components/admin/bundles/types'

/**
 * Composite key for uniquely identifying a content item across content types.
 * IDs can repeat across content types (e.g., the same ID for an MCQ and a CQ),
 * so the key combines both.
 */
function makeKey(contentType: string, contentId: string): string {
  return `${contentType}:${contentId}`
}

/** Accepts either `id` or `contentId` for flexibility with different item types. */
type ItemWithOptionalId = { id?: string; contentId?: string }

function resolveId(item: ItemWithOptionalId): string {
  return item.contentId ?? item.id ?? ''
}

export interface SelectionSummary {
  byType: Record<string, number>
  totalItems: number
  totalPrice: number
}

/**
 * Bulk content selection hook.
 *
 * - Uses a Map<compositeKey, SelectedContentItem> for O(1) add/remove/has.
 * - Selections persist across filter/search/pagination changes.
 * - Provides batch operations: selectAll, deselectAll, clearAll, invertSelection.
 * - Computes real-time summary counts by content type.
 * - Tracks "select all across pages" vs "select all visible only".
 */
export function useBulkContentSelection() {
  const [selectionMap, setSelectionMap] = useState<Map<string, SelectedContentItem>>(new Map())

  const compositeKeys = useMemo(() => new Set(selectionMap.keys()), [selectionMap])

  // ── Single item operations ───────────────────────────────────

  const isSelected = useCallback(
    (contentType: string, contentId: string): boolean => {
      return selectionMap.has(makeKey(contentType, contentId))
    },
    [selectionMap],
  )

  const toggleOne = useCallback(
    (contentType: string, item: ItemWithOptionalId & { title?: string; price?: number }) => {
      const itemId = resolveId(item)
      if (!itemId) return

      setSelectionMap((prev) => {
        const next = new Map(prev)
        const key = makeKey(contentType, itemId)
        if (next.has(key)) {
          next.delete(key)
        } else {
          next.set(key, {
            contentType,
            contentId: itemId,
            title: item.title || `${contentType} #${itemId.slice(0, 8)}`,
            price: item.price ?? 0,
            order: next.size,
          })
        }
        return next
      })
    },
    [],
  )

  const removeItem = useCallback(
    (contentType: string, contentId: string) => {
      setSelectionMap((prev) => {
        const next = new Map(prev)
        next.delete(makeKey(contentType, contentId))
        return next
      })
    },
    [],
  )

  const getItem = useCallback(
    (contentType: string, contentId: string): SelectedContentItem | undefined => {
      return selectionMap.get(makeKey(contentType, contentId))
    },
    [selectionMap],
  )

  // ── Batch operations ─────────────────────────────────────────

  /** Select all items from the *visible* list. Does NOT deselect previously selected items. */
  const selectAllVisible = useCallback(
    (contentType: string, visibleItems: Array<ItemWithOptionalId & { title?: string; price?: number }>) => {
      setSelectionMap((prev) => {
        const next = new Map(prev)
        for (const item of visibleItems) {
          const itemId = resolveId(item)
          if (!itemId) continue
          const key = makeKey(contentType, itemId)
          if (!next.has(key)) {
            next.set(key, {
              contentType,
              contentId: itemId,
              title: item.title || `${contentType} #${itemId.slice(0, 8)}`,
              price: item.price ?? 0,
              order: next.size,
            })
          }
        }
        return next
      })
    },
    [],
  )

  /** Deselect all items from the *visible* list. Does NOT affect hidden items. */
  const deselectAllVisible = useCallback(
    (contentType: string, visibleItems: Array<ItemWithOptionalId>) => {
      setSelectionMap((prev) => {
        const next = new Map(prev)
        for (const item of visibleItems) {
          const itemId = resolveId(item)
          if (!itemId) continue
          next.delete(makeKey(contentType, itemId))
        }
        return next
      })
    },
    [],
  )

  /** Invert selection for visible items. */
  const invertSelection = useCallback(
    (contentType: string, visibleItems: Array<ItemWithOptionalId & { title?: string; price?: number }>) => {
      setSelectionMap((prev) => {
        const next = new Map(prev)
        for (const item of visibleItems) {
          const itemId = resolveId(item)
          if (!itemId) continue
          const key = makeKey(contentType, itemId)
          if (next.has(key)) {
            next.delete(key)
          } else {
            next.set(key, {
              contentType,
              contentId: itemId,
              title: item.title || `${contentType} #${itemId.slice(0, 8)}`,
              price: item.price ?? 0,
              order: next.size,
            })
          }
        }
        return next
      })
    },
    [],
  )

  /** Clear ALL selections across all content types. */
  const clearAll = useCallback(() => {
    setSelectionMap(new Map())
  }, [])

  /** Replace ALL selections (used when loading existing bundle items for editing). */
  const replaceSelection = useCallback((items: SelectedContentItem[]) => {
    const map = new Map<string, SelectedContentItem>()
    for (const item of items) {
      map.set(makeKey(item.contentType, item.contentId), {
        ...item,
        order: map.size,
      })
    }
    setSelectionMap(map)
  }, [])

  /** Remove all items of a specific content type. */
  const clearType = useCallback((contentType: string) => {
    setSelectionMap((prev) => {
      const next = new Map(prev)
      for (const [key] of next) {
        if (key.startsWith(`${contentType}:`)) {
          next.delete(key)
        }
      }
      return next
    })
  }, [])

  // ── Select All Filtered (across all pages) ───────────────────

  const selectAllFiltered = useCallback(
    async (
      contentType: string,
      fetchAllIds: () => Promise<string[]>,
      getItemMeta: (id: string) => { title?: string; price?: number },
    ): Promise<number> => {
      const allIds = await fetchAllIds()
      let addedCount = 0

      setSelectionMap((prev) => {
        const next = new Map(prev)
        for (const id of allIds) {
          const key = makeKey(contentType, id)
          if (!next.has(key)) {
            const meta = getItemMeta(id)
            next.set(key, {
              contentType,
              contentId: id,
              title: meta.title || `${contentType} #${id.slice(0, 8)}`,
              price: meta.price ?? 0,
              order: next.size,
            })
            addedCount++
          }
        }
        return next
      })

      return addedCount
    },
    [],
  )

  // ── Selection state for visible items ────────────────────────

  const getVisibleState = useCallback(
    (contentType: string, visibleItems: Array<ItemWithOptionalId>) => {
      if (visibleItems.length === 0) {
        return { allSelected: false, someSelected: false, noneSelected: true, selectedCount: 0, totalCount: 0 }
      }

      let selectedCount = 0
      for (const item of visibleItems) {
        const itemId = resolveId(item)
        if (itemId && selectionMap.has(makeKey(contentType, itemId))) {
          selectedCount++
        }
      }

      return {
        allSelected: selectedCount === visibleItems.length,
        someSelected: selectedCount > 0 && selectedCount < visibleItems.length,
        noneSelected: selectedCount === 0,
        selectedCount,
        totalCount: visibleItems.length,
      }
    },
    [selectionMap],
  )

  // ── Selection summary ────────────────────────────────────────

  const summary = useMemo((): SelectionSummary => {
    const byType: Record<string, number> = {}
    let totalPrice = 0

    for (const [, item] of selectionMap) {
      byType[item.contentType] = (byType[item.contentType] || 0) + 1
      totalPrice += item.price || 0
    }

    return {
      byType,
      totalItems: selectionMap.size,
      totalPrice,
    }
  }, [selectionMap])

  const selectedItemsArray = useMemo(
    () => Array.from(selectionMap.values()).sort((a, b) => a.order - b.order),
    [selectionMap],
  )

  return {
    // State
    selectionMap,
    selectedItems: selectedItemsArray,
    compositeKeys,

    // Single operations
    isSelected,
    toggleOne,
    removeItem,
    getItem,

    // Batch operations
    selectAllVisible,
    deselectAllVisible,
    invertSelection,
    clearAll,
    clearType,
    replaceSelection,
    selectAllFiltered,

    // Derived state
    getVisibleState,
    summary,
  }
}
