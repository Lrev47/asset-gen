import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const glassPanelVariants = cva(
  'bg-surface/80 backdrop-blur-glass border rounded-lg transition-all duration-base',
  {
    variants: {
      variant: {
        default: 'border-border',
        elevated: 'border-border shadow-glass-md',
        accent: 'border-accent/20 bg-accent/5',
        muted: 'border-border/50 bg-muted/30',
      },
      hover: {
        none: '',
        glow: 'hover:border-accent/50 hover:shadow-glow hover:bg-surface-raised/80 cursor-pointer',
        subtle: 'hover:border-border-hover hover:bg-surface-raised/60 cursor-pointer',
        lift: 'hover:shadow-glass-lg hover:-translate-y-0.5 cursor-pointer',
      },
      padding: {
        none: '',
        sm: 'p-3',
        default: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      size: {
        auto: '',
        sm: 'w-64',
        md: 'w-80',
        lg: 'w-96',
        xl: 'w-[32rem]',
        full: 'w-full',
      }
    },
    defaultVariants: {
      variant: 'default',
      hover: 'none',
      padding: 'default',
      size: 'auto',
    },
  }
);

export interface GlassPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassPanelVariants> {
  children: React.ReactNode;
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant, hover, padding, size, children, ...props }, ref) => {
    return (
      <div
        className={cn(glassPanelVariants({ variant, hover, padding, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = 'GlassPanel';

// Specialized GlassPanel variants
export const GlassCard = React.forwardRef<HTMLDivElement, GlassPanelProps & {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}>(({ title, description, icon, children, className, ...props }, ref) => (
  <GlassPanel
    className={cn('space-y-4', className)}
    variant="elevated"
    hover="lift"
    ref={ref}
    {...props}
  >
    {(title || description || icon) && (
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && <h3 className="text-lg font-semibold text-text-primary">{title}</h3>}
          {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
        </div>
      </div>
    )}
    {children}
  </GlassPanel>
));

GlassCard.displayName = 'GlassCard';

export const GlassContainer = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, ...props }, ref) => (
    <GlassPanel
      className={cn('min-h-[200px] p-6', className)}
      variant="default"
      ref={ref}
      {...props}
    />
  )
);

GlassContainer.displayName = 'GlassContainer';

export const GlassFeatureCard = React.forwardRef<HTMLDivElement, Omit<GlassPanelProps, 'children'> & {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  children?: React.ReactNode;
}>(({ title, description, icon, badge, className, children, ...props }, ref) => (
  <GlassPanel
    className={cn('text-center space-y-4 relative overflow-hidden', className)}
    variant="elevated"
    hover="glow"
    padding="lg"
    ref={ref}
    {...props}
  >
    {badge && (
      <div className="absolute top-3 right-3 px-2 py-1 bg-accent/20 text-accent text-xs font-medium rounded-full">
        {badge}
      </div>
    )}
    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4 text-accent">
      {icon}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
    </div>
    {children}
  </GlassPanel>
));

GlassFeatureCard.displayName = 'GlassFeatureCard';

export const GlassMetricCard = React.forwardRef<HTMLDivElement, GlassPanelProps & {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}>(({ label, value, change, trend = 'neutral', icon, className, ...props }, ref) => {
  const trendColors = {
    up: 'text-status-success',
    down: 'text-status-error',
    neutral: 'text-text-muted',
  };

  return (
    <GlassPanel
      className={cn('space-y-2', className)}
      variant="elevated"
      hover="subtle"
      ref={ref}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        {icon && (
          <div className="w-5 h-5 text-text-muted">
            {icon}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-text-primary">{value}</div>
        {change && (
          <div className={cn('text-xs', trendColors[trend])}>
            {change}
          </div>
        )}
      </div>
    </GlassPanel>
  );
});

GlassMetricCard.displayName = 'GlassMetricCard';

export { GlassPanel, glassPanelVariants };