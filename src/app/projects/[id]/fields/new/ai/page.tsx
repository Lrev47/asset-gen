import { notFound } from 'next/navigation'
import { getProjectById } from '@/app/actions/project-detail'
import AIFieldGeneration from '@/components/fields/AIFieldGeneration'

interface AIFieldGenerationPageProps {
  params: Promise<{ id: string }>
}

export default async function AIFieldGenerationPage({ params }: AIFieldGenerationPageProps) {
  const { id } = await params
  
  try {
    const projectResult = await getProjectById(id)

    if (!projectResult.project) {
      notFound()
    }

    const project = projectResult.project

    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <AIFieldGeneration project={project} />
      </div>
    )
  } catch (error) {
    console.error('Failed to load AI field generation page:', error)
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
      title: `Generate Fields with AI - ${projectResult.project.name}`,
      description: `Use AI to generate fields for ${projectResult.project.name}`,
    }
  } catch (error) {
    return {
      title: 'Generate Fields with AI',
      description: 'Use AI to generate fields for your project'
    }
  }
}