export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-56" />
      <div className="grid grid-cols-3 gap-4">
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
      </div>
    </div>
  );
}
