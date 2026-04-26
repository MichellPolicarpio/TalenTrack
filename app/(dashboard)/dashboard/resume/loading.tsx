"use client";

export default function ResumeLoading() {
  return (
    <div className="flex h-full min-h-[calc(100vh-56px)] flex-col">
      <div className="flex h-[56px] shrink-0 items-center justify-between border-b border-border/50 bg-card px-5">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 space-y-4 overflow-hidden bg-card p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted/60" />
          <div className="h-10 w-full animate-pulse rounded bg-muted/60" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-muted/60" />
        </div>
        <div className="hidden flex-1 border-l border-border/50 bg-muted/30 p-6 lg:block">
          <div className="mx-auto h-full w-[520px] animate-pulse rounded bg-card shadow-sm" />
        </div>
      </div>
    </div>
  );
}
