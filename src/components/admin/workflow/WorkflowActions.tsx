'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Send, CheckCircle, XCircle, Archive, RotateCcw, Calendar, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { WorkflowStatus } from './WorkflowBadge'

// Allowed actions per current status
const ALLOWED_ACTIONS: Record<WorkflowStatus, { action: string; label: string; icon: React.ElementType; variant: string; requiresComment: boolean }[]> = {
  DRAFT: [
    { action: 'submit_for_review', label: 'পর্যালোচনায় পাঠান', icon: Send, variant: 'default', requiresComment: false },
  ],
  IN_REVIEW: [
    { action: 'approve', label: 'অনুমোদন', icon: CheckCircle, variant: 'default', requiresComment: false },
    { action: 'reject', label: 'প্রত্যাখ্যান', icon: XCircle, variant: 'destructive', requiresComment: true },
  ],
  APPROVED: [
    { action: 'publish', label: 'প্রকাশ করুন', icon: Send, variant: 'default', requiresComment: false },
    { action: 'schedule', label: 'নির্ধারণ করুন', icon: Calendar, variant: 'outline', requiresComment: false },
  ],
  REJECTED: [
    { action: 'reset_to_draft', label: 'খসড়ায় ফেরান', icon: RotateCcw, variant: 'outline', requiresComment: false },
  ],
  SCHEDULED: [
    { action: 'publish', label: 'এখনই প্রকাশ করুন', icon: Send, variant: 'default', requiresComment: false },
    { action: 'reset_to_draft', label: 'নির্ধারণ বাতিল', icon: RotateCcw, variant: 'outline', requiresComment: false },
  ],
  PUBLISHED: [
    { action: 'archive', label: 'আর্কাইভ', icon: Archive, variant: 'destructive', requiresComment: false },
  ],
  ARCHIVED: [
    { action: 'reset_to_draft', label: 'পুনরুদ্ধার', icon: RotateCcw, variant: 'outline', requiresComment: false },
  ],
}

interface WorkflowActionsProps {
  entityType: string
  entityId: string
  currentStatus: WorkflowStatus | string
  version: number
  onTransition?: () => void
}

export function WorkflowActions({ entityType, entityId, currentStatus, version, onTransition }: WorkflowActionsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [comment, setComment] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const allowedActions = ALLOWED_ACTIONS[(currentStatus as WorkflowStatus)] || []

  if (allowedActions.length === 0) return null

  const executeTransition = async (action: string, commentText?: string, scheduledAt?: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          action,
          comment: commentText || undefined,
          expectedVersion: version,
          scheduledAt: scheduledAt || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.conflict) {
          toast({
            title: 'সংঘাত',
            description: 'এই কন্টেন্টটি অন্য একজন প্রশাসক দ্বারা পরিবর্তন করা হয়েছে। রিফ্রেশ করে আবার চেষ্টা করুন।',
            variant: 'destructive',
          })
          onTransition?.() // Trigger refresh
        } else {
          toast({
            title: 'ত্রুটি',
            description: data.error || 'কাজ সম্পন্ন হয়নি',
            variant: 'destructive',
          })
        }
        return
      }

      toast({
        title: 'সফল',
        description: `স্ট্যাটাস পরিবর্তন করা হয়েছে`,
      })
      onTransition?.()
    } catch {
      toast({
        title: 'ত্রুটি',
        description: 'নেটওয়ার্ক সমস্যা',
        variant: 'destructive',
      })
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  const handleAction = (action: string, requiresComment: boolean) => {
    if (action === 'schedule') {
      setSelectedAction(action)
      setScheduleDialogOpen(true)
      return
    }
    if (requiresComment) {
      setSelectedAction(action)
      setComment('')
      setCommentDialogOpen(true)
      return
    }
    executeTransition(action)
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowedActions.map(({ action, label, icon: Icon, variant, requiresComment }) => (
          <Button
            key={action}
            variant={variant as 'default' | 'destructive' | 'outline'}
            size="sm"
            disabled={loading}
            onClick={() => handleAction(action, requiresComment)}
            aria-label={label}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Icon className="h-4 w-4 mr-1" />}
            {label}
          </Button>
        ))}
      </div>

      {/* Comment Dialog (for reject) */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAction === 'reject' ? 'প্রত্যাখ্যানের কারণ' : 'মন্তব্য'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction === 'reject' ? 'অনুগ্রহ করে প্রত্যাখ্যানের কারণ লিখুন' : 'আপনার মন্তব্য লিখুন'}
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="মন্তব্য লিখুন..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>বাতিল</Button>
            <Button
              disabled={selectedAction === 'reject' && !comment.trim()}
              onClick={() => {
                setCommentDialogOpen(false)
                executeTransition(selectedAction, comment)
                setComment('')
              }}
            >
              {selectedAction === 'reject' ? 'প্রত্যাখ্যান করুন' : 'নিশ্চিত করুন'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>প্রকাশের সময় নির্ধারণ</DialogTitle>
            <DialogDescription>কখন এই কন্টেন্ট প্রকাশ করতে চান?</DialogDescription>
          </DialogHeader>
          <Input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>বাতিল</Button>
            <Button
              disabled={!scheduleDate}
              onClick={() => {
                setScheduleDialogOpen(false)
                executeTransition('schedule', undefined, scheduleDate)
                setScheduleDate('')
              }}
            >
              নির্ধারণ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
