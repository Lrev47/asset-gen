import PlaceholderPage from '@/components/PlaceholderPage'

export default function ImageGenerationPage() {
  return (
    <PlaceholderPage
      title="Image Generation"
      description="Advanced image generation studio with JSON prompt editor, real-time preview, batch processing, and professional image management tools"
      userFlow={[
        'User enters image generation studio with model selection and prompt editor',
        'User crafts prompts using JSON editor with syntax highlighting and validation',
        'User selects AI model based on style requirements (photorealistic, artistic, etc.)',
        'User configures generation parameters (resolution, aspect ratio, steps, guidance)',
        'User can use prompt templates or import from previous successful generations',
        'User initiates single or batch generation with real-time progress monitoring',
        'User reviews generated images in high-resolution gallery with zoom and comparison',
        'User saves selected images to projects, fields, or personal library with metadata'
      ]}
      features={[
        'Advanced JSON prompt editor with autocomplete and validation',
        'Real-time model performance indicators and queue status',
        'Batch generation with customizable variation parameters',
        'Image-to-image generation with style transfer capabilities',
        'Prompt optimization suggestions using AI-powered analysis',
        'Version control for prompts with diff viewing and rollback',
        'Professional image gallery with comparison and rating tools'
      ]}
      interactions={{
        forms: ['JSON prompt editor', 'Generation parameters panel', 'Model selection dropdown', 'Batch configuration form'],
        actions: ['Generate image', 'Save prompt', 'Download image', 'Add to project', 'Create variations', 'Rate image'],
        displays: ['Image gallery with zoom', 'Generation progress bars', 'Model status indicators', 'Prompt history', 'Parameter presets']
      }}
      category="Generation"
      prismaModels={['AiModel', 'Prompt', 'PromptTemplate', 'Media', 'Generation', 'Project', 'Field']}
      dataDescription={[
        'AiModel - Load image-capable AI models (DALL-E, Stable Diffusion, etc.)',
        'Prompt - Access saved image prompts and create new ones with JSON editor',
        'PromptTemplate - Use pre-built image generation templates',
        'Media - Save generated images and manage versions',
        'Generation - Track image generation jobs, batch processing, and results',
        'Project - Associate generated images with specific projects',
        'Field - Save images directly to project fields'
      ]}
    />
  )
}