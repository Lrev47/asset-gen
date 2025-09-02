'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home,
  FolderPlus,
  Image,
  Sparkles,
  Database,
  BarChart3,
  Settings,
  Tags,
  FileText,
  Menu,
  X,
  Users,
  CreditCard,
  Bell
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview and quick actions'
  },
  {
    title: 'Projects',
    href: '/projects',
    icon: FolderPlus,
    description: 'Manage your projects'
  },
  {
    title: 'Media',
    href: '/media',
    icon: Image,
    description: 'Browse and organize assets'
  },
  {
    title: 'Generate',
    href: '/generate',
    icon: Sparkles,
    description: 'Create new content'
  },
  {
    title: 'Models',
    href: '/models',
    icon: Database,
    description: 'AI model registry'
  },
  {
    title: 'Prompts',
    href: '/prompts',
    icon: FileText,
    description: 'Prompt templates'
  },
  {
    title: 'Tags',
    href: '/tags',
    icon: Tags,
    description: 'Organize with tags'
  }
]

const secondaryNavItems: NavItem[] = [
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Usage statistics'
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Account preferences'
  }
]

export default function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className={cn('flex flex-col bg-card border-r border-border', className)}>
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-xl font-bold text-foreground">MediaForge</h2>
              <p className="text-xs text-muted-foreground">AI Media Platform</p>
            </div>
          )}
        </Link>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                active 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    <div className="font-medium">{item.title}</div>
                    {item.description && (
                      <div className="text-muted-foreground">{item.description}</div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
        
        <Separator className="my-4" />
        
        {secondaryNavItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group',
                active 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    <div className="font-medium">{item.title}</div>
                    {item.description && (
                      <div className="text-muted-foreground">{item.description}</div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Free Plan</p>
                <p className="text-xs text-muted-foreground">50 generations left</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Button size="sm" variant="outline" className="w-full p-2">
              <CreditCard className="h-4 w-4" />
            </Button>
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}