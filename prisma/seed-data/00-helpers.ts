const BN_MAP: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
}

export function BN(n: number | string): string {
  return String(n).split('').map(c => BN_MAP[c] ?? c).join('')
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

let _counter = 0
export function deterministicId(prefix: string): string {
  _counter++
  return `${prefix}_${String(_counter).padStart(6, '0')}`
}

export function resetCounter() {
  _counter = 0
}

export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

export function bnDate(date: Date): string {
  const d = date.getDate()
  const m = date.getMonth() + 1
  const y = date.getFullYear()
  return `${BN(d)}/${BN(m)}/${BN(y)}`
}

export const CLASSES = [
  { name: '৬ষ্ঠ শ্রেণি', nameEn: 'Class 6', slug: 'class-6', order: 1, icon: '6', color: '#10b981', gradient: 'from-emerald-400 to-emerald-600' },
  { name: '৭ম শ্রেণি', nameEn: 'Class 7', slug: 'class-7', order: 2, icon: '7', color: '#3b82f6', gradient: 'from-teal-400 to-teal-600' },
  { name: '৮ম শ্রেণি', nameEn: 'Class 8', slug: 'class-8', order: 3, icon: '8', color: '#8b5cf6', gradient: 'from-cyan-400 to-cyan-600' },
  { name: 'এসএসসি', nameEn: 'SSC', slug: 'ssc', order: 4, icon: 'S', color: '#f59e0b', gradient: 'from-emerald-500 to-teal-500' },
  { name: 'এইচএসসি', nameEn: 'HSC', slug: 'hsc', order: 5, icon: 'H', color: '#ef4444', gradient: 'from-teal-500 to-emerald-500' },
]

export const SUBJECTS: Record<string, Array<{ name: string; nameBn: string; slug: string; order: number }>> = {
  'class-6': [
    { name: 'Bangla', nameBn: 'বাংলা', slug: 'bangla', order: 1 },
    { name: 'English', nameBn: 'ইংরেজি', slug: 'english', order: 2 },
    { name: 'Mathematics', nameBn: 'গণিত', slug: 'mathematics', order: 3 },
    { name: 'Science', nameBn: 'বিজ্ঞান', slug: 'science', order: 4 },
    { name: 'Bangladesh and Global Studies', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়', slug: 'bangladesh-global-studies', order: 5 },
    { name: 'Islamic Studies', nameBn: 'ইসলাম ও নৈতিক শিক্ষা', slug: 'islamic-studies', order: 6 },
    { name: 'Hindu Studies', nameBn: 'হিন্দু ধর্ম', slug: 'hindu-studies', order: 7 },
    { name: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', slug: 'ict', order: 8 },
    { name: 'Physical Education', nameBn: 'শারীরিক শিক্ষা ও স্বাস্থ্য', slug: 'physical-education', order: 9 },
    { name: 'Arts and Crafts', nameBn: 'চারু ও কারুকলা', slug: 'arts-crafts', order: 10 },
  ],
  'class-7': [
    { name: 'Bangla', nameBn: 'বাংলা', slug: 'bangla', order: 1 },
    { name: 'English', nameBn: 'ইংরেজি', slug: 'english', order: 2 },
    { name: 'Mathematics', nameBn: 'গণিত', slug: 'mathematics', order: 3 },
    { name: 'Science', nameBn: 'বিজ্ঞান', slug: 'science', order: 4 },
    { name: 'Bangladesh and Global Studies', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়', slug: 'bangladesh-global-studies', order: 5 },
    { name: 'Islamic Studies', nameBn: 'ইসলাম ও নৈতিক শিক্ষা', slug: 'islamic-studies', order: 6 },
    { name: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', slug: 'ict', order: 7 },
    { name: 'Physical Education', nameBn: 'শারীরিক শিক্ষা ও স্বাস্থ্য', slug: 'physical-education', order: 8 },
  ],
  'class-8': [
    { name: 'Bangla', nameBn: 'বাংলা', slug: 'bangla', order: 1 },
    { name: 'English', nameBn: 'ইংরেজি', slug: 'english', order: 2 },
    { name: 'Mathematics', nameBn: 'গণিত', slug: 'mathematics', order: 3 },
    { name: 'Science', nameBn: 'বিজ্ঞান', slug: 'science', order: 4 },
    { name: 'Bangladesh and Global Studies', nameBn: 'বাংলাদেশ ও বিশ্বপরিচয়', slug: 'bangladesh-global-studies', order: 5 },
    { name: 'Islamic Studies', nameBn: 'ইসলাম ও নৈতিক শিক্ষা', slug: 'islamic-studies', order: 6 },
    { name: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', slug: 'ict', order: 7 },
  ],
  'ssc': [
    { name: 'Bangla', nameBn: 'বাংলা', slug: 'bangla', order: 1 },
    { name: 'English', nameBn: 'ইংরেজি', slug: 'english', order: 2 },
    { name: 'Mathematics', nameBn: 'গণিত', slug: 'mathematics', order: 3 },
    { name: 'Physics', nameBn: 'পদার্থবিজ্ঞান', slug: 'physics', order: 4 },
    { name: 'Chemistry', nameBn: 'রসায়ন', slug: 'chemistry', order: 5 },
    { name: 'Biology', nameBn: 'জীববিজ্ঞান', slug: 'biology', order: 6 },
    { name: 'Higher Mathematics', nameBn: 'উচ্চতর গণিত', slug: 'higher-mathematics', order: 7 },
    { name: 'Bangladesh History', nameBn: 'বাংলাদেশের ইতিহাস ও বিশ্বসভ্যতা', slug: 'bangladesh-history', order: 8 },
    { name: 'Agriculture', nameBn: 'কৃষি শিক্ষা', slug: 'agriculture', order: 9 },
    { name: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', slug: 'ict', order: 10 },
  ],
  'hsc': [
    { name: 'Bangla', nameBn: 'বাংলা', slug: 'bangla', order: 1 },
    { name: 'English', nameBn: 'ইংরেজি', slug: 'english', order: 2 },
    { name: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', slug: 'ict', order: 3 },
    { name: 'Physics', nameBn: 'পদার্থবিজ্ঞান', slug: 'physics', order: 4 },
    { name: 'Chemistry', nameBn: 'রসায়ন', slug: 'chemistry', order: 5 },
    { name: 'Biology', nameBn: 'জীববিজ্ঞান', slug: 'biology', order: 6 },
    { name: 'Higher Mathematics', nameBn: 'উচ্চতর গণিত', slug: 'higher-mathematics', order: 7 },
    { name: 'Statistics', nameBn: 'পরিসংখ্যান', slug: 'statistics', order: 8 },
    { name: 'Accounting', nameBn: 'হিসাববিজ্ঞান', slug: 'accounting', order: 9 },
    { name: 'Management', nameBn: 'ব্যবস্থাপনা', slug: 'management', order: 10 },
  ],
}

export const CHAPTER_NAMES: Record<string, string[]> = {
  'bangla': ['পয়গম্বর ও সাহাবীদের জীবনী', 'ভাষা ও সাহিত্য', 'বাংলা ব্যাকরণ', 'প্রবন্ধ রচনা', 'পদ্য পরিচিতি', 'গদ্য পরিচিতি', 'বাংলা উচ্চারণ', 'বিরাম চিহ্ন'],
  'english': ['Parts of Speech', 'Tense', 'Voice Change', 'Narration', 'Completing Sentences', 'Article', 'Preposition', 'Suffix and Prefix'],
  'mathematics': ['সেট ও ফাংশন', 'বীজগণিতের রাশি', 'সূচক ও লগারিদম', 'রেখা ও কোণ', 'ত্রিকোণমিতি', 'ক্ষেত্রফল', 'ঘন জ্যামিতি', 'পরিসংখ্যান'],
  'physics': ['ভৌত জগৎ ও পরিমাপ', 'গতি', 'বল ও গতি', 'কাজ, ক্ষমতা ও শক্তি', 'চাপ ও তরল', 'তাপ', 'তরঙ্গ ও শব্দ', 'আলো', 'চুম্বক ও বিদ্যুৎ'],
  'chemistry': ['রসায়নের ধারণা', 'পদার্থের অবস্থা', 'পরমাণুর গঠন', 'পর্যায় সারণি', 'রাসায়নিক বন্ধন', 'রাসায়নিক বিক্রিয়া', 'জারণ-বিজারণ', 'জৈব রসায়ন'],
  'biology': ['জীবকোষ ও টিস্যু', 'জীবের প্রজনন', 'বংশগতি ও বিবর্তন', 'মানবদেহের পাচনতন্ত্র', 'রক্ত সঞ্চালন', 'শ্বসন ও রেচন', 'অনুজীব ও রোগ', 'জীববৈচিত্র্য ও সংরক্ষণ'],
  'higher-mathematics': ['ম্যাট্রিক্স', 'সারনির্ধারক', 'ভেক্টর', 'সমতলীয় জ্যামিতি', 'ক্যালকুলাসের ভিত্তি', 'অবকলন', 'সমাকলন', 'ডিফারেনশিয়াল সমীকরণ'],
  'bangladesh-global-studies': ['বাংলাদেশের ইতিহাস', 'মুক্তিযুদ্ধ', 'বাংলাদেশের সংবিধান', 'সরকার ব্যবস্থা', 'অর্থনীতি', 'আন্তর্জাতিক সম্পর্ক', 'জনসংখ্যা', 'পরিবেশ'],
  'ict': ['ডিজিটাল বিশ্ব', 'তথ্য সংগ্রহ ও ব্যবস্থাপনা', 'প্রোগ্রামিং ভাষা', 'ওয়েব ডেভেলপমেন্ট', 'ডাটাবেস', 'নেটওয়ার্ক ও যোগাযোগ', 'সাইবার নিরাপত্তা'],
  'islamic-studies': ['আকিদা', 'ইবাদত', 'আখলাক', 'সিরাত', 'ফিকহ', 'কুরআন শিক্ষা'],
  'bangladesh-history': ['প্রাচীন বাংলা', 'মধ্যযুগের বাংলা', 'ব্রিটিশ শাসন', 'বাংলা নবজাগরণ', 'পাকিস্তান আন্দোলন', 'স্বাধীনতা সংগ্রাম', 'বাংলাদেশের রাজনীতি'],
  'agriculture': ['কৃষির ধারণা', 'মৃত্তিকা', 'ফসল উৎপাদন', 'সেচ ও নিষ্কাশন', 'সার ও কীটনাশক', 'প্রাণি সম্পদ', 'মৎস্য চাষ'],
  'science': ['জীববিজ্ঞানের ভিত্তি', 'পদার্থ বিজ্ঞানের ধারণা', 'রসায়নের মৌলিক ধারণা', 'পরিবেশ ও বাস্তুতন্ত্র', 'শক্তি ও তার ব্যবহার', 'আমাদের শরীর'],
  'statistics': ['পরিসংখ্যানের ধারণা', 'উপাত্ত সংগ্রহ', 'কেন্দ্রীয় প্রবণতা', 'বিক্ষেপণ', 'সম্ভাবনা', 'সূচক', 'সম্পর্ক ও সহসম্পর্ক'],
  'accounting': ['হিসাববিজ্ঞানের ধারণা', 'লেনদেন', 'জাবেদা', 'খতিয়ান', 'তালিকা', 'মূল্যবৃদ্ধি', 'আর্থিক বিবরণী'],
  'management': ['ব্যবস্থাপনার ধারণা', 'পরিকল্পনা', 'সংগঠন', 'কর্মী ব্যবস্থাপনা', 'নিয়ন্ত্রণ', 'যোগাযোগ', 'নেতৃত্ব'],
  'physical-education': ['শারীরিক শিক্ষার ধারণা', 'জিমন্যাস্টিকস', 'অ্যাথলেটিকস', 'সুস্থতা ও পুষ্টি', 'প্রাথমিক চিকিৎসা', 'বিভিন্ন খেলা'],
  'hindu-studies': ['হিন্দুধর্মের পরিচয়', 'দেবদেবী', 'পূজা-পার্বণ', 'পুরাণ', 'যোগ ও ধ্যান', 'নৈতিকতা'],
  'arts-crafts': ['অঙ্কন', 'রং ও রঙের ব্যবহার', 'চিত্রকর্ম', 'ভাস্কর্য', 'ছাপচিত্র', 'মৃৎশিল্প'],
}

export const BOARDS = [
  { name: 'ঢাকা', slug: 'dhaka', color: 'rose', order: 1 },
  { name: 'রাজশাহী', slug: 'rajshahi', color: 'emerald', order: 2 },
  { name: 'চট্টগ্রাম', slug: 'chittagong', color: 'sky', order: 3 },
  { name: 'বরিশাল', slug: 'barishal', color: 'amber', order: 4 },
  { name: 'সিলেট', slug: 'sylhet', color: 'violet', order: 5 },
  { name: 'দিনাজপুর', slug: 'dinajpur', color: 'orange', order: 6 },
  { name: 'কুমিল্লা', slug: 'comilla', color: 'teal', order: 7 },
  { name: 'যশোর', slug: 'jessore', color: 'pink', order: 8 },
  { name: 'ময়মনসিংহ', slug: 'mymensingh', color: 'indigo', order: 9 },
  { name: 'টেকনাফ', slug: 'teknaf', color: 'cyan', order: 10 },
]

export const YEARS = Array.from({ length: 15 }, (_, i) => String(2025 - i))

export function generateChapterNames(subjectSlug: string): string[] {
  return CHAPTER_NAMES[subjectSlug] ?? [
    'প্রথম অধ্যায়', 'দ্বিতীয় অধ্যায়', 'তৃতীয় অধ্যায়', 'চতুর্থ অধ্যায়',
    'পঞ্চম অধ্যায়', 'ষষ্ঠ অধ্যায়', 'সপ্তম অধ্যায়', 'অষ্টম অধ্যায়',
  ]
}

export function generateTopicNames(chapterName: string, chapterIndex: number): string[] {
  const topics: string[] = []
  const parts = ['ক', 'খ', 'গ']
  for (let i = 1; i <= 3; i++) {
    topics.push(`${chapterName} - ${parts[i - 1]}`)
  }
  if (chapterIndex % 3 === 0) topics.push(`${chapterName} - ঘ`)
  return topics
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}
