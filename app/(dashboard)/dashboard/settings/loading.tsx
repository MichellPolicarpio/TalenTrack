"use client";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col p-8 md:p-12">
      <div className="max-w-2xl space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-neutral-100" />
        </div>
        
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4 rounded-xl border border-neutral-100 bg-white p-6 shadow-sm">
              <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />
              <div className="space-y-3">
                <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-50" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
