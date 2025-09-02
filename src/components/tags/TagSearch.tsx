'use client'

import { useState, useCallback, useMemo } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import type { TagCategoryWithTags } from '@/app/actions/tags'

interface TagSearchProps {
  categories: TagCategoryWithTags[]
  onFilteredCategoriesChange: (categories: TagCategoryWithTags[]) => void
  className?: string
}

interface SearchFilters {
  searchQuery: string
  selectedMediaTypes: string[]
  selectedCategories: string[]
  showEmptyCategories: boolean
}

const mediaTypeOptions = [
  { value: 'image', label: 'Image', color: 'bg-blue-100 text-blue-800' },
  { value: 'video', label: 'Video', color: 'bg-purple-100 text-purple-800' },
  { value: 'audio', label: 'Audio', color: 'bg-green-100 text-green-800' },
  { value: 'text', label: 'Text', color: 'bg-orange-100 text-orange-800' },
  { value: 'document', label: 'Document', color: 'bg-gray-100 text-gray-800' }
]

export default function TagSearch({ 
  categories, 
  onFilteredCategoriesChange, 
  className 
}: TagSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    selectedMediaTypes: [],
    selectedCategories: [],
    showEmptyCategories: true
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Memoized filtering logic
  const filteredCategories = useMemo(() => {
    return categories.filter(category => {
      // Search query filter (searches category name, description, tag names, tag values)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase()
        const categoryMatch = (
          category.name.toLowerCase().includes(query) ||
          category.description?.toLowerCase().includes(query) ||
          false
        )
        const tagMatch = category.tags.some(tag => 
          tag.name.toLowerCase().includes(query) ||
          tag.value.toLowerCase().includes(query) ||
          tag.description?.toLowerCase().includes(query) ||
          false
        )
        
        if (!categoryMatch && !tagMatch) return false
      }

      // Media type filter
      if (filters.selectedMediaTypes.length > 0) {
        const hasMatchingMediaType = filters.selectedMediaTypes.some(mediaType =>
          category.mediaTypes.includes(mediaType)
        )
        if (!hasMatchingMediaType) return false
      }

      // Category filter
      if (filters.selectedCategories.length > 0) {
        if (!filters.selectedCategories.includes(category.id)) return false
      }

      // Empty categories filter
      if (!filters.showEmptyCategories && category.tags.length === 0) {
        return false
      }

      return true
    }).map(category => {
      // If there's a search query, also filter tags within categories
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase()
        const filteredTags = category.tags.filter(tag =>
          tag.name.toLowerCase().includes(query) ||
          tag.value.toLowerCase().includes(query) ||
          tag.description?.toLowerCase().includes(query) ||
          false
        )
        
        return {
          ...category,
          tags: filteredTags
        }
      }
      
      return category
    })
  }, [categories, filters])

  // Update parent component when filters change
  const debouncedFilterUpdate = useCallback(() => {
    onFilteredCategoriesChange(filteredCategories)
  }, [filteredCategories, onFilteredCategoriesChange])

  // Apply filters immediately
  useMemo(() => {
    debouncedFilterUpdate()
  }, [debouncedFilterUpdate])

  const updateFilters = (updates: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }))
  }

  const handleMediaTypeToggle = (mediaType: string, checked: boolean) => {
    updateFilters({
      selectedMediaTypes: checked
        ? [...filters.selectedMediaTypes, mediaType]
        : filters.selectedMediaTypes.filter(type => type !== mediaType)
    })
  }

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    updateFilters({
      selectedCategories: checked
        ? [...filters.selectedCategories, categoryId]
        : filters.selectedCategories.filter(id => id !== categoryId)
    })
  }

  const clearAllFilters = () => {
    setFilters({
      searchQuery: '',
      selectedMediaTypes: [],
      selectedCategories: [],
      showEmptyCategories: true
    })
  }

  const clearSearchQuery = () => {
    updateFilters({ searchQuery: '' })
  }

  const hasActiveFilters = (
    filters.searchQuery.trim() ||
    filters.selectedMediaTypes.length > 0 ||
    filters.selectedCategories.length > 0 ||
    !filters.showEmptyCategories
  )

  const totalResults = filteredCategories.length
  const totalTags = filteredCategories.reduce((sum, cat) => sum + cat.tags.length, 0)

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tags, categories, or descriptions..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="pl-10 pr-8"
          />
          {filters.searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearchQuery}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Toggle & Results Count */}
        <div className="flex items-center justify-between">
          <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2 h-5 text-xs">
                    {[
                      filters.selectedMediaTypes.length,
                      filters.selectedCategories.length,
                      filters.searchQuery.trim() ? 1 : 0,
                      !filters.showEmptyCategories ? 1 : 0
                    ].filter(Boolean).reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
                {/* Media Type Filters */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Media Types</h4>
                  <div className="space-y-2">
                    {mediaTypeOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-media-${option.value}`}
                          checked={filters.selectedMediaTypes.includes(option.value)}
                          onCheckedChange={(checked) => 
                            handleMediaTypeToggle(option.value, checked as boolean)
                          }
                        />
                        <label 
                          htmlFor={`filter-media-${option.value}`}
                          className="text-sm flex items-center gap-2"
                        >
                          <span className={`px-2 py-1 rounded-full text-xs ${option.color}`}>
                            {option.label}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Filters */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Categories</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-category-${category.id}`}
                          checked={filters.selectedCategories.includes(category.id)}
                          onCheckedChange={(checked) => 
                            handleCategoryToggle(category.id, checked as boolean)
                          }
                        />
                        <label 
                          htmlFor={`filter-category-${category.id}`}
                          className="text-sm flex items-center gap-2 flex-1"
                        >
                          <span>{category.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {category.tags.length}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other Options */}
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-empty"
                      checked={filters.showEmptyCategories}
                      onCheckedChange={(checked) => 
                        updateFilters({ showEmptyCategories: checked as boolean })
                      }
                    />
                    <label htmlFor="show-empty" className="text-sm">
                      Show empty categories
                    </label>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex items-center space-x-4">
            {/* Results Count */}
            <div className="text-sm text-muted-foreground">
              {totalResults} {totalResults === 1 ? 'category' : 'categories'} · {totalTags} tags
            </div>
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.searchQuery.trim() && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{filters.searchQuery}"
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={clearSearchQuery}
                />
              </Badge>
            )}
            
            {filters.selectedMediaTypes.map(mediaType => (
              <Badge key={mediaType} variant="secondary" className="flex items-center gap-1">
                {mediaTypeOptions.find(opt => opt.value === mediaType)?.label || mediaType}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleMediaTypeToggle(mediaType, false)}
                />
              </Badge>
            ))}
            
            {filters.selectedCategories.map(categoryId => {
              const category = categories.find(cat => cat.id === categoryId)
              return category ? (
                <Badge key={categoryId} variant="secondary" className="flex items-center gap-1">
                  {category.name}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleCategoryToggle(categoryId, false)}
                  />
                </Badge>
              ) : null
            })}
            
            {!filters.showEmptyCategories && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Hide empty
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilters({ showEmptyCategories: true })}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}