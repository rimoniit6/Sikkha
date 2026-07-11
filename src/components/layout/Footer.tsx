'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Youtube,
  MessageCircle,
  ExternalLink,
  Heart,
  ArrowUp,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useRouterStore, type RoutePath } from '@/store/router'
import { useSiteConfig } from '@/hooks/use-metadata'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'
import { useNavigation } from '@/hooks/use-navigation'
import { getMessages } from '@/lib/messages'
import Image from 'next/image'

export default function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigate = useRouterStore((s) => s.navigate)
  const { config } = useSiteConfig()
  const { classOptions } = useHierarchyMetadata()
  const { footerNav, loading: navLoading } = useNavigation()
  const msg = getMessages(config?.messages)

  const siteName = config?.siteName || 'শিক্ষা বাংলা'

  const classLinks = classOptions.map((c) => ({
    label: c.label,
    route: 'class-detail' as const,
    params: { classSlug: c.value },
  }))

  const contactInfo = [
    ...(config?.contactEmail ? [{ icon: Mail, label: config.contactEmail, href: `mailto:${config.contactEmail}` }] : []),
    ...(config?.contactPhone ? [{ icon: Phone, label: config.contactPhone, href: `tel:${config.contactPhone}` }] : []),
    ...(config?.contactAddress ? [{ icon: MapPin, label: config.contactAddress, href: '#' }] : []),
  ]

  const socialLinks = [
    ...(config?.facebook ? [{ icon: Facebook, label: 'Facebook', href: config.facebook, color: 'hover:bg-blue-500 hover:text-white hover:border-blue-500' }] : []),
    ...(config?.youtube ? [{ icon: Youtube, label: 'YouTube', href: config.youtube, color: 'hover:bg-red-500 hover:text-white hover:border-red-500' }] : []),
    ...(config?.telegram ? [{ icon: MessageCircle, label: 'Telegram', href: config.telegram, color: 'hover:bg-sky-500 hover:text-white hover:border-sky-500' }] : []),
  ]

  return (
    <footer className="relative bg-gradient-to-b from-muted/40 to-muted border-t">
      {/* Decorative top border gradient */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-edu-primary/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <motion.div
              className="flex items-center gap-2.5 cursor-pointer mb-5"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate('home')}
            >
              {config?.logo ? (
                <Image
                  src={config.logo}
                  alt={siteName}
                  width={42}
                  height={42}
                  className="w-10 h-10 rounded-xl object-contain"
                />
              ) : (
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-edu-primary to-edu-primary-dark text-white shadow-lg shadow-edu-primary/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-foreground leading-tight">{siteName}</h3>
                <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Education Platform</p>
              </div>
            </motion.div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-5">
              {config?.footerDescription || config?.siteDescription || 'শিক্ষার্থীদের জন্য অনলাইন শিক্ষা প্ল্যাটফর্ম।'}
            </p>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2.5">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center w-10 h-10 rounded-xl bg-background border border-border/50 text-muted-foreground transition-all duration-200 ${social.color}`}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="sr-only">{social.label}</span>
                    </motion.a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-edu-primary" />
              দ্রুত লিংক
            </h4>
            <ul className="space-y-3">
              {navLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <li key={i}>
                      <div className="h-4 w-28 rounded bg-muted/60 animate-pulse" />
                    </li>
                  ))
                : footerNav.length > 0
                  ? footerNav.map((link) => (
                      <li key={link.id}>
                        <button
                          onClick={() => navigate(link.route as RoutePath)}
                          className="text-sm text-muted-foreground hover:text-edu-primary transition-colors flex items-center gap-2 group"
                        >
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-edu-primary group-hover:w-1.5 transition-all" />
                          {link.label}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                        </button>
                      </li>
                    ))
                  : (
                      <li>
                        <p className="text-sm text-muted-foreground/60 italic">শীঘ্রই আসছে...</p>
                      </li>
                    )}
            </ul>
          </div>

          {/* Class Links */}
          <div>
            <h4 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-amber-500" />
              শ্রেণিসমূহ
            </h4>
            {classLinks.length > 0 ? (
              <ul className="space-y-3">
                {classLinks.map((link) => (
                  <li key={link.params.classSlug}>
                    <button
                      onClick={() => navigate(link.route, link.params)}
                      className="text-sm text-muted-foreground hover:text-edu-primary transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40 group-hover:bg-amber-500 group-hover:w-1.5 transition-all" />
                      {link.label}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">{msg.footerClassesSoon}</p>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-rose-500" />
              যোগাযোগ
            </h4>
            {contactInfo.length > 0 ? (
              <ul className="space-y-4">
                {contactInfo.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className="text-sm text-muted-foreground hover:text-edu-primary transition-colors flex items-start gap-2.5 group"
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 group-hover:bg-edu-primary/10 transition-colors shrink-0 mt-0.5">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-edu-primary transition-colors" />
                        </span>
                        <span className="leading-snug">{item.label}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">{msg.footerContactSoon}</p>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <Separator className="bg-border/50" />
        <div className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {currentYear} {siteName}। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <div className="flex items-center gap-5">
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-edu-primary transition-colors">
              প্রাইভেসি পলিসি
            </a>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-edu-primary transition-colors">
              শর্তাবলী
            </a>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            ভালোবাসায় তৈরি <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse-soft" /> বাংলাদেশ থেকে
          </p>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <Button
        onClick={scrollToTop}
        size="icon"
        className={`fixed bottom-24 md:bottom-8 right-6 z-40 h-11 w-11 rounded-full bg-edu-primary hover:bg-edu-primary-dark text-white shadow-lg shadow-edu-primary/25 transition-all duration-300 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="উপরে যান"
      >
        <ArrowUp className="w-4 h-4" />
      </Button>
    </footer>
  )
}