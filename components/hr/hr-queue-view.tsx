"use client";

import { useEffect, useMemo, useState } from "react";
import { HrKpiGrid, type HrQueueKpis } from "./HrKpiGrid";
import { HrNavigationTabs, type HrTabId } from "./HrNavigationTabs";
import { HrQueueTable } from "./HrQueueTable";
import { HrSidebarDirective, HrMobileFooterGuide } from "./HrSidebarDirective";

const PAGE_SIZE = 5;

export type HrQueueRow = {
  resumeId: string;
  employeeName: string;
  employeeEmail: string;
  jobTitle: string | null;
  submittedAt: string;
  version: number;
  status?: string;
  isSnapshot?: boolean;
  snapshotId?: string | null;
  operationDate?: string;
};

export function HrQueueView({
  pendingRows,
  approvedRows,
  historyRows,
  kpis,
}: {
  pendingRows: HrQueueRow[];
  approvedRows: HrQueueRow[];
  historyRows: HrQueueRow[];
  kpis: HrQueueKpis;
}) {
  const [activeTab, setActiveTab] = useState<HrTabId>("pending");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const rows = activeTab === "pending" ? pendingRows : activeTab === "approved" ? approvedRows : historyRows;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.employeeName,
        r.employeeEmail,
        r.jobTitle ?? "",
        `v${r.version}`,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  const safePage = Math.min(page, totalPages - 1);
  const pageSlice = useMemo(() => {
    const p = Math.min(page, totalPages - 1);
    return filtered.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE);
  }, [filtered, page, totalPages]);

  const showingFrom = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const showingTo = Math.min((safePage + 1) * PAGE_SIZE, filtered.length);

  return (
    <div className="flex flex-col xl:flex-row gap-10 items-start">
      <div className="flex flex-1 flex-col gap-6 w-full min-w-0">
        <HrKpiGrid kpis={kpis} />

        <div className="flex h-full flex-col gap-0 rounded-xl border border-neutral-200/90 bg-background shadow-[0_4px_16px_rgba(0,0,0,0.02)] print:border-0 print:shadow-none overflow-hidden">
          <HrNavigationTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setPage(0);
            }}
            query={query}
            onQueryChange={(q) => {
              setQuery(q);
              setPage(0);
            }}
          />

          <div className="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto p-4 md:p-6">
            <HrQueueTable
              rows={pageSlice}
              activeTab={activeTab}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              totalPages={totalPages}
              showingFrom={showingFrom}
              showingTo={showingTo}
              totalFiltered={filtered.length}
              query={query}
            />
          </div>

          <HrMobileFooterGuide />
        </div>
      </div>

      <HrSidebarDirective />
    </div>
  );
}
