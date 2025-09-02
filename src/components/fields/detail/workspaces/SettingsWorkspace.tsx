'use client'

import { useState } from 'react'
import { Save, Trash2, Settings2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'

interface SettingsWorkspaceProps {
  field: FieldWithFullDetails
}

export default function SettingsWorkspace({ field }: SettingsWorkspaceProps) {
  const [name, setName] = useState(field.name)
  const [description, setDescription] = useState(field.description || '')
  const [type, setType] = useState(field.type)
  const [position, setPosition] = useState(field.position.toString())
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // TODO: Implement save functionality
    console.log('Saving field settings:', { name, description, type, position })
    
    setTimeout(() => {
      setIsSaving(false)
    }, 1000)
  }

  const handleDelete = async () => {
    // TODO: Implement delete functionality
    console.log('Deleting field:', field.id)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Field Settings</h2>
          <p className="text-muted-foreground">
            Configure field properties and behavior
          </p>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Settings2 className="h-5 w-5" />
              <CardTitle>Basic Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field-name">Field Name</Label>
              <Input
                id="field-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter field name..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-description">Description</Label>
              <Textarea
                id="field-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this field is for..."
                className="min-h-[80px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field-type">Field Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gallery">Gallery</SelectItem>
                    <SelectItem value="hero">Hero Banner</SelectItem>
                    <SelectItem value="testimonials">Testimonials</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="product">Product Images</SelectItem>
                    <SelectItem value="background">Background</SelectItem>
                    <SelectItem value="icon">Icons</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-position">Position</Label>
                <Input
                  id="field-position"
                  type="number"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  min="1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Field Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Field Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{field._count.media}</div>
                <div className="text-sm text-muted-foreground">Generated Media</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{field._count.generations}</div>
                <div className="text-sm text-muted-foreground">Total Generations</div>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Created</span>
                <span className="text-muted-foreground">
                  {new Date(field.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Last Updated</span>
                <span className="text-muted-foreground">
                  {new Date(field.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Project</span>
                <Badge variant="outline">{field.project.name}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Current Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted/50 p-4 rounded-lg overflow-auto max-h-60">
              {JSON.stringify(field.requirements, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center space-x-2">
                <Trash2 className="h-4 w-4" />
                <span>Delete Field</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span>Delete Field</span>
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{field.name}"? This action cannot be undone.
                  All generated media and generation history will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete Field
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleSave} disabled={isSaving} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}