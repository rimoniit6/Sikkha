import { api } from '@/lib/api-client'

type QueryParams = Record<string, string | number | boolean | undefined | null>
type PaginationMeta = { page: number; limit: number; total: number; totalPages: number }

export interface CourseRecord {
  id: string; title: string; slug: string; description: string | null
  thumbnail: string | null; isPremium: boolean; price: number | null
  originalPrice?: number | null
  status: string
  classId: string | null; subjectId: string | null
  teacherName?: string | null
  hasCertificate?: boolean
  duration?: number | null
  language?: string | null
  difficulty?: string | null
  features?: string | null
  requirements?: string | null
  targetStudents?: string | null
  classCategory?: { id: string; name: string; slug: string } | null
  subject?: { id: string; name: string; slug: string; color?: string; icon?: string } | null
  _count?: { lessons?: number; purchases: number }
  createdAt?: string
}

export interface EnrollmentRecord {
  id: string; status: string; type: string; enrolledAt: string; completedAt: string | null
}

export interface ActivityProgress {
  total: number
  completed: number
}

export interface CourseProgressResponse {
  lessonProgress: Record<string, boolean>
  overall: ActivityProgress & { percent: number }
  breakdown: {
    lessons: ActivityProgress
    liveClasses: ActivityProgress
    recordedClasses: ActivityProgress
    assignments: ActivityProgress
    mcqExams: ActivityProgress
    cqExams: ActivityProgress
  }
}

export const courseService = {
  list: (params?: QueryParams) =>
    api.get<{ courses: CourseRecord[]; pagination: PaginationMeta }>('courses', { action: 'list', ...params }),
  detail: (slug: string) =>
    api.get<{ course: any; hasAccess: boolean; enrollment?: EnrollmentRecord | null; progress?: Record<string, boolean> }>('courses', { action: 'detail', slug }),
  detailById: (id: string) =>
    api.get<{ course: any; hasAccess: boolean }>('courses', { action: 'detail', id }),
  checkPurchase: (courseId: string) =>
    api.get<{ isPurchased: boolean }>('courses/purchase', { courseId }),
  listPurchases: () =>
    api.get<{ purchases: Array<{ id: string; course: CourseRecord }> }>('courses/purchase'),
  purchase: (courseId: string, paymentId?: string) =>
    api.post<{ purchase: { id: string } }>('courses/purchase', { courseId, paymentId }),
  enroll: (courseId: string) =>
    api.post<{ enrollment: EnrollmentRecord }>('courses/enroll', { courseId }),
  toggleProgress: (courseId: string, contentId: string, completed: boolean) =>
    api.post<{ record: { contentId: string; completed: boolean } }>('courses/progress', { courseId, contentId, completed }),
  progress: (courseId: string) =>
    api.get<CourseProgressResponse>('courses/progress', { courseId }),
  syllabus: (courseId: string) =>
    api.get<{ summary: any; rows: any[]; examCalendar?: any[] }>('courses', { action: 'syllabus', courseId }),
  listAssignments: (courseId: string) =>
    api.get<{ assignments: any[] }>('courses/assignments', { action: 'list', courseId }),
  submitAssignment: (assignmentId: string, content?: string, fileUrls?: string) =>
    api.post<{ submission: any }>('courses/assignments', { action: 'submit', assignmentId, content, fileUrls }),
  updateAssignmentSubmission: (assignmentId: string, content?: string, fileUrls?: string) =>
    api.post<{ submission: any }>('courses/assignments', { action: 'update-submission', assignmentId, content, fileUrls }),

  // Related courses (same subject or class)
  related: (courseId: string) =>
    api.get<{ courses: CourseRecord[] }>('courses', { action: 'related', courseId }),

  // Continue learning — user's enrollments with progress
  enrollments: () =>
    api.get<{ enrollments: Array<{
      enrollment: { id: string; status: string; type: string; enrolledAt: string; completedAt: string | null }
      course: CourseRecord
      progress: { total: number; completed: number; percent: number }
      certificate: { id: string; serial: string } | null
    }> }>('courses', { action: 'enrollments' }),

  // User's earned certificates
  certificates: () =>
    api.get<{ certificates: Array<{ id: string; serial: string; issuedAt: string; course: { id: string; title: string; slug: string; thumbnail: string | null } }> }>('courses/certificate', {}),

  // Course bookmarks
  listBookmarks: () =>
    api.get<{ bookmarks: Array<{ id: string; contentId: string; title: string; createdAt: string }> }>('bookmarks', { contentType: 'course' }),
  checkBookmark: (courseId: string) =>
    api.get<{ data: { isBookmarked: boolean } }>('bookmarks/check', { contentType: 'course', contentId: courseId }),
  addBookmark: (courseId: string) =>
    api.post<{ bookmarked: boolean }>('bookmarks', { contentId: courseId, contentType: 'course' }),
  removeBookmark: (courseId: string) =>
    api.delete<{ bookmarked: boolean }>('bookmarks', { contentType: 'course', contentId: courseId }),

  // Personal course notes (user-generated)
  myNotes: (courseId: string) =>
    api.get<{ data: Array<{ id: string; contentId: string; contentType: string; content: string; updatedAt: string }> }>('notes', { contentType: 'course', contentId: courseId }),
  saveNote: (courseId: string, content: string) =>
    api.post<{ data: { id: string; content: string } }>('notes', { contentId: courseId, contentType: 'course', content }),
}
