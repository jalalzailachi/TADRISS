export default function Loading() {
  return (
    <div className="px-6 md:px-12 py-8 space-y-4">
      <div className="skeleton h-8 w-40" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-96 w-full" />
    </div>
  );
}
