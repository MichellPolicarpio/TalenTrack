"use client";

export default function HistoryLoading() {
  return (
    <div className="flex h-full flex-col bg-neutral-50/30 px-6 py-8 md:px-10">
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-lg bg-neutral-200" />
        </div>

        {/* List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-100" />
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
                  <div className="h-3 w-48 animate-pulse rounded bg-neutral-100" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-50" />
                <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
