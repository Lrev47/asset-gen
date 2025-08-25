import PlaceholderPage from '@/components/PlaceholderPage'

export default function ImageAnalyzerPage() {
  return (
    <PlaceholderPage
      title="Image-to-Prompt Analyzer"
      description="AI-powered image analysis system that reverse-engineers prompts from uploaded images with style detection, composition analysis, and prompt optimization"
      userFlow={[
        'User uploads reference images through drag-and-drop or file browser interface',
        'User selects analysis depth (basic style extraction vs comprehensive analysis)',
        'AI analyzes images for style, composition, lighting, color palette, and subject matter',
        'User reviews extracted prompt components with confidence scores and suggestions',
        'User refines and customizes generated prompts using interactive editing tools',
        'User tests generated prompts with different AI models for accuracy validation',
        'User saves successful prompts to library with original image reference links',
        'User creates prompt variations based on analyzed style elements and parameters'
      ]}
      features={[
        'Advanced computer vision analysis for style, composition, and technical parameters',
        'Multi-modal prompt generation supporting various AI model formats and requirements',
        'Interactive prompt refinement with component-level editing and confidence indicators',
        'Batch image analysis for consistent style extraction across image sets',
        'Style transfer capabilities for applying analyzed styles to new prompt creations',
        'Integration with prompt library for seamless saving and organization',
        'Comparative analysis showing original vs generated results for accuracy assessment'
      ]}
      interactions={{
        forms: ['Image upload interface', 'Analysis settings panel', 'Prompt refinement editor', 'Batch processing controls'],
        actions: ['Upload images', 'Analyze style', 'Refine prompts', 'Test generation', 'Save to library', 'Create variations'],
        displays: ['Image preview panels', 'Analysis result breakdowns', 'Prompt component editors', 'Confidence indicators', 'Comparison galleries']
      }}
      category="Prompt System"
      prismaModels={['Prompt', 'Media', 'AiModel', 'PromptTemplate']}
      dataDescription={[
        'Prompt - Save analyzed prompts extracted from uploaded images',
        'Media - Store uploaded reference images for analysis',
        'AiModel - Use vision-capable AI models for image analysis',
        'PromptTemplate - Match analyzed elements to existing templates'
      ]}
    />
  )
}