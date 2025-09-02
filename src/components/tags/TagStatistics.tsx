'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { TagCategoryWithTags } from '@/app/actions/tags'

interface TagStatisticsProps {
  categories: TagCategoryWithTags[]
  className?: string
}

interface TagUsage {
  tagId: string
  tagName: string
  categoryName: string
  usageCount: number
  successRate: number
  mediaTypes: string[]
}

interface CategoryStats {
  categoryId: string
  categoryName: string
  totalTags: number
  totalUsage: number
  averageSuccessRate: number
  mediaTypes: string[]
}

// Mock data for demonstration - in real implementation, this would come from the database
const generateMockUsageData = (categories: TagCategoryWithTags[]): TagUsage[] => {
  const mockData: TagUsage[] = []
  
  categories.forEach(category => {
    category.tags.forEach(tag => {
      // Generate random usage statistics for demonstration
      const usageCount = Math.floor(Math.random() * 100) + 1
      const successRate = Math.floor(Math.random() * 30) + 70 // 70-100% success rate
      
      mockData.push({
        tagId: tag.id,
        tagName: tag.name,
        categoryName: category.name,
        usageCount,
        successRate,
        mediaTypes: tag.mediaTypes
      })
    })
  })
  
  return mockData.sort((a, b) => b.usageCount - a.usageCount)
}

const generateCategoryStats = (categories: TagCategoryWithTags[], usageData: TagUsage[]): CategoryStats[] => {
  return categories.map(category => {
    const categoryUsage = usageData.filter(usage => usage.categoryName === category.name)
    const totalUsage = categoryUsage.reduce((sum, usage) => sum + usage.usageCount, 0)
    const averageSuccessRate = categoryUsage.length > 0
      ? categoryUsage.reduce((sum, usage) => sum + usage.successRate, 0) / categoryUsage.length
      : 0

    return {
      categoryId: category.id,
      categoryName: category.name,
      totalTags: category.tags.length,
      totalUsage,
      averageSuccessRate,
      mediaTypes: category.mediaTypes
    }
  }).sort((a, b) => b.totalUsage - a.totalUsage)
}

export default function TagStatistics({ categories, className }: TagStatisticsProps) {
  const [usageData, setUsageData] = useState<TagUsage[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])

  useEffect(() => {
    // In a real implementation, this would fetch actual usage data from the database
    const mockUsageData = generateMockUsageData(categories)
    const mockCategoryStats = generateCategoryStats(categories, mockUsageData)
    
    setUsageData(mockUsageData)
    setCategoryStats(mockCategoryStats)
  }, [categories])

  const totalTags = categories.reduce((sum, cat) => sum + cat.tags.length, 0)
  const totalUsage = usageData.reduce((sum, usage) => sum + usage.usageCount, 0)
  const averageSuccessRate = usageData.length > 0
    ? usageData.reduce((sum, usage) => sum + usage.successRate, 0) / usageData.length
    : 0
  const mostUsedTag = usageData[0]

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTags}</div>
            <p className="text-xs text-muted-foreground">
              Across {categories.length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Times tags were used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average generation success
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">{mostUsedTag?.tagName || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {mostUsedTag?.usageCount || 0} uses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Used Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usageData.slice(0, 10).map((tag, index) => (
                <div key={tag.tagId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="text-sm font-medium text-muted-foreground w-6">
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{tag.tagName}</div>
                      <div className="text-xs text-muted-foreground">{tag.categoryName}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">{tag.usageCount}</div>
                      <div className="text-xs text-muted-foreground">
                        {tag.successRate}% success
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {tag.mediaTypes.slice(0, 2).map(type => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                      {tag.mediaTypes.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{tag.mediaTypes.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categoryStats.map((category) => (
                <div key={category.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{category.categoryName}</span>
                      <Badge variant="outline" className="text-xs">
                        {category.totalTags} tags
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{category.totalUsage}</div>
                      <div className="text-xs text-muted-foreground">uses</div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Usage</span>
                      <span>{((category.totalUsage / Math.max(totalUsage, 1)) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={(category.totalUsage / Math.max(totalUsage, 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Success Rate</span>
                      <span>{category.averageSuccessRate.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={category.averageSuccessRate} 
                      className="h-2"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {category.mediaTypes.map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Media Type Breakdown */}
            <div>
              <h4 className="font-medium text-sm mb-3">Most Popular Media Types</h4>
              <div className="space-y-2">
                {['image', 'video', 'audio', 'text', 'document'].map(mediaType => {
                  const mediaUsage = usageData.filter(usage => 
                    usage.mediaTypes.includes(mediaType)
                  ).reduce((sum, usage) => sum + usage.usageCount, 0)
                  const percentage = totalUsage > 0 ? (mediaUsage / totalUsage) * 100 : 0
                  
                  return (
                    <div key={mediaType} className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs capitalize">
                        {mediaType}
                      </Badge>
                      <div className="text-sm">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Success Rate Distribution */}
            <div>
              <h4 className="font-medium text-sm mb-3">Success Rate Distribution</h4>
              <div className="space-y-2">
                {[
                  { label: '90-100%', min: 90, max: 100 },
                  { label: '80-89%', min: 80, max: 89 },
                  { label: '70-79%', min: 70, max: 79 },
                  { label: '60-69%', min: 60, max: 69 },
                  { label: '<60%', min: 0, max: 59 }
                ].map(range => {
                  const count = usageData.filter(usage => 
                    usage.successRate >= range.min && usage.successRate <= range.max
                  ).length
                  const percentage = usageData.length > 0 ? (count / usageData.length) * 100 : 0
                  
                  return (
                    <div key={range.label} className="flex items-center justify-between">
                      <span className="text-xs">{range.label}</span>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm">{count}</div>
                        <div className="text-xs text-muted-foreground">
                          ({percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Usage Frequency */}
            <div>
              <h4 className="font-medium text-sm mb-3">Usage Frequency</h4>
              <div className="space-y-2">
                {[
                  { label: 'Heavy (50+)', min: 50 },
                  { label: 'Regular (20-49)', min: 20, max: 49 },
                  { label: 'Light (10-19)', min: 10, max: 19 },
                  { label: 'Occasional (5-9)', min: 5, max: 9 },
                  { label: 'Rare (<5)', min: 0, max: 4 }
                ].map(range => {
                  const count = usageData.filter(usage => {
                    const inRange = usage.usageCount >= range.min
                    return range.max ? inRange && usage.usageCount <= range.max : inRange
                  }).length
                  const percentage = usageData.length > 0 ? (count / usageData.length) * 100 : 0
                  
                  return (
                    <div key={range.label} className="flex items-center justify-between">
                      <span className="text-xs">{range.label}</span>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm">{count}</div>
                        <div className="text-xs text-muted-foreground">
                          ({percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}