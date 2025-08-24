import React from 'react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  className?: string;
  showBackgroundDecorations?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  header,
  leftPanel,
  rightPanel,
  className = '',
  showBackgroundDecorations = true,
}) => {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Background decorations */}
      {showBackgroundDecorations && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
      )}

      {/* Header */}
      {header && (
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface/80 backdrop-blur-glass border-b border-border">
          <div className="h-full px-6 flex items-center justify-between">
            {header}
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className={cn('relative', header ? 'pt-16' : '')}>
        <div className="flex min-h-[calc(100vh-4rem)]">
          {/* Left Panel */}
          {leftPanel && (
            <aside className="w-[280px] border-r border-border bg-surface/50 backdrop-blur-sm flex-shrink-0">
              <div className="h-full overflow-y-auto p-4">
                {leftPanel}
              </div>
            </aside>
          )}

          {/* Center Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
          </main>

          {/* Right Panel */}
          {rightPanel && (
            <aside className="w-[320px] border-l border-border bg-surface/50 backdrop-blur-sm flex-shrink-0">
              <div className="h-full overflow-y-auto p-4">
                {rightPanel}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

// AppShell variants for common layouts
export const DashboardAppShell: React.FC<Omit<AppShellProps, 'leftPanel'> & { navigation: React.ReactNode }> = ({
  navigation,
  ...props
}) => (
  <AppShell
    leftPanel={
      <nav className="space-y-2">
        {navigation}
      </nav>
    }
    {...props}
  />
);

export const CreativeAppShell: React.FC<Omit<AppShellProps, 'leftPanel' | 'rightPanel'> & {
  tools: React.ReactNode;
  layers: React.ReactNode;
}> = ({
  tools,
  layers,
  ...props
}) => (
  <AppShell
    leftPanel={
      <div className="space-y-4">
        <div className="text-sm font-medium text-text-primary mb-2">Tools</div>
        {tools}
      </div>
    }
    rightPanel={
      <div className="space-y-4">
        <div className="text-sm font-medium text-text-primary mb-2">Layers</div>
        {layers}
      </div>
    }
    {...props}
  />
);

export const DataProcessingAppShell: React.FC<Omit<AppShellProps, 'leftPanel' | 'rightPanel'> & {
  uploader: React.ReactNode;
  results: React.ReactNode;
}> = ({
  uploader,
  results,
  ...props
}) => (
  <AppShell
    leftPanel={
      <div className="space-y-4">
        <div className="text-sm font-medium text-text-primary mb-2">Upload</div>
        {uploader}
      </div>
    }
    rightPanel={
      <div className="space-y-4">
        <div className="text-sm font-medium text-text-primary mb-2">Results</div>
        {results}
      </div>
    }
    {...props}
  />
);