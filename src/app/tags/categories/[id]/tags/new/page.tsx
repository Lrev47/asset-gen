import { notFound } from 'next/navigation'
import prisma from '@/lib/db/prisma'
import TagForm from '@/components/tags/TagForm'

interface NewTagPageProps {
  params: { id: string }
}

async function getCategoryById(id: string) {
  try {
    const category = await prisma.tagCategory.findUnique({
      where: { id }
    })
    return category
  } catch (error) {
    console.error('Error fetching category:', error)
    return null
  }
}

export default async function NewTagPage({ params }: NewTagPageProps) {
  const category = await getCategoryById(params.id)

  if (!category) {
    notFound()
  }

  return <TagForm mode="create" categoryId={params.id} />
}