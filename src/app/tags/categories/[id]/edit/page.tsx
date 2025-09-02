import { notFound } from 'next/navigation'
import prisma from '@/lib/db/prisma'
import TagCategoryForm from '@/components/tags/TagCategoryForm'

interface CategoryEditPageProps {
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

export default async function CategoryEditPage({ params }: CategoryEditPageProps) {
  const category = await getCategoryById(params.id)

  if (!category) {
    notFound()
  }

  return <TagCategoryForm mode="edit" initialData={category} />
}