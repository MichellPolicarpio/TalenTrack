"use client";

import { Search, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type HrTabId = "pending" | "approved" | "history";

interface HrNavigationTabsProps {
  activeTab: HrTabId;
  onTabChange: (tab: HrTabId) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

export function HrNavigationTabs({
  activeTab,
  onTabChange,
  query,
  onQueryChange,
}: HrNavigationTabsProps) {
  const tabs: { id: HrTabId; label: string }[] = [
    { id: "pending", label: "Pending Approval" },
    { id: "approved", label: "Approved (Recent)" },
    { id: "history", label: "Full History" },
  ];

  return (
    <div className="print:hidden shrink-0 border-b border-neutral-200 bg-sidebar px-5 pt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-8">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative pb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus:outline-none",
                  active ? "text-[#111827]" : "text-neutral-400 hover:text-neutral-600",
                )}
              >
                {tab.label}
                {active ? (
                  <span
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pb-2">
          <div className="relative min-w-0 w-full sm:w-[260px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter by name or title…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="h-8 w-full pl-8 text-[13px]"
              aria-label="Filter queue"
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0 hover:bg-neutral-50"
            onClick={() => onQueryChange("")}
            title="Clear filters"
          >
            <FilterX className="size-3.5 text-neutral-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
