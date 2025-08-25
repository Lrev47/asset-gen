'use client'

import React from 'react'
import { 
  LayoutDashboard, 
  FileText, 
  Image, 
  MessageSquare, 
  BarChart3, 
  Settings 
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import OverviewTab from './tabs/OverviewTab'
import FieldsTab from './tabs/FieldsTab'
import MediaTab from './tabs/MediaTab'
import PromptsTab from './tabs/PromptsTab'
import AnalyticsTab from './tabs/AnalyticsTab'
import SettingsTab from './tabs/SettingsTab'
import type { ProjectWithFullDetails, ProjectMetrics, RecentActivity } from '@/app/actions/project-detail'

interface ProjectTabsProps {
  project: ProjectWithFullDetails
  metrics: ProjectMetrics
  recentActivity: RecentActivity[]
  defaultTab?: string
}

export default function ProjectTabs({
  project,
  metrics,
  recentActivity,
  defaultTab = 'overview'
}: ProjectTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="overview" className="flex items-center space-x-2">
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        <TabsTrigger value="fields" className="flex items-center space-x-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Fields</span>
          <span className="ml-1 px-1.5 py-0.5 bg-muted/50 rounded text-xs">
            {project._count.fields}
          </span>
        </TabsTrigger>
        <TabsTrigger value="media" className="flex items-center space-x-2">
          <Image className="h-4 w-4" />
          <span className="hidden sm:inline">Media</span>
          <span className="ml-1 px-1.5 py-0.5 bg-muted/50 rounded text-xs">
            {project._count.media}
          </span>
        </TabsTrigger>
        <TabsTrigger value="prompts" className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Prompts</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Analytics</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <OverviewTab 
          project={project}
          metrics={metrics}
          recentActivity={recentActivity}
        />
      </TabsContent>

      <TabsContent value="fields" className="space-y-6">
        <FieldsTab 
          project={project}
          fields={project.fields}
        />
      </TabsContent>

      <TabsContent value="media" className="space-y-6">
        <MediaTab 
          project={project}
          media={project.media}
          fields={project.fields}
        />
      </TabsContent>

      <TabsContent value="prompts" className="space-y-6">
        <PromptsTab 
          project={project}
        />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <AnalyticsTab 
          project={project}
          metrics={metrics}
        />
      </TabsContent>

      <TabsContent value="settings" className="space-y-6">
        <SettingsTab 
          project={project}
        />
      </TabsContent>
    </Tabs>
  )
}