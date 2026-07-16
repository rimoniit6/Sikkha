'use client'

import { useEffect, useRef, useState } from 'react'
import { BookOpen, GraduationCap, ArrowRight, Sparkles, Star, Loader2, Play, Users, Award, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouterStore } from '@/store/router'
import { usePublicStats, useSiteConfig } from '@/hooks/use-metadata'

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

// Canvas-based particle system for the hero background
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
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

    // Initialize particles
    const count = Math.min(60, Math.floor(canvas.offsetWidth / 20))
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

      // Draw connection lines between nearby particles
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

      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

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
  const { stats, loading } = usePublicStats()
  const { config } = useSiteConfig()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Subtle mouse parallax for floating elements
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  const heroStats = stats
    ? [
        { value: formatStatValue(stats.students), label: 'শিক্ষার্থী', icon: Users },
        { value: formatStatValue(stats.mcqs), label: 'MCQ প্রশ্ন', icon: BookOpen },
        { value: formatStatValue(stats.lectures), label: 'লেকচার', icon: Play },
        { value: formatStatValue(stats.exams), label: 'পরীক্ষা', icon: Award },
      ]
    : []

  return (
    <section className="relative min-h-[92vh] flex flex-col overflow-hidden">
      {/* Multi-layer Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-teal-600 to-emerald-800 animate-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03),transparent_70%)]" />

      {/* Particle Canvas */}
      <ParticleCanvas />

      {/* Animated floating elements with mouse parallax */}
      {floatingElements.map(({ Icon, x, y, delay, size }, i) => {
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
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center stagger-children">
            {/* Top Badge with pulse ring */}
            <div className="mb-6">
              <span className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium border border-white/20 shadow-lg shadow-black/10">
                <span className="absolute inset-0 rounded-full bg-white/5 animate-pulse-ring" />
                <span className="absolute inset-0 rounded-full bg-white/5 animate-pulse-ring-delayed" />
                <Sparkles className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{config?.heroBadge || 'বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম'}</span>
              </span>
            </div>

            {/* Main Heading with enhanced gradient */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
              {config?.heroTitle || 'বাংলাদেশের সেরা'}
              <br />
              <span className="relative inline-block mt-1">
                <span className="bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-200 bg-clip-text text-transparent animate-text-shimmer bg-[length:200%_auto]">
                  শিক্ষা প্ল্যাটফর্ম
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-yellow-300/0 via-amber-300/60 to-yellow-300/0 rounded-full" />
              </span>
            </h1>

            {/* Subtitle with typing cursor effect */}
            <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed">
              {config?.heroSubtitle || 'Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন'}
            </p>

            {/* CTA Buttons with enhanced styling */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14">
              <Button
                size="lg"
                className="group relative bg-white text-emerald-700 hover:bg-white/95 font-bold text-lg px-10 h-13 shadow-xl shadow-black/20 transition-all duration-300 hover:shadow-2xl hover:shadow-black/25 hover:scale-[1.02] active:scale-[0.97] hover-shine"
                onClick={() => navigate('class-list')}
              >
                <span className="flex items-center gap-2">
                  শিক্ষা শুরু করুন
                  <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="group border-2 border-white/30 text-white hover:bg-white/15 hover:border-white/50 hover:text-white font-bold text-lg px-10 h-13 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] hover-shine"
                onClick={() => navigate('premium')}
              >
                <span className="flex items-center gap-2">
                  প্রিমিয়াম দেখুন
                  <Sparkles className="w-5 h-5 transition-transform duration-200 group-hover:rotate-12" />
                </span>
              </Button>
            </div>

            {/* Stats with icons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 max-w-3xl mx-auto">
              {heroStats.map((stat, i) => {
                const StatIcon = stat.icon
                return (
                  <div
                    key={i}
                    className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/15 hover:bg-white/18 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 animate-scale-in cursor-default"
                    style={{ animationDelay: `${0.8 + i * 0.1}s` }}
                  >
                    <StatIcon className="w-4 h-4 text-white/50 mx-auto mb-2 transition-colors group-hover:text-amber-300" />
                    <div className="text-2xl sm:text-3xl font-bold text-white">
                      {loading ? (
                        <div role="status" aria-busy="true"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
                      ) : (
                        stat.value
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-white/70 mt-1 font-medium">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Bottom wave with double layer */}
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