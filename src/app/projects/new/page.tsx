import PlaceholderPage from '@/components/PlaceholderPage'

export default function CreateProjectPage() {
  return (
    <PlaceholderPage
      title="Create New Project"
      description="Guided project creation wizard with templates, team setup, and initial configuration for rapid project initialization"
      userFlow={[
        'User clicks "Create New Project" and enters the guided setup wizard',
        'User selects project type from templates (Website, App, Campaign, Brand Kit, etc.)',
        'User fills in basic project information (name, description, goals)',
        'User configures team settings and invites collaborators with role assignments',
        'User selects media types needed (images, videos, audio, documents)',
        'User defines initial project fields and requirements',
        'User reviews all settings and creates the project with confirmation',
        'User is redirected to the new project dashboard to begin work'
      ]}
      features={[
        'Multi-step wizard with progress indicator',
        'Pre-built project templates for common use cases',
        'Team collaboration setup with role-based permissions',
        'Custom field definition and requirement specification',
        'Media type configuration with generation parameters',
        'Project goal setting and success metrics definition'
      ]}
      interactions={{
        forms: ['Project details form', 'Team member invitation', 'Custom field builder', 'Media type selector'],
        actions: ['Select template', 'Invite team members', 'Add custom fields', 'Create project', 'Save as draft'],
        displays: ['Progress stepper', 'Template gallery', 'Team member cards', 'Field preview', 'Configuration summary']
      }}
      category="Core Pages"
      prismaModels={['ProjectType', 'User', 'Team']}
      dataDescription={[
        'ProjectType - Load available project templates and default field configurations',
        'User - Set project ownership and initial permissions',
        'Team - Optionally assign project to team with collaborative access'
      ]}
    />
  )
}