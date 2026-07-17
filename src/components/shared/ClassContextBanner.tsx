'use client'

import { useState } from 'react'
import { GraduationCap, ChevronDown, Check, Globe } from 'lucide-react'
import { useLearningPreference } from '@/providers/LearningPreferenceProvider'
import { useHierarchyMetadata } from '@/hooks/use-hierarchy-metadata'

export default function ClassContextBanner() {
  const { learningMode, classLevel, setPreference } = useLearningPreference()
  const { classLevelLabels, classOptions } = useHierarchyMetadata()
  const [open, setOpen] = useState(false)

  if (learningMode !== 'CLASS_BASED' || !classLevel) return null

  const currentLabel = classLevelLabels[classLevel] || classLevel

  return (
    <div className="relative bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span className="font-medium">বর্তমান শ্রেণি:</span>
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center gap-1 font-semibold hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors"
            >
              {currentLabel}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <button
            onClick={() => setPreference('GLOBAL')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Globe className="h-3 w-3" />
            সব ক্লাস দেখুন
          </button>
        </div>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-4 sm:left-6 lg:left-8 top-full z-50 mt-1 bg-background border border-border rounded-xl shadow-xl py-1 min-w-[200px]">
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">শ্রেণি পরিবর্তন করুন</div>
            {classOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setPreference('CLASS_BASED', opt.value); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  classLevel === opt.value
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-medium'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <GraduationCap className="h-4 w-4 shrink-0" />
                {opt.label}
                {classLevel === opt.value && <Check className="h-4 w-4 ml-auto text-emerald-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
