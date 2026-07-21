import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Eye, CheckCircle2, Lock, AlertCircle, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Purchase State Machine — Single Source of Truth for Purchase Badges
 *
 * Four valid states:
 *   NOT_PURCHASED → "প্রিমিয়াম" (Amber)
 *   PENDING_APPROVAL → "অপেক্ষমাণ" (Yellow)
 *   APPROVED → "কেনা" (Emerald)
 *   REJECTED → "বাতিল" (Rose)
 *
 * Plus 'free' for non-premium content.
 */
export type PurchaseState = 'free' | 'purchased' | 'pending' | 'rejected' | 'locked' | 'NOT_PURCHASED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

// Backward-compatible alias
export type AccessStatus = PurchaseState

interface PurchaseStatusBadgeProps {
  state?: PurchaseState
  size?: 'sm' | 'default'
  className?: string
}

const badgeConfig: Record<PurchaseState, { text: string; icon: ReactNode; className: string }> = {
  free: {
    text: 'ফ্রি',
    icon: <Eye className="size-3" />,
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  },
  NOT_PURCHASED: {
    text: 'প্রিমিয়াম',
    icon: <Lock className="size-3" />,
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  },
  PENDING_APPROVAL: {
    text: 'অপেক্ষমাণ',
    icon: <AlertCircle className="size-3" />,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  APPROVED: {
    text: 'কেনা',
    icon: <CheckCircle2 className="size-3" />,
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  REJECTED: {
    text: 'বাতিল',
    icon: <XCircle className="size-3" />,
    className: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400',
  },
  purchased: {
    text: 'কেনা',
    icon: <CheckCircle2 className="size-3" />,
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  pending: {
    text: 'অপেক্ষমাণ',
    icon: <AlertCircle className="size-3" />,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  rejected: {
    text: 'বাতিল',
    icon: <XCircle className="size-3" />,
    className: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400',
  },
  locked: {
    text: 'প্রিমিয়াম',
    icon: <Lock className="size-3" />,
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  },
}

// Legacy aliases for backward compatibility
const legacyMap: Record<string, PurchaseState> = {
  locked: 'NOT_PURCHASED',
  pending: 'PENDING_APPROVAL',
  purchased: 'APPROVED',
  rejected: 'REJECTED',
}

export function PurchaseStatusBadge({ state = 'NOT_PURCHASED', size = 'default', className }: PurchaseStatusBadgeProps) {
  const resolvedState = legacyMap[state] || state
  const config = badgeConfig[resolvedState]
  return (
    <Badge className={cn(size === 'sm' ? 'text-[10px] px-1.5 gap-0.5' : 'text-xs gap-1', config.className, className)}>
      {size === 'sm' ? null : config.icon} {config.text}
    </Badge>
  )
}

export default PurchaseStatusBadge
