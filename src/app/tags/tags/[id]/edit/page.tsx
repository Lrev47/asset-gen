import { notFound } from 'next/navigation'
import prisma from '@/lib/db/prisma'
import TagForm from '@/components/tags/TagForm'

interface TagEditPageProps {
  params: { id: string }
}

async function getTagById(id: string) {
  try {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        category: true
      }
    })
    return tag
  } catch (error) {
    console.error('Error fetching tag:', error)
    return null
  }
}

export default async function TagEditPage({ params }: TagEditPageProps) {
  const tag = await getTagById(params.id)

  if (!tag) {
    notFound()
  }

  return <TagForm mode="edit" initialData={tag} />
}