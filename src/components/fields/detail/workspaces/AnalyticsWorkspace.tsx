'use client'

import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target,
  BarChart3,
  PieChart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'

interface AnalyticsWorkspaceProps {
  field: FieldWithFullDetails
}

export default function AnalyticsWorkspace({ field }: AnalyticsWorkspaceProps) {
  // Calculate analytics
  const totalGenerations = field.generations.length
  const completedGenerations = field.generations.filter(g => g.status === 'completed').length
  const failedGenerations = field.generations.filter(g => g.status === 'failed').length
  const successRate = totalGenerations > 0 ? (completedGenerations / totalGenerations) * 100 : 0
  
  const totalCost = field.generations
    .filter(g => g.cost)
    .reduce((sum, g) => sum + (g.cost || 0), 0)
  
  const avgProcessingTime = field.generations
    .filter(g => g.duration)
    .reduce((sum, g, _, arr) => sum + (g.duration || 0) / arr.length, 0)

  // Get model usage stats
  const modelStats = field.generations.reduce((acc, gen) => {
    const modelName = gen.model.name || 'Unknown'
    acc[modelName] = (acc[modelName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const requirements = field.requirements as any || {}
  const targetQuantity = requirements.quantity || 0
  const currentQuantity = field._count.media
  const completionRate = targetQuantity > 0 ? (currentQuantity / targetQuantity) * 100 : 0

  if (totalGenerations === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center mb-6">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No analytics yet</h3>
          <p className="text-muted-foreground mb-6">
            Generate some content to see analytics and performance metrics.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">
            Performance insights and metrics for {field.name}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGenerations}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                <span>{completedGenerations} completed</span>
                <span>•</span>
                <span>{failedGenerations} failed</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
              <Progress value={successRate} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                ~${(totalCost / Math.max(completedGenerations, 1)).toFixed(3)} per asset
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Processing Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(avgProcessingTime / 1000)}s</div>
              <div className="text-xs text-muted-foreground mt-1">
                Per generation
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Towards Goal */}
        {targetQuantity > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Progress Towards Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Assets Generated</span>
                  <span className="text-sm text-muted-foreground">
                    {currentQuantity} / {targetQuantity}
                  </span>
                </div>
                <Progress value={completionRate} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className={completionRate >= 100 ? "text-green-600" : "text-muted-foreground"}>
                    {completionRate.toFixed(1)}% complete
                  </span>
                  {completionRate < 100 && (
                    <span className="text-muted-foreground">
                      {targetQuantity - currentQuantity} remaining
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Model Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <CardTitle>AI Model Usage</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(modelStats)
                .sort(([,a], [,b]) => b - a)
                .map(([model, count]) => {
                  const percentage = (count / totalGenerations) * 100
                  return (
                    <div key={model} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{model}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{count} uses</Badge>
                          <span className="text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>

        {/* Generation Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {field.generations.slice(0, 5).map((generation) => (
                <div key={generation.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      generation.status === 'completed' ? 'bg-green-500' :
                      generation.status === 'failed' ? 'bg-red-500' :
                      generation.status === 'processing' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`} />
                    <div>
                      <div className="text-sm font-medium">{generation.model.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(generation.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={generation.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {generation.status}
                    </Badge>
                    {generation.cost && (
                      <span className="text-xs text-muted-foreground">
                        ${generation.cost.toFixed(3)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}