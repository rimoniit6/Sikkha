'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { blogService } from '@/features/blog/services/blog.service'
import { queryKeys } from '@/lib/query-keys'
import type { BlogPostRecord, BlogCategoryRecord, BlogTagRecord } from '@/features/blog/types/blog'

type ApiParams = Record<string, string | number | boolean | null | undefined>

export function useAdminBlogs(params?: ApiParams) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.blog.admin.list(params),
    queryFn: () => blogService.admin.list(params),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin', 'blog'] })
  }, [qc])

  return {
    blogs: (query.data ?? []) as BlogPostRecord[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}

export function useAdminBlog(id: string) {
  return useQuery({
    queryKey: queryKeys.blog.admin.detail(id),
    queryFn: () => blogService.admin.detail(id),
    enabled: !!id,
  })
}

export function useAdminBlogCategories() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.blog.admin.categories(),
    queryFn: () => blogService.admin.categories.list(),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.blog.admin.categories() })
  }, [qc])

  return {
    categories: (query.data ?? []) as BlogCategoryRecord[],
    isLoading: query.isLoading,
    invalidate,
  }
}

export function useAdminBlogTags() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.blog.admin.tags(),
    queryFn: () => blogService.admin.tags.list(),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.blog.admin.tags() })
  }, [qc])

  return {
    tags: (query.data ?? []) as BlogTagRecord[],
    isLoading: query.isLoading,
    invalidate,
  }
}
