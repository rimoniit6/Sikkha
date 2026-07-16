import type { TabId } from '../hooks/use-course-detail'

export const MODERN_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'কোর্স ইনফো', icon: BookOpen },
  { id: 'content', label: 'কন্টেন্ট', icon: Library },
  { id: 'exams-assignments', label: 'পরীক্ষা ও অ্যাসাইনমেন্ট', icon: ClipboardCheck },
  { id: 'students', label: 'ছাত্র-ছাত্রী', icon: Users },
  { id: 'settings', label: 'সেটিংস', icon: Settings },
]

export const STATUS_META: Record<string, { label: string; className: string }> = {
  published: { label: 'পাবলিশড', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  draft: { label: 'ড্রাফট', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  archived: { label: 'আর্কাইভড', className: 'bg-amber-100 text-amber-700 border-amber-200' },
}

export const LESSON_TYPE_META: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  LIVE: { label: 'লাইভ', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: Radio },
  RECORDED: { label: 'রেকর্ডেড', className: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Video },
}

export const EXAM_TYPE_META: Record<
  string,
  { label: string; dotColor: string; iconBg: string; iconColor: string }
> = {
  MCQ: { label: 'MCQ', dotColor: 'bg-amber-500', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  CQ: { label: 'CQ', dotColor: 'bg-purple-500', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
}

export const SOURCE_META: Record<string, { label: string; className: string }> = {
  purchase: { label: 'ক্রয়', className: 'bg-blue-100 text-blue-700' },
  free_enroll: { label: 'ফ্রি এনরোল', className: 'bg-green-100 text-green-700' },
  enrollment: { label: 'এনরোলমেন্ট', className: 'bg-purple-100 text-purple-700' },
}

export const GRADE_OPTIONS = [
  { label: 'A+', value: 5.0 },
  { label: 'A', value: 4.0 },
  { label: 'A-', value: 3.5 },
  { label: 'B', value: 3.0 },
  { label: 'C', value: 2.0 },
  { label: 'D', value: 1.0 },
  { label: 'F', value: 0.0 },
]

export const GRADE_LABEL: Record<number, string> = {}
for (const g of GRADE_OPTIONS) GRADE_LABEL[g.value] = g.label

export const DAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি']

import { BookOpen, Library, ClipboardCheck, Users, Settings, Radio, Video } from 'lucide-react'
