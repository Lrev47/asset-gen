import { Metadata } from 'next'
import { getTagCategories } from '@/app/actions/tags'
import TagManagement from '@/components/tags/TagManagement'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tag Management - Asset Generator',
  description: 'Manage prompt enhancement tags for AI-powered media generation'
}

export default async function TagsPage() {
  const { categories, error } = await getTagCategories()

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error Loading Tags:</strong> {error}
            </AlertDescription>
          </Alert>
          
          <div className="text-center mt-8">
            <h1 className="text-2xl font-bold mb-2">Tag Management</h1>
            <p className="text-muted-foreground">
              There was an issue loading your tag system. Please refresh the page or contact support if the problem persists.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tag Management</h1>
            <p className="text-muted-foreground">
              Manage prompt enhancement tags used during media generation. Tags are organized by category and media type to help you create better AI-generated content.
            </p>
          </div>
        </div>
        
        {/* Quick Info */}
        {categories.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-2">
              <div className="text-blue-600 dark:text-blue-400 text-sm">
                💡 <strong>Pro Tip:</strong> Use tags to quickly enhance your prompts during generation. 
                Select tags that match your desired style, composition, or mood to get better results from AI models.
              </div>
            </div>
          </div>
        )}
      </div>

      <TagManagement initialCategories={categories} />
    </div>
  )
}