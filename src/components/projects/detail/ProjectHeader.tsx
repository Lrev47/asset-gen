'use client'

import React from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  ExternalLink, 
  Settings, 
  Download, 
  Archive, 
  Users, 
  Calendar,
  Activity,
  BarChart3,
  Image as ImageIcon,
  FileText,
  Zap,
  Github,
  Globe
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime, getStatusColor, isValidUrl } from '@/lib/utils'
import type { ProjectWithFullDetails, ProjectMetrics } from '@/app/actions/project-detail'

interface ProjectHeaderProps {
  project: ProjectWithFullDetails
  metrics: ProjectMetrics
  onExport: (format: 'json' | 'csv') => Promise<void>
  onArchive: () => Promise<void>
}

export default function ProjectHeader({
  project,
  metrics,
  onExport,
  onArchive
}: ProjectHeaderProps) {
  const statusVariant = getStatusColor(project.status)
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

  const completionPercentage = metrics.totalFields > 0 
    ? Math.round((metrics.completedFields / metrics.totalFields) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        {/* Left: Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <Link 
              href="/projects"
              className="p-1 hover:bg-muted/50 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground truncate">
              {project.name}
            </h1>
            <Badge variant={statusVariant as any}>
              {project.status}
            </Badge>
            <Badge variant="outline">
              {project.type}
            </Badge>
          </div>

          {project.description && (
            <p className="text-muted-foreground mb-4 max-w-2xl">
              {project.description}
            </p>
          )}

          {/* Project Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>Updated {formatRelativeTime(project.updatedAt)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>Owner: {project.user.name || project.user.email}</span>
            </div>

            {project.teamProjects.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>Team: {project.teamProjects[0]?.team.name}</span>
              </div>
            )}

            {metrics.lastActivity && (
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3" />
                <span>Active {formatRelativeTime(metrics.lastActivity)}</span>
              </div>
            )}
          </div>

          {/* External Links */}
          {hasLinks && (
            <div className="flex flex-wrap gap-2 mt-4">
              {Object.entries(links).map(([type, url]) => (
                isValidUrl(url as string) && (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => window.open(url as string, '_blank')}
                  >
                    {getLinkIcon(type)}
                    <span className="ml-1.5 capitalize">{type}</span>
                  </Button>
                )
              ))}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3">
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport('json')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('csv')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {project.status !== 'archived' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onArchive}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fields</p>
              <p className="text-2xl font-bold">{metrics.totalFields}</p>
              <p className="text-xs text-muted-foreground">
                {metrics.completedFields} completed ({completionPercentage}%)
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <ImageIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Media</p>
              <p className="text-2xl font-bold">{metrics.totalMedia}</p>
              <p className="text-xs text-muted-foreground">
                Total assets
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Generations</p>
              <p className="text-2xl font-bold">{metrics.totalGenerations}</p>
              <p className="text-xs text-muted-foreground">
                {metrics.successfulGenerations} successful
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
              <p className="text-2xl font-bold">{metrics.pendingGenerations}</p>
              <p className="text-xs text-muted-foreground">
                In progress
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}