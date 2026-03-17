export default function ProductCardSkeleton() {
  return (
    <article className="premium-panel overflow-hidden rounded-3xl p-4">
      <div className="skeleton-shimmer h-44 rounded-2xl" />
      <div className="mt-4 space-y-2">
        <div className="skeleton-shimmer h-3 w-20 rounded-full" />
        <div className="skeleton-shimmer h-5 w-5/6 rounded-lg" />
        <div className="skeleton-shimmer h-5 w-2/3 rounded-lg" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="skeleton-shimmer h-7 rounded-full" />
        <div className="skeleton-shimmer h-7 rounded-full" />
        <div className="skeleton-shimmer h-7 rounded-full" />
      </div>
      <div className="mt-4 skeleton-shimmer h-20 rounded-2xl" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="skeleton-shimmer h-10 rounded-xl" />
        <div className="skeleton-shimmer h-10 rounded-xl" />
      </div>
    </article>
  );
}
