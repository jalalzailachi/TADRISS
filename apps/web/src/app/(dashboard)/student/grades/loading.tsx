export default function Loading() {
  return (
    <div className="px-6 md:px-12 py-8 space-y-4">
      <div className="skeleton h-8 w-40" />
      <div className="skeleton h-64 w-full" />
    </div>
  );
}
