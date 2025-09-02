import { notFound } from 'next/navigation'
import { getFieldWithFullDetails } from '@/app/actions/field-detail'
import FieldDetailLayout from '@/components/fields/detail/FieldDetailLayout'

interface FieldDetailPageProps {
  params: {
    id: string
    fieldId: string
  }
}

export default async function FieldDetailPage({ params }: FieldDetailPageProps) {
  const { field, error } = await getFieldWithFullDetails(params.fieldId)

  if (error || !field) {
    notFound()
  }

  // Verify field belongs to the project
  if (field.projectId !== params.id) {
    notFound()
  }

  return <FieldDetailLayout field={field} />
}