'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  BarChart3, 
  Plus, 
  FolderPlus, 
  Image, 
  Sparkles, 
  Database,
  Settings,
  Users,
  TrendingUp,
  Activity,
  Clock,
  ArrowRight,
  Zap,
  CreditCard,
  Play
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

import { 
  getDashboardStats, 
  getRecentProjects, 
  getRecentActivity, 
  getResourceUsage,
  type DashboardStats,
  type RecentProject,
  type ActivityItem,
  type ResourceUsage
} from '@/app/actions/dashboard'

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsResult, projectsResult, activityResult, usageResult] = await Promise.all([
        getDashboardStats(),
        getRecentProjects(5),
        getRecentActivity(8),
        getResourceUsage()
      ])

      if (statsResult.success) setStats(statsResult.data!)
      if (projectsResult.success) setRecentProjects(projectsResult.data!)
      if (activityResult.success) setRecentActivity(activityResult.data!)
      if (usageResult.success) setResourceUsage(usageResult.data!)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted/30 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted/30 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-muted/30 rounded-lg"></div>
            <div className="h-80 bg-muted/30 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'project_created': return <FolderPlus className="h-4 w-4" />
      case 'media_generated': return <Sparkles className="h-4 w-4" />
      case 'media_uploaded': return <Image className="h-4 w-4" />
      case 'generation_completed': return <Zap className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'project_created': return 'bg-blue-500/10 text-blue-500'
      case 'media_generated': return 'bg-purple-500/10 text-purple-500'
      case 'media_uploaded': return 'bg-green-500/10 text-green-500'
      case 'generation_completed': return 'bg-orange-500/10 text-orange-500'
      default: return 'bg-gray-500/10 text-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back to MediaForge
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/projects/new">
                <Button className="h-9">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Link href="/projects/new">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <FolderPlus className="h-6 w-6" />
                  <span className="text-sm">New Project</span>
                </Button>
              </Link>
              
              <Link href="/generate">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Sparkles className="h-6 w-6" />
                  <span className="text-sm">Generate</span>
                </Button>
              </Link>
              
              <Link href="/media">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Image className="h-6 w-6" />
                  <span className="text-sm">Media</span>
                </Button>
              </Link>
              
              <Link href="/models">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Database className="h-6 w-6" />
                  <span className="text-sm">Models</span>
                </Button>
              </Link>
              
              <Link href="/analytics">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm">Analytics</span>
                </Button>
              </Link>
              
              <Link href="/settings">
                <Button variant="outline" className="w-full h-20 flex flex-col space-y-2">
                  <Settings className="h-6 w-6" />
                  <span className="text-sm">Settings</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <FolderPlus className="h-5 w-5 mr-2" />
                  Recent Projects
                </CardTitle>
                <CardDescription>Your latest work</CardDescription>
              </div>
              <Link href="/projects">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No projects yet</p>
                  <Link href="/projects/new">
                    <Button size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-1" />
                      Create Project
                    </Button>
                  </Link>
                </div>
              ) : (
                recentProjects.map(project => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        {project.previewImage ? (
                          <img 
                            src={project.previewImage} 
                            alt={project.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <FolderPlus className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{project.name}</h4>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">{project.type}</Badge>
                          <span>•</span>
                          <span>{project.mediaCount} media</span>
                          <span>•</span>
                          <span>{project.fieldsCount} fields</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium">{activity.title}</h4>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {activity.projectId && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <Link href={`/projects/${activity.projectId}`}>
                                <span className="text-xs text-primary hover:underline">
                                  {activity.projectName}
                                </span>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resource Usage */}
        {resourceUsage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Resource Usage
              </CardTitle>
              <CardDescription>Current month usage and limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Generations</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {resourceUsage.generationsThisMonth}/{resourceUsage.generationsLimit}
                    </span>
                  </div>
                  <Progress value={(resourceUsage.generationsThisMonth / resourceUsage.generationsLimit) * 100} />
                </div>


                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Cost This Month</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ${resourceUsage.costThisMonth.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {resourceUsage.apiCallsThisMonth} API calls
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}