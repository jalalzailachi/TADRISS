'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteClass(classId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
      .from('profiles').select('role, institution_id')
      .eq('id', user.id).single()

    if (profile?.role !== 'institution_admin') return { error: 'Unauthorized' }

    const { error } = await supabase.rpc('delete_class_cascade', {
      p_class_id: classId,
      p_institution_id: profile.institution_id,
    })

    if (error) {
      console.error('[deleteClass]', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard/classes')
    return { success: true }
  } catch {
    return { error: 'Failed to delete class' }
  }
}
