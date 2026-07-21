'use client'

import { useQuery } from '@tanstack/react-query'
import { blogService } from '@/features/blog/services/blog.service'
import { queryKeys } from '@/lib/query-keys'
import type { BlogPostRecord, BlogCategoryRecord, BlogTagRecord } from '@/features/blog/types/blog'

type ApiParams = Record<string, string | number | boolean | null | undefined>

export function useBlogs(params?: ApiParams) {
  return useQuery({
    queryKey: queryKeys.blog.list(params),
    queryFn: () => blogService.public.list(params),
  })
}

export function useBlog(slug: string) {
  return useQuery({
    queryKey: queryKeys.blog.detail(slug),
    queryFn: () => blogService.public.detail(slug),
    enabled: !!slug,
  })
}

export function useBlogCategories() {
  return useQuery({
    queryKey: queryKeys.blog.categories(),
    queryFn: () => blogService.public.categories(),
  })
}

export function useBlogTags() {
  return useQuery({
    queryKey: queryKeys.blog.tags(),
    queryFn: () => blogService.public.tags(),
  })
}
