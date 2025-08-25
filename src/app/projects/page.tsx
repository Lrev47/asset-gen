'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grid, List, Download, Archive, Trash2, MoreHorizontal, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import SearchBar from '@/components/projects/SearchBar'
import ProjectFilters from '@/components/projects/ProjectFilters'
import ProjectSort from '@/components/projects/ProjectSort'
import ProjectGrid from '@/components/projects/ProjectGrid'
import ProjectList from '@/components/projects/ProjectList'
import { getProjects, archiveProjects, deleteProjects, duplicateProject, type ProjectWithRelations, type ProjectFilters as ProjectFiltersType, type ProjectSortOptions } from '@/app/actions/projects'

type ViewType = 'grid' | 'list'

export default function ProjectsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [projects, setProjects] = useState<ProjectWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ProjectFiltersType>({})
  const [sortBy, setSortBy] = useState<ProjectSortOptions>({ field: 'updatedAt', direction: 'desc' })
  const [viewType, setViewType] = useState<ViewType>('grid')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [projectTypes, setProjectTypes] = useState<string[]>([])

  // Load projects on initial render and when dependencies change
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const result = await getProjects({ 
        search: searchQuery, 
        filters, 
        sortBy 
      })
      
      setProjects(result.projects)
      
      // Extract unique project types for filter dropdown
      const types = Array.from(new Set(result.projects.map(p => p.type)))
      setProjectTypes(types)
    } catch (error) {
      console.error('Failed to load projects:', error)
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter and search projects locally for immediate feedback
  const filteredProjects = useMemo(() => {
    let filtered = [...projects]

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(query) ||
        (project.description && project.description.toLowerCase().includes(query)) ||
        project.type.toLowerCase().includes(query)
      )
    }

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(project => project.status === filters.status)
    }
    
    if (filters.type) {
      filtered = filtered.filter(project => project.type === filters.type)
    }

    if (filters.dateRange) {
      const { from, to } = filters.dateRange
      filtered = filtered.filter(project => {
        const updatedAt = new Date(project.updatedAt)
        return updatedAt >= from && updatedAt <= to
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { field, direction } = sortBy
      let aVal: any = a[field as keyof ProjectWithRelations]
      let bVal: any = b[field as keyof ProjectWithRelations]

      // Handle date sorting
      if (field === 'createdAt' || field === 'updatedAt') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      }

      // Handle string sorting
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [projects, searchQuery, filters, sortBy])

  // Selection handlers
  const handleSelectProject = (projectId: string, selected: boolean) => {
    setSelectedProjects(prev => 
      selected 
        ? [...prev, projectId]
        : prev.filter(id => id !== projectId)
    )
  }

  const handleSelectAll = (selected: boolean) => {
    setSelectedProjects(selected ? filteredProjects.map(p => p.id) : [])
  }

  // Project actions
  const handleEditProject = (project: ProjectWithRelations) => {
    router.push(`/projects/${project.id}/edit`)
  }

  const handleDuplicateProject = async (project: ProjectWithRelations) => {
    try {
      const result = await duplicateProject(project.id)
      if (result.success && result.data) {
        // Need to fetch the duplicated project with relations for proper typing
        await loadProjects()
        toast({
          title: "Success",
          description: `Project "${project.name}" has been duplicated.`,
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to duplicate project:', error)
      toast({
        title: "Error", 
        description: "Failed to duplicate project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleArchiveProject = async (project: ProjectWithRelations) => {
    try {
      await archiveProjects([project.id])
      setProjects(prev => prev.map(p => 
        p.id === project.id ? { ...p, status: 'archived' as const } : p
      ))
      toast({
        title: "Success",
        description: `Project "${project.name}" has been archived.`,
      })
    } catch (error) {
      console.error('Failed to archive project:', error)
      toast({
        title: "Error",
        description: "Failed to archive project. Please try again.", 
        variant: "destructive",
      })
    }
  }

  const handleDeleteProject = async (project: ProjectWithRelations) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteProjects([project.id])
      setProjects(prev => prev.filter(p => p.id !== project.id))
      setSelectedProjects(prev => prev.filter(id => id !== project.id))
      toast({
        title: "Success",
        description: `Project "${project.name}" has been deleted.`,
      })
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Bulk operations
  const handleBulkArchive = async () => {
    if (selectedProjects.length === 0) return

    try {
      await archiveProjects(selectedProjects)
      setProjects(prev => prev.map(p => 
        selectedProjects.includes(p.id) ? { ...p, status: 'archived' as const } : p
      ))
      setSelectedProjects([])
      toast({
        title: "Success",
        description: `${selectedProjects.length} project(s) have been archived.`,
      })
    } catch (error) {
      console.error('Failed to archive projects:', error)
      toast({
        title: "Error",
        description: "Failed to archive projects. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProjects.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedProjects.length} project(s)? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteProjects(selectedProjects)
      setProjects(prev => prev.filter(p => !selectedProjects.includes(p.id)))
      setSelectedProjects([])
      toast({
        title: "Success",
        description: `${selectedProjects.length} project(s) have been deleted.`,
      })
    } catch (error) {
      console.error('Failed to delete projects:', error)
      toast({
        title: "Error",
        description: "Failed to delete projects. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-8 bg-muted/30 rounded w-48"></div>
            <div className="h-10 bg-muted/30 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted/30 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">
            Manage your projects and assets ({filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''})
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-card p-1">
            <Button
              variant={viewType === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('grid')}
              className="h-8 px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewType === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('list')}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => router.push('/projects/new')} className="h-9">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search projects by name, description, or type..."
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <ProjectFilters
            filters={filters}
            onFiltersChange={setFilters}
            projectTypes={projectTypes}
          />
          
          <ProjectSort
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProjects.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <div className="flex items-center space-x-4">
            <Checkbox
              checked={selectedProjects.length === filteredProjects.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedProjects.length} of {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedProjects([])}>
              Clear Selection
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archive ({selectedProjects.length})
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedProjects.length})
            </Button>
          </div>
        </div>
      )}

      {/* Projects Display */}
      {viewType === 'grid' ? (
        <ProjectGrid
          projects={filteredProjects}
          selectedProjects={selectedProjects}
          onSelectProject={handleSelectProject}
          onEditProject={handleEditProject}
          onDuplicateProject={handleDuplicateProject}
          onArchiveProject={handleArchiveProject}
          onDeleteProject={handleDeleteProject}
        />
      ) : (
        <ProjectList
          projects={filteredProjects}
          selectedProjects={selectedProjects}
          onSelectProject={handleSelectProject}
          onEditProject={handleEditProject}
          onDuplicateProject={handleDuplicateProject}
          onArchiveProject={handleArchiveProject}
          onDeleteProject={handleDeleteProject}
        />
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {searchQuery || Object.keys(filters).length > 0 ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-4">
            {searchQuery || Object.keys(filters).length > 0 
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Get started by creating your first project to organize your assets and generate content.'
            }
          </p>
          {!searchQuery && Object.keys(filters).length === 0 && (
            <Button onClick={() => router.push('/projects/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          )}
        </div>
      )}
    </div>
  )
}