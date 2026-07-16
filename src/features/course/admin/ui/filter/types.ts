export interface SubjectOption {
  id: string
  name: string
  classId: string
}

export interface ClassOption {
  id: string
  name: string
}

export interface ModernCourseFilters {
  search: string
  statusFilter: string
  classFilter: string
  subjectFilter: string
  typeFilter: string
}
