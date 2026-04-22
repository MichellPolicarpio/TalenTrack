"use client";

import { Info, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function QualityDirective() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-primary">
        <Info className="size-4" />
        <h3 className="text-[11px] font-bold uppercase tracking-wider">The quality directive</h3>
      </div>
      <p className="text-[12px] leading-relaxed text-neutral-600">
        Each submission should pass a quick consistency check: identity matches employee records, job title aligns with profile, and visible
        sections match what will appear on the shared PDF. Approve only when content is accurate; request changes with clear notes.
      </p>
    </div>
  );
}

export function StatusLegend() {
  const legendItems = [
    { color: "bg-sky-500", label: "higher version / release track" },
    { color: "bg-amber-500", label: "revise / action expected" },
    { color: "bg-rose-500", label: "first submission (initial)" },
    { color: "bg-neutral-400", label: "draft-stage version" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-neutral-900">
        <Search className="size-4" />
        <h3 className="text-[11px] font-bold uppercase tracking-wider">Status legend</h3>
      </div>
      <div className="flex flex-col gap-3">
        {legendItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn("size-2 shrink-0 rounded-full", item.color)} />
            <span className="text-[11px] font-medium text-neutral-500 leading-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Component for the sticky XL sidebar */
export function HrSidebarDirective() {
  return (
    <aside className="hidden xl:flex flex-col gap-6 w-[280px] shrink-0 sticky top-6">
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
        <QualityDirective />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
        <StatusLegend />
      </div>
    </aside>
  );
}

/** Component for the mobile footer */
export function HrMobileFooterGuide() {
  return (
    <footer className="xl:hidden grid gap-4 border-t border-neutral-200 bg-neutral-50/60 p-4 md:grid-cols-[1fr_auto] md:items-start md:gap-8 md:p-5">
      <QualityDirective />
      <div className="min-w-[200px]">
        <StatusLegend />
      </div>
    </footer>
  );
}
