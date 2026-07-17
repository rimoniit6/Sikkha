'use client'

import { type LucideIcon, GraduationCap, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface ClassContext {
  className: string
  onSwitchClass?: () => void
  onBrowseAll?: () => void
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  classContext?: ClassContext
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  classContext,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Illustration-style icon */}
      <motion.div
        className="relative mb-6"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' } as const}
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50">
          <Icon className="w-10 h-10 text-muted-foreground/60" />
        </div>
        {/* Decorative dots */}
        <motion.div
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-edu-primary/20"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-edu-accent/20"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
      </motion.div>

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">{description}</p>

      {classContext && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            <GraduationCap className="h-3.5 w-3.5" />
            {classContext.className}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3">
        {actionLabel && onAction && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onAction}
              className="bg-edu-primary hover:bg-edu-primary-dark text-white"
            >
              {actionLabel}
            </Button>
          </motion.div>
        )}

        {classContext?.onSwitchClass && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={classContext.onSwitchClass}
              variant="outline"
              className="gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              শ্রেণি পরিবর্তন করুন
            </Button>
          </motion.div>
        )}

        {classContext?.onBrowseAll && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={classContext.onBrowseAll}
              variant="ghost"
              className="gap-2 text-muted-foreground"
            >
              <Globe className="h-4 w-4" />
              সব ক্লাস দেখুন
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
