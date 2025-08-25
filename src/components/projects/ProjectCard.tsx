'use client'

import React from 'react'
import Link from 'next/link'
import { MoreVertical, ExternalLink, Github, Globe, FileText, Calendar, Users, Image, Settings, Archive, Copy, Trash2 } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
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

interface ProjectCardProps {
  project: ProjectWithRelations
  isSelected?: boolean
  onSelect?: (projectId: string, selected: boolean) => void
  onEdit?: (project: ProjectWithRelations) => void
  onDuplicate?: (project: ProjectWithRelations) => void
  onArchive?: (project: ProjectWithRelations) => void
  onDelete?: (project: ProjectWithRelations) => void
}

export default function ProjectCard({
  project,
  isSelected = false,
  onSelect,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}: ProjectCardProps) {
  const statusVariant = getStatusColor(project.status)
  
  // Extract links from metadata
  const links = (project.metadata as any)?.links || {}
  const hasLinks = Object.keys(links).length > 0

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a, input, [role="button"]')) {
      return
    }
    // Navigate to project detail
    window.location.href = `/projects/${project.id}`
  }

  return (
    <Card className="group cursor-pointer hover:border-accent/50 transition-all duration-300 hover:shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Selection Checkbox */}
            {onSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(project.id, checked as boolean)}
                className="mt-1 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            
            {/* Project Info */}
            <div className="flex-1 min-w-0" onClick={handleCardClick}>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">
                  {project.name}
                </h3>
                <Badge variant={statusVariant as any} className="text-xs">
                  {project.status}
                </Badge>
              </div>
              
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {truncateText(project.description, 100)}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatRelativeTime(project.updatedAt)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FileText className="h-3 w-3" />
                  <span>{project._count.fields} fields</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Image className="h-3 w-3" />
                  <span>{project._count.media} media</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(project)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onArchive && project.status !== 'archived' && (
                <DropdownMenuItem onClick={() => onArchive(project)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(project)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3" onClick={handleCardClick}>
        {/* Project Type and Team */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            {project.type}
          </Badge>
          
          {project.teamProjects.length > 0 && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{project.teamProjects[0]?.team?.name}</span>
            </div>
          )}
        </div>

        {/* Media Preview */}
        {project.media.length > 0 && (
          <div className="mt-3 flex space-x-1">
            {project.media.slice(0, 3).map((media) => (
              <div
                key={media.id}
                className="w-8 h-8 rounded bg-muted/30 flex items-center justify-center overflow-hidden"
                title={media.name}
              >
                <img
                  src={media.url}
                  alt={media.name}
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    // Replace with icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const icon = document.createElement('div');
                      icon.innerHTML = '<svg class="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 16 4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path></svg>';
                      parent.appendChild(icon);
                    }
                  }}
                />
              </div>
            ))}
            {project.media.length > 3 && (
              <div className="w-8 h-8 rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                +{project.media.length - 3}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* External Links */}
      {hasLinks && (
        <CardFooter className="pt-0">
          <div className="flex space-x-2 w-full">
            {Object.entries(links).map(([type, url]) => (
              isValidUrl(url as string) && (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs flex items-center space-x-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(url as string, '_blank')
                  }}
                >
                  {getLinkIcon(type)}
                  <span className="capitalize">{type}</span>
                </Button>
              )
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}