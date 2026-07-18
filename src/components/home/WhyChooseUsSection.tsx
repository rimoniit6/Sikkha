'use client'

import { useEffect, useRef, useState } from 'react'
import { BookOpen, Smartphone, BarChart3, MessageCircle, Shield, Clock, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  color: string
  bg: string
}

const features: Feature[] = [
  { icon: BookOpen, title: 'মানসম্মত কন্টেন্ট', description: 'অভিজ্ঞ শিক্ষকদের দ্বারা তৈরি সম্পূর্ণ কারিকুলাম ভিত্তিক কন্টেন্ট', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  { icon: Smartphone, title: 'মোবাইল ফ্রেন্ডলি', description: 'যেকোনো ডিভাইস থেকে সহজে পড়াশোনা করুন', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/40' },
  { icon: BarChart3, title: 'মডেল টেস্ট', description: 'বোর্ড পরীক্ষার প্যাটার্ন অনুযায়ী মডেল টেস্ট দিন', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  { icon: MessageCircle, title: 'ডাউট সলভিং', description: 'সৃজনশীল প্রশ্নের বিস্তারিত সমাধান সহ গাইডলাইন', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/40' },
  { icon: Shield, title: 'পেমেন্ট সুরক্ষা', description: 'নিরাপদ পেমেন্ট গ্যারান্টি সহ রিফান্ড নীতি', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/40' },
  { icon: Clock, title: '২৪/৭ অ্যাক্সেস', description: 'যেকোনো সময় আপনার সুবিধামতো পড়াশোনা চালান', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/40' },
]

export default function WhyChooseUsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() } }, { threshold: 0.1 })
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-14 sm:py-16 bg-muted/20" aria-labelledby="why-choose-us-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <Badge variant="secondary" className="mb-3 px-3 py-1 text-sm font-medium bg-primary/10 text-primary">কেন আমরা সেরা</Badge>
          <h2 id="why-choose-us-title" className="text-2xl sm:text-3xl font-bold text-foreground">আমাদের বেছে নেওয়ার কারণ</h2>
          <p className="mt-2 text-muted-foreground text-sm max-w-xl mx-auto">আমরা শিক্ষার মান বাড়াতে প্রতিনিয়ত কাজ করে যাচ্ছি</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className={`group bg-card border border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:border-primary/30 hover:shadow-md transition-all duration-300 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-5 w-5 sm:h-5.5 sm:w-5.5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
