'use client'

import { Crown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PriceDisplayProps {
  price: number
  originalPrice?: number | null
  isPremium: boolean
}

export default function PriceDisplay({ price, originalPrice, isPremium }: PriceDisplayProps) {
  if (!isPremium) {
    return (
      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200">
        ফ্রি
      </Badge>
    )
  }

  const hasDiscount = originalPrice && originalPrice > price

  return (
    <Badge
      variant="secondary"
      className={cn(
        'flex items-center gap-1 font-semibold',
        hasDiscount
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : 'bg-slate-100 text-slate-700 border border-slate-200'
      )}
    >
      {hasDiscount && <Crown className="h-3 w-3" />}
      {hasDiscount && originalPrice && (
        <span className="line-through opacity-50 text-[10px] mr-0.5">৳{originalPrice}</span>
      )}
      <span>৳{price}</span>
      {hasDiscount && originalPrice && originalPrice > 0 && (
        <span className="text-[10px] bg-amber-200/60 rounded-full px-1 ml-0.5">
          -{Math.round((1 - price / originalPrice) * 100)}%
        </span>
      )}
    </Badge>
  )
}
