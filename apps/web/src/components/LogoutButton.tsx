'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function LogoutButton({ showLabel = true }: { showLabel?: boolean }) {
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('nav')

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className={`
        flex items-center gap-3 h-10 rounded-xl text-sm font-bold
        text-error hover:bg-error/10 transition-all duration-200
        ${showLabel ? 'px-3 w-full' : 'w-10 justify-center'}
      `}
      title={showLabel ? '' : t('logout')}
    >
      <span className="material-symbols-outlined text-[20px]">logout</span>
      {showLabel && <span className="whitespace-nowrap">{t('logout')}</span>}
    </button>
  )
}
