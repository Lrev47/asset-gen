'use client'

import Link from 'next/link'
import { 
  ArrowLeft, 
  Settings, 
  Download, 
  Play,
  Grid,
  FileText,
  BarChart3,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'
import type { WorkspaceMode } from './FieldDetailLayout'

interface FieldHeaderProps {
  field: FieldWithFullDetails
  mode: WorkspaceMode
  onModeChange: (mode: WorkspaceMode) => void
}

export default function FieldHeader({ field, mode, onModeChange }: FieldHeaderProps) {
  const modeButtons = [
    { id: 'generate' as const, label: 'Generate', icon: Play },
    { id: 'gallery' as const, label: 'Gallery', icon: Grid },
    { id: 'prompts' as const, label: 'Prompts', icon: FileText },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="border-b bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Back Button */}
          <Link
            href={`/projects/${field.projectId}/fields`}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link 
              href={`/projects/${field.projectId}`}
              className="hover:text-foreground transition-colors"
            >
              {field.project.name}
            </Link>
            <span>/</span>
            <Link
              href={`/projects/${field.projectId}/fields`}
              className="hover:text-foreground transition-colors"
            >
              Fields
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{field.name}</span>
          </div>
        </div>

        {/* Center - Mode Switcher */}
        <div className="flex items-center bg-muted/30 rounded-lg p-1">
          {modeButtons.map((button) => {
            const Icon = button.icon
            return (
              <Button
                key={button.id}
                variant={mode === button.id ? 'default' : 'ghost'}
                size="sm"
                className="h-8"
                onClick={() => onModeChange(button.id)}
              >
                <Icon className="h-3 w-3 mr-2" />
                {button.label}
              </Button>
            )
          })}
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Field Stats */}
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {field.type}
            </Badge>
            <div className="text-sm text-muted-foreground">
              {field._count.media} media • {field._count.generations} generations
            </div>
          </div>

          {/* Action Buttons */}
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Field Title and Description */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{field.name}</h1>
            {field.description && (
              <p className="text-muted-foreground mt-1">{field.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              <Palette className="h-4 w-4 mr-2" />
              Start Generation
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}