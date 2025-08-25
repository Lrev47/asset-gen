'use client'

import React, { useState } from 'react'
import { BarChart3, TrendingUp, Zap, Image as ImageIcon, Clock, Calendar, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import type { ProjectWithFullDetails, ProjectMetrics } from '@/app/actions/project-detail'

interface AnalyticsTabProps {
  project: ProjectWithFullDetails
  metrics: ProjectMetrics
}

export default function AnalyticsTab({ project, metrics }: AnalyticsTabProps) {
  const [timeRange, setTimeRange] = useState<string>('30d')

  // Mock analytics data - in real app this would come from server
  const mockAnalytics = {
    generationTrends: [
      { date: '2024-01-15', successful: 5, failed: 1, total: 6 },
      { date: '2024-01-16', successful: 8, failed: 0, total: 8 },
      { date: '2024-01-17', successful: 12, failed: 2, total: 14 },
      { date: '2024-01-18', successful: 6, failed: 1, total: 7 },
    ],
    topPerformingFields: [
      { fieldName: 'Hero Banner', generations: 15, successRate: 93.3 },
      { fieldName: 'Product Gallery', generations: 12, successRate: 91.7 },
      { fieldName: 'Profile Images', generations: 8, successRate: 87.5 }
    ],
    modelUsage: [
      { model: 'DALL-E 3', usage: 18, cost: 54.00 },
      { model: 'Stable Diffusion', usage: 12, cost: 24.00 },
      { model: 'Midjourney', usage: 5, cost: 25.00 }
    ],
    costBreakdown: {
      thisMonth: 103.00,
      lastMonth: 87.50,
      totalSpent: 1240.00,
      avgPerGeneration: 2.95
    }
  }

  const successRate = metrics.totalGenerations > 0
    ? (metrics.successfulGenerations / metrics.totalGenerations) * 100
    : 0

  const avgGenerationsPerDay = mockAnalytics.generationTrends.length > 0
    ? mockAnalytics.generationTrends.reduce((sum, day) => sum + day.total, 0) / mockAnalytics.generationTrends.length
    : 0

  return (
    <div className="space-y-6">
      {/* Header with Time Range */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Analytics & Insights</h2>
          <p className="text-sm text-muted-foreground">
            Performance metrics and usage analytics
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +2.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Output</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgGenerationsPerDay.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              generations per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockAnalytics.costBreakdown.thisMonth}</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Cost/Generation</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockAnalytics.costBreakdown.avgPerGeneration}</div>
            <p className="text-xs text-muted-foreground">
              -0.15 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5" />
              <span>Top Performing Fields</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAnalytics.topPerformingFields.map((field, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{field.fieldName}</p>
                      <p className="text-xs text-muted-foreground">
                        {field.generations} generations
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {field.successRate}% success
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Model Usage & Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Model Usage & Costs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAnalytics.modelUsage.map((model, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      index === 0 ? 'bg-green-500' : 
                      index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{model.model}</p>
                      <p className="text-xs text-muted-foreground">
                        {model.usage} generations
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${model.cost.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      ${(model.cost / model.usage).toFixed(2)}/gen
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Generation Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalytics.generationTrends.map((day, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="text-sm font-medium text-muted-foreground w-20">
                  {new Date(day.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium">{day.total} generations</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round((day.successful / day.total) * 100)}% success
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(day.successful / Math.max(...mockAnalytics.generationTrends.map(d => d.total))) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground w-16">
                  {day.successful}S {day.failed}F
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}