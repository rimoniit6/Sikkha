'use client'

import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouterStore } from '@/store/router'

export default function CTASection() {
  const navigate = useRouterStore((s) => s.navigate)

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 py-16 md:py-24" aria-label="Call to action">
      {/* Decorative floating circles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-2xl animate-float-1" />
        <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-white/10 blur-xl animate-float-2" />
        <div className="absolute bottom-10 left-1/4 h-48 w-48 rounded-full bg-white/5 blur-2xl animate-float-3" />
        <div className="absolute -bottom-16 right-1/3 h-56 w-56 rounded-full bg-white/8 blur-2xl animate-float-4" />
        <div className="absolute top-1/2 right-1/4 h-32 w-32 rounded-full bg-white/10 blur-xl animate-float-5" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Sparkle icon */}
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <Sparkles className="h-7 w-7 text-white" />
        </div>

        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
          আজই শুরু করুন আপনার শিক্ষা যাত্রা
        </h2>

        <p className="mt-4 text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto">
          নিবন্ধন করুন এবং বিনামূল্যে কন্টেন্ট অ্যাক্সেস করুন
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={() => navigate('register')}
            className="w-full sm:w-auto bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-base px-8 py-6 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
          >
            নিবন্ধন করুন
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('class-list')}
            className="w-full sm:w-auto border-white/40 text-white hover:bg-white/15 hover:text-white font-semibold text-base px-8 py-6 rounded-xl backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]"
          >
            আরও জানুন
          </Button>
        </div>
      </div>
    </section>
  )
}