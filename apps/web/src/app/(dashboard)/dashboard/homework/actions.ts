'use server'

import { createClient } from '@/lib/supabase/server'
import { getErrorMessage } from '@/lib/errors'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const homeworkSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  class_id:    z.string().uuid('Invalid class selection'),
  due_date:    z.string().optional().or(z.literal('')),
})

async function getActor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, institution_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['institution_admin', 'teacher'].includes(profile.role)) {
    throw new Error('Unauthorized')
  }
  return { supabase, profile }
}

export async function createHomework(formData: FormData) {
  try {
    const raw = {
      title:       formData.get('title'),
      description: formData.get('description'),
      class_id:    formData.get('class_id'),
      due_date:    formData.get('due_date'),
    }
    const parsed = homeworkSchema.safeParse(raw)
    if (!parsed.success) return { error: parsed.error.errors[0].message }

    const { supabase, profile } = await getActor()

    const { error } = await supabase.from('homework').insert({
      title:          parsed.data.title,
      description:    parsed.data.description,
      class_id:       parsed.data.class_id,
      institution_id: profile.institution_id,
      teacher_id:     profile.id,
      due_date:       parsed.data.due_date || null,
    })

    if (error) return { error: error.message }
    revalidatePath('/dashboard/homework')
    return { success: true }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}

export async function updateHomework(homeworkId: string, formData: FormData) {
  try {
    const parsed = homeworkSchema.safeParse({
      title:       formData.get('title'),
      description: formData.get('description'),
      class_id:    formData.get('class_id'),
      due_date:    formData.get('due_date'),
    })
    if (!parsed.success) return { error: parsed.error.errors[0].message }

    const { supabase, profile } = await getActor()

    const { error } = await supabase.from('homework').update({
      title:       parsed.data.title,
      description: parsed.data.description,
      class_id:    parsed.data.class_id,
      due_date:    parsed.data.due_date || null,
    })
    .eq('id', homeworkId)
    .eq('institution_id', profile.institution_id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/homework')
    return { success: true }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}

export async function deleteHomework(homeworkId: string) {
  try {
    const { supabase, profile } = await getActor()
    const { error } = await supabase.from('homework')
      .delete()
      .eq('id', homeworkId)
      .eq('institution_id', profile.institution_id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/homework')
    return { success: true }
  } catch (err) {
    return { error: getErrorMessage(err) }
  }
}
