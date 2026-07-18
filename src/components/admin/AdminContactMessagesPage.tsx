'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare, Mail, Trash2, Eye, EyeOff, Search, RefreshCw, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  isRead: boolean
  createdAt: string
}

const toBengaliNum = (n: number) => n.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)])

const formatDateBn = (dateStr: string) => {
  const d = new Date(dateStr)
  const day = toBengaliNum(d.getDate())
  const month = toBengaliNum(d.getMonth() + 1)
  const year = toBengaliNum(d.getFullYear())
  const hours = toBengaliNum(Number(d.getHours().toString().padStart(2, '0').replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)])))
  const mins = toBengaliNum(Number(d.getMinutes().toString().padStart(2, '0').replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)])))
  return `${day}/${month}/${year} ${hours}:${mins}`
}

export default function AdminContactMessagesPage() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      const res = await fetch(`/api/admin/contact-messages?${params}`)
      if (res.ok) {
        const json = await res.json()
        setMessages(json.data || [])
        setUnreadCount(json.unreadCount || 0)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/admin/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* ignore */ }
  }

  const deleteMessage = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/contact-messages?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id))
        if (selectedId === id) setSelectedId(null)
        toast({ title: 'মুছে ফেলা হয়েছে' })
      }
    } catch {
      toast({ title: 'মুছতে সমস্যা হয়েছে', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  const selectedMessage = messages.find(m => m.id === selectedId)

  // Detail view
  if (selectedMessage) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="min-h-[44px]">
            <span className="mr-2">←</span> ফিরে যান
          </Button>
          <h2 className="font-semibold text-lg">যোগাযোগ বার্তা</h2>
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-base">{selectedMessage.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedMessage.email}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDateBn(selectedMessage.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!selectedMessage.isRead && (
                  <Button size="sm" variant="outline" onClick={() => markAsRead(selectedMessage.id)}>
                    <Eye className="size-4 mr-1" /> পড়া হয়েছে চিহ্নিত করুন
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteMessage(selectedMessage.id)}
                  disabled={deleting === selectedMessage.id}
                >
                  {deleting === selectedMessage.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </Button>
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="size-5 text-emerald-500" />
            যোগাযোগ বার্তা
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            হোমপেজের "যোগাযোগ করুন" ফরম থেকে আসা বার্তাসমূহ
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {toBengaliNum(unreadCount)}টি নতুন
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchMessages}>
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Messages list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center">
            <Mail className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">কোনো বার্তা নেই</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <Card
              key={msg.id}
              className={cn(
                'cursor-pointer hover:shadow-md transition-all border-border/50',
                !msg.isRead && 'border-l-4 border-l-emerald-500'
              )}
              onClick={() => { setSelectedId(msg.id); markAsRead(msg.id) }}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className={cn(
                  'p-2 rounded-lg shrink-0',
                  msg.isRead ? 'bg-muted' : 'bg-emerald-100 dark:bg-emerald-900/30'
                )}>
                  <Mail className={cn('size-4', msg.isRead ? 'text-muted-foreground' : 'text-emerald-600')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn('font-medium text-sm', !msg.isRead && 'font-bold')}>{msg.name}</span>
                    <span className="text-xs text-muted-foreground">{msg.email}</span>
                    {!msg.isRead && <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700">নতুন</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{msg.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{formatDateBn(msg.createdAt)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 size-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id) }}
                  disabled={deleting === msg.id}
                  aria-label="মুছে ফেলুন"
                >
                  {deleting === msg.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
