import { api } from '@/lib/api-client'
import type { BlogPostRecord, BlogPostInput, BlogCategoryRecord, BlogCategoryInput, BlogTagRecord, BlogTagInput } from '@/features/blog/types/blog'

type ApiParams = Record<string, string | number | boolean | null | undefined>

export const blogService = {
  admin: {
    list: (params?: ApiParams) =>
      api.get<BlogPostRecord[]>('admin/blog', params),
    detail: (id: string) =>
      api.get<BlogPostRecord>(`admin/blog/${id}`),
    create: (data: BlogPostInput) =>
      api.post<BlogPostRecord>('admin/blog', data),
    update: (id: string, data: Partial<BlogPostInput>) =>
      api.put<BlogPostRecord>(`admin/blog/${id}`, data),
    remove: (id: string) =>
      api.delete<{ id: string }>(`admin/blog/${id}`),
    restore: (id: string) =>
      api.post<BlogPostRecord>(`admin/blog/${id}/restore`),
    publish: (id: string) =>
      api.post<BlogPostRecord>(`admin/blog/${id}/publish`),
    archive: (id: string) =>
      api.post<BlogPostRecord>(`admin/blog/${id}/archive`),
    categories: {
      list: () => api.get<BlogCategoryRecord[]>('admin/blog/categories'),
      create: (data: BlogCategoryInput) => api.post<BlogCategoryRecord>('admin/blog/categories', data),
      update: (id: string, data: Partial<BlogCategoryInput>) => api.put<BlogCategoryRecord>('admin/blog/categories', { id, ...data }),
      remove: (id: string) => api.delete<{ id: string }>('admin/blog/categories', { id }),
    },
    tags: {
      list: () => api.get<BlogTagRecord[]>('admin/blog/tags'),
      create: (data: BlogTagInput) => api.post<BlogTagRecord>('admin/blog/tags', data),
      update: (id: string, data: Partial<BlogTagInput>) => api.put<BlogTagRecord>('admin/blog/tags', { id, ...data }),
      remove: (id: string) => api.delete<{ id: string }>('admin/blog/tags', { id }),
    },
  },
  public: {
    list: (params?: ApiParams) =>
      api.get<BlogPostRecord[]>('blog', params),
    detail: (slug: string) =>
      api.get<BlogPostRecord>(`blog/${slug}`),
    categories: () =>
      api.get<BlogCategoryRecord[]>('blog/categories'),
    tags: () =>
      api.get<BlogTagRecord[]>('blog/tags'),
    related: (slug: string, limit?: number) =>
      api.get<BlogPostRecord[]>(`blog/${slug}/related`, { limit }),
  },
}
