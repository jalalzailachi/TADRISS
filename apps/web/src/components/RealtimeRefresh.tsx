'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function RealtimeRefresh({
  table,
  filter,
}: {
  table: string
  filter?: string
}) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}:${filter || 'all'}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table, filter },
        () => {
          console.log(`[RealtimeRefresh] ${table} changed, refreshing...`)
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, router, supabase])

  return null
}
