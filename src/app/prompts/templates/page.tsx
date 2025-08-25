import PlaceholderPage from '@/components/PlaceholderPage'

export default function PromptTemplatesPage() {
  return (
    <PlaceholderPage
      title="Prompt Templates"
      description="Curated collection of professional prompt templates with customization tools and performance-tested configurations for optimal AI generation results"
      userFlow={[
        'User browses template gallery organized by media type, industry, or style category',
        'User previews templates with sample outputs and performance metrics',
        'User customizes templates using guided parameter adjustment and preview tools',
        'User tests template variations with different models to find optimal configurations',
        'User saves customized templates to personal library with performance tracking',
        'User creates new templates from successful prompts with guided template builder',
        'User shares high-performing templates with community and team members',
        'User downloads or imports templates from community marketplace and verified creators'
      ]}
      features={[
        'Curated template gallery with professional-grade prompts for all media types',
        'Interactive template customization with real-time preview and validation',
        'Performance-tested configurations with success rate guarantees',
        'Template builder with guided creation and best-practice recommendations',
        'Community marketplace with ratings, reviews, and verified creator badges',
        'Advanced categorization with industry-specific and style-based organization',
        'Template versioning with performance comparison and A/B testing capabilities'
      ]}
      interactions={{
        forms: ['Template customization interface', 'Template builder wizard', 'Search and filter controls', 'Community submission form'],
        actions: ['Customize template', 'Test variations', 'Save to library', 'Create template', 'Share template', 'Import from marketplace'],
        displays: ['Template gallery with previews', 'Customization panels', 'Performance indicators', 'Sample output grids', 'Community ratings']
      }}
      category="Prompt System"
      prismaModels={['PromptTemplate', 'MediaType', 'Prompt']}
      dataDescription={[
        'PromptTemplate - Display all available prompt templates by category',
        'MediaType - Organize templates by compatible media generation types',
        'Prompt - Show example prompts created from each template'
      ]}
    />
  )
}