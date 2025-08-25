import PlaceholderPage from '@/components/PlaceholderPage'

export default function EditProjectPage() {
  return (
    <PlaceholderPage
      title="Edit Project"
      description="Comprehensive project configuration interface for updating metadata, team settings, and project parameters"
      userFlow={[
        'User accesses edit mode from project detail page or settings menu',
        'User updates basic project information (name, description, goals)',
        'User modifies project type and associated default configurations',
        'User manages team access by adding/removing members and adjusting roles',
        'User configures project visibility and sharing permissions',
        'User updates generation preferences and AI model settings',
        'User reviews all changes in a summary panel before saving',
        'User saves changes with confirmation and returns to project detail view'
      ]}
      features={[
        'Live preview of changes with before/after comparison',
        'Team member management with role-based access control',
        'Project type migration with automatic field mapping',
        'Bulk configuration updates with validation',
        'Change history tracking with rollback capabilities',
        'Advanced settings for generation preferences and limits'
      ]}
      interactions={{
        forms: ['Project metadata form', 'Team member roles editor', 'Settings configuration panel'],
        actions: ['Save changes', 'Reset to defaults', 'Add team member', 'Change project type', 'Archive project'],
        displays: ['Change preview', 'Team member cards', 'Settings tabs', 'Validation messages', 'Confirmation dialogs']
      }}
      category="Core Pages"
      prismaModels={['Project', 'ProjectType', 'Team', 'TeamProject']}
      dataDescription={[
        'Project - Load current project data for editing form',
        'ProjectType - Allow changing project type and associated settings',
        'Team - Manage team access and permissions',
        'TeamProject - Update project sharing and collaboration settings'
      ]}
    />
  )
}