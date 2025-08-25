import PlaceholderPage from '@/components/PlaceholderPage'

export default function CreatePromptPage() {
  return (
    <PlaceholderPage
      title="Create New Prompt"
      description="Advanced prompt creation studio with intelligent assistance, real-time validation, and performance optimization for crafting high-quality AI generation prompts"
      userFlow={[
        'User selects prompt creation method (from scratch, template, or AI-assisted generation)',
        'User chooses target media type and compatible AI models for optimal prompt structure',
        'User crafts prompt using advanced JSON editor with syntax highlighting and autocomplete',
        'User utilizes AI-powered prompt assistance for optimization and improvement suggestions',
        'User configures generation parameters and validates prompt structure in real-time',
        'User tests prompt with multiple models using built-in generation preview tools',
        'User refines prompt based on test results and performance analytics feedback',
        'User saves prompt to library with metadata, tags, and sharing permissions'
      ]}
      features={[
        'AI-powered prompt assistance with intelligent suggestions and optimization',
        'Advanced JSON editor with syntax highlighting, validation, and autocomplete',
        'Template-based creation with customizable professional-grade prompt structures',
        'Real-time prompt testing with multiple AI models and instant preview results',
        'Performance prediction analytics showing expected success rates and quality scores',
        'Collaborative prompt development with version control and team feedback',
        'Intelligent tagging system with automatic categorization and search optimization'
      ]}
      interactions={{
        forms: ['JSON prompt editor', 'Media type selector', 'AI model compatibility checker', 'Metadata and tagging interface'],
        actions: ['Create from template', 'Get AI assistance', 'Test prompt', 'Validate structure', 'Save to library', 'Share with team'],
        displays: ['Syntax-highlighted editor', 'Real-time validation indicators', 'Preview generation results', 'Performance predictions', 'Model compatibility badges']
      }}
      category="Prompt System"
      prismaModels={['PromptTemplate', 'MediaType', 'User', 'AiModel']}
      dataDescription={[
        'PromptTemplate - Load template structures for different media types',
        'MediaType - Configure prompt for specific media generation types',
        'User - Set prompt ownership and privacy settings',
        'AiModel - Show compatible AI models for prompt testing'
      ]}
    />
  )
}