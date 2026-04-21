"use client";

import { useRef, useState, useTransition, useCallback, useLayoutEffect } from "react";
import {
  Clock,
  Download,
  Loader2,
  Undo2,
  FileText,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { withdrawSubmissionAction } from "@/lib/actions/approval.actions";
import { Button } from "@/components/ui/button";
import {
  ResumePreview,
  type ResumePreviewProps,
} from "@/components/resume/ResumePreview";

export type PendingReviewViewProps = {
  resumeId: string;
  employeeName: string;
  previewProps: ResumePreviewProps;
  onDownloadPdf: () => Promise<void>;
  downloading: boolean;
};

/** Pixels of scroll for full collapse */
const COLLAPSE_PX = 85;

export function PendingReviewView({
  resumeId,
  employeeName,
  previewProps,
  onDownloadPdf,
  downloading,
}: PendingReviewViewProps) {
  const router = useRouter();
  const [pendingWithdraw, startWithdraw] = useTransition();
  const [withdrawn, setWithdrawn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Update CSS custom property directly on the card + scroll area — zero React re-renders
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    const card = cardRef.current;
    if (!el || !card) return;
    const t = Math.min(1, Math.max(0, el.scrollTop / COLLAPSE_PX));
    card.style.setProperty("--t", String(t));
    el.style.setProperty("--t", String(t));
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  function handleWithdraw() {
    startWithdraw(async () => {
      try {
        await withdrawSubmissionAction(resumeId);
        setWithdrawn(true);
        toast.success("Submission withdrawn. You can edit your resume now.");
        router.refresh();
      } catch {
        toast.error("Could not withdraw. Please try again.");
      }
    });
  }

  return (
    <div className="flex h-full flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* ─── Collapsible status hero card ─── */}
      {/*
        --t goes from 0 (expanded) to 1 (collapsed).
        All child interpolations use calc() with --t for GPU-accelerated, zero-JS-rerender updates.
      */}
      <div
        ref={cardRef}
        className="pending-hero relative shrink-0 overflow-hidden border-b border-amber-200/60 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50"
        style={{ "--t": "0" } as React.CSSProperties}
      >
        {/* Animated background dots */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{ opacity: "calc(0.035 * (1 - var(--t)))" } as React.CSSProperties}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, #F59E0B 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        {/* Inner container — collapses from column to compact row */}
        <div
          className="pending-inner relative mx-auto flex max-w-3xl flex-col items-center justify-center px-6 text-center"
          style={{
            paddingTop: "calc(56px - 52px * var(--t))",
            paddingBottom: "calc(72px - 70px * var(--t))",
            gap: "calc(24px - 24px * var(--t))",
          } as React.CSSProperties}
        >
          {/* Animated icon */}
          <div
            className="relative shrink-0 overflow-hidden"
            style={{
              transform: "scale(calc(1 - 1 * var(--t)))",
              opacity: "calc(1 - 2 * var(--t))",
              maxHeight: "calc(64px * (1 - var(--t)))",
              transformOrigin: "center",
            } as React.CSSProperties}
          >
            <div
              className="absolute -inset-3 animate-ping rounded-full bg-amber-400/20"
              style={{ opacity: "calc(1 - var(--t))" } as React.CSSProperties}
            />
            <div
              className="absolute -inset-1.5 animate-pulse rounded-full bg-amber-300/30"
              style={{ opacity: "calc(1 - var(--t))" } as React.CSSProperties}
            />
            <div className="relative flex size-16 items-center justify-center rounded-2xl border border-amber-200/80 bg-white shadow-lg shadow-amber-200/40">
              <Clock
                className="size-8 text-amber-600 animate-[spin_8s_linear_infinite]"
                strokeWidth={1.75}
              />
            </div>
          </div>

          {/* Text block */}
          <div className="flex flex-col items-center overflow-hidden" style={{ gap: "calc(14px - 14px * var(--t))", maxHeight: "calc(80px * (1 - var(--t)) + 20px)" } as React.CSSProperties}>
            {/* Title */}
            <h2
              className="font-bold tracking-tight text-neutral-900"
              style={{ fontSize: "calc(26px - 16px * var(--t))", lineHeight: 1.2, opacity: "calc(1 - 0.6 * var(--t))" } as React.CSSProperties}
            >
              Your resume is under review
            </h2>

            {/* Subtitle */}
            <div
              className="overflow-hidden"
              style={{
                maxHeight: "calc(60px * (1 - var(--t)))",
                opacity: "calc(1 - var(--t) * 2.5)",
              } as React.CSSProperties}
            >
              <p className="mx-auto max-w-md text-[14px] leading-relaxed text-neutral-500">
                <span className="font-medium text-neutral-700">{employeeName}</span>
                {" "}— your resume has been submitted to HR for approval. You&apos;ll be
                notified when a decision is made.
              </p>
            </div>

          </div>

          {/* Action buttons — always visible */}
          <div
            className="flex shrink-0 flex-wrap items-center justify-center gap-3"
            style={{
              transform: "scale(calc(1 - 0.2 * var(--t)))",
              transformOrigin: "center",
            } as React.CSSProperties}
          >
            <Button
              type="button"
              variant="outline"
              disabled={pendingWithdraw || withdrawn}
              onClick={handleWithdraw}
              className="h-10 gap-2 rounded-xl border-amber-200/90 bg-white px-5 text-[13px] font-semibold text-amber-800 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50/80 hover:shadow-md disabled:opacity-50"
            >
              {pendingWithdraw ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Undo2 className="size-4" />
              )}
              {pendingWithdraw ? "Withdrawing…" : "Withdraw & Edit"}
            </Button>

            <Button
              type="button"
              disabled={downloading}
              onClick={() => void onDownloadPdf()}
              className="h-10 gap-2 rounded-xl bg-[#FF6C06] px-5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {downloading ? "Generating…" : "Download PDF"}
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-amber-600/70"
          style={{ opacity: "calc(1 - var(--t) * 4)" } as React.CSSProperties}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest mb-0.5">Scroll Down</span>
          <ChevronDown className="size-4 animate-bounce" opacity={0.8} />
        </div>
      </div>

      {/* ─── Scrollable resume preview ─── */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col items-center overflow-auto bg-neutral-100/80 px-4 pb-8 sm:px-8"
      >
        {/*
          Scroll spacer — its height equals COLLAPSE_PX so the first N px of
          scroll only collapse the banner while the resume stays visually in place.
          Once the spacer scrolls out the resume is flush with the collapsed banner.
        */}
        <div
          className="flex w-full shrink-0 flex-col items-center justify-end"
          style={{ height: `${COLLAPSE_PX}px` }}
          aria-hidden
        >
          {/* Section label lives inside the spacer */}
          <div className="flex items-center gap-2 pb-6 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
            <FileText className="size-4" strokeWidth={2} />
            Resume Preview
          </div>
        </div>

        {/* Preview with review border glow */}
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-1 animate-pulse rounded-sm"
            style={{
              boxShadow: "0 0 0 2px rgba(245, 158, 11, 0.15), 0 0 24px 4px rgba(245, 158, 11, 0.08)",
            }}
            aria-hidden
          />
          <ResumePreview {...previewProps} />
        </div>
      </div>
    </div>
  );
}
