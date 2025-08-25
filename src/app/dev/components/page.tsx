'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'

export default function ComponentsShowcase() {
  const [checked, setChecked] = useState(false)
  const [switchEnabled, setSwitchEnabled] = useState(false)

  const componentSections = [
    {
      name: 'Button',
      component: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">🎨</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>Outline Disabled</Button>
          </div>
        </div>
      )
    },
    {
      name: 'Checkbox',
      component: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="checkbox1" 
              checked={checked}
              onCheckedChange={(value) => setChecked(value === true)}
            />
            <Label htmlFor="checkbox1">Accept terms and conditions</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="checkbox2" />
            <Label htmlFor="checkbox2">Subscribe to newsletter</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="checkbox3" disabled />
            <Label htmlFor="checkbox3">Disabled option</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="checkbox4" disabled checked />
            <Label htmlFor="checkbox4">Disabled checked</Label>
          </div>
        </div>
      )
    },
    {
      name: 'Switch',
      component: (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="switch1"
              checked={switchEnabled}
              onCheckedChange={(value) => setSwitchEnabled(value)}
            />
            <Label htmlFor="switch1">Enable notifications</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="switch2" />
            <Label htmlFor="switch2">Auto-save drafts</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="switch3" disabled />
            <Label htmlFor="switch3">Disabled switch</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="switch4" disabled checked />
            <Label htmlFor="switch4">Disabled checked</Label>
          </div>
        </div>
      )
    },
    {
      name: 'Separator',
      component: (
        <div className="space-y-4">
          <div>
            <p>Content above separator</p>
            <Separator className="my-4" />
            <p>Content below separator</p>
          </div>
          <div className="flex items-center space-x-4">
            <span>Left content</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Right content</span>
          </div>
        </div>
      )
    },
    {
      name: 'Label',
      component: (
        <div className="space-y-4">
          <div>
            <Label>Default Label</Label>
            <p className="text-sm text-gray-600 mt-1">Basic label styling</p>
          </div>
          <div>
            <Label htmlFor="input1">Label for Input</Label>
            <input 
              id="input1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter text..."
            />
          </div>
          <div>
            <Label className="text-red-600">Error Label</Label>
            <p className="text-sm text-red-600 mt-1">Custom styled label</p>
          </div>
        </div>
      )
    },
    {
      name: 'Tabs',
      component: (
        <Tabs defaultValue="tab1" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tab1">Account</TabsTrigger>
            <TabsTrigger value="tab2">Password</TabsTrigger>
            <TabsTrigger value="tab3">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="mt-4">
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Account Information</h3>
              <p className="text-gray-600">Manage your account details and preferences here.</p>
            </div>
          </TabsContent>
          <TabsContent value="tab2" className="mt-4">
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Password & Security</h3>
              <p className="text-gray-600">Update your password and security settings.</p>
            </div>
          </TabsContent>
          <TabsContent value="tab3" className="mt-4">
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Application Settings</h3>
              <p className="text-gray-600">Configure your application preferences.</p>
            </div>
          </TabsContent>
        </Tabs>
      )
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass rounded-lg p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Radix UI Components Showcase</h1>
        <p className="text-muted-foreground">
          Explore all available Radix UI components with the MediaForge dark theme.
          Use these components to build consistent and accessible interfaces.
        </p>
      </div>

      {/* Theme Demo Section */}
      <div className="glass-heavy rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
          <span className="text-accent animate-glow mr-2">🎨</span>
          Dark Theme System
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-light rounded-lg p-4">
            <h3 className="text-foreground font-medium mb-2">Glass Light</h3>
            <p className="text-muted-foreground text-sm">Subtle glassmorphism effect</p>
            <div className="mt-3 w-full h-2 bg-accent/20 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-accent animate-glow rounded-full"></div>
            </div>
          </div>
          <div className="glass rounded-lg p-4">
            <h3 className="text-foreground font-medium mb-2">Glass Medium</h3>
            <p className="text-muted-foreground text-sm">Standard glass effect</p>
            <div className="mt-3 w-full h-2 bg-accent/20 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-accent animate-glow rounded-full"></div>
            </div>
          </div>
          <div className="glass-heavy rounded-lg p-4">
            <h3 className="text-foreground font-medium mb-2">Glass Heavy</h3>
            <p className="text-muted-foreground text-sm">Strong glass effect</p>
            <div className="mt-3 w-full h-2 bg-accent/20 rounded-full overflow-hidden">
              <div className="h-full w-full bg-accent animate-glow rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Component Stats */}
      <div className="glass rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Component Library Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 glass-light rounded-lg hover:glass hover:border-accent transition-all duration-300 group">
            <div className="text-2xl font-bold text-accent animate-glow group-hover:glow-lg">{componentSections.length}</div>
            <div className="text-sm text-muted-foreground group-hover:text-foreground">Components</div>
          </div>
          <div className="text-center p-4 glass-light rounded-lg hover:glass hover:border-accent transition-all duration-300 group">
            <div className="text-2xl font-bold text-accent animate-glow group-hover:glow-lg">6</div>
            <div className="text-sm text-muted-foreground group-hover:text-foreground">Variants</div>
          </div>
          <div className="text-center p-4 glass-light rounded-lg hover:glass hover:border-accent transition-all duration-300 group">
            <div className="text-2xl font-bold text-accent animate-glow group-hover:glow-lg">4</div>
            <div className="text-sm text-muted-foreground group-hover:text-foreground">Sizes</div>
          </div>
          <div className="text-center p-4 glass-light rounded-lg hover:glass hover:border-accent transition-all duration-300 group">
            <div className="text-2xl font-bold text-accent animate-glow group-hover:glow-lg">100%</div>
            <div className="text-sm text-muted-foreground group-hover:text-foreground">Accessible</div>
          </div>
        </div>
      </div>

      {/* Components */}
      <div className="space-y-8">
        {componentSections.map((section, index) => (
          <div key={section.name} className="glass rounded-lg overflow-hidden">
            <div className="px-6 py-4 glass-heavy border-b border-border/50">
              <h2 className="text-xl font-semibold text-foreground">{section.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Interactive examples of the {section.name} component with dark theme
              </p>
            </div>
            <div className="p-6">
              {section.component}
            </div>
            <div className="px-6 py-3 glass-light border-t border-border/30">
              <details className="group">
                <summary className="flex cursor-pointer items-center text-sm text-muted-foreground hover:text-accent transition-colors">
                  <span>View Usage</span>
                  <svg className="ml-1 h-4 w-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-3 text-sm">
                  <code className="glass p-3 rounded block font-mono text-foreground border border-border">
                    import &#123; {section.name} &#125; from '@/components/ui/{section.name.toLowerCase()}'
                  </code>
                </div>
              </details>
            </div>
          </div>
        ))}
      </div>

      {/* Component Status */}
      <div className="glass rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Implementation Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'Button', status: 'complete' },
            { name: 'Checkbox', status: 'complete' },
            { name: 'Switch', status: 'complete' },
            { name: 'Label', status: 'complete' },
            { name: 'Separator', status: 'complete' },
            { name: 'Tabs', status: 'complete' },
            { name: 'Accordion', status: 'pending' },
            { name: 'Alert Dialog', status: 'pending' },
            { name: 'Avatar', status: 'pending' },
            { name: 'Dialog', status: 'pending' },
            { name: 'Dropdown Menu', status: 'pending' },
            { name: 'Form', status: 'pending' },
            { name: 'Navigation Menu', status: 'pending' },
            { name: 'Popover', status: 'pending' },
            { name: 'Progress', status: 'pending' },
            { name: 'Select', status: 'pending' },
            { name: 'Toast', status: 'pending' },
          ].map((component) => (
            <div key={component.name} className="flex justify-between items-center py-3 px-4 glass-light rounded-lg hover:glass hover:border-accent transition-all duration-300 group">
              <span className="text-foreground group-hover:text-accent transition-colors">{component.name}</span>
              <span className={`px-3 py-1 text-xs rounded-full transition-all duration-300 ${
                component.status === 'complete' 
                  ? 'bg-accent/20 text-accent border border-accent/30 glow-sm group-hover:glow' 
                  : 'bg-muted/30 text-muted-foreground border border-muted/30'
              }`}>
                {component.status === 'complete' ? '✓ Complete' : '⏳ Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}