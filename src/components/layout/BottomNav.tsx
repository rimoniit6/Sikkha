'use client'

import { useRouterStore, useCurrentRoute } from '@/store/router'
import type { RoutePath } from '@/store/router'
import { useIsAuthenticated } from '@/store/auth'
import { useNavigation } from '@/hooks/use-navigation'

const BOTTOM_NAV_ROUTE_MAP: Record<string, string> = {
  'notice-detail': 'home',
  'suggestion-detail': 'suggestions',
  'class-detail': 'class-list',
  'subject-detail': 'class-list',
  'chapter-detail': 'class-list',
  'lecture-list': 'class-list',
  'lecture-viewer': 'class-list',
  'cq-list': 'class-list',
  'cq-viewer': 'class-list',
  'board-questions': 'home',
  'search': 'home',
  'premium': 'home',
  'payment': 'user-dashboard',
  'exam-session': 'exam-center',
  'exam-result': 'exam-center',
  'mcq-exam-package-list': 'exam-center',
  'mcq-exam-package-detail': 'exam-center',
  'mcq-exam-history': 'exam-center',
  'cq-exam-package-list': 'exam-center',
  'cq-exam-package-detail': 'exam-center',
  'cq-exam-viewer': 'exam-center',
  'cq-exam-result': 'exam-center',
  'create-exam': 'exam-center',
  'exam-creator-history': 'exam-center',
  'exam-creator-result': 'exam-center',
  'short-questions': 'home',
  'course-list': 'home',
  'course-detail': 'course-list',
  'course-viewer': 'course-detail',
  'notices': 'home',
  'exam-center': 'exam-center',
  'user-dashboard': 'user-dashboard',
  'suggestions': 'suggestions',
  'class-list': 'class-list',
  'home': 'home',
  'login': 'home',
  'register': 'home',
  'blog': 'blog',
  'blog-detail': 'blog',
  'blog-category': 'blog',
  'blog-tag': 'blog',
  'blog-author': 'blog',
}

export default function BottomNav() {
  const currentRoute = useCurrentRoute()
  const navigate = useRouterStore((s) => s.navigate)
  const isAuthenticated = useIsAuthenticated()
  const { bottomNav, loading: navLoading } = useNavigation()

  const visibleItems = bottomNav.filter(item => {
    if (item.isAdminOnly) return false
    if (item.isAuthOnly && !isAuthenticated) return false
    return true
  })

  const getActiveIndex = () => {
    const mappedRoute = BOTTOM_NAV_ROUTE_MAP[currentRoute] || currentRoute
    const idx = visibleItems.findIndex((item) => item.route === mappedRoute)
    return idx >= 0 ? idx : 0
  }

  const handleTabClick = (route: string) => {
    navigate(route as RoutePath)
  }

  const activeIndex = getActiveIndex()
  const itemCount = visibleItems.length
  const itemWidthPercent = itemCount > 0 ? 100 / itemCount : 20

  if (navLoading) return null

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe" role="navigation" aria-label="মূল নেভিগেশন">
      <div className="mx-3 mb-3">
        <nav className="glass rounded-2xl shadow-lg shadow-black/10 dark:shadow-black/30 px-2 py-1.5">
          <div className="flex items-center justify-around relative">
            {/* Active Indicator Background — CSS transition instead of framer-motion */}
            <div
              className="absolute top-0 h-full pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: `${itemWidthPercent}%`,
                left: `${activeIndex * itemWidthPercent}%`,
              }}
            >
              <div className="mx-1 my-0.5 h-[calc(100%-4px)] rounded-xl bg-edu-primary/10 dark:bg-edu-primary/20" />
            </div>

            {/* Nav Items */}
            {visibleItems.map((item, index) => {
              const Icon = item.Icon
              const isActive = index === activeIndex
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.route)}
                  className={`relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] z-10 active:scale-90 transition-transform duration-150 ${
                    isActive ? '' : 'hover:bg-accent/30'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <div
                    className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isActive ? 'scale-110 -translate-y-0.5' : 'scale-100 translate-y-0'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors duration-200 ${
                        isActive ? 'text-edu-primary' : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[10px] mt-0.75 font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-edu-primary opacity-100 translate-y-0'
                        : 'text-muted-foreground opacity-70 translate-y-px'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
