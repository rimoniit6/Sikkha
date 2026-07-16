'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { useRouterStore } from '@/store/router'

interface AlertCounts {
  payments: { pending: number }
  feedback: { pending: number }
}

interface AdminAlertContextType {
  payments: { pending: number }
  feedback: { pending: number }
  isNewPayment: boolean
  isNewFeedback: boolean
  acknowledgePayment: () => void
  acknowledgeFeedback: () => void
}

const AdminAlertContext = createContext<AdminAlertContextType | null>(null)

export function AdminAlertProvider({ children }: { children: React.ReactNode }) {
  const navigate = useRouterStore((s) => s.navigate)
  const [current, setCurrent] = useState<AlertCounts>({ payments: { pending: 0 }, feedback: { pending: 0 } })
  const lastSeen = useRef({ payments: 0, feedback: 0 })
  const previous = useRef({ payments: 0, feedback: 0 })
  const initialLoad = useRef(true)
  const [isNewPayment, setIsNewPayment] = useState(false)
  const [isNewFeedback, setIsNewFeedback] = useState(false)

  const { data } = useQuery<AlertCounts>({
    queryKey: ['admin-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/admin/alerts')
      if (!res.ok) throw new Error('Failed to fetch alerts')
      const json = await res.json()
      return { payments: json.data.payments, feedback: json.data.feedback }
    },
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!data) return
    setCurrent(data)

    if (initialLoad.current) {
      previous.current = { payments: data.payments.pending, feedback: data.feedback.pending }
      lastSeen.current = { payments: data.payments.pending, feedback: data.feedback.pending }
      initialLoad.current = false
      return
    }

    if (data.payments.pending > previous.current.payments && data.payments.pending > lastSeen.current.payments) {
      setIsNewPayment(true)
      toast({
        title: 'নতুন পেমেন্ট',
        description: 'নতুন পেমেন্ট জমা পড়েছে',
        onClick: () => navigate('admin-payments'),
      })
    }

    if (data.feedback.pending > previous.current.feedback && data.feedback.pending > lastSeen.current.feedback) {
      setIsNewFeedback(true)
      toast({
        title: 'নতুন ফিডব্যাক',
        description: 'নতুন ফিডব্যাক জমা পড়েছে',
        onClick: () => navigate('admin-feedback'),
      })
    }

    previous.current = { payments: data.payments.pending, feedback: data.feedback.pending }
  }, [data, navigate])

  const acknowledgePayment = useCallback(() => {
    lastSeen.current.payments = current.payments.pending
    setIsNewPayment(false)
  }, [current.payments.pending])

  const acknowledgeFeedback = useCallback(() => {
    lastSeen.current.feedback = current.feedback.pending
    setIsNewFeedback(false)
  }, [current.feedback.pending])

  return (
    <AdminAlertContext.Provider
      value={{
        payments: current.payments,
        feedback: current.feedback,
        isNewPayment,
        isNewFeedback,
        acknowledgePayment,
        acknowledgeFeedback,
      }}
    >
      {children}
    </AdminAlertContext.Provider>
  )
}

export function useAdminAlerts() {
  const ctx = useContext(AdminAlertContext)
  if (!ctx) throw new Error('useAdminAlerts must be used within AdminAlertProvider')
  return ctx
}
