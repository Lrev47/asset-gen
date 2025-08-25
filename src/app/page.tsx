import { prisma } from '@/lib/db/prisma'

export default async function HomePage() {
  // Basic database connection test
  let healthCheck = true
  try {
    await prisma.$queryRaw`SELECT 1 as test`
  } catch (error) {
    console.log('Database connection failed:', error)
    healthCheck = false
  }
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(220,38,38,0.1),transparent)]"></div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="mb-8 animate-float">
          <h1 className="text-6xl font-bold text-foreground mb-4">
            Media<span className="text-accent animate-glow">Forge</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Dynamic Media Creation Platform
          </p>
        </div>
        
        <div className="glass rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Platform Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 group">
                <div className="w-3 h-3 bg-accent rounded-full animate-glow group-hover:glow-lg transition-all duration-300"></div>
                <span className="text-card-foreground group-hover:text-foreground transition-colors">Multi-modal AI Generation (Images, Videos, Audio)</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-3 h-3 bg-accent rounded-full animate-glow group-hover:glow-lg transition-all duration-300"></div>
                <span className="text-card-foreground group-hover:text-foreground transition-colors">Dynamic Project Management</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-3 h-3 bg-accent rounded-full animate-glow group-hover:glow-lg transition-all duration-300"></div>
                <span className="text-card-foreground group-hover:text-foreground transition-colors">Flexible AI Model Integration</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 group">
                <div className="w-3 h-3 bg-accent rounded-full animate-glow group-hover:glow-lg transition-all duration-300"></div>
                <span className="text-card-foreground group-hover:text-foreground transition-colors">Advanced Prompt Engineering</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-3 h-3 bg-accent rounded-full animate-glow group-hover:glow-lg transition-all duration-300"></div>
                <span className="text-card-foreground group-hover:text-foreground transition-colors">Team Collaboration Tools</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-3 h-3 bg-accent rounded-full animate-glow group-hover:glow-lg transition-all duration-300"></div>
                <span className="text-card-foreground group-hover:text-foreground transition-colors">Usage Analytics & Cost Tracking</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`glass-light rounded-lg p-4 mb-8 transition-all duration-300 ${healthCheck 
          ? 'border-accent/50' 
          : 'border-yellow-500/50'
        }`}>
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${healthCheck 
              ? 'bg-accent glow-sm' 
              : 'bg-yellow-500'
            }`}></div>
            <span className={`font-medium ${healthCheck 
              ? 'text-accent' 
              : 'text-yellow-400'
            }`}>
              {healthCheck ? 'Database Connected' : 'Database Offline'}
            </span>
          </div>
          <p className={`text-sm mt-1 ${healthCheck 
            ? 'text-accent/80' 
            : 'text-yellow-400/80'
          }`}>
            {healthCheck 
              ? 'PostgreSQL connection successful' 
              : 'Database connection failed - check your PostgreSQL server'
            }
          </p>
        </div>
        
        <div className="text-muted-foreground mb-8">
          <p>Ready to build your media creation workflows</p>
        </div>

        <div className="flex justify-center space-x-4">
          <a 
            href="/dev"
            className="inline-flex items-center px-6 py-3 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-medium transition-all duration-300 hover:glow-sm hover:scale-105"
          >
            Enter Development Environment
          </a>
          <a 
            href="/dev/components"
            className="inline-flex items-center px-6 py-3 glass hover:glass-heavy text-foreground rounded-lg font-medium transition-all duration-300 hover:border-accent hover:glow-sm"
          >
            View Components
          </a>
        </div>
      </div>
    </div>
  )
}