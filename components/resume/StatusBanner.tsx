"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Check,
  Loader2,
  Copy,
  Undo2,
  Cloud,
  MessageSquareText,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { withdrawSubmissionAction } from "@/lib/actions/approval.actions";
import { formatLastSavedRelative } from "@/lib/format-last-saved";
import { type ResumeStatus, RESUME_STATUS } from "@/lib/db/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_META: Record<ResumeStatus, { color: string; label: string }> = {
  [RESUME_STATUS.DRAFT]: { color: "#F17A28", label: "Draft" },
  [RESUME_STATUS.PENDING_APPROVAL]: { color: "#F59E0B", label: "Pending review" },
  [RESUME_STATUS.APPROVED]: { color: "#16A34A", label: "Approved" },
  [RESUME_STATUS.NEEDS_CHANGES]: { color: "#DC2626", label: "Changes requested" },
};

const statusPillClass =
  "inline-flex max-w-full items-center gap-2 rounded-full border border-neutral-200/90 bg-neutral-50/90 px-3 py-1.5 text-[13px] font-semibold tracking-tight text-neutral-800 shadow-sm shadow-neutral-200/40";

export function StatusBanner({
  resumeId,
  status,
  reviewerNotes,
  publicShareToken,
  lastSavedAt,
  children,
}: {
  resumeId: string;
  status: ResumeStatus;
  reviewerNotes: string | null;
  publicShareToken: string | null;
  /** Latest known persist time (resume row vs profile row, plus client bump on Save). */
  lastSavedAt: Date | null;
  children?: React.ReactNode;
}) {
  const [pendingWithdraw, startWithdrawTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const savedRelative = formatLastSavedRelative(lastSavedAt, nowTick);
  const savedTitle = lastSavedAt
    ? lastSavedAt.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : undefined;

  const meta = STATUS_META[status];
  const notesText = reviewerNotes?.trim() ?? "";
  const hasHrFeedback = notesText.length > 0;

  function handleWithdraw() {
    startWithdrawTransition(async () => {
      try {
        await withdrawSubmissionAction(resumeId);
        toast.success("Submission withdrawn. You can keep editing.");
      } catch {
        toast.error("Could not withdraw submission.");
      }
    });
  }

  function handleCopy() {
    if (!publicShareToken) return;
    const url = `${window.location.origin}/resume/public/${publicShareToken}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const statusDot = (
    <span
      className="size-2 shrink-0 rounded-full ring-2 ring-white drop-shadow-sm"
      style={{ backgroundColor: meta.color }}
    />
  );

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-neutral-200 bg-neutral-50/70 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          {status === RESUME_STATUS.NEEDS_CHANGES && hasHrFeedback ? (
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className={cn(
                statusPillClass,
                "cursor-pointer border-red-200/90 bg-red-50/80 text-red-950 transition hover:bg-red-50 hover:ring-2 hover:ring-red-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50",
              )}
              title="View full HR feedback"
              aria-haspopup="dialog"
              aria-expanded={feedbackOpen}
            >
              {statusDot}
              <span className="flex items-center gap-1.5">
                {meta.label}
                <MessageSquareText className="size-3.5 shrink-0 opacity-80" aria-hidden />
              </span>
            </button>
          ) : (
            <span
              className={statusPillClass}
              title="Current resume status"
            >
              {statusDot}
              {meta.label}
            </span>
          )}

          {hasHrFeedback && status !== RESUME_STATUS.NEEDS_CHANGES ? (
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-amber-800 underline decoration-amber-300 underline-offset-2 transition hover:text-amber-950 hover:decoration-amber-500"
            >
              <MessageSquareText className="size-3.5 shrink-0" aria-hidden />
              View HR comment
            </button>
          ) : null}

          <span
            className="flex items-center gap-1.5 text-[12px] leading-none text-neutral-500"
            title={savedTitle}
          >
            <Cloud
              className="size-3.5 shrink-0 text-neutral-400"
              aria-hidden
            />
            <span>
              Last saved ·{" "}
              <span className="text-neutral-600">{savedRelative}</span>
            </span>
          </span>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {status === RESUME_STATUS.PENDING_APPROVAL && (
            <button
              type="button"
              disabled={pendingWithdraw}
              onClick={handleWithdraw}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-amber-200/90 bg-white px-3.5 text-[12px] font-semibold text-amber-800 shadow-sm transition-colors hover:bg-amber-50/90 disabled:opacity-50"
            >
              {pendingWithdraw ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Undo2 className="size-3.5" />
              )}
              Withdraw
            </button>
          )}

          {status === RESUME_STATUS.APPROVED && publicShareToken && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200/90 bg-white px-3.5 text-[12px] font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5 text-neutral-600" />
              )}
              {copied ? "Copied" : "Copy public link"}
            </button>
          )}

          {children && (
            <>
              <span className="hidden h-5 w-px bg-neutral-200 sm:block ml-2" />
              {children}
            </>
          )}
        </div>
      </div>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent
          className="flex max-h-[min(85vh,560px)] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
          showCloseButton={false}
        >
          <div className="flex shrink-0 items-start gap-2 border-b border-neutral-200/90 px-4 py-3">
            <DialogHeader className="min-w-0 flex-1 space-y-0 p-0 text-left">
              <DialogTitle className="pr-1 leading-snug">
                HR feedback
              </DialogTitle>
            </DialogHeader>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-neutral-600"
                  aria-label="Close"
                />
              }
            >
              <XIcon className="size-4" />
            </DialogClose>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <p className="whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 text-[13px] leading-relaxed text-neutral-900">
              {notesText}
            </p>
          </div>
          <DialogFooter className="m-0 shrink-0 gap-2 border-t border-neutral-200/90 bg-neutral-50/40 px-4 py-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFeedbackOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
