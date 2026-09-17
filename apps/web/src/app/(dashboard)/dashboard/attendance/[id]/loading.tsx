export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 w-24 bg-surface-container-high rounded" />
        <div className="h-8 w-64 bg-surface-container-high rounded" />
        <div className="h-4 w-48 bg-surface-container-high rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4">
            <div className="h-3 w-16 bg-surface-container-high rounded mb-3" />
            <div className="h-7 w-12 bg-surface-container-high rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-outline-variant/5">
            <div className="w-9 h-9 bg-surface-container-high rounded-lg" />
            <div className="h-4 w-32 bg-surface-container-high rounded" />
            <div className="ms-auto flex gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-8 w-16 bg-surface-container-high rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
