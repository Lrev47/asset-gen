import PlaceholderPage from '@/components/PlaceholderPage'

export default function CreateFieldPage() {
  return (
    <PlaceholderPage
      title="Create New Field"
      description="Intelligent field creation wizard with guided requirement specification, automated template suggestions, and performance optimization for efficient project setup"
      userFlow={[
        'User initiates field creation with intelligent field type recommendations based on project context',
        'User selects field type from curated categories with visual previews and use case examples',
        'User defines field requirements using guided specification tools with validation and suggestions',
        'User configures media parameters including dimensions, formats, style preferences, and quality settings',
        'User sets generation priorities, deadlines, and budget constraints for resource planning',
        'User applies field templates or creates custom configurations with best practice guidance',
        'User validates field requirements with compatibility checking and optimization recommendations',
        'User saves field configuration with automated tagging and project integration'
      ]}
      features={[
        'Intelligent field type recommendation based on project analysis and industry best practices',
        'Guided requirement specification with validation, suggestions, and completeness checking',
        'Visual field preview with mockups and example outputs for better planning',
        'Template-based field creation with customizable professional-grade configurations',
        'Advanced parameter configuration with optimization for different AI models and quality levels',
        'Project integration with automatic workflow setup and dependency management',
        'Performance prediction with estimated generation times, costs, and success rates'
      ]}
      interactions={{
        forms: ['Field type selector with visual previews', 'Requirement specification wizard', 'Media parameter configurator', 'Template customization interface'],
        actions: ['Select field type', 'Define requirements', 'Configure parameters', 'Apply template', 'Preview field', 'Save configuration'],
        displays: ['Field type gallery with examples', 'Requirement builder interface', 'Parameter configuration panels', 'Template preview windows', 'Validation indicators']
      }}
      category="Field Management"
      prismaModels={['FieldType', 'Project', 'MediaType']}
      dataDescription={[
        'FieldType - Load available field types (Gallery, Hero, Testimonials, etc.)',
        'Project - Reference parent project for field creation',
        'MediaType - Configure supported media types for the field'
      ]}
    />
  )
}