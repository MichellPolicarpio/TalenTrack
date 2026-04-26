"use client";

import { useRef, useCallback, useLayoutEffect } from "react";
import {
  BadgeCheck,
  Download,
  Loader2,
  FileText,
  ChevronDown,
  ExternalLink,
  RefreshCcw,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reopenResumeForUpdateAction } from "@/lib/actions/approval.actions";
import { Button } from "@/components/ui/button";
import {
  ResumePreview,
  type ResumePreviewProps,
} from "@/components/resume/ResumePreview";

export type ApprovedViewProps = {
  resumeId: string;
  employeeName: string;
  previewProps: ResumePreviewProps;
  onDownloadPdf: () => Promise<void>;
  downloading: boolean;
};

/** Pixels of scroll for full collapse */
const COLLAPSE_PX = 85;

export function ApprovedView({
  resumeId,
  employeeName,
  previewProps,
  onDownloadPdf,
  downloading,
}: ApprovedViewProps) {
  const [isPendingUpdate, startUpdate] = useTransition();
  const [updated, setUpdated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  function handleReopen() {
    startUpdate(async () => {
      try {
        await reopenResumeForUpdateAction(resumeId);
        setUpdated(true);
        toast.success("Resume reopened. You can edit your CV now.");
      } catch {
        toast.error("Could not reopen. Please try again.");
      }
    });
  }

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

  return (
    <div className="flex h-full flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      {/* ─── Celebratory status hero card ─── */}
      <div
        ref={cardRef}
        className="relative shrink-0 overflow-hidden border-b border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50"
        style={{ "--t": "0" } as React.CSSProperties}
      >
        {/* Animated background patterns */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{ opacity: "calc(0.04 * (1 - var(--t)))" } as React.CSSProperties}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, #059669 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Inner container */}
        <div
          className="relative mx-auto flex max-w-3xl flex-col items-center justify-center px-6 text-center"
          style={{
            paddingTop: "calc(56px - 52px * var(--t))",
            paddingBottom: "calc(72px - 70px * var(--t))",
            gap: "calc(24px - 24px * var(--t))",
          } as React.CSSProperties}
        >
          {/* Success icon */}
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
              className="absolute -inset-3 animate-pulse rounded-full bg-emerald-400/20"
              style={{ opacity: "calc(1 - var(--t))" } as React.CSSProperties}
            />
            <div className="relative flex size-16 items-center justify-center rounded-2xl border border-emerald-200/80 bg-white shadow-xl shadow-emerald-200/40">
              <BadgeCheck
                className="size-9 text-emerald-600"
                strokeWidth={1.75}
              />
            </div>
          </div>

          {/* Text block */}
          <div className="flex flex-col items-center overflow-hidden" style={{ gap: "calc(14px - 14px * var(--t))", maxHeight: "calc(80px * (1 - var(--t)) + 20px)" } as React.CSSProperties}>
            <h2
              className="font-bold tracking-tight text-neutral-900"
              style={{ fontSize: "calc(26px - 16px * var(--t))", lineHeight: 1.2, opacity: "calc(1 - 0.6 * var(--t))" } as React.CSSProperties}
            >
              Resume Approved & Ready
            </h2>
            <div
              className="overflow-hidden"
              style={{
                maxHeight: "calc(60px * (1 - var(--t)))",
                opacity: "calc(1 - var(--t) * 2.5)",
              } as React.CSSProperties}
            >
              <p className="mx-auto max-w-md text-[14px] leading-relaxed text-neutral-500">
                Congratulations <span className="font-semibold text-emerald-700">{employeeName.split(" ")[0]}</span>! 
                Your resume is officially approved and ready for use.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div
            className="flex shrink-0 flex-wrap items-center justify-center gap-3"
            style={{
              transform: "scale(calc(1 - 0.1 * var(--t)))",
              transformOrigin: "center",
            } as React.CSSProperties}
          >
            <Button
              type="button"
              disabled={downloading}
              onClick={() => void onDownloadPdf()}
              className="h-10 gap-2 rounded-xl bg-emerald-600 px-6 text-[13px] font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {downloading ? "Generating…" : "Download Official PDF"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isPendingUpdate || updated}
              onClick={handleReopen}
              className="h-10 gap-2 rounded-xl border-emerald-200/90 bg-white px-5 text-[13px] font-semibold text-emerald-800 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50/80 hover:shadow-md disabled:opacity-50"
            >
              {isPendingUpdate ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCcw className="size-4" />
              )}
              {isPendingUpdate ? "Reopening..." : "Update CV"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="h-10 gap-2 rounded-xl border-transparent bg-transparent px-4 text-[13px] font-medium text-emerald-600/70 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <ExternalLink className="size-4" />
              Global Profile
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-emerald-600/70"
          style={{ opacity: "calc(1 - var(--t) * 4)" } as React.CSSProperties}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest mb-0.5">View Resume</span>
          <ChevronDown className="size-4 animate-bounce" />
        </div>
      </div>

      {/* ─── Scrollable resume preview ─── */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col items-center overflow-auto bg-neutral-50/50 px-4 pb-8 sm:px-8"
      >
        <div
          className="flex w-full shrink-0 flex-col items-center justify-end"
          style={{ height: `${COLLAPSE_PX}px` }}
          aria-hidden
        >
          <div className="flex items-center gap-2 pb-6 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-600/60">
            <FileText className="size-4" strokeWidth={2.5} />
            Official Document
          </div>
        </div>

        <div className="relative">
          {/* Subtle success glow around the resume */}
          <div
            className="pointer-events-none absolute -inset-2 rounded-lg opacity-40 transition-opacity"
            style={{
              boxShadow: "0 0 40px 10px rgba(16, 185, 129, 0.1)",
              opacity: "calc(0.4 * (1 - var(--t)))"
            } as React.CSSProperties}
            aria-hidden
          />
          <ResumePreview {...previewProps} />
        </div>
      </div>
    </div>
  );
}
