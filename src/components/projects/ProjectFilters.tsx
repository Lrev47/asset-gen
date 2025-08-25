'use client'

import React from 'react'
import { CalendarDays, Filter, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { ProjectFilters } from '@/app/actions/projects'

interface ProjectFiltersProps {
  filters: ProjectFilters
  onFiltersChange: (filters: ProjectFilters) => void
  projectTypes: string[]
  className?: string
}

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
  { value: 'draft', label: 'Draft' },
]

const dateRangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
]

export default function ProjectFilters({
  filters,
  onFiltersChange,
  projectTypes,
  className = ""
}: ProjectFiltersProps) {
  const hasActiveFilters = !!(filters.status || filters.type || filters.dateRange || filters.teamMember)
  
  const clearFilters = () => {
    onFiltersChange({})
  }

  const updateFilter = (key: keyof ProjectFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    })
  }

  const getDateRange = (option: string) => {
    const now = new Date()
    const start = new Date()
    
    switch (option) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        return { from: start, to: now }
      case 'week':
        start.setDate(now.getDate() - 7)
        return { from: start, to: now }
      case 'month':
        start.setMonth(now.getMonth() - 1)
        return { from: start, to: now }
      case 'quarter':
        start.setMonth(now.getMonth() - 3)
        return { from: start, to: now }
      case 'year':
        start.setFullYear(now.getFullYear() - 1)
        return { from: start, to: now }
      default:
        return undefined
    }
  }

  const handleDateRangeChange = (value: string) => {
    const dateRange = getDateRange(value)
    updateFilter('dateRange', dateRange)
  }

  // Get current date range option for display
  const getCurrentDateRangeOption = () => {
    if (!filters.dateRange) return ''
    
    const { from, to } = filters.dateRange
    const diffInDays = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays <= 1) return 'today'
    if (diffInDays <= 7) return 'week'
    if (diffInDays <= 31) return 'month'
    if (diffInDays <= 93) return 'quarter'
    return 'year'
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Status Filter */}
      <Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Type Filter */}
      <Select value={filters.type || ''} onValueChange={(value) => updateFilter('type', value)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {projectTypes.map((type) => (
            <SelectItem key={type} value={type}>
              <span className="capitalize">{type}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range Filter */}
      <Select value={getCurrentDateRangeOption()} onValueChange={handleDateRangeChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Date Range" />
        </SelectTrigger>
        <SelectContent>
          {dateRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-3"
          >
            <RotateCcw className="h-3 w-3 mr-2" />
            Clear
          </Button>
          
          {/* Active Filters Display */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex space-x-1">
              {filters.status && (
                <Badge 
                  variant="secondary" 
                  className="text-xs cursor-pointer hover:bg-destructive/20"
                  onClick={() => updateFilter('status', '')}
                >
                  Status: {filters.status}
                  <span className="ml-1">×</span>
                </Badge>
              )}
              {filters.type && (
                <Badge 
                  variant="secondary" 
                  className="text-xs cursor-pointer hover:bg-destructive/20 capitalize"
                  onClick={() => updateFilter('type', '')}
                >
                  Type: {filters.type}
                  <span className="ml-1">×</span>
                </Badge>
              )}
              {filters.dateRange && (
                <Badge 
                  variant="secondary" 
                  className="text-xs cursor-pointer hover:bg-destructive/20"
                  onClick={() => updateFilter('dateRange', undefined)}
                >
                  <CalendarDays className="h-3 w-3 mr-1" />
                  {dateRangeOptions.find(opt => opt.value === getCurrentDateRangeOption())?.label}
                  <span className="ml-1">×</span>
                </Badge>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}