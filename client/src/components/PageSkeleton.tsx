import { Skeleton } from "@/components/ui/skeleton";

export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-4 rounded-2xl" style={{ background: 'oklch(0.10 0.025 270)', border: '1px solid oklch(0.72 0.28 305 / 0.15)' }}>
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="w-10 h-10 rounded-full" style={{ background: 'oklch(0.15 0.025 270)' }} />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-28" style={{ background: 'oklch(0.15 0.025 270)' }} />
              <Skeleton className="h-2.5 w-20" style={{ background: 'oklch(0.13 0.025 270)' }} />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-2" style={{ background: 'oklch(0.13 0.025 270)' }} />
          <Skeleton className="h-4 w-3/4" style={{ background: 'oklch(0.13 0.025 270)' }} />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl" style={{ background: 'oklch(0.10 0.025 270)', border: '1px solid oklch(0.72 0.28 305 / 0.15)' }}>
          <Skeleton className="h-32 w-full rounded-xl mb-3" style={{ background: 'oklch(0.15 0.025 270)' }} />
          <Skeleton className="h-4 w-3/4 mb-2" style={{ background: 'oklch(0.13 0.025 270)' }} />
          <Skeleton className="h-3 w-1/2" style={{ background: 'oklch(0.12 0.025 270)' }} />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div>
      <Skeleton className="h-48 w-full" style={{ background: 'oklch(0.12 0.025 270)' }} />
      <div className="px-4 -mt-12 mb-4">
        <Skeleton className="w-24 h-24 rounded-2xl" style={{ background: 'oklch(0.15 0.025 270)' }} />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-5 w-40" style={{ background: 'oklch(0.13 0.025 270)' }} />
          <Skeleton className="h-3.5 w-28" style={{ background: 'oklch(0.12 0.025 270)' }} />
          <Skeleton className="h-3 w-64" style={{ background: 'oklch(0.11 0.025 270)' }} />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'oklch(0.10 0.025 270)' }}>
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'oklch(0.15 0.025 270)' }} />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3" style={{ background: 'oklch(0.13 0.025 270)' }} />
            <Skeleton className="h-2.5 w-1/4" style={{ background: 'oklch(0.12 0.025 270)' }} />
          </div>
          <Skeleton className="h-4 w-16" style={{ background: 'oklch(0.13 0.025 270)' }} />
        </div>
      ))}
    </div>
  );
}
