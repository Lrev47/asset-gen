'use client'

import React from 'react'
import ProjectCard from './ProjectCard'
import type { ProjectWithRelations } from '@/app/actions/projects'

interface ProjectGridProps {
  projects: ProjectWithRelations[]
  selectedProjects?: string[]
  onSelectProject?: (projectId: string, selected: boolean) => void
  onEditProject?: (project: ProjectWithRelations) => void
  onDuplicateProject?: (project: ProjectWithRelations) => void
  onArchiveProject?: (project: ProjectWithRelations) => void
  onDeleteProject?: (project: ProjectWithRelations) => void
}

export default function ProjectGrid({
  projects,
  selectedProjects = [],
  onSelectProject,
  onEditProject,
  onDuplicateProject,
  onArchiveProject,
  onDeleteProject,
}: ProjectGridProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isSelected={selectedProjects.includes(project.id)}
          {...(onSelectProject && { onSelect: onSelectProject })}
          {...(onEditProject && { onEdit: onEditProject })}
          {...(onDuplicateProject && { onDuplicate: onDuplicateProject })}
          {...(onArchiveProject && { onArchive: onArchiveProject })}
          {...(onDeleteProject && { onDelete: onDeleteProject })}
        />
      ))}
    </div>
  )
}