import { createClient } from './supabase/server';

export interface Subscription {
  id: string;
  tier: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  max_students: number;
}

export async function getSubscription() {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('id, tier, status, max_students, current_period_end')
    .single();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return subscription;
}

export async function checkStudentLimit() {
  const supabase = await createClient();

  const [sub, studentCountRes] = await Promise.all([
    getSubscription(),
    // RLS scopes this to the calling user's institution automatically
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .is('deleted_at', null)
  ]);

  if (!sub) return { allowed: true }; // Fallback or strict? Let's say lenient for now but log.
  
  const currentCount = studentCountRes.count || 0;
  
  if (currentCount >= sub.max_students) {
    return { 
      allowed: false, 
      message: `Student limit reached (${currentCount}/${sub.max_students}). Please upgrade your plan.` 
    };
  }

  return { allowed: true, current: currentCount, max: sub.max_students };
}

/**
 * Server Action wrapper for subscription-gated features
 */
export async function withSubscriptionCheck<T>(
  action: () => Promise<T>,
  check: () => Promise<{ allowed: boolean; message?: string }>
): Promise<T | { error: string }> {
  const { allowed, message } = await check();
  
  if (!allowed) {
    return { error: message || 'Subscription limit reached.' };
  }
  
  return action();
}
