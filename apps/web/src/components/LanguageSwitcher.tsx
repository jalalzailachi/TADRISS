'use client'

import { setLocale } from '@/app/actions/locale'
import { useTransition } from 'react'
import { useLocale } from 'next-intl'

const LANGUAGES = [
  { code: 'ar', label: 'عربي', flag: '🇲🇦' },
  { code: 'fr', label: 'FR',   flag: '🇫🇷' },
  { code: 'en', label: 'EN',   flag: '🇬🇧' },
] as const

type LocaleCode = typeof LANGUAGES[number]['code']

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const current = useLocale() as LocaleCode
  const [isPending, startTransition] = useTransition()

  // Compact mode: single globe icon button that cycles to the next locale
  if (compact) {
    const currentIndex = LANGUAGES.findIndex(l => l.code === current)
    const nextLang = LANGUAGES[(currentIndex + 1) % LANGUAGES.length]
    return (
      <button
        disabled={isPending}
        onClick={() => startTransition(() => setLocale(nextLang.code))}
        className={`
          w-10 h-10 flex items-center justify-center rounded-xl
          bg-surface-container-low border border-outline-variant/5
          text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high
          transition-all duration-200 font-bold text-[10px] uppercase tracking-widest
          ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={`Switch to ${nextLang.label}`}
      >
        <span className="material-symbols-outlined text-[18px]">translate</span>
      </button>
    )
  }

  // Full mode: 3-button pill switcher
  return (
    <div className="flex items-center bg-surface-container-low border border-outline-variant/10 rounded-xl p-1 h-10 w-full shadow-inner overflow-hidden">
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          disabled={isPending}
          onClick={() => startTransition(() => setLocale(lang.code))}
          className={`
            relative z-10 flex-1 flex items-center justify-center h-full px-2
            text-[11px] font-bold transition-all duration-300 uppercase tracking-tight rounded-lg
            ${current === lang.code
              ? 'bg-primary text-white shadow-sm scale-[1.02]'
              : 'text-outline hover:text-on-surface hover:bg-surface-container-high/50'
            }
            ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={lang.code === 'ar' ? 'العربية' : lang.code === 'fr' ? 'Français' : 'English'}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
