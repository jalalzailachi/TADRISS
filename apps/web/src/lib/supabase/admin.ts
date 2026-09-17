/**
 * Supabase Admin Client (Server-only)
 * Uses SUPABASE_SERVICE_ROLE_KEY — bypasses RLS.
 * NEVER import this in client components or expose to the browser.
 */
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
