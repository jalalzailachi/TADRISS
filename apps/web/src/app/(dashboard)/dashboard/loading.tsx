export default function Loading() {
  return (
    <div className="space-y-8 page-enter">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-4 w-32 skeleton" />
          <div className="h-10 w-72 skeleton" />
          <div className="h-4 w-48 skeleton" />
        </div>
        <div className="flex gap-3">
          <div className="h-12 w-12 skeleton rounded-2xl" />
          <div className="h-12 w-40 skeleton rounded-2xl" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-in">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-8 rounded-3xl border border-outline-variant/5 space-y-6">
            <div className="flex justify-between">
              <div className="w-14 h-14 skeleton rounded-2xl" />
              <div className="w-16 h-6 skeleton rounded-md" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 skeleton" />
              <div className="h-10 w-20 skeleton" />
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-8">
          <div className="h-[420px] skeleton rounded-[48px]" />
          <div className="p-10 rounded-[40px] border border-outline-variant/5 space-y-6">
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="h-6 w-40 skeleton" />
                <div className="h-3 w-56 skeleton" />
              </div>
              <div className="h-10 w-24 skeleton rounded-xl" />
            </div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-6 p-5">
                <div className="w-14 h-14 skeleton rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 skeleton" />
                  <div className="h-3 w-56 skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-8">
          <div className="h-[340px] skeleton rounded-2xl" />
          <div className="h-[200px] skeleton rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
