export default function Loading() {
  return (
    <div className="px-6 md:px-12 py-8 space-y-4">
      <div className="skeleton h-8 w-40" />
      <div className="grid grid-cols-12 gap-4">
        <div className="skeleton h-[500px] col-span-9" />
        <div className="skeleton h-[500px] col-span-3" />
      </div>
    </div>
  );
}
