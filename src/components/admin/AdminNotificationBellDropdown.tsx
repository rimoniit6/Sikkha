'use client'

import React, { useCallback, useState, useEffect, useRef } from 'react'
import { Bell, MessageSquareText, Mail, CreditCard, CheckCheck, ExternalLink, Loader2, Volume2, VolumeX } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useRouterStore } from '@/store/router'
import {
  useAdminNotificationBell,
  useMarkAdminNotificationsRead,
  type AdminNotificationItem,
} from '@/hooks/admin/use-admin-notification-bell'
import { useAdminNotificationSound } from '@/hooks/admin/use-admin-notification-sound'

// ─── Helpers ───

function getIcon(type: string, title: string) {
  const lower = `${title} ${type}`.toLowerCase()
  if (lower.includes('পেমেন্ট') || lower.includes('payment')) return CreditCard
  if (lower.includes('যোগাযোগ') || lower.includes('contact')) return Mail
  return MessageSquareText // feedback
}

function getIconBg(type: string, title: string) {
  const lower = `${title} ${type}`.toLowerCase()
  if (lower.includes('পেমেন্ট') || lower.includes('payment')) return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
  if (lower.includes('যোগাযোগ') || lower.includes('contact')) return 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400'
  return 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
}

function timeAgo(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diffMs = now - then
  const seconds = Math.floor(diffMs / 1000)

  if (seconds < 60) return 'এখনই'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} মি. আগে`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ঘ. আগে`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} দিন আগে`
  return new Date(dateString).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })
}

function getNavigationTarget(notification: AdminNotificationItem): { route: string; label: string } {
  const link = notification.link || ''
  if (link.includes('/admin/feedback')) return { route: 'admin-feedback', label: 'ফিডব্যাক দেখুন' }
  if (link.includes('/admin/contact')) return { route: 'admin-contact-messages', label: 'যোগাযোগ বার্তা দেখুন' }
  if (link.includes('/admin/payments')) return { route: 'admin-payments', label: 'পেমেন্ট দেখুন' }
  return { route: 'admin-notifications', label: 'নোটিফিকেশন দেখুন' }
}

// ─── Notification Item ───

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: AdminNotificationItem
  onMarkRead: (id: string) => void
}) {
  const navigate = useRouterStore((s) => s.navigate)
  const nav = getNavigationTarget(notification)

  const handleClick = useCallback(() => {
    onMarkRead(notification.id)
    navigate(nav.route as any)
  }, [notification.id, nav.route, onMarkRead, navigate])

  const Icon = getIcon(notification.type, notification.title)
  const iconBg = getIconBg(notification.type, notification.title)

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-accent/50',
        !notification.isRead && 'bg-accent/20'
      )}
      aria-label={`${notification.title} — ${notification.message}`}
    >
      {/* Icon */}
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', iconBg)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm leading-tight', !notification.isRead && 'font-semibold')}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
    </button>
  )
}

// ─── Dropdown Content ───

function NotificationDropdownContent({
  onClose,
}: {
  onClose?: () => void
}) {
  const { data, isLoading } = useAdminNotificationBell()
  const markRead = useMarkAdminNotificationsRead()
  const navigate = useRouterStore((s) => s.navigate)
  const { soundEnabled, setSoundEnabled } = useAdminNotificationSound()

  const notifications = data?.data ?? []
  const unread = data?.pagination?.unread ?? 0

  const handleMarkRead = useCallback(
    (id: string) => {
      if (markRead.isPending) return
      markRead.mutate({ ids: [id] })
      onClose?.()
    },
    [markRead, onClose]
  )

  const handleMarkAllRead = useCallback(() => {
    markRead.mutate({ markAll: true })
  }, [markRead])

  const handleNav = useCallback(
    (route: string) => {
      navigate(route as 'admin-feedback' | 'admin-contact-messages' | 'admin-payments' | 'admin-notifications')
      onClose?.()
    },
    [navigate, onClose]
  )

  return (
    <div className="w-[360px] max-h-[480px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <h3 className="text-sm font-semibold">
          নোটিফিকেশন
          {unread > 0 && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({unread}টি অপঠিত)
            </span>
          )}
        </h3>
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markRead.isPending}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
            aria-label="সব পড়া হয়েছে হিসেবে চিহ্নিত করুন"
          >
            {markRead.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3 w-3" />
            )}
            সব পড়া
          </button>
        )}
      </div>

      <Separator />

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">কোনো নতুন নোটিফিকেশন নেই</p>
          </div>
        ) : (
          notifications.map((n, idx) => (
            <React.Fragment key={n.id}>
              {idx > 0 && <Separator className="mx-4 w-auto" />}
              <NotificationItem notification={n} onMarkRead={handleMarkRead} />
            </React.Fragment>
          ))
        )}
      </div>

      {/* Footer */}
      {data && data.pagination.hasMore && (
        <>
          <Separator />
          <div className="px-4 py-2 text-center">
            <button
              onClick={() => handleNav('admin-notifications')}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              সব নোটিফিকেশন দেখুন ({data.pagination.total})
            </button>
          </div>
        </>
      )}

      {/* Sound toggle */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={cn(
            'flex items-center gap-2 text-xs transition-colors',
            soundEnabled
              ? 'text-muted-foreground hover:text-foreground'
              : 'text-muted-foreground/50 hover:text-muted-foreground'
          )}
          aria-label={soundEnabled ? 'সাউন্ড বন্ধ করুন' : 'সাউন্ড চালু করুন'}
          title={soundEnabled ? 'নতুন নোটিফিকেশনে সাউন্ড বাজবে' : 'নতুন নোটিফিকেশনে সাউন্ড বন্ধ'}
        >
          {soundEnabled ? (
            <Volume2 className="h-3.5 w-3.5" />
          ) : (
            <VolumeX className="h-3.5 w-3.5" />
          )}
          <span>{soundEnabled ? 'সাউন্ড চালু' : 'সাউন্ড বন্ধ'}</span>
        </button>
      </div>

      <Separator />

      {/* Quick links */}
      <div className="flex items-center gap-1 p-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-xs h-8"
          onClick={() => handleNav('admin-feedback')}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          ফিডব্যাক
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-xs h-8"
          onClick={() => handleNav('admin-contact-messages')}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          যোগাযোগ
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-xs h-8"
          onClick={() => handleNav('admin-payments')}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          পেমেন্ট
        </Button>
      </div>
    </div>
  )
}

// ─── Bell Button ───

export default function AdminNotificationBellDropdown() {
  const { data } = useAdminNotificationBell()
  const unread = data?.pagination?.unread ?? 0
  const [open, setOpen] = useState(false)
  // Activate sound detection (runs while dropdown exists in DOM)
  useAdminNotificationSound()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={`নোটিফিকেশন${unread > 0 ? ` — ${unread}টি অপঠিত` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white leading-none shadow-sm ring-2 ring-background">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-auto p-0 overflow-hidden rounded-xl shadow-xl border"
      >
        <NotificationDropdownContent onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

/**
 * Floating Admin Action Center — fixed at top-right on every admin page.
 * Shows the bell icon with a red unread badge. Clicking opens a dropdown
 * showing only Payments, Feedback, and Contact notifications.
 *
 * - Pulses briefly when new notifications arrive.
 * - Uses controlled Popover for programmatic close.
 * - z-30 stays below modals/z-40 overlays and drawers/z-50.
 */
export function AdminActionCenter() {
  const { data } = useAdminNotificationBell()
  const unread = data?.pagination?.unread ?? 0
  const [open, setOpen] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const prevUnread = useRef(0)
  const initialized = useRef(false)

  // Activate sound detection
  useAdminNotificationSound()

  // Trigger brief pulse animation only when NEW notifications arrive at runtime
  useEffect(() => {
    if (!initialized.current) {
      // Suppress pulse on initial mount — only pulse for runtime arrivals
      prevUnread.current = unread
      initialized.current = true
      return
    }
    if (unread > 0 && unread > prevUnread.current) {
      setIsNew(true)
      const timer = setTimeout(() => setIsNew(false), 2000)
      prevUnread.current = unread
      return () => clearTimeout(timer)
    }
    prevUnread.current = unread
  }, [unread])

  return (
    <div className="fixed top-4 right-4 z-30">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-full',
              'bg-card border shadow-lg hover:shadow-xl',
              'text-muted-foreground hover:text-foreground',
              'transition-all duration-200',
              isNew && 'animate-notify-ring'
            )}
            aria-label={`অ্যাডমিন অ্যাকশন সেন্টার${unread > 0 ? ` — ${unread}টি অপঠিত` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span
                className={cn(
                  'absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center',
                  'rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white',
                  'leading-none shadow-sm ring-2 ring-background'
                )}
              >
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={12}
          className="w-auto p-0 overflow-hidden rounded-xl shadow-xl border"
        >
          <NotificationDropdownContent onClose={() => setOpen(false)} />
        </PopoverContent>
      </Popover>
    </div>
  )
}