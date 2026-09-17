export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-6 bg-surface-container rounded-lg w-16" />
        <div className="h-8 bg-surface-container rounded-lg w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-surface-container rounded-xl" />
        ))}
      </div>
      <div className="h-10 bg-surface-container rounded-lg w-80" />
      <div className="h-72 bg-surface-container rounded-xl" />
    </div>
  );
}
