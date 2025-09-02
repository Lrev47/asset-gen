'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PageInfo {
  name: string
  route: string
  description: string
  status: 'not-started' | 'in-progress' | 'complete'
  priority: 'high' | 'medium' | 'low'
  complexity: 'simple' | 'medium' | 'complex'
  category: string
}

const pages: PageInfo[] = [
  // Core Pages
  {
    name: 'Dashboard',
    route: '/',
    description: 'Central command center showing overview of all activity, stats cards, recent projects',
    status: 'complete',
    priority: 'high',
    complexity: 'medium',
    category: 'core'
  },
  {
    name: 'Projects List',
    route: '/projects',
    description: 'Browse and manage all projects with search, filter, and bulk actions',
    status: 'complete',
    priority: 'high',
    complexity: 'medium',
    category: 'core'
  },
  {
    name: 'Create Project',
    route: '/projects/new',
    description: 'Form to create new projects with templates and project type selection',
    status: 'complete',
    priority: 'high',
    complexity: 'simple',
    category: 'core'
  },
  {
    name: 'Project Detail',
    route: '/projects/[id]',
    description: 'Project command center with tabs for overview, fields, media, prompts, activity',
    status: 'complete',
    priority: 'high',
    complexity: 'complex',
    category: 'core'
  },
  {
    name: 'Edit Project',
    route: '/projects/[id]/edit',
    description: 'Edit project metadata, settings, and configuration',
    status: 'complete',
    priority: 'medium',
    complexity: 'simple',
    category: 'core'
  },

  // Field Management
  {
    name: 'Field Management',
    route: '/projects/[id]/fields',
    description: 'Configure project-specific fields with requirements and generation progress',
    status: 'complete',
    priority: 'high',
    complexity: 'medium',
    category: 'fields'
  },
  {
    name: 'Create Field',
    route: '/projects/[id]/fields/new',
    description: 'Create new field with type selection and requirement configuration',
    status: 'complete',
    priority: 'high',
    complexity: 'medium',
    category: 'fields'
  },
  {
    name: 'Field Detail',
    route: '/projects/[id]/fields/[fieldId]',
    description: 'View field details, media, and generation history',
    status: 'complete',
    priority: 'medium',
    complexity: 'medium',
    category: 'fields'
  },
  {
    name: 'Edit Field',
    route: '/projects/[id]/fields/[fieldId]/edit',
    description: 'Edit field requirements, settings, and configuration',
    status: 'complete',
    priority: 'medium',
    complexity: 'simple',
    category: 'fields'
  },

  // Generation Hub
  {
    name: 'Generation Hub',
    route: '/generate',
    description: 'Central location for all media generation with type selector and recent prompts',
    status: 'complete',
    priority: 'high',
    complexity: 'medium',
    category: 'generation'
  },
  {
    name: 'Image Generation',
    route: '/generate/image',
    description: 'Dedicated image generation with JSON prompt editor, preview, and batch controls',
    status: 'complete',
    priority: 'high',
    complexity: 'complex',
    category: 'generation'
  },
  {
    name: 'Video Generation',
    route: '/generate/video',
    description: 'Video generation interface with timeline, clips, and animation controls',
    status: 'complete',
    priority: 'medium',
    complexity: 'complex',
    category: 'generation'
  },
  {
    name: 'Audio Generation',
    route: '/generate/audio',
    description: 'Audio generation for voice synthesis, music, and sound effects',
    status: 'complete',
    priority: 'medium',
    complexity: 'medium',
    category: 'generation'
  },
  {
    name: 'Document Generation',
    route: '/generate/document',
    description: 'Generate marketing copy, documentation, and written content',
    status: 'complete',
    priority: 'medium',
    complexity: 'medium',
    category: 'generation'
  },
  {
    name: 'Batch Generation',
    route: '/generate/batch',
    description: 'Batch processing interface for multiple media generation jobs',
    status: 'complete',
    priority: 'medium',
    complexity: 'complex',
    category: 'generation'
  },
  {
    name: 'Generation History',
    route: '/generate/history',
    description: 'View all past generations with filtering and search capabilities',
    status: 'complete',
    priority: 'low',
    complexity: 'medium',
    category: 'generation'
  },

  // Media Library
  {
    name: 'Media Library',
    route: '/media',
    description: 'Browse all generated media with advanced filtering and gallery views',
    status: 'complete',
    priority: 'high',
    complexity: 'medium',
    category: 'media'
  },
  {
    name: 'Image Gallery',
    route: '/media/images',
    description: 'Dedicated image gallery with grid/list views and metadata',
    status: 'complete',
    priority: 'medium',
    complexity: 'medium',
    category: 'media'
  },
  {
    name: 'Video Gallery',
    route: '/media/videos',
    description: 'Video library with preview, playback controls, and thumbnails',
    status: 'complete',
    priority: 'medium',
    complexity: 'medium',
    category: 'media'
  },
  {
    name: 'Audio Library',
    route: '/media/audio',
    description: 'Audio file management with playback and waveform visualization',
    status: 'complete',
    priority: 'low',
    complexity: 'medium',
    category: 'media'
  },
  {
    name: 'Document Library',
    route: '/media/documents',
    description: 'Text content and document management with preview and editing',
    status: 'complete',
    priority: 'low',
    complexity: 'simple',
    category: 'media'
  },
  {
    name: 'Media Detail',
    route: '/media/[id]',
    description: 'Individual media item view with metadata, history, and actions',
    status: 'complete',
    priority: 'medium',
    complexity: 'medium',
    category: 'media'
  },

  // Prompt System
  {
    name: 'Prompt Library',
    route: '/prompts',
    description: 'Manage and organize all prompts with categories and performance metrics',
    status: 'complete',
    priority: 'high',
    complexity: 'medium',
    category: 'prompts'
  },
  {
    name: 'Create Prompt',
    route: '/prompts/new',
    description: 'Create new JSON-based prompts with visual editor and templates',
    status: 'complete',
    priority: 'high',
    complexity: 'complex',
    category: 'prompts'
  },
  {
    name: 'Prompt Detail',
    route: '/prompts/[id]',
    description: 'View prompt details, usage history, and performance analytics',
    status: 'complete',
    priority: 'medium',
    complexity: 'medium',
    category: 'prompts'
  },
  {
    name: 'Edit Prompt',
    route: '/prompts/[id]/edit',
    description: 'Edit existing prompts with JSON editor and preview capabilities',
    status: 'complete',
    priority: 'medium',
    complexity: 'complex',
    category: 'prompts'
  },
  {
    name: 'Prompt Templates',
    route: '/prompts/templates',
    description: 'Pre-built prompt templates organized by media type and use case',
    status: 'complete',
    priority: 'medium',
    complexity: 'simple',
    category: 'prompts'
  },
  {
    name: 'Image-to-Prompt Analyzer',
    route: '/prompts/analyze',
    description: 'Upload images to extract JSON prompts with style and composition analysis',
    status: 'complete',
    priority: 'high',
    complexity: 'complex',
    category: 'prompts'
  },

  // Model Management
  {
    name: 'Models Overview',
    route: '/models',
    description: 'Comprehensive dashboard for managing all AI models, both API-based and local installations',
    status: 'complete',
    priority: 'high',
    complexity: 'medium',
    category: 'models'
  },
  {
    name: 'Model Registry',
    route: '/models/registry',
    description: 'Browse and add new AI models from various providers with automatic capability detection',
    status: 'complete',
    priority: 'high',
    complexity: 'medium',
    category: 'models'
  },
  {
    name: 'API Models',
    route: '/models/api',
    description: 'Manage cloud-based AI models from OpenAI, Replicate, Hugging Face and other providers',
    status: 'complete',
    priority: 'high',
    complexity: 'medium',
    category: 'models'
  },
  {
    name: 'Local Models',
    route: '/models/local',
    description: 'Install and manage locally hosted AI models for offline generation and privacy',
    status: 'complete',
    priority: 'medium',
    complexity: 'complex',
    category: 'models'
  },
  {
    name: 'Model Detail',
    route: '/models/[id]',
    description: 'Comprehensive view of individual AI model with performance analytics and configuration',
    status: 'complete',
    priority: 'medium',
    complexity: 'medium',
    category: 'models'
  },
  {
    name: 'Edit Model',
    route: '/models/[id]/edit',
    description: 'Configure AI model settings, parameters, and integration details',
    status: 'complete',
    priority: 'high',
    complexity: 'complex',
    category: 'models'
  },
  {
    name: 'Model Comparison',
    route: '/models/compare',
    description: 'Side-by-side comparison of AI models with performance benchmarks and cost analysis',
    status: 'complete',
    priority: 'low',
    complexity: 'medium',
    category: 'models'
  },

  // Settings & Admin
  {
    name: 'Settings Hub',
    route: '/settings',
    description: 'Central hub for account, team, billing, and system configuration management',
    status: 'complete',
    priority: 'medium',
    complexity: 'simple',
    category: 'settings'
  },
  {
    name: 'Profile Settings',
    route: '/settings/profile',
    description: 'Manage personal account information, preferences, and notification settings',
    status: 'complete',
    priority: 'medium',
    complexity: 'simple',
    category: 'settings'
  },
  {
    name: 'API Keys',
    route: '/settings/api',
    description: 'Manage API keys for external services and configure authentication settings',
    status: 'complete',
    priority: 'high',
    complexity: 'medium',
    category: 'settings'
  },
  {
    name: 'Billing & Subscription',
    route: '/settings/billing',
    description: 'Manage subscription plans, payment methods, and usage billing information',
    status: 'complete',
    priority: 'medium',
    complexity: 'medium',
    category: 'settings'
  },
  {
    name: 'Team Settings',
    route: '/settings/team',
    description: 'Manage team members, roles, permissions, and collaboration preferences',
    status: 'complete',
    priority: 'low',
    complexity: 'medium',
    category: 'settings'
  },
  {
    name: 'Integrations',
    route: '/settings/integrations',
    description: 'Configure third-party integrations, webhooks, and external service connections',
    status: 'complete',
    priority: 'medium',
    complexity: 'medium',
    category: 'settings'
  },

  // Tags Management
  {
    name: 'Tags Management',
    route: '/tags',
    description: 'Central hub for managing tag categories and tags for prompt enhancement',
    status: 'complete',
    priority: 'high',
    complexity: 'medium',
    category: 'tags'
  },
  {
    name: 'Create Tag Category',
    route: '/tags/categories/new',
    description: 'Create new tag categories for organizing tags by media type and purpose',
    status: 'complete',
    priority: 'high',
    complexity: 'simple',
    category: 'tags'
  },
  {
    name: 'Edit Tag Category',
    route: '/tags/categories/[id]/edit',
    description: 'Edit existing tag categories with media type and organizational settings',
    status: 'complete',
    priority: 'medium',
    complexity: 'simple',
    category: 'tags'
  },
  {
    name: 'Create Tag in Category',
    route: '/tags/categories/[id]/tags/new',
    description: 'Create new tags within specific categories for prompt enhancement',
    status: 'complete',
    priority: 'high',
    complexity: 'simple',
    category: 'tags'
  },
  {
    name: 'Edit Tag',
    route: '/tags/tags/[id]/edit',
    description: 'Edit individual tag properties, values, and media type associations',
    status: 'complete',
    priority: 'medium',
    complexity: 'simple',
    category: 'tags'
  },

  // Analytics
  {
    name: 'Analytics Dashboard',
    route: '/analytics',
    description: 'Overview of usage statistics, costs, and performance metrics',
    status: 'complete',
    priority: 'medium',
    complexity: 'medium',
    category: 'analytics'
  },
  {
    name: 'Usage Statistics',
    route: '/analytics/usage',
    description: 'Detailed usage analytics with charts and trends over time',
    status: 'complete',
    priority: 'medium',
    complexity: 'medium',
    category: 'analytics'
  },
  {
    name: 'Cost Analysis',
    route: '/analytics/costs',
    description: 'Cost breakdown by model, project, and time period with forecasting',
    status: 'complete',
    priority: 'high',
    complexity: 'medium',
    category: 'analytics'
  },
  {
    name: 'Performance Metrics',
    route: '/analytics/performance',
    description: 'Model performance analytics, success rates, and optimization insights',
    status: 'complete',
    priority: 'low',
    complexity: 'complex',
    category: 'analytics'
  }
]

const categories = [
  { key: 'all', name: 'All Pages', icon: '📋' },
  { key: 'core', name: 'Core Pages', icon: '🏠' },
  { key: 'fields', name: 'Field Management', icon: '🎯' },
  { key: 'generation', name: 'Generation', icon: '⚡' },
  { key: 'media', name: 'Media Library', icon: '🎨' },
  { key: 'prompts', name: 'Prompt System', icon: '✨' },
  { key: 'models', name: 'Model Management', icon: '🤖' },
  { key: 'tags', name: 'Tags Management', icon: '🏷️' },
  { key: 'settings', name: 'Settings', icon: '⚙️' },
  { key: 'analytics', name: 'Analytics', icon: '📊' }
]

const statusColors = {
  'not-started': 'bg-muted/30 text-muted-foreground border-muted/30',
  'in-progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'complete': 'bg-accent/20 text-accent border-accent/30 glow-sm'
}

const priorityColors = {
  'high': 'bg-red-500/20 text-red-400 border-red-500/30',
  'medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'low': 'bg-green-500/20 text-green-400 border-green-500/30'
}

const complexityColors = {
  'simple': 'bg-green-500/20 text-green-400 border-green-500/30',
  'medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'complex': 'bg-red-500/20 text-red-400 border-red-500/30'
}

// Helper functions for dynamic routes
const isDynamicRoute = (route: string): boolean => {
  return route.includes('[') && route.includes(']')
}

const getDemoRoute = (route: string): string => {
  let demoRoute = route
  // Replace [id] with demo-id
  demoRoute = demoRoute.replace(/\[id\]/g, 'demo-id')
  // Replace [fieldId] with demo-field
  demoRoute = demoRoute.replace(/\[fieldId\]/g, 'demo-field')
  return demoRoute
}

export default function PagesOverview() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPages = pages.filter(page => {
    const matchesCategory = selectedCategory === 'all' || page.category === selectedCategory
    const matchesSearch = page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.route.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const stats = {
    total: pages.length,
    complete: pages.filter(p => p.status === 'complete').length,
    inProgress: pages.filter(p => p.status === 'in-progress').length,
    notStarted: pages.filter(p => p.status === 'not-started').length,
    highPriority: pages.filter(p => p.priority === 'high').length
  }

  const progressPercentage = Math.round((stats.complete / stats.total) * 100)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass rounded-lg p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
          <span className="text-accent animate-glow mr-3">📋</span>
          Frontend Pages Overview
        </h1>
        <p className="text-muted-foreground">
          Complete list of all frontend pages that need to be built for MediaForge based on the PRD specifications.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="glass rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Development Progress</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-4 glass-light rounded-lg">
            <div className="text-2xl font-bold text-accent animate-glow">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Pages</div>
          </div>
          <div className="text-center p-4 glass-light rounded-lg">
            <div className="text-2xl font-bold text-accent animate-glow">{stats.complete}</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
          <div className="text-center p-4 glass-light rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center p-4 glass-light rounded-lg">
            <div className="text-2xl font-bold text-muted-foreground">{stats.notStarted}</div>
            <div className="text-sm text-muted-foreground">Not Started</div>
          </div>
          <div className="text-center p-4 glass-light rounded-lg">
            <div className="text-2xl font-bold text-red-400">{stats.highPriority}</div>
            <div className="text-sm text-muted-foreground">High Priority</div>
          </div>
        </div>
        <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-accent animate-glow rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">
          {progressPercentage}% Complete ({stats.complete} of {stats.total} pages)
        </p>
      </div>

      {/* Search and Filter */}
      <div className="glass rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search pages by name, route, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 glass rounded-lg text-foreground placeholder-muted-foreground focus:border-accent focus:glow-sm transition-all duration-300"
            />
          </div>
          <Button 
            onClick={() => setSearchTerm('')}
            variant="outline"
            className="hover:border-accent hover:text-accent transition-all duration-300"
          >
            Clear
          </Button>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="glass w-full justify-start overflow-x-auto">
            {categories.map(category => (
              <TabsTrigger key={category.key} value={category.key} className="whitespace-nowrap">
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Pages List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPages.map((page, index) => (
          <div key={page.route} className="glass rounded-lg p-6 hover:glass-heavy hover:border-accent transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                {page.name}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full border transition-all duration-300 ${statusColors[page.status]}`}>
                {page.status === 'not-started' && '○ Not Started'}
                {page.status === 'in-progress' && '◐ In Progress'}
                {page.status === 'complete' && '● Complete'}
              </span>
            </div>

            <div className="mb-4">
              <code className="text-sm bg-card/50 px-2 py-1 rounded text-accent font-mono">
                {page.route}
              </code>
            </div>

            <p className="text-sm text-muted-foreground mb-4 group-hover:text-foreground transition-colors">
              {page.description}
            </p>

            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs rounded-full border ${priorityColors[page.priority]}`}>
                  {page.priority.toUpperCase()} Priority
                </span>
                <span className={`px-2 py-1 text-xs rounded-full border ${complexityColors[page.complexity]}`}>
                  {page.complexity.charAt(0).toUpperCase() + page.complexity.slice(1)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {isDynamicRoute(page.route) ? (
                <div className="flex-1 flex gap-2">
                  <Link href={getDemoRoute(page.route)} className="flex-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full hover:border-accent hover:text-foreground hover:bg-accent/10 hover:glow-sm transition-all duration-300"
                    >
                      {page.status === 'complete' ? 'View Demo' : 'Create Page'}
                    </Button>
                  </Link>
                  <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full flex items-center whitespace-nowrap">
                    Template
                  </span>
                </div>
              ) : (
                <Link href={page.route} className="flex-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full hover:border-accent hover:text-foreground hover:bg-accent/10 hover:glow-sm transition-all duration-300"
                  >
                    {page.status === 'complete' ? 'View Page' : 'Create Page'}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredPages.length === 0 && (
        <div className="glass rounded-lg p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-foreground mb-2">No pages found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or category filter.
          </p>
        </div>
      )}
    </div>
  )
}