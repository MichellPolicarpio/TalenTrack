"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  FilterX,
  ClipboardList,
  Info,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

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

export type HrQueueKpis = {
  pendingCount: number;
  oldestWaitDays: number | null;
  resubmissionCount: number;
  submittedLast24h: number;
  /** Promedio de días en cola (solo filas actuales). */
  avgWaitDays: number | null;
  /** Filas con ≥ `criticalDaysThreshold` días esperando. */
  criticalCount: number;
};

function initialsFromName(name: string, email: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  if (parts[0] && parts[0].length > 0) return parts[0][0]!.toUpperCase();
  return email[0]?.toUpperCase() ?? "?";
}

function formatRelativeSubmitted(submittedAt: Date, now: Date): string {
  const ms = now.getTime() - submittedAt.getTime();
  if (ms < 60_000) return "Just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;

  const sod = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const dayDiff = Math.round((sod(now) - sod(submittedAt)) / 86_400_000);
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff === 0)
    return `Today · ${submittedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

  return submittedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Badges estilo mockup: solo entero `version` en BD → etiqueta heurística. */
function VersionControlBadge({ version }: { version: number }) {
  if (version <= 1) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-red-200 bg-red-50/90 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-red-900",
        )}
      >
        V{version}.0 · INITIAL
      </span>
    );
  }
  if (version === 2) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-neutral-300 bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-neutral-800",
        )}
      >
        V{version}.0 · DRAFT
      </span>
    );
  }
  if (version < 5) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-amber-950",
        )}
      >
        V{version}.0 · REVISE
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-sky-300 bg-sky-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-sky-950",
      )}
    >
      V{version}.0 · RELEASE
    </span>
  );
}

function KpiCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string | number;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "ring-neutral-200 transition-shadow",
        highlight && "border-amber-200/80 bg-[#FFF8F3] ring-amber-200/60 shadow-sm",
      )}
    >
      <CardContent className="flex flex-col gap-0.5 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold tabular-nums text-[#111827]">{value}</p>
        {hint ? (
          <p className="text-[10.5px] leading-snug text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

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
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "history">("pending");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const now = useMemo(() => new Date(), []);

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
        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
          <KpiCard
            label="Total in queue"
            value={kpis.pendingCount}
            hint={
              kpis.submittedLast24h > 0
                ? `+${kpis.submittedLast24h} submitted in the last 24h`
                : "All pending HR decision"
            }
          />
          <KpiCard
            label="Avg. turnaround (est.)"
            value={kpis.avgWaitDays == null ? "—" : kpis.avgWaitDays.toFixed(1)}
            hint="Mean days waiting in this queue"
          />
          <KpiCard
            label="Resubmit rate"
            value={
              kpis.pendingCount === 0
                ? "—"
                : `${Math.round((kpis.resubmissionCount / kpis.pendingCount) * 100)}%`
            }
            hint={`${kpis.resubmissionCount} with version > 1`}
          />
          <KpiCard
            label="Critical priority"
            value={kpis.criticalCount}
            hint="Waiting ≥ 3 days"
            highlight={kpis.criticalCount > 0}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex h-full flex-col gap-0 rounded-xl border border-neutral-200/90 bg-background shadow-[0_4px_16px_rgba(0,0,0,0.02)] print:border-0 print:shadow-none overflow-hidden">
          {/* Tab nav */}
          <div className="print:hidden shrink-0 border-b border-neutral-200 bg-sidebar px-5 pt-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-8">
                {[
                  { id: "pending", label: "Pending Approval" },
                  { id: "approved", label: "Approved (Recent)" },
                  { id: "history", label: "Full History" },
                ].map((tab) => {
                  const active = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id as "pending" | "approved" | "history");
                        setPage(0);
                      }}
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
                    id="hr-queue-filter"
                    type="search"
                    placeholder="Filter by name or title…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(0);
                    }}
                    className="h-8 w-full pl-8 text-[13px]"
                    aria-label="Filter queue"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 shrink-0 hover:bg-neutral-50"
                  onClick={() => {
                    setQuery("");
                    setPage(0);
                  }}
                  title="Clear filters"
                >
                  <FilterX className="size-3.5 text-neutral-500" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto p-4 md:p-6">
            {!query && rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-neutral-50 text-neutral-300">
                  <ClipboardList className="size-6" />
                </div>
                <p className="text-sm font-medium text-neutral-500">
                  {activeTab === "pending"
                    ? "Your queue is empty. All caught up!"
                    : activeTab === "approved"
                      ? "No recent approvals to show."
                      : "No history found."}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">No rows match your filter.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="overflow-x-auto rounded-lg border border-neutral-200/60 shadow-sm">
                  <Table>
                    <TableHeader className="bg-neutral-50/50">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">Employee</TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">Job title</TableHead>
                        <TableHead className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">Submitted</TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">Version control</TableHead>
                        <TableHead className="text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageSlice.map((item) => {
                        const submitted = new Date(item.submittedAt);
                        return (
                          <TableRow
                            key={item.isSnapshot ? `snap-${item.snapshotId}` : `curr-${item.resumeId}`}
                            className="hover:bg-neutral-50/50"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-[#B45309] ring-1 ring-amber-100"
                                  style={{ backgroundColor: "#FFF4EC" }}
                                >
                                  {initialsFromName(item.employeeName, item.employeeEmail)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-[#111827]">{item.employeeName}</p>
                                  <p className="truncate text-xs text-muted-foreground">{item.employeeEmail}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-[#374151]">
                              {item.jobTitle ?? <span className="italic text-muted-foreground">Not specified</span>}
                            </TableCell>
                            <TableCell className="text-sm tabular-nums text-[#374151]">
                              {submitted.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-medium transition-colors",
                                  (item.status === "APPROVED" || activeTab === "approved") && !item.isSnapshot && "border-green-200 bg-green-50/50 text-green-950",
                                  (item.status === "APPROVED" || activeTab === "approved") && item.isSnapshot && "border-slate-200 bg-slate-50/80 text-slate-600",
                                  (item.status === "PENDING_APPROVAL" || activeTab === "pending") && "border-amber-200 bg-amber-50/50 text-amber-950",
                                  item.status === "NEEDS_CHANGES" && "border-red-200 bg-red-50/50 text-red-950",
                                )}
                              >
                                {item.isSnapshot
                                  ? `v${item.version} · Archived`
                                  : item.status === "PENDING_APPROVAL"
                                    ? "Pending"
                                    : item.status === "APPROVED"
                                      ? "Approved"
                                      : item.status === "NEEDS_CHANGES"
                                        ? "Changes"
                                        : activeTab === "pending"
                                          ? "Pending"
                                          : "Approved"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Link
                                href={
                                  item.isSnapshot
                                    ? `/dashboard/hr/review/snapshot/${item.snapshotId}`
                                    : `/dashboard/hr/review/${item.resumeId}`
                                }
                                className={cn(
                                  buttonVariants({ size: "sm" }),
                                  item.isSnapshot ? "bg-slate-600 text-white hover:bg-slate-700" : "bg-primary text-white hover:bg-primary/90",
                                )}
                              >
                                {item.isSnapshot ? "Snapshot" : "Review"}
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-4 px-1">
                  <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    Showing <span className="text-[#111827]">{showingFrom}</span> to{" "}
                    <span className="text-[#111827]">{showingTo}</span> of <span className="text-[#111827]">{filtered.length}</span> results
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setPage(page - 1)} disabled={page === 0} className="size-8">
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-xs font-semibold tabular-nums text-neutral-600 px-2">
                      Page {page + 1} / {totalPages}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1} className="size-8">
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Directive (visible on mobile/tablet) */}
          <footer className="xl:hidden grid gap-4 border-t border-neutral-200 bg-neutral-50/60 p-4 md:grid-cols-[1fr_auto] md:items-start md:gap-8 md:p-5">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">The quality directive</p>
              <p className="max-w-xl text-[11px] leading-relaxed text-neutral-600">
                Each submission should pass a quick consistency check: identity matches employee records, job title aligns with profile, and visible
                sections match what will appear on the shared PDF. Approve only when content is accurate; request changes with clear notes.
              </p>
            </div>
            <div className="min-w-[200px]">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Status legend</p>
              <ul className="space-y-1.5 text-[10.5px] text-neutral-600">
                <li className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-sky-500" />
                  Blue — higher version / release track
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                  Orange — revise / action expected
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-rose-500" />
                  Red — first submission (initial)
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-neutral-400" />
                  Grey — draft-stage version
                </li>
              </ul>
            </div>
          </footer>
        </div>
      </div>

      {/* Sidebar (XL+ only) */}
      <aside className="hidden xl:flex flex-col gap-6 w-[280px] shrink-0 sticky top-6">
        <div className="flex flex-col gap-4 rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Info className="size-4" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider">The quality directive</h3>
          </div>
          <p className="text-[12px] leading-relaxed text-neutral-600">
            Each submission should pass a quick consistency check: identity matches employee records, job title aligns with profile, and visible
            sections match what will appear on the shared PDF. Approve only when content is accurate; request changes with clear notes.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-neutral-900">
            <Search className="size-4" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider">Status legend</h3>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { color: "bg-sky-500", label: "higher version / release track" },
              { color: "bg-amber-500", label: "revise / action expected" },
              { color: "bg-rose-500", label: "first submission (initial)" },
              { color: "bg-neutral-400", label: "draft-stage version" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn("size-2 shrink-0 rounded-full", item.color)} />
                <span className="text-[11px] font-medium text-neutral-500 leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
