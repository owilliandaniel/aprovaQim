// Loading placeholders shown while page data streams in.
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[411px]:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-72 animate-pulse rounded-[13px] border border-line bg-white" />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl border border-line bg-white" />
      ))}
    </div>
  );
}
