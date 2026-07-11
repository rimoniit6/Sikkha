'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, TrendingUp, X, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouterStore } from '@/store/router'
import { useSiteConfig } from '@/hooks/use-metadata'

/* ─── Static popular tags ─── */
const POPULAR_TAGS = [
  'SSC গণিত',
  'HSC পদার্থবিজ্ঞান',
  'বোর্ড প্রশ্ন ২০২৪',
  'MCQ প্র্যাকটিস',
  'সৃজনশীল সমাধান',
]

/* ─── Suggestion type ─── */
interface Suggestion {
  text: string
  type?: string
}

/* ─── Debounce helper ─── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/* ─── Component ─── */
export default function QuickSearchSection() {
  const navigate = useRouterStore((s) => s.navigate)
  const { config } = useSiteConfig()

  /* Dynamic tags from site config – fall back to static ones */
  const popularTags: string[] =
    config?.searchSuggestions?.length ? config.searchSuggestions : POPULAR_TAGS

  /* Local state */
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  /* ─── Fetch suggestions ─── */
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([])
      setIsLoading(false)
      return
    }
    let cancelled = false
    async function fetchSuggestions() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        if (cancelled) return
        const items: Suggestion[] = Array.isArray(json)
          ? json.map((s: string | Suggestion) =>
              typeof s === 'string' ? { text: s } : s,
            )
          : Array.isArray(json.data)
            ? json.data.map((s: string | Suggestion) =>
                typeof s === 'string' ? { text: s } : s,
              )
            : Array.isArray(json.suggestions)
              ? json.suggestions.map((s: string | Suggestion) =>
                  typeof s === 'string' ? { text: s } : s,
                )
              : []
        setSuggestions(items)
      } catch {
        setSuggestions([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchSuggestions()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  /* Show dropdown when focused and has query or when there are suggestions */
  useEffect(() => {
    setShowDropdown(isFocused && (query.trim().length > 0 || suggestions.length > 0))
  }, [isFocused, query, suggestions])

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* ─── Navigate to search ─── */
  const goSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim()
      if (!trimmed) return
      navigate('search', { searchQuery: trimmed })
      setQuery(trimmed)
      setShowDropdown(false)
      setIsFocused(false)
      inputRef.current?.blur()
    },
    [navigate],
  )

  /* ─── Submit handler ─── */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        goSearch(suggestions[activeIndex].text)
      } else {
        goSearch(query)
      }
    },
    [query, suggestions, activeIndex, goSearch],
  )

  /* ─── Keyboard navigation ─── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || suggestions.length === 0) return
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
          break
        case 'Escape':
          setShowDropdown(false)
          setIsFocused(false)
          inputRef.current?.blur()
          break
        case 'Enter':
          if (activeIndex >= 0 && activeIndex < suggestions.length) {
            e.preventDefault()
            goSearch(suggestions[activeIndex].text)
          }
          break
      }
    },
    [showDropdown, suggestions, activeIndex, goSearch],
  )

  /* Scroll active item into view */
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return
    const activeEl = listRef.current.children[activeIndex] as HTMLElement | undefined
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  /* ─── Clear input ─── */
  const handleClear = useCallback(() => {
    setQuery('')
    setSuggestions([])
    setActiveIndex(-1)
    inputRef.current?.focus()
  }, [])

  /* ─── Tag click ─── */
  const handleTagClick = useCallback(
    (tag: string) => {
      goSearch(tag)
    },
    [goSearch],
  )

  /* ─── Suggestion click ─── */
  const handleSuggestionClick = useCallback(
    (text: string) => {
      goSearch(text)
    },
    [goSearch],
  )

  return (
    <section className="relative py-16 sm:py-20 lg:py-24" aria-label="দ্রুত অনুসন্ধান">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-8 sm:mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">
              দ্রুত অনুসন্ধান
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
            আপনি কী খুঁজছেন?
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            বিষয়, অধ্যায়, বোর্ড প্রশ্ন — যেকোনো কিছু খুঁজুন এখান থেকে
          </p>
        </div>

        {/* Search card with glass morphism */}
        <div className="animate-fade-in-up delay-150" style={{ animationDelay: '0.15s' }}>
          <div
            ref={containerRef}
            className={`
              relative rounded-2xl transition-all duration-300
              ${isFocused
                ? 'shadow-[0_0_0_2px_oklch(0.55_0.2_160),0_8px_40px_oklch(0.55_0.2_160/15%)]'
                : 'shadow-lg shadow-black/5 dark:shadow-black/20'
              }
            `}
          >
            {/* Gradient border wrapper */}
            <div
              className={`
                absolute -inset-[2px] rounded-2xl transition-opacity duration-300 -z-10
                ${isFocused
                  ? 'opacity-100 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
                  : 'opacity-0'
                }
              `}
              aria-hidden="true"
            />

            {/* Glass card */}
            <div className="glass-card p-2 sm:p-3 rounded-2xl relative">
              {/* Form */}
              <form onSubmit={handleSubmit} role="search" aria-label="সাইট অনুসন্ধান">
                <div className="relative flex items-center gap-2">
                  {/* Animated search icon */}
                  <div className="pl-3 sm:pl-4 shrink-0">
                    <Search
                      className={`
                        w-5 h-5 text-muted-foreground transition-all duration-300
                        ${isFocused ? 'text-primary scale-110' : 'scale-100'}
                      `}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Input */}
                  <Input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setActiveIndex(-1)
                    }}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="অধ্যায়, বিষয়, বোর্ড প্রশ্ন খুঁজুন..."
                    className="
                      flex-1 h-12 sm:h-14 text-base sm:text-lg
                      border-0 bg-transparent shadow-none
                      focus-visible:ring-0 focus-visible:ring-offset-0
                      placeholder:text-muted-foreground/70
                      px-0
                    "
                    aria-label="অনুসন্ধান করুন"
                    aria-expanded={showDropdown}
                    aria-controls="quick-search-dropdown"
                    aria-autocomplete="list"
                    aria-activedescendant={
                      activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined
                    }
                  />

                  {/* Clear button */}
                  {query && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={handleClear}
                      aria-label="অনুসন্ধান মুছুন"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Submit button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="
                      shrink-0 h-10 sm:h-12 px-4 sm:px-6
                      bg-primary hover:bg-primary/90 text-primary-foreground
                      rounded-xl font-semibold transition-all duration-200
                      gap-2
                    "
                    disabled={!query.trim()}
                  >
                    <span className="hidden sm:inline">অনুসন্ধান</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>

              {/* ─── Dropdown ─── */}
              {showDropdown && (
                <div
                  id="quick-search-dropdown"
                  role="listbox"
                  className="
                    mt-2 rounded-xl overflow-hidden
                    bg-card border border-border
                    shadow-lg shadow-black/5 dark:shadow-black/20
                    animate-scale-in
                  "
                >
                  {/* Loading state */}
                  {isLoading && (
                    <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>অনুসন্ধান করা হচ্ছে...</span>
                    </div>
                  )}

                  {/* Suggestions list */}
                  {!isLoading && suggestions.length > 0 && (
                    <ul
                      ref={listRef}
                      className="max-h-72 overflow-y-auto scrollbar-thin py-1"
                    >
                      {suggestions.map((suggestion, idx) => {
                        const isActive = idx === activeIndex
                        return (
                          <li
                            key={`${suggestion.text}-${idx}`}
                            id={`suggestion-${idx}`}
                            role="option"
                            aria-selected={isActive}
                            onClick={() => handleSuggestionClick(suggestion.text)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={`
                              flex items-center gap-3 px-4 py-3 cursor-pointer
                              transition-colors duration-150
                              ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground hover:bg-muted/80'
                              }
                            `}
                          >
                            <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
                            <span className="flex-1 text-sm sm:text-base truncate">
                              {suggestion.text}
                            </span>
                            {isActive && (
                              <ArrowRight className="w-4 h-4 shrink-0 text-primary animate-fade-in" />
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}

                  {/* Empty state — no results */}
                  {!isLoading && query.trim() && suggestions.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                      <Search className="w-8 h-8 opacity-40" />
                      <p className="text-sm">&ldquo;{query}&rdquo; এর জন্য কোনো সাজেশন পাওয়া যায়নি</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 mt-1"
                        onClick={() => goSearch(query)}
                      >
                        এই পদটি দিয়ে অনুসন্ধান করুন
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Popular tags ─── */}
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 mb-4 justify-center">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">জনপ্রিয় অনুসন্ধান</span>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
            {popularTags.map((tag, idx) => (
              <Badge
                key={tag}
                variant="outline"
                className="
                  cursor-pointer select-none
                  px-3 py-1.5 sm:px-4 sm:py-2
                  text-sm font-medium
                  border-border/80 text-foreground/80
                  hover:border-primary/50 hover:text-primary hover:bg-primary/5
                  active:scale-95
                  transition-all duration-200
                  rounded-full
                "
                style={{ animationDelay: `${0.35 + idx * 0.06}s` }}
                onClick={() => handleTagClick(tag)}
                role="button"
                tabIndex={0}
                aria-label={`${tag} দিয়ে অনুসন্ধান করুন`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleTagClick(tag)
                  }
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}