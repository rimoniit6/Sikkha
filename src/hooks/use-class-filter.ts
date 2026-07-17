'use client'

import { useLearningPreference } from '@/providers/LearningPreferenceProvider'
import { useMemo } from 'react'

/**
 * Returns query params to append to API calls that accept a classLevel param.
 * Useful for: bundles, suggestions, board-questions, search, etc.
 */
export function useClassFilterParams(): Record<string, string> {
  const { learningMode, classLevel } = useLearningPreference()

  return useMemo(() => {
    if (learningMode !== 'CLASS_BASED' || !classLevel) return {} as Record<string, string>
    return { classLevel } as Record<string, string>
  }, [learningMode, classLevel])
}

interface ClassFilterable {
  classLevel?: string
  classId?: string
  class?: { slug?: string; id?: string }
  classCategory?: { slug?: string; id?: string }
}

/**
 * Client-side array filter for items that have a class reference.
 * Used for filtering progress, bookmarks, recently-viewed, etc.
 * where server-side JOIN filtering is too expensive.
 */
export function useClassFilter() {
  const { learningMode, classLevel } = useLearningPreference()

  const isClassBased = learningMode === 'CLASS_BASED' && !!classLevel

  const filterByClass = useMemo(() => {
    return <T extends ClassFilterable>(items: T[]): T[] => {
      if (!isClassBased) return items
      return items.filter((item) => {
        if ('classLevel' in item && item.classLevel) return item.classLevel === classLevel
        if ('classId' in item && item.classId) return item.classId === classLevel
        if ('classCategory' in item && item.classCategory?.slug) return item.classCategory.slug === classLevel
        if ('class' in item && item.class?.slug) return item.class.slug === classLevel
        return true
      })
    }
  }, [isClassBased, classLevel])

  return { classLevel, learningMode, isClassBased, filterByClass }
}

/**
 * Appends classLevel to a URL's search params when in CLASS_BASED mode.
 * Useful for prefetching or manual URL construction.
 */
export function useClassUrl(basePath: string): string {
  const { learningMode, classLevel } = useLearningPreference()

  return useMemo(() => {
    if (learningMode !== 'CLASS_BASED' || !classLevel) return basePath
    const separator = basePath.includes('?') ? '&' : '?'
    return `${basePath}${separator}classLevel=${classLevel}`
  }, [basePath, learningMode, classLevel])
}
