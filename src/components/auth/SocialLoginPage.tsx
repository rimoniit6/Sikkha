'use client'

import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore, useAuthLoading } from '@/store/auth'
import { useRouterStore } from '@/store/router'
import { GraduationCap,Lock,Mail,UserPlus,LogIn } from 'lucide-react'
import { useState } from 'react'

export default function SocialLoginPage() {
  const isLoading = useAuthLoading()
  const setLoading = useAuthStore((s) => s.setLoading)
  const login = useAuthStore((s) => s.login)
  const navigate = useRouterStore((s) => s.navigate)
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('ইমেইল ও পাসওয়ার্ড দিন')
      return
    }
    if (isRegister && password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
      return
    }
    setLoading(true)
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const body: Record<string, string> = { email, password }
      if (isRegister) body.name = name

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'ব্যর্থ হয়েছে')
        return
      }
      if (data.success && data.data?.user) {
        login(data.data.user)
        const role = data.data.user.role
        if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
          navigate('admin-dashboard')
        } else {
          navigate('home')
        }
      }
    } catch {
      setError('সার্ভার সমস্যা। পরে আবার চেষ্টা করুন।')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-background dark:via-background dark:to-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-900/20 rounded-full blur-3xl" />
      </div>

      <div
        className="relative z-10 w-full max-w-md animate-fade-in"
      >
        <Card className="glass-card border-0 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-8 animate-fade-in-up delay-100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mb-4 shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">শিক্ষা বাংলা</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isRegister ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'আপনার অ্যাকাউন্টে লগইন করুন'}
              </p>
            </div>

            {error && (
              <div
                className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center animate-fade-in-up"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name">নাম</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="আপনার নাম"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">ইমেইল</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="পাসওয়ার্ড দিন"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isRegister ? 'রেজিস্টার হচ্ছে...' : 'লগইন হচ্ছে...'}
                    </div>
                  ) : isRegister ? (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      রেজিস্টার করুন
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      লগইন করুন
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setError('') }}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {isRegister ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন' : 'নতুন অ্যাকাউন্ট? রেজিস্টার করুন'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
