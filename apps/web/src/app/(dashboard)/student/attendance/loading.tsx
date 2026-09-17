export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-surface-container rounded-lg w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-surface-container rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-12 bg-surface-container rounded-lg" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-surface-container rounded-lg" />
        ))}
      </div>
    </div>
  );
}
