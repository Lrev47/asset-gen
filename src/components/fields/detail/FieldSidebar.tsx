'use client'

import { 
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Image,
  FileText,
  Activity,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'
import type { WorkspaceMode } from './FieldDetailLayout'

interface FieldSidebarProps {
  field: FieldWithFullDetails
  mode: WorkspaceMode
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export default function FieldSidebar({ 
  field, 
  mode, 
  collapsed, 
  onCollapsedChange 
}: FieldSidebarProps) {
  if (collapsed) {
    return (
      <div className="w-12 h-full flex flex-col items-center py-4 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapsedChange(false)}
          className="w-8 h-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-col space-y-2">
          <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center">
            <Clock className="h-3 w-3 text-primary" />
          </div>
          <div className="w-6 h-6 bg-green-500/20 rounded flex items-center justify-center">
            <Zap className="h-3 w-3 text-green-500" />
          </div>
          <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center">
            <Image className="h-3 w-3 text-blue-500" />
          </div>
        </div>
      </div>
    )
  }

  const recentGenerations = field.generations.slice(0, 5)
  const recentMedia = field.media.slice(0, 3)

  return (
    <div className="w-80 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Navigation</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapsedChange(true)}
          className="w-8 h-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Image className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Media</span>
              </div>
              <Badge variant="secondary">{field._count.media}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm">Generations</span>
              </div>
              <Badge variant="secondary">{field._count.generations}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Active</span>
              </div>
              <Badge variant="secondary">
                {field.generations.filter(g => g.status === 'pending' || g.status === 'processing').length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Generations */}
        {recentGenerations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Generations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentGenerations.map((generation) => (
                  <div key={generation.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        generation.status === 'completed' ? 'bg-green-500' :
                        generation.status === 'processing' ? 'bg-yellow-500' :
                        generation.status === 'pending' ? 'bg-blue-500' :
                        'bg-red-500'
                      )} />
                      <span className="truncate max-w-[120px]">
                        {generation.model.name}
                      </span>
                    </div>
                    <Badge 
                      variant={generation.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {generation.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Media Previews */}
        {recentMedia.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {recentMedia.map((media) => (
                  <div
                    key={media.id}
                    className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={media.url}
                      alt={media.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full bg-muted flex items-center justify-center"><svg class="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 16 4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path></svg></div>'
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Zap className="h-4 w-4 mr-2" />
              New Generation
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Create Prompt
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Edit Requirements
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}