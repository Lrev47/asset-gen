import PlaceholderPage from '@/components/PlaceholderPage'

export default function FieldManagementPage() {
  return (
    <PlaceholderPage
      title="Field Management"
      description="Dynamic field configuration system for defining project requirements, media specifications, and generation parameters"
      userFlow={[
        'User views all project fields in an organized dashboard with status indicators',
        'User clicks "Add Field" to create a new field with type selection wizard',
        'User configures field requirements including media type, dimensions, style preferences',
        'User sets field priority and deadline for generation scheduling',
        'User organizes fields by dragging and dropping for logical grouping',
        'User initiates bulk generation for multiple fields or individual field generation',
        'User monitors generation progress and reviews completed assets per field',
        'User can duplicate successful fields or create templates for reuse'
      ]}
      features={[
        'Drag-and-drop field organization with custom grouping',
        'Field templates and presets for common use cases',
        'Bulk field operations (generate, duplicate, archive)',
        'Progress tracking with completion percentages per field',
        'Advanced field configuration with conditional requirements',
        'Field dependency mapping for sequential generation workflows'
      ]}
      interactions={{
        forms: ['Field creation wizard', 'Requirements specification form', 'Batch configuration panel'],
        actions: ['Add new field', 'Generate media', 'Duplicate field', 'Bulk operations', 'Create template'],
        displays: ['Field cards with progress bars', 'Media thumbnail grids', 'Status indicators', 'Generation queue', 'Field dependency tree']
      }}
      category="Field Management"
      prismaModels={['Field', 'FieldType', 'Media', 'Generation', 'Project']}
      dataDescription={[
        'Field - Display all project fields with current status and progress',
        'FieldType - Show available field types and their default configurations',
        'Media - Count and preview media assets for each field',
        'Generation - Track active and completed generation jobs per field',
        'Project - Reference parent project for context and permissions'
      ]}
    />
  )
}