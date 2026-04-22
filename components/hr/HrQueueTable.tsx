"use client";

import Link from "next/link";
import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { HrQueueRow } from "./hr-queue-view";

interface HrQueueTableProps {
  rows: HrQueueRow[];
  activeTab: "pending" | "approved" | "history";
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  totalFiltered: number;
  query: string;
}

function initialsFromName(name: string, email: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  if (parts[0] && parts[0].length > 0) return parts[0][0]!.toUpperCase();
  return email[0]?.toUpperCase() ?? "?";
}

export function HrQueueTable({
  rows,
  activeTab,
  page,
  pageSize,
  onPageChange,
  totalPages,
  showingFrom,
  showingTo,
  totalFiltered,
  query,
}: HrQueueTableProps) {
  if (!query && rows.length === 0) {
    return (
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
    );
  }

  if (totalFiltered === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">No rows match your filter.</p>;
  }

  return (
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
            {rows.map((item) => {
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
          <span className="text-[#111827]">{showingTo}</span> of <span className="text-[#111827]">{totalFiltered}</span> results
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => onPageChange(page - 1)} disabled={page === 0} className="size-8">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs font-semibold tabular-nums text-neutral-600 px-2">
            Page {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="icon" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1} className="size-8">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
