'use client'

import { useState, useEffect } from 'react'
import { Search, X, ChevronDown, SlidersHorizontal, BookOpen, Layers } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import type { SubjectOption, ClassOption } from './types'

interface SearchFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: string
  onStatusFilterChange: (v: string) => void
  classFilter: string
  onClassFilterChange: (v: string) => void
  subjectFilter: string
  onSubjectFilterChange: (v: string) => void
  typeFilter: string
  onTypeFilterChange: (v: string) => void
  classes: ClassOption[]
  subjects: SubjectOption[]
  total: number
  viewMode: 'table' | 'grid'
  onViewModeChange: (v: 'table' | 'grid') => void
  selectedIds: Set<string>
  onClearSelection: () => void
  onAdd: () => void
  children?: React.ReactNode
}

export default function SearchFilters({
  search, onSearchChange, statusFilter, onStatusFilterChange,
  classFilter, onClassFilterChange, subjectFilter, onSubjectFilterChange,
  typeFilter, onTypeFilterChange, classes, subjects, total, viewMode, onViewModeChange,
  selectedIds, onClearSelection, onAdd, children,
}: SearchFiltersProps) {
  const [openClass, setOpenClass] = useState(false)
  const [openSubject, setOpenSubject] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  const filteredSubjects = classFilter ? subjects.filter(s => s.classId === classFilter) : subjects
  const activeFilters = [statusFilter, classFilter, subjectFilter, typeFilter, search].filter(Boolean).length - (search ? 1 : 0)

  const resetFilters = () => {
    onSearchChange('')
    onStatusFilterChange('all')
    onClassFilterChange('')
    onSubjectFilterChange('')
    onTypeFilterChange('')
    setDateRange({})
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="কোর্স খুঁজুন..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9 h-10"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-10">
                <SlidersHorizontal className="h-4 w-4" />
                ফিল্টার
                {activeFilters > 0 && (
                  <span className="bg-primary text-primary-foreground h-5 w-5 rounded-full text-[10px] flex items-center justify-center font-bold">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">ফিল্টার</p>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={resetFilters}>
                    রিসেট
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">স্ট্যাটাস</label>
                  <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">সব</SelectItem>
                      <SelectItem value="draft">ড্রাফট</SelectItem>
                      <SelectItem value="published">পাবলিশড</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">শ্রেণি</label>
                  <Popover open={openClass} onOpenChange={setOpenClass}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 text-sm">
                        {classFilter
                          ? classes.find(c => c.id === classFilter)?.name || '—'
                          : 'সব শ্রেণি'}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="শ্রেণি খুঁজুন..." />
                        <CommandList>
                          <CommandEmpty>কোনো শ্রেণি নেই</CommandEmpty>
                          <CommandGroup>
                            {classes.map(c => (
                              <CommandItem key={c.id} value={c.name} onSelect={() => {
                                onClassFilterChange(c.id)
                                onSubjectFilterChange('')
                                setOpenClass(false)
                              }}>
                                {c.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">বিষয়</label>
                  <Popover open={openSubject} onOpenChange={setOpenSubject}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between h-9 text-sm"
                        disabled={!classFilter}
                      >
                        {subjectFilter
                          ? subjects.find(s => s.id === subjectFilter)?.name || '—'
                          : classFilter ? 'বিষয় নির্বাচন' : 'প্রথম শ্রেণি নির্বাচন করুন'}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="বিষয় খুঁজুন..." />
                        <CommandList>
                          <CommandEmpty>কোনো বিষয় নেই</CommandEmpty>
                          <CommandGroup>
                            {filteredSubjects.map(s => (
                              <CommandItem key={s.id} value={s.name} onSelect={() => {
                                onSubjectFilterChange(s.id)
                                setOpenSubject(false)
                              }}>
                                {s.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">কাঠামো</label>
                  <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">সব</SelectItem>
                      <SelectItem value="structured">স্ট্রাকচার্ড</SelectItem>
                      <SelectItem value="recorded">রেকর্ডেড</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">তারিখ পরিসর</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-9 text-sm">
                        {dateRange.from
                          ? dateRange.to
                            ? `${dateRange.from.toLocaleDateString('bn-BD')} — ${dateRange.to.toLocaleDateString('bn-BD')}`
                            : dateRange.from.toLocaleDateString('bn-BD')
                          : 'তারিখ নির্বাচন করুন'}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                        onSelect={r => setDateRange({ from: r?.from, to: r?.to })}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button className="w-full" size="sm" onClick={() => setIsFilterOpen(false)}>
                  {activeFilters > 0 ? `${activeFilters}টি ফিল্টার অ্যাপ্লাই` : 'অ্যাপ্লাই করুন'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center rounded-lg border p-0.5">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewModeChange('table')}
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => onViewModeChange('grid')}
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-destructive h-9" onClick={onClearSelection}>
                <X className="h-3.5 w-3.5" />
                {selectedIds.size}টি বাদ দিন
              </Button>
            )}
            <Button onClick={onAdd} className="gap-1.5 h-10">
              <Plus className="h-4 w-4" />
              নতুন কোর্স
            </Button>
          </div>
        </div>
      </div>

      {activeFilters > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">অ্যাক্টিভ ফিল্টার:</span>
          {statusFilter !== 'all' && (
            <FilterChip label={`স্ট্যাটাস: ${{ draft: 'ড্রাফট', published: 'পাবলিশড' }[statusFilter] || statusFilter}`} onClear={() => onStatusFilterChange('all')} />
          )}
          {classFilter && (
            <FilterChip label={`শ্রেণি: ${classes.find(c => c.id === classFilter)?.name}`} onClear={() => { onClassFilterChange(''); onSubjectFilterChange('') }} />
          )}
          {subjectFilter && (
            <FilterChip label={`বিষয়: ${subjects.find(s => s.id === subjectFilter)?.name}`} onClear={() => onSubjectFilterChange('')} />
          )}
          {typeFilter !== 'all' && (
            <FilterChip label={`কাঠামো: ${{ structured: 'স্ট্রাকচার্ড', recorded: 'রেকর্ডেড' }[typeFilter]}`} onClear={() => onTypeFilterChange('all')} />
          )}
          <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={resetFilters}>
            সব রিসেট
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        মোট <span className="font-semibold text-foreground">{total}</span>টি কোর্স
        {selectedIds.size > 0 && <span className="ml-2 text-primary">• {selectedIds.size}টি নির্বাচিত</span>}
      </p>
    </div>
  )
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs pl-2.5 pr-1 py-0.5">
      {label}
      <button onClick={onClear} className="rounded-full p-0.5 hover:bg-primary/20">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

