'use client'

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-on-surface">Something went wrong</h2>
          <p className="text-sm text-outline font-medium">
            An unexpected error occurred. Please try again.
          </p>
        </div>
        <button
          onClick={reset}
          className="h-11 px-8 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
