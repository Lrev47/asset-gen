import PlaceholderPage from '@/components/PlaceholderPage'

export default function EditPromptPage() {
  return (
    <PlaceholderPage
      title="Edit Prompt"
      description="Advanced prompt editing environment with version control, collaborative editing, and real-time performance validation for optimizing existing prompts"
      userFlow={[
        'User loads existing prompt into advanced editor with complete revision history',
        'User modifies prompt structure using intelligent editing tools with syntax assistance',
        'User utilizes AI-powered suggestions for improving prompt effectiveness and clarity',
        'User tests modifications in real-time with multiple AI models and instant feedback',
        'User compares current version with previous versions using side-by-side diff viewing',
        'User collaborates with team members through integrated comments and suggestion system',
        'User validates changes with performance metrics and success rate predictions',
        'User saves updated prompt with detailed change logs and version tagging'
      ]}
      features={[
        'Advanced JSON editor with intelligent autocomplete and syntax validation',
        'Version control system with detailed change tracking and rollback capabilities',
        'Real-time collaborative editing with conflict resolution and team synchronization',
        'AI-powered editing assistance with context-aware improvement suggestions',
        'Live prompt testing with instant generation previews and performance feedback',
        'Side-by-side version comparison with visual diff highlighting and merge tools',
        'Performance prediction analytics showing impact of changes on success rates'
      ]}
      interactions={{
        forms: ['Advanced JSON editor', 'Version comparison interface', 'Collaboration comment system', 'Change validation panel'],
        actions: ['Save changes', 'Test modifications', 'Compare versions', 'Revert changes', 'Add comments', 'Merge suggestions'],
        displays: ['Syntax-highlighted editor', 'Version diff viewer', 'Real-time preview results', 'Performance impact indicators', 'Collaboration sidebar']
      }}
      category="Prompt System"
      prismaModels={['Prompt', 'PromptTemplate', 'MediaType', 'AiModel']}
      dataDescription={[
        'Prompt - Load existing prompt data for editing with version control',
        'PromptTemplate - Allow changing base template structure',
        'MediaType - Update media type compatibility and parameters',
        'AiModel - Test prompt changes with compatible AI models'
      ]}
    />
  )
}