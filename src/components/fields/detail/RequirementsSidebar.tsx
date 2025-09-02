'use client'

import { useState } from 'react'
import { 
  ChevronLeft,
  ChevronRight,
  Edit3,
  Save,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'

interface RequirementsSidebarProps {
  field: FieldWithFullDetails
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export default function RequirementsSidebar({ 
  field, 
  collapsed, 
  onCollapsedChange 
}: RequirementsSidebarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedRequirements, setEditedRequirements] = useState(
    JSON.stringify(field.requirements, null, 2)
  )

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(editedRequirements)
      // TODO: Call server action to save requirements
      console.log('Saving requirements:', parsed)
      setIsEditing(false)
    } catch (error) {
      console.error('Invalid JSON:', error)
    }
  }

  const handleCancel = () => {
    setEditedRequirements(JSON.stringify(field.requirements, null, 2))
    setIsEditing(false)
  }

  if (collapsed) {
    return (
      <div className="w-12 h-full flex flex-col items-center py-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapsedChange(false)}
          className="w-8 h-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-col space-y-2">
          <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center">
            <Edit3 className="h-3 w-3 text-purple-500" />
          </div>
        </div>
      </div>
    )
  }

  const requirements = field.requirements as any || {}

  return (
    <div className="w-96 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Requirements</h2>
        <div className="flex items-center space-x-2">
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="w-8 h-8 p-0"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapsedChange(true)}
            className="w-8 h-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEditing ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Edit Requirements</CardTitle>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="w-6 h-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    className="w-6 h-6 p-0"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedRequirements}
                onChange={(e) => setEditedRequirements(e.target.value)}
                className="min-h-[300px] font-mono text-xs"
                placeholder="Enter requirements in JSON format"
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Dimensions */}
            {requirements.dimensions && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Dimensions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-mono">
                    {requirements.dimensions.width} × {requirements.dimensions.height}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">pixels</div>
                </CardContent>
              </Card>
            )}

            {/* Quantity */}
            {requirements.quantity && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quantity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{requirements.quantity}</div>
                  <div className="text-xs text-muted-foreground mt-1">assets needed</div>
                </CardContent>
              </Card>
            )}

            {/* Format */}
            {requirements.format && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Format</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="uppercase">
                    {requirements.format}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Style Guidelines */}
            {requirements.style && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Style Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {requirements.style}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Additional Properties */}
            {Object.keys(requirements).filter(key => 
              !['dimensions', 'quantity', 'format', 'style'].includes(key)
            ).map((key) => (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {typeof requirements[key] === 'object' 
                      ? JSON.stringify(requirements[key], null, 2)
                      : requirements[key]
                    }
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Field Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Field Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Priority</span>
                  <Badge variant="outline">
                    {(field.settings as any)?.priority || 1}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Position</span>
                  <Badge variant="outline">
                    {field.position}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Raw JSON Toggle */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Raw Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-auto max-h-40">
                  {JSON.stringify(field.requirements, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}