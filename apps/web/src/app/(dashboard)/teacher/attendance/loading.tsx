export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-surface-container rounded-lg w-48" />
      <div className="flex gap-3">
        <div className="h-10 bg-surface-container rounded-lg w-40" />
        <div className="h-10 bg-surface-container rounded-lg w-32" />
      </div>
      <div className="space-y-3">
        <div className="h-12 bg-surface-container rounded-lg" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 bg-surface-container rounded-lg" />
        ))}
      </div>
    </div>
  );
}
