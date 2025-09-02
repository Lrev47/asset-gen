'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Grid, 
  List, 
  Search, 
  Filter,
  ArrowLeft,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import FieldCard from './FieldCard'
import BulkOperationsBar from './BulkOperationsBar'
import type { ProjectWithFullDetails } from '@/app/actions/project-detail'
import type { FieldWithDetails } from '@/app/actions/fields'
import {
  bulkDeleteFields,
  bulkDuplicateFields,
  bulkGenerateFields,
  deleteField,
  duplicateField
} from '@/app/actions/fields'

interface FieldManagementDashboardProps {
  project: ProjectWithFullDetails
  fields: FieldWithDetails[]
}

type ViewMode = 'grid' | 'list'
type SortOption = 'name' | 'created' | 'updated' | 'priority' | 'status'
type FilterOption = 'all' | 'complete' | 'pending' | 'generating'

export default function FieldManagementDashboard({
  project,
  fields: initialFields
}: FieldManagementDashboardProps) {
  const [fields, setFields] = useState<FieldWithDetails[]>(initialFields)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('created')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)

  // Filter and sort fields
  const filteredAndSortedFields = useMemo(() => {
    let result = fields.filter(field => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          field.name.toLowerCase().includes(query) ||
          field.type.toLowerCase().includes(query) ||
          field.description?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Status filter
      if (filterBy !== 'all') {
        const hasActiveGenerations = field.generations.some(g => 
          g.status === 'pending' || g.status === 'processing'
        )
        const isComplete = field._count.media > 0
        
        switch (filterBy) {
          case 'complete':
            if (!isComplete) return false
            break
          case 'pending':
            if (isComplete || hasActiveGenerations) return false
            break
          case 'generating':
            if (!hasActiveGenerations) return false
            break
        }
      }

      return true
    })

    // Sort fields
    result.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'created':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'updated':
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
        case 'priority':
          aValue = (a.settings as any)?.priority || 1
          bValue = (b.settings as any)?.priority || 1
          break
        case 'status':
          // Sort by completion status
          aValue = a._count.media > 0 ? 3 : 
                   a.generations.some(g => g.status === 'pending' || g.status === 'processing') ? 2 : 1
          bValue = b._count.media > 0 ? 3 : 
                   b.generations.some(g => g.status === 'pending' || g.status === 'processing') ? 2 : 1
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [fields, searchQuery, sortBy, sortOrder, filterBy])

  // Selection handlers
  const handleSelectField = (fieldId: string) => {
    const newSelection = new Set(selectedFields)
    if (newSelection.has(fieldId)) {
      newSelection.delete(fieldId)
    } else {
      newSelection.add(fieldId)
    }
    setSelectedFields(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedFields.size === filteredAndSortedFields.length) {
      setSelectedFields(new Set())
    } else {
      setSelectedFields(new Set(filteredAndSortedFields.map(f => f.id)))
    }
  }

  const handleClearSelection = () => {
    setSelectedFields(new Set())
  }

  // Field operations
  const handleDeleteField = async (fieldId: string) => {
    setIsProcessing(true)
    try {
      const result = await deleteField(fieldId)
      if (result.success) {
        setFields(fields.filter(f => f.id !== fieldId))
        setSelectedFields(new Set(Array.from(selectedFields).filter(id => id !== fieldId)))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDuplicateField = async (fieldId: string) => {
    setIsProcessing(true)
    try {
      const result = await duplicateField(fieldId)
      if (result.field) {
        // Refresh the page to get the updated field list
        window.location.reload()
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateField = async (fieldId: string) => {
    setIsProcessing(true)
    try {
      await bulkGenerateFields([fieldId], {
        userId: 'user-demo', // TODO: Get actual user ID from session
        prompt: 'Generate content based on field requirements and specifications',
        batchSize: 1,
        priority: 1
      })
      // Refresh to show updated generation status
      window.location.reload()
    } finally {
      setIsProcessing(false)
    }
  }

  // Bulk operations
  const handleBulkGenerate = async () => {
    setIsProcessing(true)
    try {
      await bulkGenerateFields(Array.from(selectedFields), {
        userId: 'user-demo', // TODO: Get actual user ID from session
        prompt: 'Generate high-quality content based on field requirements',
        batchSize: 1,
        priority: 2
      })
      setSelectedFields(new Set())
      window.location.reload()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkDuplicate = async () => {
    setIsProcessing(true)
    try {
      await bulkDuplicateFields(Array.from(selectedFields))
      setSelectedFields(new Set())
      window.location.reload()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    setIsProcessing(true)
    try {
      const result = await bulkDeleteFields(Array.from(selectedFields))
      if (result.success) {
        setFields(fields.filter(f => !selectedFields.has(f.id)))
        setSelectedFields(new Set())
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddField = () => {
    // TODO: Navigate to add field page instead of modal
    console.log('Add Field clicked - will implement page navigation')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/projects" className="hover:text-foreground transition-colors">
            Projects
          </Link>
          <span>/</span>
          <Link href={`/projects/${project.id}`} className="hover:text-foreground transition-colors">
            {project.name}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Field Management</span>
        </div>

        {/* Title and Back Button */}
        <div className="flex items-center space-x-4">
          <Link 
            href={`/projects/${project.id}`}
            className="p-1 hover:bg-muted/50 rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Field Management</h1>
            <p className="text-muted-foreground">
              Manage content requirements and generation for {project.name}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="generating">Generating</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [sort, order] = value.split('-')
            setSortBy(sort as SortOption)
            setSortOrder(order as 'asc' | 'desc')
          }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="created-desc">Newest</SelectItem>
              <SelectItem value="created-asc">Oldest</SelectItem>
              <SelectItem value="priority-desc">High Priority</SelectItem>
              <SelectItem value="status-desc">By Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-card p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-7 px-2"
            >
              <Grid className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-7 px-2"
            >
              <List className="h-3 w-3" />
            </Button>
          </div>

          {/* Add Field */}
          <Button onClick={handleAddField}>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span>
            {filteredAndSortedFields.length} of {fields.length} fields
          </span>
          {selectedFields.size > 0 && (
            <Badge variant="outline">
              {selectedFields.size} selected
            </Badge>
          )}
        </div>

        {filteredAndSortedFields.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedFields.size === filteredAndSortedFields.length ? 'Deselect All' : 'Select All'}
          </Button>
        )}
      </div>

      {/* Fields Grid/List */}
      {filteredAndSortedFields.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredAndSortedFields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              isSelected={selectedFields.has(field.id)}
              onSelect={handleSelectField}
              onEdit={(fieldId) => {
                // TODO: Open edit modal or navigate to edit page
                console.log('Edit field:', fieldId)
              }}
              onDelete={handleDeleteField}
              onDuplicate={handleDuplicateField}
              onGenerate={handleGenerateField}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Filter className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || filterBy !== 'all' ? 'No fields match your filters' : 'No fields yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterBy !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first field to start defining content requirements.'
              }
            </p>
            {!searchQuery && filterBy === 'all' && (
              <Button onClick={handleAddField}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Field
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Bulk Operations Bar */}
      <BulkOperationsBar
        selectedCount={selectedFields.size}
        onClearSelection={handleClearSelection}
        onBulkGenerate={handleBulkGenerate}
        onBulkDuplicate={handleBulkDuplicate}
        onBulkDelete={handleBulkDelete}
        isProcessing={isProcessing}
      />

    </div>
  )
}