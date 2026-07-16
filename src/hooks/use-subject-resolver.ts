'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJSON } from '@/lib/fetch-json'

// UUID pattern to detect if value is an ID (CUID) vs slug
const UUID_REGEX = /^[a-z][a-z0-9]{24,}$/i

interface SubjectResolveResult {
  success: boolean
  data?: { id: string; name: string; slug: string; classId: string }
}

async function resolveSubjectId(subjectIdOrSlug: string, classSlug?: string): Promise<string> {
  // If it looks like a UUID/CUID, use it directly
  if (UUID_REGEX.test(subjectIdOrSlug)) {
    return subjectIdOrSlug
  }

  // Otherwise, it's a slug - resolve via API
  const params = new URLSearchParams()
  if (classSlug) {
    params.set('classSlug', classSlug)
  }

  const url = `/api/subjects/slug/${encodeURIComponent(subjectIdOrSlug)}?${params.toString()}`
  const result = await fetchJSON<SubjectResolveResult>(url)

  if (result.success && result.data?.id) {
    return result.data.id
  }

  // Fall back to original value
  return subjectIdOrSlug
}

export function useSubjectResolver(subjectIdOrSlug: string | undefined, classSlug?: string) {
  return useQuery<string>({
    queryKey: ['subject-resolve', subjectIdOrSlug, classSlug],
    queryFn: () => resolveSubjectId(subjectIdOrSlug!, classSlug),
    enabled: !!subjectIdOrSlug,
    staleTime: 300_000, // Cache for 5 minutes - slug won't change
  })
}