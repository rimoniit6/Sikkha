'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useAdminNotificationBell } from './use-admin-notification-bell'

const STORAGE_KEY = 'admin-notification-sound-enabled'

// ─── Web Audio chime generator ───

let _audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new AudioContext()
  }
  return _audioCtx
}

/**
 * Plays a short, pleasant two-tone chime using the Web Audio API.
 * No external sound files needed.
 */
function playNotificationChime() {
  try {
    const ctx = getAudioContext()

    // Resume if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime

    // First tone (C5) — 523.25 Hz
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.value = 523.25
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.15)

    // Second tone (E5) — 659.25 Hz, starts slightly after first
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.value = 659.25
    gain2.gain.setValueAtTime(0.001, now)
    gain2.gain.setValueAtTime(0.25, now + 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now)
    osc2.stop(now + 0.35)
  } catch {
    // Web Audio API not available or blocked — silently ignore
  }
}

// ─── Browser Notification API ───

function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return Promise.resolve(false)

  if (Notification.permission === 'granted') {
    return Promise.resolve(true)
  }

  if (Notification.permission === 'denied') {
    return Promise.resolve(false)
  }

  return Notification.requestPermission().then((permission) => permission === 'granted')
}

function showSystemNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'admin-notification',
      silent: true, // We play our own sound
    })
  } catch {
    // Notification API error — silently ignore
  }
}

// ─── Hook ───

/**
 * Hook that detects new admin notifications and plays a sound +
 * optionally shows a browser system notification.
 *
 * - Sound is generated via Web Audio API (no external files).
 * - Sound is opt-in via a toggle persisted in localStorage.
 * - System notifications are shown when tab is backgrounded (opt-in).
 * - Respects browser autoplay policy (needs first user interaction).
 *
 * Returns `{ soundEnabled, setSoundEnabled }` for UI toggles.
 */
// ─── Module-level unread tracker ───
// Shared across all hook instances (sidebar + dropdown) to prevent duplicate sounds.
let _previousUnread = -1

/**
 * Hook that detects new admin notifications and plays a sound +
 * optionally shows a browser system notification.
 *
 * - Sound is generated via Web Audio API (no external files).
 * - Sound is opt-in via a toggle persisted in localStorage.
 * - System notifications are shown when tab is backgrounded (opt-in).
 * - Respects browser autoplay policy (needs first user interaction).
 * - Uses a module-level unread counter to prevent duplicate sounds
 *   when multiple hook instances mount (sidebar + dropdown).
 *
 * Returns `{ soundEnabled, setSoundEnabled }` for UI toggles.
 */
export function useAdminNotificationSound(): {
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
} {
  const { data } = useAdminNotificationBell()
  const tabHiddenRef = useRef(false)
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  // Track tab visibility
  useEffect(() => {
    const handleVisibility = () => {
      tabHiddenRef.current = document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibility)
    tabHiddenRef.current = document.hidden
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Detect new notifications using a shared module-level counter
  useEffect(() => {
    const unread = data?.pagination?.unread ?? 0

    // First load from any hook instance — initialize shared counter
    if (_previousUnread === -1) {
      _previousUnread = unread
      return
    }

    // New notification arrived (checked against SHARED counter)
    if (unread > _previousUnread) {
      const added = unread - _previousUnread

      if (soundEnabled) {
        playNotificationChime()
      }

      // System notification if tab is hidden (user is on another tab)
      if (tabHiddenRef.current && data?.data?.length) {
        const latest = data.data[0]
        showSystemNotification(
          latest.title || 'নতুন নোটিফিকেশন',
          `${latest.message || ''}${added > 1 ? ` (${added}টি নতুন)` : ''}`
        )
      }
    }

    _previousUnread = unread
  }, [data, soundEnabled])

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled)
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')

    // Request notification permission when enabling sound for the first time
    if (enabled) {
      requestNotificationPermission()
    }
  }, [])

  return { soundEnabled, setSoundEnabled }
}
