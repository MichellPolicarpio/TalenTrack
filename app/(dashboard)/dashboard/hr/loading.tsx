"use client";

export default function HrLoading() {
  return (
    <div className="flex h-full flex-col p-4 pb-20 md:p-6">
      <div className="space-y-8">
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-neutral-100 bg-white shadow-sm" />
          ))}
        </div>

        {/* Table Content Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
            <div className="h-10 w-64 animate-pulse rounded-lg bg-neutral-100" />
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            {/* Table Header */}
            <div className="h-12 border-b border-neutral-100 bg-neutral-50 px-4" />
            
            {/* Table Rows */}
            <div className="divide-y divide-neutral-50">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex h-16 items-center gap-4 px-4">
                  <div className="h-4 w-1/4 animate-pulse rounded bg-neutral-100" />
                  <div className="h-4 w-1/4 animate-pulse rounded bg-neutral-50" />
                  <div className="h-4 w-1/6 animate-pulse rounded bg-neutral-100" />
                  <div className="ml-auto h-8 w-20 animate-pulse rounded-full bg-neutral-50" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
