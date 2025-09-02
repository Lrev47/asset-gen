'use client'

import GenerationWorkspace from './workspaces/GenerationWorkspace'
import MediaGalleryWorkspace from './workspaces/MediaGalleryWorkspace'
import PromptsWorkspace from './workspaces/PromptsWorkspace'
import AnalyticsWorkspace from './workspaces/AnalyticsWorkspace'
import SettingsWorkspace from './workspaces/SettingsWorkspace'
import type { FieldWithFullDetails } from '@/app/actions/field-detail'
import type { WorkspaceMode } from './FieldDetailLayout'

interface FieldWorkspaceProps {
  field: FieldWithFullDetails
  mode: WorkspaceMode
}

export default function FieldWorkspace({ field, mode }: FieldWorkspaceProps) {
  return (
    <div className="h-full w-full bg-background">
      {mode === 'generate' && <GenerationWorkspace field={field} />}
      {mode === 'gallery' && <MediaGalleryWorkspace field={field} />}
      {mode === 'prompts' && <PromptsWorkspace field={field} />}
      {mode === 'analytics' && <AnalyticsWorkspace field={field} />}
      {mode === 'settings' && <SettingsWorkspace field={field} />}
    </div>
  )
}