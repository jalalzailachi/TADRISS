export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-surface-container rounded-lg w-48" />
      <div className="flex gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-surface-container rounded-lg w-24" />
        ))}
      </div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-surface-container rounded w-32" />
            <div className="h-10 bg-surface-container rounded-lg" />
          </div>
        ))}
      </div>
      <div className="h-10 bg-surface-container rounded-lg w-28" />
    </div>
  );
}
