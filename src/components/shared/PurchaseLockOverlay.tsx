'use client'

import { useState } from 'react'

import { Lock, Crown, Sparkles, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PurchaseStatusBadge from './PurchaseStatusBadge'
import PurchaseOptionsModal from './PurchaseOptionsModal'

/**
 * Purchase State Machine — Single Source of Truth for Lock Overlays
 *
 * Four valid states:
 *   NOT_PURCHASED → Lock overlay with purchase button
 *   PENDING_APPROVAL → Pending overlay with disabled state
 *   APPROVED → Content with purchased badge
 *   REJECTED → Rejection overlay with repurchase button
 */
interface PurchaseLockOverlayProps {
  onUpgrade?: () => void
  title?: string
  description?: string
  purchased?: boolean
  pendingPayment?: boolean
  rejected?: boolean
  price?: number
  contentType?: string
  contentId?: string
  contentTitle?: string
  classLevel?: string
  children?: React.ReactNode
}

export default function PurchaseLockOverlay({
  onUpgrade,
  title = 'প্রিমিয়াম কন্টেন্ট',
  description = 'এই কন্টেন্টটি দেখতে পেমেন্ট করুন',
  purchased = false,
  pendingPayment = false,
  rejected = false,
  price,
  contentType,
  contentId,
  contentTitle,
  classLevel,
  children,
}: PurchaseLockOverlayProps) {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  const hasContentDetails = !!(contentType && contentId && price && price > 0)

  const handleUpgrade = () => {
    if (hasContentDetails) {
      setShowPurchaseModal(true)
    } else if (onUpgrade) {
      onUpgrade()
    }
  }

  // APPROVED — Show content with badge
  if (purchased) {
    return (
      <div className="relative">
        <div className="animate-scale-in absolute top-3 right-3 z-20">
          <PurchaseStatusBadge state="APPROVED" size="sm" className="shadow-sm" />
        </div>
        {children}
      </div>
    )
  }

  // PENDING_APPROVAL — Show waiting state
  if (pendingPayment) {
    return (
      <div className="relative rounded-xl overflow-hidden">
        <div className="premium-blur absolute inset-0 bg-gradient-to-br from-amber-50/50 to-yellow-50/50">
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,oklch(0.55_0.2_160/0.03)_10px,oklch(0.55_0.2_160/0.03)_20px)]" />
        </div>

        <div className="animate-fade-in relative glass-card flex flex-col items-center justify-center py-12 px-6 text-center min-h-[200px]">
          <div className="animate-float relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
              <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-1">পেমেন্ট অপেক্ষমাণ</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            আপনার পেমেন্ট যাচাই করা হচ্ছে। অনুমোদিত হলে কন্টেন্টটি দেখতে পারবেন।
          </p>

          <Button disabled variant="outline" className="gap-2">
            <Clock className="size-4 animate-spin" />
            যাচাই চলছে
          </Button>
        </div>
      </div>
    )
  }

  // REJECTED — Show rejection with repurchase option
  if (rejected) {
    return (
      <>
        <div className="relative rounded-xl overflow-hidden">
          <div className="premium-blur absolute inset-0 bg-gradient-to-br from-rose-50/50 to-red-50/50">
            <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,oklch(0.6_0.2_25/0.03)_10px,oklch(0.6_0.2_25/0.03)_20px)]" />
          </div>

          <div className="animate-fade-in relative glass-card flex flex-col items-center justify-center py-12 px-6 text-center min-h-[200px]">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
              </div>
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-1">পেমেন্ট বাতিল হয়েছে</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              আপনার পূর্বের পেমেন্ট অনুমোদিত হয়নি। আবার পেমেন্ট করুন।
            </p>

            <PurchaseStatusBadge state="REJECTED" className="mb-4" />

            {price && price > 0 && (
              <div className="flex items-center gap-2 mb-4 text-edu-premium">
                <Crown className="w-5 h-5" />
                <span className="text-xl font-bold">৳{price}</span>
              </div>
            )}

            <Button
              onClick={handleUpgrade}
              className="bg-edu-premium hover:bg-edu-premium/90 text-white gap-2 shadow-lg shadow-edu-premium/20"
            >
              <Crown className="w-4 h-4" />
              আবার পেমেন্ট করুন
            </Button>
          </div>
        </div>

        {hasContentDetails && (
          <PurchaseOptionsModal
            open={showPurchaseModal}
            onOpenChange={setShowPurchaseModal}
            contentType={contentType!}
            contentId={contentId!}
            contentTitle={contentTitle || title}
            contentPrice={price || 0}
            classLevel={classLevel}
          />
        )}
      </>
    )
  }

  // NOT_PURCHASED — Show lock with purchase option
  return (
    <>
      <div className="relative rounded-xl overflow-hidden">
        <div className="premium-blur absolute inset-0 bg-gradient-to-br from-edu-primary/5 to-edu-accent/5">
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,oklch(0.55_0.2_160/0.03)_10px,oklch(0.55_0.2_160/0.03)_20px)]" />
        </div>

        <div className="animate-fade-in relative glass-card flex flex-col items-center justify-center py-12 px-6 text-center min-h-[200px]">
          <div className="animate-float relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-edu-premium/10 border border-edu-premium/20 flex items-center justify-center">
              <Lock className="w-7 h-7 text-edu-premium" />
            </div>
            <div className="animate-pulse-soft absolute -top-1 -right-1">
              <Sparkles className="w-4 h-4 text-edu-premium" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>

          {price && price > 0 ? (
            <div className="flex items-center gap-2 mb-4 text-edu-premium">
              <Crown className="w-5 h-5" />
              <span className="text-xl font-bold">৳{price}</span>
            </div>
          ) : (
            <PurchaseStatusBadge state="NOT_PURCHASED" size="sm" className="mb-4" />
          )}

          <Button
            onClick={handleUpgrade}
            className="bg-edu-premium hover:bg-edu-premium/90 text-white gap-2 shadow-lg shadow-edu-premium/20"
          >
            <Crown className="w-4 h-4" />
            কিনুন
          </Button>
        </div>
      </div>

      {hasContentDetails && (
        <PurchaseOptionsModal
          open={showPurchaseModal}
          onOpenChange={setShowPurchaseModal}
          contentType={contentType!}
          contentId={contentId!}
          contentTitle={contentTitle || title}
          contentPrice={price || 0}
          classLevel={classLevel}
        />
      )}
    </>
  )
}
