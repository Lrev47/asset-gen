'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, Edit, Trash2, Tags, Folder, BarChart3, 
  Download, Upload, Search, Eye, Copy, MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import TagSearch from './TagSearch'
import TagStatistics from './TagStatistics'
import TagPreview from './TagPreview'
import type { TagCategoryWithTags } from '@/app/actions/tags'
import { 
  deleteTagCategory, 
  deleteTag, 
  exportTags,
  importTags,
  duplicateTag 
} from '@/app/actions/tags'

interface TagManagementProps {
  initialCategories: TagCategoryWithTags[]
}

export default function TagManagement({ initialCategories }: TagManagementProps) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [filteredCategories, setFilteredCategories] = useState(initialCategories)
  const [activeTab, setActiveTab] = useState('manage')

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const { success, error } = await deleteTagCategory(categoryId)
    
    if (success) {
      setCategories(categories.filter(cat => cat.id !== categoryId))
      console.log(`Deleted category: ${categoryName}`)
    } else {
      console.error('Failed to delete category:', error)
      // TODO: Show error toast
    }
  }

  const handleDeleteTag = async (categoryId: string, tagId: string, tagName: string) => {
    const { success, error } = await deleteTag(tagId)
    
    if (success) {
      const updatedCategories = categories.map(category => 
        category.id === categoryId 
          ? { ...category, tags: category.tags.filter(tag => tag.id !== tagId) }
          : category
      )
      setCategories(updatedCategories)
      setFilteredCategories(updatedCategories)
      console.log(`Deleted tag: ${tagName}`)
    } else {
      console.error('Failed to delete tag:', error)
      // TODO: Show error toast
    }
  }

  const handleExportTags = async () => {
    try {
      const { data, error } = await exportTags()
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
          type: 'application/json' 
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tags-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        console.error('Export failed:', error)
      }
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const handleImportTags = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const result = await importTags(data)
      
      if (result.success) {
        console.log(`Imported ${result.imported.categories} categories and ${result.imported.tags} tags`)
        if (result.errors.length > 0) {
          console.warn('Import warnings:', result.errors)
        }
        // Refresh the page to show imported data
        router.refresh()
      } else {
        console.error('Import failed:', result.errors)
      }
    } catch (error) {
      console.error('Import error:', error)
    }
  }

  const handleDuplicateTag = async (tagId: string, targetCategoryId: string) => {
    try {
      const { tag, error } = await duplicateTag(tagId, targetCategoryId)
      if (tag) {
        router.refresh()
      } else {
        console.error('Duplicate failed:', error)
      }
    } catch (error) {
      console.error('Duplicate error:', error)
    }
  }

  const navigateToNewCategory = () => {
    router.push('/tags/categories/new')
  }

  const navigateToEditCategory = (categoryId: string) => {
    router.push(`/tags/categories/${categoryId}/edit`)
  }

  const navigateToNewTag = (categoryId: string) => {
    router.push(`/tags/categories/${categoryId}/tags/new`)
  }

  const navigateToEditTag = (tagId: string) => {
    router.push(`/tags/tags/${tagId}/edit`)
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <TabsList className="grid w-auto grid-cols-4">
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Manage
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center space-x-2">
          {/* Import/Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Bulk Operations</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleExportTags}>
                <Download className="h-4 w-4 mr-2" />
                Export Tags
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => document.getElementById('import-file')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Tags
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Hidden file input for import */}
          <input
            id="import-file"
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportTags}
          />

          <Button onClick={navigateToNewCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <TabsContent value="manage" className="space-y-6">
        {/* Search and Filter */}
        <TagSearch 
          categories={categories}
          onFilteredCategoriesChange={setFilteredCategories}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{categories.length}</div>
              <div className="text-xs text-muted-foreground">Total Categories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {categories.reduce((sum, cat) => sum + cat.tags.length, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Tags</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {filteredCategories.length}
              </div>
              <div className="text-xs text-muted-foreground">Filtered Results</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {filteredCategories.reduce((sum, cat) => sum + cat.tags.length, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Filtered Tags</div>
            </CardContent>
          </Card>
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                <p className="text-muted-foreground mb-4">
                  {categories.length === 0 
                    ? 'No tag categories exist yet.'
                    : 'No categories match your current filters.'
                  }
                </p>
                <Button onClick={navigateToNewCategory}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map(category => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <Folder className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {category.mediaTypes.map(type => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                          <span className="text-xs text-muted-foreground">
                            {category.tags.length} tags
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigateToNewTag(category.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigateToEditCategory(category.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{category.name}"? This will also delete all {category.tags.length} tags in this category. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteCategory(category.id, category.name)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Category
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {category.description}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    {category.tags.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>No tags in this category</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => navigateToNewTag(category.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add First Tag
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {category.tags.map(tag => (
                          <div 
                            key={tag.id} 
                            className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm">{tag.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                "{tag.value}"
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem 
                                    onClick={() => navigateToEditTag(tag.id)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => navigator.clipboard.writeText(tag.value)}
                                  >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Value
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteTag(category.id, tag.id, tag.name)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </TabsContent>

      <TabsContent value="analytics">
        <TagStatistics categories={categories} />
      </TabsContent>

      <TabsContent value="preview">
        <TagPreview categories={categories} />
      </TabsContent>

      <TabsContent value="search">
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Advanced Search</h3>
          <p>Advanced tag search functionality will be available here.</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}