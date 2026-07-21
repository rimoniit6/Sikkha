import type { PrismaClient } from '@prisma/client'

const NAV_ITEMS = [
  // ========== Header ==========
  { label: 'হোম', route: 'home', icon: 'Home', location: 'header', order: 1 },
  { label: 'ক্লাসসমূহ', route: 'class-list', icon: 'GraduationCap', location: 'header', order: 2 },
  { label: 'কোর্স', route: 'course-list', icon: 'BookOpen', location: 'header', order: 3 },
  { label: 'এক্সাম', route: 'exam-center', icon: 'ClipboardCheck', location: 'header', order: 4 },
  { label: 'সাজেশন', route: 'suggestions', icon: 'BookOpen', location: 'header', order: 5 },
  { label: 'বোর্ড প্রশ্ন', route: 'board-questions', icon: 'BookOpen', location: 'header', order: 6 },
  { label: 'নোটিশ', route: 'notices', icon: 'Megaphone', location: 'header', order: 7 },
  { label: 'প্রিমিয়াম', route: 'premium', icon: 'Crown', location: 'header', order: 8 },
  { label: 'এডমিন', route: 'admin-dashboard', icon: 'LayoutDashboard', location: 'header', order: 9, isAdminOnly: true },
  { label: 'ব্লগ', route: 'blog', icon: 'Newspaper', location: 'header', order: 10 },

  // ========== Bottom Navigation ==========
  { label: 'হোম', route: 'home', icon: 'Home', location: 'bottomNav', order: 1 },
  { label: 'ক্লাস', route: 'class-list', icon: 'BookOpen', location: 'bottomNav', order: 2 },
  { label: 'এক্সাম', route: 'exam-center', icon: 'ClipboardCheck', location: 'bottomNav', order: 3 },
  { label: 'সাজেশন', route: 'suggestions', icon: 'Lightbulb', location: 'bottomNav', order: 4 },
  { label: 'প্রোফাইল', route: 'user-dashboard', icon: 'User', location: 'bottomNav', order: 5, isAuthOnly: true },
  { label: 'ব্লগ', route: 'blog', icon: 'Newspaper', location: 'bottomNav', order: 6 },

  // ========== Footer ==========
  { label: 'হোম', route: 'home', icon: 'Home', location: 'footer', order: 1 },
  { label: 'ক্লাসসমূহ', route: 'class-list', icon: 'GraduationCap', location: 'footer', order: 2 },
  { label: 'বোর্ড প্রশ্ন', route: 'board-questions', icon: 'BookOpen', location: 'footer', order: 3 },
  { label: 'প্রিমিয়াম', route: 'premium', icon: 'Crown', location: 'footer', order: 4 },
  { label: 'ব্লগ', route: 'blog', icon: 'Newspaper', location: 'footer', order: 5 },
]

export async function seedNavigation(db: PrismaClient) {
  await db.navigation.deleteMany()
  for (const nav of NAV_ITEMS) {
    await db.navigation.create({
      data: {
        label: nav.label,
        route: nav.route,
        icon: nav.icon,
        location: nav.location,
        order: nav.order,
        isAuthOnly: nav.isAuthOnly ?? false,
        isAdminOnly: nav.isAdminOnly ?? false,
      },
    })
  }
}
