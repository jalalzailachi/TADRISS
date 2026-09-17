export default function Loading() {
  return (
    <div className="space-y-8 page-enter">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-3 w-20 skeleton" />
          <div className="h-8 w-48 skeleton" />
          <div className="h-3 w-64 skeleton" />
        </div>
        <div className="flex gap-3">
          <div className="h-11 w-64 skeleton rounded-2xl hidden md:block" />
          <div className="h-11 w-40 skeleton rounded-2xl" />
        </div>
      </div>

      {/* Tab switcher skeleton */}
      <div className="h-12 w-80 skeleton rounded-2xl" />

      {/* Stats row skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-in">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 rounded-3xl border border-outline-variant/5 space-y-4">
            <div className="flex justify-between">
              <div className="w-10 h-10 skeleton rounded-xl" />
              <div className="w-16 h-5 skeleton rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-24 skeleton" />
              <div className="h-8 w-28 skeleton" />
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-outline-variant/5 overflow-hidden">
        <div className="h-14 skeleton rounded-none" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-8 py-5 border-t border-outline-variant/5">
            <div className="w-10 h-10 skeleton rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 skeleton" />
              <div className="h-2.5 w-20 skeleton" />
            </div>
            <div className="h-4 w-20 skeleton" />
            <div className="h-4 w-24 skeleton" />
            <div className="h-6 w-20 skeleton rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
