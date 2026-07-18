'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, Sparkles, X, BookOpen, GraduationCap, FileQuestion } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouterStore } from '@/store/router'
import { useSiteConfig } from '@/hooks/use-metadata'

// Fallback suggestions used when DB config is not available yet
const FALLBACK_SUGGESTIONS = [
  'উচ্চতর গণিত',
  'পদার্থবিজ্ঞান',
  'রসায়ন',
  'জীববিজ্ঞান',
  'বাংলা',
  'ইংরেজি',
]

const SUGGESTION_ICONS = [BookOpen, GraduationCap, FileQuestion, BookOpen, GraduationCap, FileQuestion]
const SUGGESTION_TYPES: Array<'subject' | 'exam'> = ['subject', 'subject', 'subject', 'subject', 'subject', 'exam']

interface SearchBarProps {
  className?: string
  expanded?: boolean
  onExpandChange?: (expanded: boolean) => void
}

export default function SearchBar({ className, expanded: controlledExpanded, onExpandChange }: SearchBarProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useRouterStore((s) => s.navigate)

  // DB-driven search suggestions via SiteConfig
  const { config } = useSiteConfig()

  const suggestions = useMemo(() => {
    const rawLabels = (config?.searchSuggestions?.length ? config.searchSuggestions : FALLBACK_SUGGESTIONS)
    return rawLabels.map((label, idx) => ({
      label,
      type: SUGGESTION_TYPES[idx % SUGGESTION_TYPES.length],
      icon: SUGGESTION_ICONS[idx % SUGGESTION_ICONS.length],
    }))
  }, [config?.searchSuggestions])

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded
  const setIsExpanded = onExpandChange || setInternalExpanded

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
        setIsExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setIsExpanded])

  const handleFocus = () => {
    setShowSuggestions(true)
    setIsExpanded(true)
  }

  const handleSuggestionClick = (label: string) => {
    setQuery(label)
    setShowSuggestions(false)
    navigate('search', { searchQuery: label })
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const filteredSuggestions = suggestions.filter((s) =>
    s.label.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <div
        className={`glass rounded-xl flex items-center gap-2 px-3 h-10 border border-transparent focus-within:border-edu-primary/30 transition-all duration-200 ${
          isExpanded ? 'w-full' : 'w-auto'
        }`}
      >
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          ref={inputRef}
          placeholder="কোর্স, অধ্যায় খুঁজুন..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-0 p-0 h-auto text-sm placeholder:text-muted-foreground/60"
        />
        {query && (
          <button
            onClick={handleClear}
            className="shrink-0 p-1.5 rounded-full hover:bg-muted active:bg-muted/80 transition-colors"
            aria-label="সার্চ মুছুন"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
        <Sparkles className="w-4 h-4 text-edu-premium shrink-0" />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (query.length > 0 || true) && (
        <div
          className="absolute top-full left-0 right-0 mt-2 glass rounded-xl border border-edu-glass-border shadow-xl overflow-hidden z-50 animate-fade-in"
          style={{ animationDuration: '0.15s' }}
        >
          <div className="p-2">
            {query.length === 0 && (
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-edu-premium" />
                জনপ্রিয় অনুসন্ধান
              </div>
            )}
            {(query.length > 0 ? filteredSuggestions : suggestions).map((suggestion, idx) => {
              const Icon = suggestion.icon
              return (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion.label)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent/50 active:bg-accent/70 transition-colors text-left min-h-[44px]"
                >
                  <div className="w-7 h-7 rounded-lg bg-edu-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-edu-primary" />
                  </div>
                  <span className="text-foreground">{suggestion.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground capitalize">
                    {suggestion.type === 'subject' ? 'বিষয়' : 'পরীক্ষা'}
                  </span>
                </button>
              )
            })}
            {query.length > 0 && filteredSuggestions.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                কোনো ফলাফল পাওয়া যায়নি
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
