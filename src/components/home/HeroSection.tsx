'use client'

import { useEffect, useRef, useState } from 'react'
import { BookOpen, GraduationCap, ArrowRight, Sparkles, Star, Play, Users, Award, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouterStore } from '@/store/router'
import { useSiteConfig } from '@/hooks/use-metadata'
import { useLearningPreference } from '@/providers/LearningPreferenceProvider'

const floatingElements = [
  { Icon: BookOpen, x: '8%', y: '18%', delay: 0, size: 28 },
  { Icon: GraduationCap, x: '88%', y: '12%', delay: 1, size: 32 },
  { Icon: Star, x: '78%', y: '72%', delay: 2, size: 24 },
  { Icon: Sparkles, x: '12%', y: '78%', delay: 3, size: 26 },
  { Icon: BookOpen, x: '92%', y: '52%', delay: 4, size: 22 },
  { Icon: Users, x: '20%', y: '45%', delay: 1.5, size: 20 },
  { Icon: Award, x: '72%', y: '25%', delay: 2.5, size: 20 },
  { Icon: Zap, x: '45%', y: '85%', delay: 3.5, size: 18 },
]

function formatStatValue(count: number): string {
  if (count === 0) return '০'
  return new Intl.NumberFormat('bn-BD').format(count) + '+'
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

// Canvas-based particle system — reduced on mobile
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    // Respect prefers-reduced-motion — skip animation entirely
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; opacityDir: number;
    }> = []

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    // Fewer particles on mobile for better performance
    const count = isMobile
      ? Math.min(20, Math.floor(canvas.offsetWidth / 40))
      : Math.min(60, Math.floor(canvas.offsetWidth / 20))
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.4 + 0.1,
        opacityDir: Math.random() > 0.5 ? 1 : -1,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.opacity += p.opacityDir * 0.003

        if (p.opacity >= 0.5) p.opacityDir = -1
        if (p.opacity <= 0.05) p.opacityDir = 1
        if (p.x < 0) p.x = canvas.offsetWidth
        if (p.x > canvas.offsetWidth) p.x = 0
        if (p.y < 0) p.y = canvas.offsetHeight
        if (p.y > canvas.offsetHeight) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
        ctx.fill()
      }

      // Connection lines — skip on mobile for performance
      if (!isMobile) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x
            const dy = particles[i].y - particles[j].y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 120) {
              ctx.beginPath()
              ctx.moveTo(particles[i].x, particles[i].y)
              ctx.lineTo(particles[j].x, particles[j].y)
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.06 * (1 - dist / 120)})`
              ctx.lineWidth = 0.5
              ctx.stroke()
            }
          }
        }
      }

      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [isMobile])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      style={{ opacity: 0.6 }}
    />
  )
}

export default function HeroSection() {
  const navigate = useRouterStore((s) => s.navigate)
  const { config } = useSiteConfig()
  const isMobile = useIsMobile()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Mouse parallax — desktop only
  useEffect(() => {
    if (isMobile) return
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMove)
  }, [isMobile])

  // ── Urgency: class-aware exam countdown ──────────────────────────
  // Priority 1: Show exam relevant to user's class context
  // Priority 2: Show nearest upcoming exam (guest visitors)
  // Priority 3: Hide if no valid exam exists
  const { classLevel } = useLearningPreference()
  const [urgency, setUrgency] = useState<{ name: string; days: number } | null>(null)

  useEffect(() => {
    const now = Date.now()
    const DAY = 86400000
    const MAX_DAYS = 180

    const exams = [
      { name: config?.homepageExam1Name, date: config?.homepageExam1Date },
      { name: config?.homepageExam2Name, date: config?.homepageExam2Date },
    ]
      .filter((e): e is { name: string; date: string } & typeof e => !!(e.name && e.date && !isNaN(new Date(e.date).getTime())))
      .map((e) => ({ ...e, days: Math.ceil((new Date(e.date!).getTime() - now) / DAY) }))

    const valid = exams.filter((e) => e.days > 0 && e.days < MAX_DAYS)
    if (valid.length === 0) { setUrgency(null); return }

    // Priority 1: Class-based selection
    const classExamMap: Record<string, string> = {
      'class-9': 'ssc', 'class-10': 'ssc', ssc: 'ssc',
      'class-11': 'hsc', 'class-12': 'hsc', hsc: 'hsc',
    }
    if (classLevel) {
      const examType = classExamMap[classLevel]
      const match = valid.find((e) => e.name.toLowerCase().includes(examType))
      if (match) { setUrgency({ name: match.name, days: match.days }); return }
    }

    // Priority 2: Nearest exam
    valid.sort((a, b) => a.days - b.days)
    setUrgency({ name: valid[0].name, days: valid[0].days })
  }, [config?.homepageExam1Date, config?.homepageExam1Name, config?.homepageExam2Date, config?.homepageExam2Name, classLevel])

  return (
    <section className={`relative ${isMobile ? 'min-h-[80vh]' : 'min-h-[92vh]'} flex flex-col overflow-hidden`}>
      {/* Multi-layer Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-teal-600 to-emerald-800 animate-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03),transparent_70%)]" />

      {/* Particle Canvas */}
      <ParticleCanvas />

      {/* Floating elements — parallax desktop only */}
      {!isMobile && floatingElements.map(({ Icon, x, y, delay, size }, i) => {
        const floatClass = `animate-float-${(i % 5) + 1}`
        const parallaxFactor = (i % 3) * 0.15 + 0.1
        return (
          <div
            key={i}
            className={`absolute text-white/15 pointer-events-none ${floatClass}`}
            style={{
              left: x,
              top: y,
              animationDelay: `${delay}s`,
              transform: `translate(${mousePos.x * parallaxFactor * -30}px, ${mousePos.y * parallaxFactor * -30}px)`,
              transition: 'transform 0.3s ease-out',
            }}
            aria-hidden="true"
          >
            <Icon size={size} />
          </div>
        )
      })}

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isMobile ? 'py-12' : 'py-16 sm:py-20'}`}>
          <div className="text-center stagger-children">
            {/* Top Badge */}
            <div className={isMobile ? 'mb-4' : 'mb-6'}>
              <span className="relative inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs sm:text-sm font-medium border border-white/20 shadow-lg shadow-black/10">
                <span className="relative z-10">{config?.heroBadge || '৮০% কনটেন্ট বিনামূল্যে'}</span>
              </span>
            </div>

            {/* Main Heading */}
            <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl'} font-extrabold text-white leading-[1.1] mb-4 sm:mb-6 tracking-tight`}>
              {config?.heroTitle || 'Class 6 থেকে HSC পর্যন্ত A+ পেতে প্রস্তুত হোন'}
            </h1>

            {/* Subtitle */}
            <p className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl'} text-white/85 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed`}>
              {config?.heroSubtitle || 'সরকারি কারিকুলাম অনুযায়ী লেকচার, প্র্যাকটিস MCQ ও বোর্ড প্রশ্ন — ৮০% কনটেন্ট বিনামূল্যে'}
            </p>

            {/* Feature Strip — Product Discovery */}
            <div className={`${isMobile ? 'flex flex-nowrap overflow-x-auto gap-3 pb-1 -mx-4 px-4 snap-x snap-mandatory no-scrollbar' : 'flex flex-wrap justify-center gap-x-4 gap-y-2'} mb-6 sm:mb-8`}>
              {['🎬 ভিডিও ক্লাস', '📝 MCQ', '📖 বোর্ড প্রশ্ন', '✍️ সৃজনশীল', '🏆 মডেল টেস্ট', '📄 PDF নোট'].map((item) => (
                <span key={item} className={`${isMobile ? 'snap-center shrink-0 text-xs' : 'text-sm'} text-white/90 whitespace-nowrap`}>{item}</span>
              ))}
            </div>

            {/* Trust Message */}
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-white/90 text-center mb-6 sm:mb-8`}>
              ১০,০০০+ শিক্ষার্থী · ৫০,০০০+ MCQ · ৮০% কনটেন্ট বিনামূল্যে
            </p>

            {/* CTA Buttons */}
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3 sm:gap-4 justify-center items-center ${isMobile ? 'mb-10' : 'mb-14'}`}>
              <Button
                size="lg"
                className={`group relative bg-white text-emerald-700 hover:bg-white/95 font-bold ${isMobile ? 'text-base w-full h-12' : 'text-lg px-10 h-13'} shadow-xl shadow-black/20 transition-all duration-300 hover:shadow-2xl hover:shadow-black/25 hover:scale-[1.02] active:scale-[0.97] hover-shine`}
                onClick={() => navigate('class-list')}
              >
                <span className="flex items-center gap-2 justify-center">
                  ফ্রি শুরু করুন
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className={`group border-2 border-white/30 text-white hover:bg-white/15 hover:border-white/50 hover:text-white font-bold ${isMobile ? 'text-base w-full h-12' : 'text-lg px-10 h-13'} bg-white/10 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] hover-shine`}
                onClick={() => navigate('board-questions')}
              >
                <span className="flex items-center gap-2 justify-center">
                  বোর্ড প্রশ্ন দেখুন
                </span>
              </Button>
            </div>

            {/* Urgency Message — class-aware exam countdown (conditional, no spacing — CTA wrapper provides margin) */}
            {urgency && (
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-white/90 text-center`}>
                {urgency.name}: {formatStatValue(urgency.days).replace('+', '')} দিন বাকি — এখনই প্রস্তুতি শুরু করুন
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full relative z-10">
          <path
            d="M0 60L48 55.7C96 51.3 192 42.7 288 40.8C384 39 480 44 576 51.2C672 58.3 768 67.7 864 65.8C960 64 1056 51 1152 46.7C1248 42.3 1344 46.7 1392 48.8L1440 51V120H0V60Z"
            className="fill-background"
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-background" />
      </div>
    </section>
  )
}
