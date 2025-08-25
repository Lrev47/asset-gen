'use client'

import React from 'react'
import { 
  Calendar, 
  Clock,
  User,
  TrendingUp,
  Activity,
  Image as ImageIcon,
  FileText,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import type { ProjectWithFullDetails, ProjectMetrics, RecentActivity } from '@/app/actions/project-detail'

interface OverviewTabProps {
  project: ProjectWithFullDetails
  metrics: ProjectMetrics
  recentActivity: RecentActivity[]
}

export default function OverviewTab({
  project,
  metrics,
  recentActivity
}: OverviewTabProps) {
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'field_created':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'media_added':
        return <ImageIcon className="h-4 w-4 text-green-500" />
      case 'generation_completed':
        return <Zap className="h-4 w-4 text-purple-500" />
      case 'project_updated':
        return <Activity className="h-4 w-4 text-orange-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getActivityBadgeVariant = (type: RecentActivity['type']) => {
    switch (type) {
      case 'field_created':
        return 'default'
      case 'media_added':
        return 'success'
      case 'generation_completed':
        return 'info'
      case 'project_updated':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  const completionRate = metrics.totalFields > 0 
    ? (metrics.completedFields / metrics.totalFields) * 100
    : 0

  const successRate = metrics.totalGenerations > 0
    ? (metrics.successfulGenerations / metrics.totalGenerations) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedFields} of {metrics.totalFields} fields completed
            </p>
            <div className="mt-2 w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.successfulGenerations} successful generations
            </p>
            <div className="mt-2 w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingGenerations}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.failedGenerations} failed jobs
            </p>
            <div className="mt-2 flex space-x-1">
              <div className="flex-1 bg-secondary rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full w-full" />
              </div>
              {metrics.failedGenerations > 0 && (
                <div className="w-4 bg-red-500 rounded-full h-2" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5" />
              <span>Recent Media</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.media.length > 0 ? (
              <div className="space-y-3">
                {project.media.slice(0, 5).map((media) => (
                  <div key={media.id} className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
                      <img
                        src={media.url}
                        alt={media.name}
                        className="w-full h-full object-cover rounded-lg"
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{media.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {media.type} • {formatRelativeTime(media.createdAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {media.format}
                    </Badge>
                  </div>
                ))}
                {project.media.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    And {project.media.length - 5} more media files...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No media files yet</p>
                <p className="text-xs">Media will appear here as you add them</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={getActivityBadgeVariant(activity.type) as any} 
                          className="text-xs"
                        >
                          {activity.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                      {activity.userName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          by {activity.userName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs">Project activity will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Owner</label>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm">{project.user.name || project.user.email}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{formatRelativeTime(project.createdAt)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <Badge variant="outline">{project.type}</Badge>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Badge variant={project.status === 'active' ? 'success' : project.status === 'completed' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
            </div>
          </div>

          {project.description && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {project.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}