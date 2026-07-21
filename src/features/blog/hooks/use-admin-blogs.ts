'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { blogService } from '@/features/blog/services/blog.service'
import { queryKeys } from '@/lib/query-keys'
import type { BlogPostRecord, BlogCategoryRecord, BlogTagRecord } from '@/features/blog/types/blog'

type ApiParams = Record<string, string | number | boolean | null | undefined>

interface PaginatedResponse<T> {
  data: T[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useAdminBlogs(params?: ApiParams) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.blog.admin.list(params),
    queryFn: () => blogService.admin.list(params),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin', 'blog'] })
  }, [qc])

  const rawData = query.data as PaginatedResponse<BlogPostRecord> | undefined

  return {
    blogs: (rawData?.data ?? []) as BlogPostRecord[],
    total: rawData?.pagination?.total ?? 0,
    totalPages: rawData?.pagination?.totalPages ?? 0,
    page: rawData?.pagination?.page ?? 1,
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
