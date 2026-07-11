'use client'

import { useEffect, useRef, useState } from 'react'
import { BookOpen, Smartphone, BarChart3, MessageCircle, Shield, Clock, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: BookOpen,
    title: 'মানসম্মত কন্টেন্ট',
    description: 'অভিজ্ঞ শিক্ষকদের দ্বারা তৈরি সম্পূর্ণ কারিকুলাম ভিত্তিক কন্টেন্ট',
  },
  {
    icon: Smartphone,
    title: 'মোবাইল ফ্রেন্ডলি',
    description: 'যেকোনো ডিভাইস থেকে সহজে পড়াশোনা করুন',
  },
  {
    icon: BarChart3,
    title: 'মডেল টেস্ট',
    description: 'বোর্ড পরীক্ষার প্যাটার্ন অনুযায়ী মডেল টেস্ট দিন',
  },
  {
    icon: MessageCircle,
    title: 'ডাউট সলভিং',
    description: 'সৃজনশীল প্রশ্নের বিস্তারিত সমাধান সহ গাইডলাইন',
  },
  {
    icon: Shield,
    title: 'পেমেন্ট সুরক্ষা',
    description: 'নিরাপদ পেমেন্ট গ্যারান্টি সহ রিফান্ড নীতি',
  },
  {
    icon: Clock,
    title: '২৪/৭ অ্যাক্সেস',
    description: 'যেকোনো সময় আপনার সুবিধামতো পড়াশোনা চালান',
  },
]

export default function WhyChooseUsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/20 py-16 md:py-24"
      aria-labelledby="why-choose-us-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge
            variant="secondary"
            className="mb-4 px-4 py-1.5 text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          >
            কেন আমরা সেরা
          </Badge>
          <h2
            id="why-choose-us-title"
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground"
          >
            আমাদের বেছে নেওয়ার কারণ
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            আমরা শিক্ষার মান বাড়াতে প্রতিনিয়ত কাজ করে যাচ্ছি
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className={`
                  card-glow
                  group relative rounded-2xl border bg-card p-5 md:p-6
                  shadow-sm
                  transition-all duration-300 ease-out
                  hover:shadow-xl hover:-translate-y-1
                  ${isVisible ? 'animate-bounce-in-up' : 'opacity-0'}
                `}
                style={{
                  animationDelay: isVisible ? `${index * 0.1}s` : '0s',
                }}
              >
                {/* Icon Container */}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6 text-white" strokeWidth={2} />
                </div>

                {/* Content */}
                <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}