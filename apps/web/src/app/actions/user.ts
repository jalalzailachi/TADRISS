'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ActionResponse } from '@/types/actions';

const addUserSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string().max(20).optional().or(z.literal('')),
  password: z.string().min(6).optional(),
});

export async function addTeacher(formData: {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}): Promise<ActionResponse> {
  return addUser(formData, 'teacher');
}

export async function addStudent(formData: {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}): Promise<ActionResponse> {
  return addUser(formData, 'student');
}

// Keep the original createUserAction for compatibility with existing UI if needed, 
// or refactor it to use the new addUser logic.
export async function createUserAction(formData: {
  email: string;
  first_name: string;
  last_name: string;
  role: 'teacher' | 'student';
  phone?: string;
}): Promise<ActionResponse> {
  return addUser(formData, formData.role);
}

async function addUser(data: unknown, role: 'teacher' | 'student'): Promise<ActionResponse> {
  try {
    const parsed = addUserSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: 'Données invalides' };
    }

    const supabase = await createClient();
    const { data: { user: caller }, error: callerError } = await supabase.auth.getUser();

    if (callerError || !caller) {
      console.error('[addUser] Caller not authorized:', callerError);
      return { success: false, error: 'Non autorisé' };
    }

    // Get admin profile directly from DB to be safe
    const { data: adminProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('institution_id, role')
      .eq('id', caller.id)
      .single();

    if (profileFetchError || !adminProfile || adminProfile.role !== 'institution_admin') {
      console.error('[addUser] Unauthorized role/institution:', profileFetchError, adminProfile);
      return { success: false, error: 'Accès refusé: administrateur uniquement' };
    }

    const institutionId = adminProfile.institution_id;
    const adminClient = await createAdminClient();

    // Force production URL in server actions
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://84.8.223.50:3000';
    if (appUrl.includes('localhost')) {
      appUrl = 'http://84.8.223.50:3000';
    }
    
    // 1. Check if email already exists in profiles
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', parsed.data.email)
      .single();

    if (existingProfile) {
      return { success: false, error: 'Cet e-mail est déjà utilisé dans le système.' };
    }

    const tempPassword = (data as { password?: string }).password || 'Tadriss2026!';

    // 2. Create Auth User with temporary password
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
      },
      app_metadata: {
        institution_id: institutionId,
        role,
      }
    });

    if (authError) {
       console.error(`[add${role}] createUser error:`, authError);
       if (authError.message.toLowerCase().includes('already registered') || authError.status === 422) {
         return { success: false, error: 'Cet e-mail est déjà enregistré.' };
       }
       return { success: false, error: authError.message };
    }

    const newUser = authData.user;

    // 3. Create Profile
    const { error: insertError } = await adminClient
      .from('profiles')
      .upsert({
        id: newUser.id,
        institution_id: institutionId,
        role,
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        email: parsed.data.email,
        phone: (data as { phone?: string }).phone || null,
        requires_password_change: true,
        must_change_password: true,
      });

    if (insertError) {
      console.error('[addUser] Profile insertion error:', insertError);
      await adminClient.auth.admin.deleteUser(newUser.id);
      return { success: false, error: `Erreur lors de la création du profil: ${insertError.message}` };
    }

    revalidatePath('/dashboard/teachers');
    revalidatePath('/dashboard/students');

    return { 
      success: true, 
      password: tempPassword,
      message: `${role === 'teacher' ? 'Enseignant' : 'Élève'} créé avec succès.`
    };
  } catch (err) {
    console.error('[addUser] Unexpected fatal error:', err);
    return { success: false, error: 'Une erreur inattendue est survenue' };
  }
}

export async function resendInvite(profileId: string): Promise<ActionResponse> {
  'use server'
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    // Verify caller is admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role, institution_id')
      .eq('id', user.id)
      .single()
    if (adminProfile?.role !== 'institution_admin') return { success: false, error: 'Accès refusé' }

    // Get target user — must belong to same institution
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('email, institution_id, role')
      .eq('id', profileId)
      .single()

    if (!targetProfile || targetProfile.institution_id !== adminProfile.institution_id) {
      return { success: false, error: 'Utilisateur non trouvé' }
    }

    const adminClient = await createAdminClient()
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://84.8.223.50:3000'
    if (appUrl.includes('localhost')) {
      appUrl = 'http://84.8.223.50:3000'
    }
    
    // Normalize URL
    const baseUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
    const nextRoute = targetProfile.role === 'institution_admin' ? '/dashboard' : `/${targetProfile.role}`;
    const redirectTo = `${baseUrl}/auth/callback?next=${nextRoute}`

    // Try invite first
    let tokenHash: string | null = null
    let linkType: 'invite' | 'recovery' = 'invite'

    try {
      const { data, error } = await adminClient.auth.admin.generateLink({
        type: 'invite',
        email: targetProfile.email,
        options: { redirectTo }
      })
      if (!error && data?.properties?.hashed_token) {
        tokenHash = data.properties.hashed_token
        linkType = 'invite'
      }
    } catch {
      // User already exists — fall through to recovery link
    }

    // Fallback: generate a password reset link
    if (!tokenHash) {
      const { data, error } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: targetProfile.email,
        options: { redirectTo }
      })
      if (error) {
        console.error('[resendInvite] recovery link error:', error)
        return { success: false, error: error.message }
      }
      tokenHash = data?.properties?.hashed_token ?? null
      linkType = 'recovery'
    }

    if (!tokenHash) return { success: false, error: 'Échec de la génération du lien d\'invitation' }

    // Construct manual link: baseUrl/auth/callback?token_hash=HASH&type=TYPE&next=PATH
    const manualLink = `${baseUrl}/auth/callback?token_hash=${tokenHash}&type=${linkType}&next=${nextRoute}`;

    // Mark as requires_password_change again in case they never set it
    await adminClient
      .from('profiles')
      .update({ requires_password_change: true })
      .eq('id', profileId)

    return {
      success: true,
      message: `Invitation renvoyée à ${targetProfile.email}`,
      inviteLink: manualLink,
    }

  } catch (err) {
    console.error('[resendInvite] unexpected:', err)
    return { success: false, error: 'Échec du renvoi de l\'invitation. Veuillez réessayer.' }
  }
}

export async function addEnrollmentFee(formData: FormData): Promise<ActionResponse> {
  try {
    // 1. Verify admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorisé' }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('institution_id, role')
      .eq('id', user.id)
      .single()
      
    if (adminProfile?.role !== 'institution_admin') return { success: false, error: 'Accès refusé' }

    // 2. Read and validate all required fields
    const studentId = formData.get('student_id') as string | null
    const amount = formData.get('amount') as string | null
    const label = formData.get('label') as string | null
    const classId = formData.get('class_id') as string | null

    // Validate
    if (!studentId) return { success: false, error: 'L\'élève est requis. Veuillez sélectionner un élève.' }
    if (!amount || isNaN(Number(amount))) return { success: false, error: 'Un montant valide est requis.' }

    // 3. Verify student belongs to admin's institution
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('id, institution_id')
      .eq('id', studentId)
      .single()

    if (!studentProfile || studentProfile.institution_id !== adminProfile.institution_id) {
      return { success: false, error: 'Élève non trouvé dans votre établissement.' }
    }

    // 4. Insert fee
    const adminClient = await createAdminClient()

    const { error: insertError } = await adminClient
      .from('enrollment_fees')
      .insert({
        student_id: studentId,
        institution_id: adminProfile.institution_id,
        amount: Number(amount),
        label: label ?? '',
        class_id: classId || null,
        period_type: 'monthly', // Default
      })

    if (insertError) {
      console.error('[addFee] insert error:', insertError)
      return { success: false, error: insertError.message }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }

  } catch (err) {
    console.error('[addFee] unexpected:', err)
    return { success: false, error: 'Une erreur inattendue est survenue.' }
  }
}

export async function getClassesWithCounts(): Promise<ActionResponse> {
  try {
    const adminClient = await createAdminClient();
    // No select('*') — name columns explicitly
    const { data, error } = await adminClient
      .from('classes')
      .select(`
        id, name, subject, level, is_active, institution_id, created_at,
        class_students(student_id, profiles:student_id(id, first_name, last_name)),
        class_teachers(teacher_id, profiles:teacher_id(id, first_name, last_name))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      subject: c.subject ?? '',
      level: c.level ?? '',
      is_active: c.is_active,
      students: (c.class_students ?? []).map((cs: { profiles: unknown }) => cs.profiles).filter(Boolean),
      teachers: (c.class_teachers ?? []).map((ct: { profiles: unknown }) => ct.profiles).filter(Boolean),
    }));

    return { success: true, classes: mapped };
  } catch (err) {
    console.error('[getClassesWithCounts] error:', err);
    return { success: false, error: 'Failed to fetch classes' };
  }
}

export async function getStudentDashboardData(userId: string): Promise<ActionResponse> {
  try {
    // Verify the caller is the user whose data is being requested
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return { success: false, error: 'Non autorisé' };
    }

    const adminClient = await createAdminClient();

    const { data: profile, error } = await adminClient
      .from('profiles')
      .select(`
        class_students(
          class:classes(
            id, name,
            students:class_students(count),
            teachers:class_teachers(count)
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;

    const mappedClasses = (profile?.class_students || []).map((cs) => {
      const classData = cs.class as unknown as { 
        id: string; 
        name: string; 
        students: { count: number }[]; 
        teachers: { count: number }[] 
      };
      return {
        id: classData.id,
        name: classData.name,
        student_count: classData.students?.[0]?.count ?? 0,
        teacher_count: classData.teachers?.[0]?.count ?? 0,
      };
    });

    return { success: true, classes: mappedClasses, stats: { classes: mappedClasses.length, attendance: 0 } };
  } catch (err) {
    console.error('[getStudentDashboardData] error:', err);
    return { success: false, error: 'Failed to fetch dashboard data' };
  }
}
