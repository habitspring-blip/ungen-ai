export default function Shimmer() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-3 bg-surface-2 rounded"></div>
      <div className="h-3 bg-surface-2 rounded w-5/6"></div>
      <div className="h-3 bg-surface-2 rounded w-4/6"></div>
    </div>
  );
}
