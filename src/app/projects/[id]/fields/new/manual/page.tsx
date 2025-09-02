import { notFound } from 'next/navigation'
import { getProjectById } from '@/app/actions/project-detail'
import ManualFieldCreation from '@/components/fields/ManualFieldCreation'

interface ManualFieldCreationPageProps {
  params: Promise<{ id: string }>
}

export default async function ManualFieldCreationPage({ params }: ManualFieldCreationPageProps) {
  const { id } = await params
  
  try {
    const projectResult = await getProjectById(id)

    if (!projectResult.project) {
      notFound()
    }

    const project = projectResult.project

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ManualFieldCreation project={project} />
      </div>
    )
  } catch (error) {
    console.error('Failed to load manual field creation page:', error)
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
      title: `Create Field - ${projectResult.project.name}`,
      description: `Manually create a new field for ${projectResult.project.name}`,
    }
  } catch (error) {
    return {
      title: 'Create Field',
      description: 'Create a new field for your project'
    }
  }
}