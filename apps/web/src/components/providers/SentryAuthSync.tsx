'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/client'

export function SentryAuthSync() {
  const supabase = createClient()

  useEffect(() => {
    async function syncUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Tag with metadata but mask PII (email is already masked in beforeSend, but we avoid it here too)
        Sentry.setTag("user_role", user.user_metadata?.role || 'unknown')
        Sentry.setTag("institution_id", user.user_metadata?.institution_id || 'unknown')
        
        Sentry.setUser({
          id: user.id,
          // We don't set email here for privacy, Sentry will use the ID
        })
      } else {
        Sentry.setUser(null)
      }
    }

    syncUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        Sentry.setTag("user_role", session.user.user_metadata?.role || 'unknown')
        Sentry.setTag("institution_id", session.user.user_metadata?.institution_id || 'unknown')
        Sentry.setUser({ id: session.user.id })
      } else {
        Sentry.setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return null
}
