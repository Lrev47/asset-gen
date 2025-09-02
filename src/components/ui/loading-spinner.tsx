'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingSpinner({ 
  className,
  size = 'md' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Outer ring - Black */}
      <div className="absolute inset-0 rounded-full border-4 border-black/20 dark:border-white/20" />
      
      {/* Animated spinner - Red gradient */}
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-600 border-r-red-500 animate-spin" 
           style={{ 
             animationDuration: '0.8s',
             background: 'conic-gradient(from 0deg, transparent, transparent 270deg, #dc2626 360deg)',
             WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))',
             mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))'
           }} />
      
      {/* Center pulse dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" 
             style={{ animationDuration: '1s' }} />
      </div>
      
      {/* Rotating accent dots */}
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-black dark:bg-white rounded-full" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-black dark:bg-white rounded-full" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-black dark:bg-white rounded-full" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-black dark:bg-white rounded-full" />
      </div>
    </div>
  )
}