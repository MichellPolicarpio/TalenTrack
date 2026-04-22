"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  approveResumeAction,
  requestChangesAction,
} from "@/lib/actions/approval.actions";
import type { AuditLogEntry, ResumeStatus } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

function entryTime(entry: AuditLogEntry): Date {
  const d = entry.createdAt;
  if (d instanceof Date) return d;
  return new Date(d as unknown as string);
}

function applicationRef(resumeId: string): string {
  const compact = resumeId.replace(/-/g, "");
  return compact.slice(-6).toUpperCase();
}

export function HrReviewPanel({
  resumeId,
  status,
  version,
  employeeName,
  auditLog,
  resumeUpdatedAtIso,
}: {
  resumeId: string;
  status: ResumeStatus;
  version: number;
  employeeName: string;
  auditLog: AuditLogEntry[];
  resumeUpdatedAtIso: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const appId = applicationRef(resumeId);
  const updatedLabel = resumeUpdatedAtIso
    ? new Date(resumeUpdatedAtIso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveResumeAction(resumeId);
        toast.success("Resume approved.");
        router.push("/dashboard/hr/queue");
      } catch {
        toast.error("Could not approve. Please try again.");
      }
    });
  }

  function handleRequestChanges() {
    if (!notes.trim()) {
      toast.error("Please provide notes explaining what needs to change.");
      return;
    }
    startTransition(async () => {
      try {
        await requestChangesAction(resumeId, notes);
        toast.success("Changes requested. Employee has been notified.");
        router.push("/dashboard/hr/queue");
      } catch {
        toast.error("Could not send feedback. Please try again.");
      }
    });
  }

  return (
    <>
      <Toaster position="bottom-right" />
      <div className="flex flex-col gap-4">
        {/* ─── Reviewer card (mockup) ─── */}
        {status === "PENDING_APPROVAL" ? (
          <Card className="border-neutral-200 shadow-sm ring-1 ring-black/[0.03]">
            <CardHeader className="space-y-0 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold leading-snug text-[#111827]">
                    {employeeName}
                  </CardTitle>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Application ID:{" "}
                    <span className="text-foreground">#APP-{appId}</span>
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-950",
                  )}
                >
                  Pending review
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="hr-notes" className="text-xs text-muted-foreground">
                  Reviewer notes
                </Label>
                <Textarea
                  id="hr-notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Feedback for the employee when requesting changes…"
                  className="resize-y text-sm"
                />
              </div>
              <Button
                type="button"
                className="h-10 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={pending}
                onClick={handleApprove}
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Approve
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full gap-2 border-neutral-300 bg-white hover:bg-neutral-50"
                disabled={pending}
                onClick={handleRequestChanges}
              >
                <MessageSquare className="size-4 text-neutral-600" />
                Request changes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-neutral-200 shadow-sm">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                This resume is <strong>{status.replace("_", " ")}</strong> and
                cannot be reviewed again unless resubmitted.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ─── Audit timeline ─── */}
        {auditLog.length > 0 ? (
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#111827]">
                Audit log
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Status transitions and reviewer notes.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="relative space-y-0 pl-1">
                {auditLog.map((entry, idx) => {
                  const t = entryTime(entry);
                  const isOrange = idx % 2 === 0;
                  return (
                    <li key={entry.id} className="relative flex gap-3 pb-6 last:pb-0">
                      {idx < auditLog.length - 1 ? (
                        <div
                          className="absolute left-[5px] top-3 h-[calc(100%-4px)] w-px bg-neutral-200"
                          aria-hidden
                        />
                      ) : null}
                      <div
                        className={cn(
                          "relative z-[1] mt-1 size-2.5 shrink-0 rounded-full ring-2 ring-white",
                          isOrange ? "bg-primary" : "bg-sky-500",
                        )}
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                          <span className="text-xs font-semibold text-[#111827]">
                            {entry.fromStatus.replace(/_/g, " ")} →{" "}
                            {entry.toStatus.replace(/_/g, " ")}
                          </span>
                          <time
                            className="text-[10px] tabular-nums text-muted-foreground"
                            dateTime={t.toISOString()}
                          >
                            {t.toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {entry.actorName}
                        </p>
                        {entry.notes ? (
                          <p className="border-l-2 border-neutral-200 pl-2 text-[11px] italic leading-snug text-foreground/85">
                            {entry.notes}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}

                {status === "PENDING_APPROVAL" ? (
                  <li className="relative flex gap-3 opacity-70">
                    <div className="mt-1 size-2.5 shrink-0 rounded-full bg-neutral-300 ring-2 ring-white" />
                    <div>
                      <p className="text-xs font-medium text-neutral-500">
                        Pending action…
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Awaiting approve or request changes.
                      </p>
                    </div>
                  </li>
                ) : null}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {/* ─── Metadata (no fabricated checksum) ─── */}
        <Card className="border-neutral-200 bg-neutral-50/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#111827]">
              Document metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-0 text-[11px]">
            <div className="flex justify-between gap-4 border-b border-neutral-200/80 pb-2">
              <span className="shrink-0 font-medium uppercase tracking-wide text-muted-foreground">
                Export format
              </span>
              <span className="text-right font-medium text-[#111827]">PDF</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-neutral-200/80 pb-2">
              <span className="shrink-0 font-medium uppercase tracking-wide text-muted-foreground">
                Version
              </span>
              <span className="text-right font-mono text-[#111827]">v{version}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="shrink-0 font-medium uppercase tracking-wide text-muted-foreground">
                Last updated
              </span>
              <span className="max-w-[60%] text-right text-[#111827]">
                {updatedLabel}
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Download uses the same layout as the preview. No separate file checksum is
              stored; export reflects data at generation time.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
