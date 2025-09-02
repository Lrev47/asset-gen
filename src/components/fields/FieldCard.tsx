'use client'

import React from 'react'
import { 
  FileText, 
  Image as ImageIcon, 
  Edit, 
  Trash2, 
  Copy, 
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime } from '@/lib/utils'
import type { FieldWithDetails } from '@/app/actions/fields'

interface FieldCardProps {
  field: FieldWithDetails
  isSelected?: boolean
  onSelect?: (fieldId: string) => void
  onEdit?: (fieldId: string) => void
  onDelete?: (fieldId: string) => void
  onDuplicate?: (fieldId: string) => void
  onGenerate?: (fieldId: string) => void
  isDragging?: boolean
}

export default function FieldCard({
  field,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onGenerate,
  isDragging = false
}: FieldCardProps) {
  const completionRate = field._count.media > 0 ? 100 : 0
  const hasActiveGenerations = field.generations.some(g => 
    g.status === 'pending' || g.status === 'processing'
  )
  
  const getStatusIcon = () => {
    if (hasActiveGenerations) {
      return <Clock className="h-4 w-4 text-orange-500" />
    }
    if (completionRate === 100) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <AlertCircle className="h-4 w-4 text-gray-400" />
  }

  const getStatusText = () => {
    if (hasActiveGenerations) return 'Generating'
    if (completionRate === 100) return 'Complete'
    return 'Pending'
  }

  const getStatusVariant = () => {
    if (hasActiveGenerations) return 'warning'
    if (completionRate === 100) return 'success'
    return 'secondary'
  }

  const requirements = field.requirements as any || {}
  const settings = field.settings as any || {}
  const priority = settings.priority || 1
  const deadline = settings.deadline ? new Date(settings.deadline) : null

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger selection if clicking on interactive elements
    if (e.target instanceof Element) {
      const isInteractive = e.target.closest('button, [role="button"], a')
      if (!isInteractive && onSelect) {
        onSelect(field.id)
      }
    }
  }

  return (
    <Card 
      className={`transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary shadow-md' : ''
      } ${isDragging ? 'opacity-50 rotate-2' : 'cursor-pointer'}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Selection Checkbox */}
            <div className="mt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect?.(field.id)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Field Icon & Info */}
            <div className="flex items-center space-x-3 flex-1">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">{field.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {field.type}
                  </Badge>
                  {priority > 1 && (
                    <Badge variant="destructive" className="text-xs">
                      High Priority
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Position {field.position}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onGenerate?.(field.id)}>
                <Play className="mr-2 h-4 w-4" />
                Generate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(field.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(field.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(field.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {field.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {field.description}
          </p>
        )}

        {/* Requirements Summary */}
        {requirements.dimensions && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Size:</span> {requirements.dimensions.width}x{requirements.dimensions.height}
            {requirements.quantity && (
              <span className="ml-2">
                <span className="font-medium">Qty:</span> {requirements.quantity}
              </span>
            )}
          </div>
        )}

        {/* Deadline */}
        {deadline && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Deadline:</span> {formatRelativeTime(deadline)}
          </div>
        )}

        {/* Status and Progress */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <Badge variant={getStatusVariant() as any} className="text-xs">
              {getStatusText()}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {completionRate}% complete
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              completionRate === 100 ? 'bg-green-500' : 
              hasActiveGenerations ? 'bg-orange-500' : 'bg-primary'
            }`}
            style={{ width: `${completionRate}%` }}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <ImageIcon className="h-3 w-3" />
              <span>{field._count.media}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Play className="h-3 w-3" />
              <span>{field._count.generations}</span>
            </div>
          </div>
          
          <span>{formatRelativeTime(field.updatedAt)}</span>
        </div>

        {/* Media Previews */}
        {field.media.length > 0 && (
          <div className="flex space-x-1 pt-2">
            {field.media.slice(0, 4).map((media) => (
              <div
                key={media.id}
                className="w-10 h-10 rounded bg-muted/30 flex items-center justify-center overflow-hidden"
                title={media.name}
              >
                <img
                  src={media.url}
                  alt={media.name}
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 16 4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path></svg>';
                    }
                  }}
                />
              </div>
            ))}
            {field.media.length > 4 && (
              <div className="w-10 h-10 rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                +{field.media.length - 4}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onGenerate?.(field.id)}
            disabled={hasActiveGenerations}
          >
            <Play className="h-3 w-3 mr-1" />
            {hasActiveGenerations ? 'Generating...' : 'Generate'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(field.id)}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}