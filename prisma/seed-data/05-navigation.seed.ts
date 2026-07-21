import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter } from './00-helpers'

const NAV_ITEMS = [
  { label: 'হোম', route: 'home', icon: 'Home', location: 'header', order: 1 },
  { label: 'ক্লাস', route: 'classes', icon: 'BookOpen', location: 'header', order: 2 },
  { label: 'লেকচার', route: 'lectures', icon: 'PlayCircle', location: 'header', order: 3 },
  { label: 'এমসিকিউ', route: 'mcq', icon: 'CheckSquare', location: 'header', order: 4 },
  { label: 'সৃজনশীল', route: 'cq', icon: 'FileText', location: 'header', order: 5 },
  { label: 'সাজেশন', route: 'suggestions', icon: 'Lightbulb', location: 'header', order: 6 },
  { label: 'পরীক্ষা', route: 'exams', icon: 'ClipboardCheck', location: 'header', order: 7 },
  { label: 'ব্লগ', route: 'blog', icon: 'Newspaper', location: 'header', order: 8 },
  { label: 'প্রিমিয়াম', route: 'premium', icon: 'Crown', location: 'header', order: 9, isAuthOnly: false },
  { label: 'আমাদের সম্পর্কে', route: 'about', icon: 'Info', location: 'footer', order: 1 },
  { label: 'প্রাইভেসি', route: 'privacy', icon: 'Shield', location: 'footer', order: 2 },
  { label: 'টার্মস', route: 'terms', icon: 'FileText', location: 'footer', order: 3 },
  { label: 'যোগাযোগ', route: 'contact', icon: 'Mail', location: 'footer', order: 4 },
  { label: 'হোম', route: 'home', icon: 'Home', location: 'bottomNav', order: 1, isAuthOnly: false },
  { label: 'ক্লাস', route: 'classes', icon: 'BookOpen', location: 'bottomNav', order: 2, isAuthOnly: false },
  { label: 'পরীক্ষা', route: 'exams', icon: 'ClipboardCheck', location: 'bottomNav', order: 3, isAuthOnly: false },
  { label: 'ব্লগ', route: 'blog', icon: 'Newspaper', location: 'bottomNav', order: 4, isAuthOnly: false },
  { label: 'প্রোফাইল', route: 'dashboard', icon: 'User', location: 'bottomNav', order: 5, isAuthOnly: true },
]

export async function seedNavigation(db: PrismaClient) {
  resetCounter()

  for (const nav of NAV_ITEMS) {
    const existing = await db.navigation.findFirst({
      where: { label: nav.label, location: nav.location, route: nav.route },
    })
    if (existing) {
      await db.navigation.update({
        where: { id: existing.id },
        data: { isActive: true, deletedAt: null, order: nav.order, icon: nav.icon, isAuthOnly: nav.isAuthOnly ?? false },
      })
    } else {
      await db.navigation.create({
    data: {
      id: deterministicId('nav'),
      label: nav.label,
      route: nav.route,
      icon: nav.icon,
      location: nav.location,
      order: nav.order,
      isAuthOnly: nav.isAuthOnly ?? false,
    },
  })
    }
  }
}
