interface PlaceholderPageProps {
  title: string
  description: string
  userFlow?: string[]
  features?: string[]
  interactions?: {
    forms?: string[]
    actions?: string[]
    displays?: string[]
  }
  prismaModels: string[]
  dataDescription?: string[]
  category: string
}

export default function PlaceholderPage({ 
  title, 
  description, 
  userFlow = [],
  features = [],
  interactions = {},
  prismaModels, 
  dataDescription = [], 
  category 
}: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="glass rounded-lg p-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
            <span className="text-accent animate-glow mr-3">🚧</span>
            {title}
          </h1>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Under Construction */}
        <div className="glass-heavy rounded-lg p-8 text-center">
          <div className="text-6xl mb-4 animate-float">⚡</div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Under Construction
          </h2>
          <p className="text-muted-foreground mb-6">
            This page is part of the MediaForge platform and will be implemented soon.
          </p>
          <div className="inline-flex items-center px-4 py-2 glass rounded-lg">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse mr-2"></span>
            <span className="text-sm text-accent">Coming Soon</span>
          </div>
        </div>

        {/* User Flow */}
        {userFlow.length > 0 && (
          <div className="glass rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <span className="text-accent mr-2">🔄</span>
              User Flow
            </h3>
            <div className="space-y-3">
              {userFlow.map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-accent/20 border border-accent/50 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-accent text-xs font-bold">{index + 1}</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Features */}
        {features.length > 0 && (
          <div className="glass rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <span className="text-accent mr-2">⭐</span>
              Key Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="glass-light rounded-lg p-3 border border-accent/20 hover:border-accent/50 transition-all duration-300">
                  <div className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-foreground text-sm">{feature}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UI Interactions */}
        {(interactions.forms?.length || interactions.actions?.length || interactions.displays?.length) && (
          <div className="glass rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <span className="text-accent mr-2">🎛️</span>
              UI Interactions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {interactions.forms && interactions.forms.length > 0 && (
                <div className="glass-light rounded-lg p-4">
                  <h4 className="text-green-400 font-medium mb-2 flex items-center">
                    <span className="mr-2">📝</span>
                    Forms & Input
                  </h4>
                  <ul className="space-y-1">
                    {interactions.forms.map((form, index) => (
                      <li key={index} className="text-muted-foreground text-sm">{form}</li>
                    ))}
                  </ul>
                </div>
              )}
              {interactions.actions && interactions.actions.length > 0 && (
                <div className="glass-light rounded-lg p-4">
                  <h4 className="text-blue-400 font-medium mb-2 flex items-center">
                    <span className="mr-2">⚡</span>
                    Actions
                  </h4>
                  <ul className="space-y-1">
                    {interactions.actions.map((action, index) => (
                      <li key={index} className="text-muted-foreground text-sm">{action}</li>
                    ))}
                  </ul>
                </div>
              )}
              {interactions.displays && interactions.displays.length > 0 && (
                <div className="glass-light rounded-lg p-4">
                  <h4 className="text-purple-400 font-medium mb-2 flex items-center">
                    <span className="mr-2">👁️</span>
                    Display Elements
                  </h4>
                  <ul className="space-y-1">
                    {interactions.displays.map((display, index) => (
                      <li key={index} className="text-muted-foreground text-sm">{display}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prisma Models */}
        <div className="glass rounded-lg p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            <span className="text-accent mr-2">🗄️</span>
            Required Prisma Models
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {prismaModels.map((model, index) => (
              <div key={model} className="glass-light rounded-lg p-3 border border-accent/20 hover:border-accent/50 transition-all duration-300">
                <code className="text-accent font-mono text-sm">{model}</code>
              </div>
            ))}
          </div>
          
          {dataDescription.length > 0 && (
            <div className="border-t border-border/30 pt-4">
              <h4 className="text-lg font-medium text-foreground mb-3">Data Usage:</h4>
              <ul className="space-y-2">
                {dataDescription.map((desc, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-muted-foreground text-sm">{desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Page Category */}
        <div className="glass-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Category:</span>
            <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium border border-accent/30">
              {category}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}