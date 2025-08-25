'use client'

import React from 'react'
import Link from 'next/link'
import { MoreVertical, ExternalLink, Github, Globe, FileText, Calendar, Users, Image, Settings, Archive, Copy, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime, getStatusColor, truncateText, isValidUrl } from '@/lib/utils'
import type { ProjectWithRelations } from '@/app/actions/projects'

interface ProjectListProps {
  projects: ProjectWithRelations[]
  selectedProjects?: string[]
  onSelectProject?: (projectId: string, selected: boolean) => void
  onEditProject?: (project: ProjectWithRelations) => void
  onDuplicateProject?: (project: ProjectWithRelations) => void
  onArchiveProject?: (project: ProjectWithRelations) => void
  onDeleteProject?: (project: ProjectWithRelations) => void
}

export default function ProjectList({
  projects,
  selectedProjects = [],
  onSelectProject,
  onEditProject,
  onDuplicateProject,
  onArchiveProject,
  onDeleteProject,
}: ProjectListProps) {
  const getLinkIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'github':
        return <Github className="h-3 w-3" />
      case 'website':
      case 'live':
      case 'demo':
        return <Globe className="h-3 w-3" />
      case 'figma':
      case 'design':
        return <FileText className="h-3 w-3" />
      default:
        return <ExternalLink className="h-3 w-3" />
    }
  }

  if (projects.length === 0) {
    return (
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
          No projects found
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Get started by creating your first project or adjust your search filters.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border/30">
        <div className="col-span-1"></div> {/* Checkbox column */}
        <div className="col-span-3">Project</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-4">Updated</div>
        <div className="col-span-1">Links</div>
        <div className="col-span-1"></div> {/* Actions column */}
      </div>

      {/* Project Rows */}
      {projects.map((project) => {
        const statusVariant = getStatusColor(project.status)
        const links = (project.metadata as any)?.links || {}
        const hasLinks = Object.keys(links).length > 0

        return (
          <div
            key={project.id}
            className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-accent/5 transition-colors border-b border-border/10 group"
          >
            {/* Selection Checkbox */}
            <div className="col-span-1 flex items-center">
              {onSelectProject && (
                <Checkbox
                  checked={selectedProjects.includes(project.id)}
                  onCheckedChange={(checked) => onSelectProject(project.id, checked as boolean)}
                />
              )}
            </div>

            {/* Project Info */}
            <div className="col-span-3 min-w-0">
              <Link 
                href={`/projects/${project.id}`}
                className="block hover:text-accent transition-colors"
              >
                <div className="font-medium text-foreground truncate mb-1">
                  {project.name}
                </div>
                {project.description && (
                  <div className="text-sm text-muted-foreground truncate">
                    {truncateText(project.description, 80)}
                  </div>
                )}
                <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center space-x-1">
                    <FileText className="h-3 w-3" />
                    <span>{project._count.fields}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Image className="h-3 w-3" />
                    <span>{project._count.media}</span>
                  </span>
                  {project.teamProjects.length > 0 && (
                    <span className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{project.teamProjects[0]?.team?.name}</span>
                    </span>
                  )}
                </div>
              </Link>
            </div>

            {/* Status */}
            <div className="col-span-2 flex items-center">
              <Badge variant={statusVariant as any} className="text-xs">
                {project.status}
              </Badge>
              <Badge variant="outline" className="ml-2 text-xs">
                {project.type}
              </Badge>
            </div>

            {/* Updated */}
            <div className="col-span-4 flex items-center text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {formatRelativeTime(project.updatedAt)}
            </div>

            {/* Links */}
            <div className="col-span-1 flex items-center">
              {hasLinks && (
                <div className="flex space-x-1">
                  {Object.entries(links).slice(0, 2).map(([type, url]) => (
                    isValidUrl(url as string) && (
                      <Button
                        key={type}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title={`Open ${type}`}
                        onClick={(e) => {
                          e.preventDefault()
                          window.open(url as string, '_blank')
                        }}
                      >
                        {getLinkIcon(type)}
                      </Button>
                    )
                  ))}
                  {Object.keys(links).length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{Object.keys(links).length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="col-span-1 flex items-center justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${project.id}`} className="flex items-center">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  {onEditProject && (
                    <DropdownMenuItem onClick={() => onEditProject(project)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Project
                    </DropdownMenuItem>
                  )}
                  {onDuplicateProject && (
                    <DropdownMenuItem onClick={() => onDuplicateProject(project)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onArchiveProject && project.status !== 'archived' && (
                    <DropdownMenuItem onClick={() => onArchiveProject(project)}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                  )}
                  {onDeleteProject && (
                    <DropdownMenuItem 
                      onClick={() => onDeleteProject(project)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )
      })}
    </div>
  )
}