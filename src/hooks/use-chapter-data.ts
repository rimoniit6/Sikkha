'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJSON } from '@/lib/fetch-json'

export interface ChapterData {
  id: string
  name: string
  slug: string
  number: number
  subjectName: string
  subjectSlug: string
  className: string
  classSlug: string
  subjectId: string
  lectureCount: number
  mcqCount: number
  cqCount: number
  boardQuestionCount: number
  progress: number
  contentCounts: Record<string, number>
  freeContentCounts: Record<string, number>
}

// UUID pattern to detect if value is an ID (CUID) vs slug
const UUID_REGEX = /^[a-z][a-z0-9]{24,}$/i

interface ChapterResolveResult {
  success: boolean
  data?: { id: string }
}

async function resolveChapterId(chapterIdOrSlug: string, subjectId?: string): Promise<string> {
  // If it looks like a UUID/CUID, use it directly
  if (UUID_REGEX.test(chapterIdOrSlug)) {
    return chapterIdOrSlug
  }

  // Otherwise, it's a slug - resolve via API
  const params = new URLSearchParams()
  if (subjectId) {
    params.set('subjectId', subjectId)
  }

  const url = `/api/chapters/slug/${encodeURIComponent(chapterIdOrSlug)}?${params.toString()}`
  const result = await fetchJSON<ChapterResolveResult>(url)

  if (result.success && result.data?.id) {
    return result.data.id
  }

  // Fall back to original value (will likely 404, but that's handled elsewhere)
  return chapterIdOrSlug
}

export function useChapterData(chapterIdOrSlug: string | undefined, subjectId?: string) {
  return useQuery<ChapterData>({
    queryKey: ['chapter', chapterIdOrSlug, subjectId],
    queryFn: async () => {
      // Resolve slug to ID if needed
      const resolvedId = await resolveChapterId(chapterIdOrSlug!, subjectId)
      return fetchJSON<ChapterData>(`/api/chapters/${resolvedId}`)
    },
    enabled: !!chapterIdOrSlug,
    staleTime: 30_000,
  })
}
