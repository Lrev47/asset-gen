import { prisma } from '@/lib/db/prisma'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

async function getSystemInfo() {
  let healthCheck = false
  let userCount = 0
  let projectCount = 0  
  let mediaCount = 0
  let promptCount = 0
  let generationCount = 0

  try {
    await prisma.$queryRaw`SELECT 1 as test`
    healthCheck = true
    
    // Only try to get counts if connection is successful
    const [users, projects, media, prompts, generations] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.project.count().catch(() => 0),
      prisma.media.count().catch(() => 0),
      prisma.prompt.count().catch(() => 0),
      prisma.generation.count().catch(() => 0),
    ])
    
    userCount = users
    projectCount = projects
    mediaCount = media
    promptCount = prompts
    generationCount = generations
  } catch (error) {
    console.log('Database connection failed in dev page:', error)
    healthCheck = false
  }

  return {
    database: {
      connected: healthCheck,
      models: {
        users: userCount,
        projects: projectCount,
        media: mediaCount,
        prompts: promptCount,
        generations: generationCount,
      }
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? '✓ Configured' : '✗ Missing',
      openaiKey: process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ Missing',
      replicateKey: process.env.REPLICATE_API_TOKEN ? '✓ Configured' : '✗ Missing',
    }
  }
}

export default async function DevDashboard() {
  const systemInfo = await getSystemInfo()

  const quickLinks = [
    { name: 'Components Showcase', href: '/dev/components', description: 'View all Radix UI components' },
    { name: 'Database Explorer', href: '/dev/database', description: 'Explore database models and data' },
    { name: 'API Endpoints', href: '/dev/api', description: 'Test API endpoints' },
    { name: 'Prisma Studio', href: '#', description: 'Open Prisma Studio (external)', external: true },
  ]

  const apiEndpoints = [
    { method: 'GET', path: '/api/users', description: 'List all users' },
    { method: 'POST', path: '/api/users', description: 'Create new user' },
    { method: 'GET', path: '/api/projects', description: 'List all projects' },
    { method: 'POST', path: '/api/projects', description: 'Create new project' },
    { method: 'GET', path: '/api/media', description: 'List all media' },
    { method: 'POST', path: '/api/media/generate', description: 'Generate new media' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass rounded-lg p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
          <span className="text-accent animate-glow mr-3">⚡</span>
          Development Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to the MediaForge development environment. Use this dashboard to monitor system status,
          test components, and manage development tasks.
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Status */}
        <div className="glass rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Database Status</h2>
            <div className={`w-3 h-3 rounded-full animate-pulse ${systemInfo.database.connected ? 'bg-accent glow-sm' : 'bg-red-500'}`}></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connection:</span>
              <span className={systemInfo.database.connected ? 'text-accent' : 'text-red-400'}>
                {systemInfo.database.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="border-t pt-3">
              <h3 className="text-sm font-medium text-foreground mb-2">Model Records:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(systemInfo.database.models).map(([model, count]) => (
                  <div key={model} className="flex justify-between glass-light rounded px-2 py-1">
                    <span className="text-muted-foreground capitalize">{model}:</span>
                    <span className="font-mono text-accent">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="glass rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Environment</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Node Environment:</span>
              <span className="font-mono glass px-2 py-1 rounded text-sm text-accent">
                {systemInfo.environment.nodeEnv}
              </span>
            </div>
            <div className="border-t pt-3 space-y-2">
              {Object.entries(systemInfo.environment).filter(([key]) => key !== 'nodeEnv').map(([key, status]) => (
                <div key={key} className="flex justify-between glass-light rounded px-2 py-1">
                  <span className="text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                  <span className={status.includes('✓') ? 'text-accent' : 'text-red-400'}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="glass rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block p-4 glass-light hover:glass hover:border-accent rounded-lg transition-all duration-300 group hover:glow-sm"
            >
              <h3 className="font-medium text-foreground mb-1 group-hover:text-accent transition-colors">{link.name}</h3>
              <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{link.description}</p>
              {link.external && (
                <span className="inline-block mt-2 text-xs text-accent animate-glow">External Link →</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* API Endpoints */}
      <div className="glass rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">API Endpoints</h2>
        <div className="space-y-2">
          {apiEndpoints.map((endpoint, index) => (
            <div key={index} className="flex items-center space-x-4 p-3 glass-light hover:glass rounded-lg transition-all duration-300 group hover:border-accent">
              <span className={`px-2 py-1 text-xs font-mono rounded border transition-all duration-300 ${
                endpoint.method === 'GET' 
                  ? 'bg-accent/20 text-accent border-accent/30 glow-sm' 
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
                {endpoint.method}
              </span>
              <span className="font-mono text-sm flex-1 text-foreground group-hover:text-accent transition-colors">{endpoint.path}</span>
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{endpoint.description}</span>
              <Button size="sm" variant="outline">
                Test
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="hover:border-accent hover:text-accent hover:glow-sm transition-all duration-300">
            Clear Cache
          </Button>
          <Button variant="outline" className="hover:border-accent hover:text-accent hover:glow-sm transition-all duration-300">
            Restart Dev Server
          </Button>
          <Button variant="outline" className="hover:border-accent hover:text-accent hover:glow-sm transition-all duration-300">
            Run Migrations
          </Button>
          <Button variant="outline" className="hover:border-accent hover:text-accent hover:glow-sm transition-all duration-300">
            Seed Database
          </Button>
          <Button variant="destructive" className="bg-red-600 hover:bg-red-700 hover:glow-sm transition-all duration-300">
            Reset Database
          </Button>
        </div>
      </div>
    </div>
  )
}