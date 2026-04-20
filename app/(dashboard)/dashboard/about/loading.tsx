"use client";

export default function AboutLoading() {
  return (
    <div className="flex h-full flex-col bg-neutral-100/30 p-8 md:p-12 overflow-hidden">
      <div className="mx-auto w-full max-w-4xl space-y-12">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-6">
          <div className="h-20 w-20 animate-pulse rounded-2xl bg-neutral-200" />
          <div className="space-y-3 text-center">
            <div className="mx-auto h-10 w-64 animate-pulse rounded bg-neutral-200" />
            <div className="mx-auto h-4 w-96 animate-pulse rounded bg-neutral-100" />
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-4 rounded-3xl border border-neutral-100 bg-white p-8">
              <div className="h-6 w-32 animate-pulse rounded bg-neutral-200" />
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
