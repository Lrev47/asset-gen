'use client'

import React from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ProjectSortOptions } from '@/app/actions/projects'

interface ProjectSortProps {
  sortBy: ProjectSortOptions
  onSortChange: (sortBy: ProjectSortOptions) => void
  className?: string
}

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'status', label: 'Status' },
  { value: 'type', label: 'Type' },
]

export default function ProjectSort({
  sortBy,
  onSortChange,
  className = ""
}: ProjectSortProps) {
  const handleFieldChange = (field: string) => {
    onSortChange({
      ...sortBy,
      field: field as ProjectSortOptions['field']
    })
  }

  const toggleDirection = () => {
    onSortChange({
      ...sortBy,
      direction: sortBy.direction === 'asc' ? 'desc' : 'asc'
    })
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Select value={sortBy.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        size="sm"
        onClick={toggleDirection}
        className="h-9 px-3"
        title={`Sort ${sortBy.direction === 'asc' ? 'ascending' : 'descending'}`}
      >
        {sortBy.direction === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}