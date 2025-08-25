import Link from 'next/link'

export default function DevLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Dev Navigation */}
      <nav className="glass-heavy border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-2xl font-bold text-foreground hover:text-accent transition-colors">
                  Media<span className="text-accent animate-glow">Forge</span>
                </Link>
                <span className="ml-3 px-3 py-1 text-xs bg-accent/20 text-accent rounded-full font-medium border border-accent/30 glow-sm">
                  DEV
                </span>
              </div>
              <div className="ml-8 flex space-x-1">
                <Link
                  href="/dev"
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 border-b-2 border-transparent hover:border-accent transition-all duration-300"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dev/components"
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 border-b-2 border-transparent hover:border-accent transition-all duration-300"
                >
                  Components
                </Link>
                <Link
                  href="/dev/pages"
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 border-b-2 border-transparent hover:border-accent transition-all duration-300"
                >
                  Pages
                </Link>
                <Link
                  href="/dev/api"
                  className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 border-b-2 border-transparent hover:border-accent transition-all duration-300"
                >
                  API
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 glass hover:glass-heavy text-sm font-medium text-muted-foreground hover:text-foreground hover:border-accent transition-all duration-300 rounded-md"
              >
                ← Back to App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Dev Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}