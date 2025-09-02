'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Wrench, Settings, HelpCircle } from 'lucide-react'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'
import FieldDetailLayout from '../FieldDetailLayout'

interface DefaultLayoutProps {
  field: FieldWithFullDetails
}

export default function DefaultLayout({ field }: DefaultLayoutProps) {
  // For custom types or unknown types, fall back to the original layout
  if (field.type === 'custom' || !field.type) {
    return <FieldDetailLayout field={field} />
  }

  // For other types, show a simple placeholder
  return (
    <div className="h-full flex flex-col bg-background p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-950/20 rounded-lg flex items-center justify-center">
            <Wrench className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{field.name}</h1>
            <p className="text-muted-foreground">Custom Field</p>
          </div>
        </div>
        
        {field.description && (
          <p className="text-muted-foreground">{field.description}</p>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Card className="h-full">
          <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center">
            <div className="max-w-md space-y-6">
              <div className="w-24 h-24 bg-muted/50 rounded-lg flex items-center justify-center mx-auto">
                <HelpCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              
              <div>
                <h3 className="text-xl font-medium mb-2">Default Field View</h3>
                <p className="text-muted-foreground mb-1">
                  Field Type: <span className="font-medium">{field.type}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  This field type doesn't have a specialized interface yet. 
                  You can still use the standard field management tools.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 w-full">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium">Standard Tools</p>
                    <p className="text-sm text-muted-foreground">Basic field management available</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t w-full">
                <p className="text-sm text-muted-foreground">
                  Specialized interface for this field type coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}