import { notFound } from 'next/navigation'
import { 
  getProjectById, 
  getProjectMetrics, 
  getRecentActivity,
  exportProjectData
} from '@/app/actions/project-detail'
import ProjectHeader from '@/components/projects/detail/ProjectHeader'
import ProjectTabs from '@/components/projects/detail/ProjectTabs'

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ProjectDetailPage({ 
  params, 
  searchParams 
}: ProjectDetailPageProps) {
  const { id } = await params
  const { tab } = await searchParams
  
  try {
    // Fetch all project data in parallel
    const [projectResult, metrics, recentActivity] = await Promise.all([
      getProjectById(id),
      getProjectMetrics(id),
      getRecentActivity(id)
    ])

    if (!projectResult.project) {
      notFound()
    }

    const project = projectResult.project

    // Server actions for header interactions
    const handleExport = async (format: 'json' | 'csv') => {
      'use server'
      const result = await exportProjectData(id, format)
      // TODO: Handle success/error states, trigger download, etc.
      console.log('Export result:', result)
    }

    const handleArchive = async () => {
      'use server'
      // TODO: Implement archive functionality
      console.log('Archive project:', id)
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Project Header */}
          <ProjectHeader
            project={project}
            metrics={metrics}
            onExport={handleExport}
            onArchive={handleArchive}
          />

          {/* Project Tabs */}
          <ProjectTabs
            project={project}
            metrics={metrics}
            recentActivity={recentActivity}
            defaultTab={tab || 'overview'}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Failed to load project:', error)
    notFound()
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  try {
    const projectResult = await getProjectById(id)
    
    if (!projectResult.project) {
      return {
        title: 'Project Not Found',
        description: 'The requested project could not be found.'
      }
    }

    return {
      title: `${projectResult.project.name} - Asset Generator Studio`,
      description: projectResult.project.description || `Manage and generate assets for ${projectResult.project.name}`,
      openGraph: {
        title: projectResult.project.name,
        description: projectResult.project.description || `Asset generation project`,
        type: 'website',
      },
    }
  } catch (error) {
    return {
      title: 'Asset Generator Studio',
      description: 'AI-powered asset generation platform'
    }
  }
}