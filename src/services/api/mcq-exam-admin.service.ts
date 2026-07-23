import { api, type RequestConfig } from '@/lib/api-client'
import { 
  MCQExamPackageRecord, 
  MCQExamSetRecord, 
  MCQExamSetResultRecord,
  MCQSearchResult
} from '@/features/mcq-exam/types'

type AdminQueryParams = Record<string, string | number | boolean | undefined | null>
type AdminPayload = Record<string, unknown>
type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const mcqExamAdminService = {
  // Packages
  listPackages: (params: AdminQueryParams) =>
    api.get<{ packages: MCQExamPackageRecord[], pagination: PaginationMeta }>('admin/mcq-exam-packages', { action: 'list', ...params }),
  
  getPackageDetail: (id: string) => 
    api.get<{ package: MCQExamPackageRecord }>('admin/mcq-exam-packages', { action: 'detail', id }),
  
  createPackage: (data: AdminPayload, config?: RequestConfig) =>
    api.post<{ package: MCQExamPackageRecord }>('admin/mcq-exam-packages', { action: 'create-package', ...data }, config),
  
  updatePackage: (id: string, data: AdminPayload, config?: RequestConfig) =>
    api.put<{ package: MCQExamPackageRecord }>('admin/mcq-exam-packages', { action: 'update-package', id, ...data }, config),
  
  deletePackage: (id: string, config?: RequestConfig) => 
    api.delete('admin/mcq-exam-packages', { action: 'delete-package', id }, config),

  // Exam Sets
  getSetDetail: (setId: string) => 
    api.get<{ set: MCQExamSetRecord }>('admin/mcq-exam-packages', { action: 'set-detail', setId }),
  
  createSet: (data: AdminPayload, config?: RequestConfig) =>
    api.post<{ set: MCQExamSetRecord }>('admin/mcq-exam-packages', { action: 'create-set', ...data }, config),
  
  updateSet: (id: string, data: AdminPayload, config?: RequestConfig) =>
    api.put<{ set: MCQExamSetRecord }>('admin/mcq-exam-packages', { action: 'update-set', id, ...data }, config),
  
  deleteSet: (id: string, config?: RequestConfig) => 
    api.delete('admin/mcq-exam-packages', { action: 'delete-set', id }, config),
  
  bulkCreateSets: (data: AdminPayload, config?: RequestConfig) =>
    api.post<{ sets: MCQExamSetRecord[], count: number }>('admin/mcq-exam-packages', { action: 'bulk-create-sets', ...data }, config),

  // Questions
  searchMcqs: (params: AdminQueryParams) =>
    api.get<{ mcqs: MCQSearchResult[], pagination: PaginationMeta }>('admin/mcq-exam-packages', { action: 'search-mcqs', ...params }),
  
  addQuestions: (setId: string, mcqIds: string[], config?: RequestConfig) => 
    api.post('admin/mcq-exam-packages', { action: 'add-questions', setId, mcqIds }, config),
  
  removeQuestion: (setId: string, mcqId: string, config?: RequestConfig) => 
    api.delete('admin/mcq-exam-packages', { action: 'remove-question', setId, mcqId }, config),
  
  reorderQuestions: (setId: string, questionOrders: { id: string, order: number }[], config?: RequestConfig) => 
    api.put('admin/mcq-exam-packages', { action: 'reorder-questions', setId, questionOrders }, config),

  // Results & Leaderboard
  getResults: (setId: string) => 
    api.get<{ results: MCQExamSetResultRecord[] }>('admin/mcq-exam-packages', { action: 'results', setId }),
  
  getLeaderboard: (setId: string) => 
    api.get<{ leaderboard: MCQExamSetResultRecord[] }>('admin/mcq-exam-packages', { action: 'leaderboard', setId }),
}
