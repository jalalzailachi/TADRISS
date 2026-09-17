'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // Standard next-themes hydration guard: theme is only known client-side,
  // so we flip `mounted` after the first paint to avoid an SSR/client mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-9 h-9" />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="
        w-full h-full rounded-xl border border-outline-variant/5 bg-surface-container-low
        flex items-center justify-center
        text-outline hover:text-on-surface
        hover:bg-surface-container-high transition-all duration-200
      "
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <span className="material-symbols-outlined text-lg">light_mode</span>
      ) : (
        <span className="material-symbols-outlined text-lg">dark_mode</span>
      )}
    </button>
  )
}
