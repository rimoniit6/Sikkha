'use client'

import { useState } from 'react'
import { RotateCcw, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useRollbackVersion } from '@/hooks/admin/use-rollback'
import { useToast } from '@/hooks/use-toast'

interface RollbackConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: string
  entityId: string
  targetVersion: number
  currentVersion: number
  onSuccess?: () => void
}

export default function RollbackConfirmDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  targetVersion,
  currentVersion,
  onSuccess,
}: RollbackConfirmDialogProps) {
  const { toast } = useToast()
  const rollback = useRollbackVersion()
  const [comment, setComment] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const isConfirmValid = confirmText === 'রোলব্যাক'

  const handleRollback = async () => {
    if (!isConfirmValid) return

    try {
      const result = await rollback.mutateAsync({
        entityType,
        entityId,
        targetVersion,
        comment: comment || undefined,
      })

      toast({
        title: 'রোলব্যাক সফল',
        description: result.message,
      })

      setComment('')
      setConfirmText('')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'রোলব্যাক ব্যর্থ',
        description: error instanceof Error ? error.message : 'রোলব্যাক করতে সমস্যা হয়েছে',
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    setComment('')
    setConfirmText('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-500" />
            রোলব্যাক নিশ্চিত করুন
          </DialogTitle>
          <DialogDescription>
            এটি কন্টেন্টকে ভার্সন {targetVersion} এ রোলব্যাক করবে।
            বর্তমান ভার্সন ({currentVersion}) একটি নতুন ভার্সন হিসেবে সংরক্ষিত হবে।
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-800 dark:text-orange-200">সতর্কতা</p>
              <p className="text-orange-700 dark:text-orange-300 mt-1">
                এই কাজটি অপরিবর্তনীয়। রোলব্যাক করার পর আপনি পূর্ববর্তী অবস্থায় ফিরে যেতে পারবেন না।
              </p>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-1 block">মন্তব্য (ঐচ্ছিক)</label>
            <Textarea
              placeholder="রোলব্যাকের কারণ লিখুন..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              নিশ্চিত করতে <span className="font-mono bg-muted px-1 rounded">রোলব্যাক</span> লিখুন
            </label>
            <Input
              placeholder="রোলব্যাক"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className={confirmText && !isConfirmValid ? 'border-red-500' : ''}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={rollback.isPending}>
            বাতিল
          </Button>
          <Button
            variant="destructive"
            onClick={handleRollback}
            disabled={!isConfirmValid || rollback.isPending}
          >
            {rollback.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                রোলব্যাক হচ্ছে...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                রোলব্যাক করুন
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
