import { db } from '@/lib/db'
import { apiError, withCsrf } from '@/lib/api-utils'
import { requireSuperAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { auditFromRequest, AuditActions } from '@/lib/audit'

const DEFAULT_NAVIGATION_ITEMS = [
  // Header nav items
  { label: 'হোম', route: 'home', icon: 'BookOpen', location: 'header', order: 1, isAuthOnly: false, isAdminOnly: false },
  { label: 'ক্লাসসমূহ', route: 'class-list', icon: 'GraduationCap', location: 'header', order: 2, isAuthOnly: false, isAdminOnly: false },
  { label: 'কোর্স', route: 'course-list', icon: 'BookOpen', location: 'header', order: 3, isAuthOnly: false, isAdminOnly: false },
  { label: 'এক্সাম', route: 'exam-center', icon: 'ClipboardCheck', location: 'header', order: 4, isAuthOnly: false, isAdminOnly: false },
  { label: 'সাজেশন', route: 'suggestions', icon: 'BookOpen', location: 'header', order: 5, isAuthOnly: false, isAdminOnly: false },
  { label: 'বোর্ড প্রশ্ন', route: 'board-questions', icon: 'BookOpen', location: 'header', order: 6, isAuthOnly: false, isAdminOnly: false },
  { label: 'নোটিশ', route: 'notices', icon: 'Megaphone', location: 'header', order: 7, isAuthOnly: false, isAdminOnly: false },
  { label: 'প্রিমিয়াম', route: 'premium', icon: 'Crown', location: 'header', order: 8, isAuthOnly: false, isAdminOnly: false },
  { label: 'এডমিন', route: 'admin-dashboard', icon: 'LayoutDashboard', location: 'header', order: 9, isAuthOnly: false, isAdminOnly: true },

  // Bottom nav items
  { label: 'হোম', route: 'home', icon: 'Home', location: 'bottomNav', order: 1, isAuthOnly: false, isAdminOnly: false },
  { label: 'ক্লাস', route: 'class-list', icon: 'BookOpen', location: 'bottomNav', order: 2, isAuthOnly: false, isAdminOnly: false },
  { label: 'এক্সাম', route: 'exam-center', icon: 'ClipboardCheck', location: 'bottomNav', order: 3, isAuthOnly: false, isAdminOnly: false },
  { label: 'সাজেশন', route: 'suggestions', icon: 'Lightbulb', location: 'bottomNav', order: 4, isAuthOnly: false, isAdminOnly: false },
  { label: 'প্রোফাইল', route: 'user-dashboard', icon: 'User', location: 'bottomNav', order: 5, isAuthOnly: true, isAdminOnly: false },

  // Footer nav items
  { label: 'হোম', route: 'home', icon: 'BookOpen', location: 'footer', order: 1, isAuthOnly: false, isAdminOnly: false },
  { label: 'ক্লাসসমূহ', route: 'class-list', icon: 'GraduationCap', location: 'footer', order: 2, isAuthOnly: false, isAdminOnly: false },
  { label: 'বোর্ড প্রশ্ন', route: 'board-questions', icon: 'BookOpen', location: 'footer', order: 3, isAuthOnly: false, isAdminOnly: false },
  { label: 'প্রিমিয়াম', route: 'premium', icon: 'Crown', location: 'footer', order: 4, isAuthOnly: false, isAdminOnly: false },
]

// POST /api/admin/navigation/seed — seed default navigation items (super_admin only)
export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdmin(request)
    if (!auth) {
      return apiError('অনুমতি নেই', 403)
    }

    const csrfCheck = await withCsrf(request)
    if ('error' in csrfCheck) return csrfCheck.error

    const result = await db.$transaction(async (tx) => {
      let c = 0
      let s = 0
      for (const navItem of DEFAULT_NAVIGATION_ITEMS) {
        const existing = await tx.navigation.findFirst({
          where: {
            label: navItem.label,
            route: navItem.route,
            location: navItem.location,
          },
        })
        if (existing) {
          s++
          continue
        }
        await tx.navigation.create({ data: navItem })
        c++
      }
      await auditFromRequest(request, auth.user.id, AuditActions.NAVIGATION_SEED, 'navigation', 'seed', undefined, { created: c, skipped: s }, tx as never)
      return { created: c, skipped: s }
    })

    return NextResponse.json({
      success: true,
      message: `${result.created}টি তৈরি, ${result.skipped}টি আগে থেকেই আছে`,
      created: result.created,
      skipped: result.skipped,
    })
  } catch (error) {
    console.error('[Admin Navigation Seed] POST error:', error)
    return apiError('নেভিগেশন seed করতে সমস্যা হয়েছে', 500)
  }
}
