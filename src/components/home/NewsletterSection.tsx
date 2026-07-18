'use client'

import { useState, useCallback, type FormEvent } from 'react'
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useSiteConfig } from '@/hooks/use-metadata'
import { toast } from '@/hooks/use-toast'

interface FormErrors {
  name?: string
  email?: string
  message?: string
}

export default function NewsletterSection() {
  const { config } = useSiteConfig()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    if (!name.trim()) {
      newErrors.name = 'নাম আবশ্যক'
    }

    if (!email.trim()) {
      newErrors.email = 'ইমেইল আবশ্যক'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'সঠিক ইমেইল ঠিকানা দিন'
    }

    if (!message.trim()) {
      newErrors.message = 'বার্তা আবশ্যক'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, email, message])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()

      if (!validate()) return

      setIsSubmitting(true)

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
        })

        if (res.ok) {
          setIsSuccess(true)
          setName('')
          setEmail('')
          setMessage('')
          setErrors({})
          toast({
            title: 'ধন্যবাদ!',
            description: 'আপনার বার্তা পাঠানো হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।',
          })
          setTimeout(() => setIsSuccess(false), 4000)
        } else {
          const data = await res.json().catch(() => ({}))
          toast({
            title: 'ত্রুটি',
            description: data.error || 'বার্তা পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: 'ত্রুটি',
          description: 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।',
          variant: 'destructive',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [validate, name, email, message, toast]
  )

  const contactItems = [
    {
      icon: Mail,
      label: 'ইমেইল',
      value: config?.contactEmail || 'info@sikkha.com',
      href: `mailto:${config?.contactEmail || 'info@sikkha.com'}`,
    },
    {
      icon: Phone,
      label: 'ফোন',
      value: config?.contactPhone || '+৮৮০ ১৭০০-০০০০০০',
      href: `tel:${config?.contactPhone || ''}`,
    },
    {
      icon: MapPin,
      label: 'ঠিকানা',
      value: config?.contactAddress || 'ঢাকা, বাংলাদেশ',
      href: undefined,
    },
  ]

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-800 py-16 md:py-24"
      aria-label="যোগাযোগ করুন"
    >
      {/* Decorative floating circles / blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/5 blur-3xl animate-float-1" />
        <div className="absolute top-8 right-8 h-48 w-48 rounded-full bg-white/5 blur-2xl animate-float-2" />
        <div className="absolute bottom-8 left-1/4 h-56 w-56 rounded-full bg-white/5 blur-3xl animate-float-3" />
        <div className="absolute -bottom-20 right-1/3 h-64 w-64 rounded-full bg-white/5 blur-3xl animate-float-4" />
        <div className="absolute top-1/2 right-[15%] h-36 w-36 rounded-full bg-white/5 blur-2xl animate-float-5" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* ── Left column: Text & Contact Info ── */}
          <div className="animate-fade-in-up text-center lg:text-left">
            {/* Icon badge */}
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
              <MessageSquare className="h-7 w-7 text-white" />
            </div>

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
              আমাদের সাথে যোগাযোগ করুন
            </h2>

            <p className="mt-4 text-base md:text-lg text-white/80 max-w-md mx-auto lg:mx-0 leading-relaxed">
              যেকোনো প্রশ্ন, পরামর্শ বা মতামত থাকলে আমাদের সাথে যোগাযোগ করুন। আমরা শীঘ্রই আপনার বার্তার উত্তর দেব।
            </p>

            {/* Contact info items */}
            <div className="mt-8 space-y-4">
              {contactItems.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 group"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm transition-colors group-hover:bg-white/20">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-sm md:text-base text-white font-medium hover:text-white/80 transition-colors truncate block"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm md:text-base text-white font-medium truncate">
                          {item.value}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Right column: Contact Form ── */}
          <div className="animate-fade-in-up [animation-delay:150ms]">
            {isSuccess ? (
              /* ── Success State ── */
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="animate-scale-in mb-6 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full bg-white/20 animate-scale-pulse" />
                  </div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
                    <CheckCircle className="h-10 w-10 text-emerald-600" strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 animate-fade-in-up">
                  বার্তা পাঠানো হয়েছে!
                </h3>
                <p className="text-white/70 text-sm text-center max-w-xs animate-fade-in-up [animation-delay:100ms]">
                  আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব। ধন্যবাদ!
                </p>
              </div>
            ) : (
              /* ── Form ── */
              <Card className="bg-white/95 dark:bg-white/90 backdrop-blur-xl shadow-2xl shadow-black/20 border-0">
                <CardContent className="p-6 md:p-8">
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    {/* Name */}
                    <div className="space-y-2">
                      <label
                        htmlFor="contact-name"
                        className="block text-sm font-semibold text-foreground"
                      >
                        আপনার নাম <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="contact-name"
                        type="text"
                        placeholder="আপনার পূর্ণ নাম লিখুন"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value)
                          if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                        }}
                        className="h-11 rounded-lg"
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive animate-slide-up">{errors.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label
                        htmlFor="contact-email"
                        className="block text-sm font-semibold text-foreground"
                      >
                        ইমেইল <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="example@mail.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                        }}
                        className="h-11 rounded-lg"
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive animate-slide-up">{errors.email}</p>
                      )}
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <label
                        htmlFor="contact-message"
                        className="block text-sm font-semibold text-foreground"
                      >
                        বার্তা <span className="text-destructive">*</span>
                      </label>
                      <Textarea
                        id="contact-message"
                        placeholder="আপনার বার্তা এখানে লিখুন..."
                        rows={4}
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value)
                          if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }))
                        }}
                        className="resize-none rounded-lg min-h-[100px]"
                      />
                      {errors.message && (
                        <p className="text-xs text-destructive animate-slide-up">{errors.message}</p>
                      )}
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-base rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-600/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          পাঠানো হচ্ছে...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          পাঠান
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
