import { notFound } from 'next/navigation'
import { getProjectById } from '@/app/actions/project-detail'
import { getProjectFields } from '@/app/actions/fields'
import FieldManagementDashboard from '@/components/fields/FieldManagementDashboard'

interface FieldManagementPageProps {
  params: Promise<{ id: string }>
}

export default async function FieldManagementPage({ params }: FieldManagementPageProps) {
  const { id } = await params
  
  try {
    // Fetch project and fields data
    const [projectResult, fieldsResult] = await Promise.all([
      getProjectById(id),
      getProjectFields(id)
    ])

    if (!projectResult.project) {
      notFound()
    }

    const project = projectResult.project
    const fields = fieldsResult.fields

    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <FieldManagementDashboard 
          project={project}
          fields={fields}
        />
      </div>
    )
  } catch (error) {
    console.error('Failed to load field management page:', error)
    notFound()
  }
}

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
      title: `Field Management - ${projectResult.project.name}`,
      description: `Manage fields and content requirements for ${projectResult.project.name}`,
    }
  } catch (error) {
    return {
      title: 'Field Management',
      description: 'Manage project fields and content requirements'
    }
  }
}