"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Minus, Plus, Printer, Search } from "lucide-react";

import { ResumePreview } from "@/components/resume/ResumePreview";
import { HrReviewPanel } from "@/components/hr/HrReviewPanel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  Achievement,
  AuditLogEntry,
  Certification,
  Education,
  License,
  ResumeProfile,
  Project,
  ResumeStatus,
  Skill,
  WorkExperience,
} from "@/lib/db/types";

function initials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  if (parts[0]?.[0]) return parts[0][0]!.toUpperCase();
  return email[0]?.toUpperCase() ?? "?";
}

function tabMatches(
  status: ResumeStatus,
  tab: "draft" | "pending" | "approved",
): boolean {
  if (tab === "draft")
    return status === "DRAFT" || status === "NEEDS_CHANGES";
  if (tab === "pending") return status === "PENDING_APPROVAL";
  return status === "APPROVED";
}

function normalizeDate(d: Date | string | null | undefined): Date | null {
  if (d == null) return null;
  if (d instanceof Date) return d;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t;
}

function normalizeWorkExperiences(list: WorkExperience[]): WorkExperience[] {
  return list.map((e) => ({
    ...e,
    startDate: normalizeDate(e.startDate as unknown as Date | string | null),
    endDate: normalizeDate(e.endDate as unknown as Date | string | null),
  }));
}

export type HrReviewClientProps = {
  resumeId: string;
  employeeName: string;
  status: ResumeStatus;
  version: number;
  profile: ResumeProfile | null;
  experiences: WorkExperience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  resumeProjects: Project[];
  licenses: License[];
  achievements: Achievement[];
  auditLog: AuditLogEntry[];
  resumeUpdatedAtIso: string | null;
  reviewerName: string;
  reviewerEmail: string;
};

export function HrReviewClient({
  resumeId,
  employeeName,
  status,
  version,
  profile,
  experiences,
  education,
  skills,
  certifications,
  resumeProjects,
  licenses,
  achievements,
  auditLog,
  resumeUpdatedAtIso,
  reviewerName,
  reviewerEmail,
}: HrReviewClientProps) {
  const [zoomPct, setZoomPct] = useState(90);

  const exp = useMemo(() => normalizeWorkExperiences(experiences), [experiences]);
  const edu = education;
  const sk = skills;
  const cert = certifications;
  const proj = resumeProjects;
  const ach = achievements;

  const scale = zoomPct / 100;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F4F5F7]">
      {/* ─── Workflow toolbar (mockup: Draft / Pending / Approved + actions) ─── */}
      <header className="sticky top-0 z-20 flex shrink-0 flex-col gap-0 border-b border-neutral-200 bg-white shadow-sm print:hidden">
        <div className="flex h-11 items-center justify-between gap-3 px-4 md:px-5">
          <div className="flex min-w-0 flex-1 items-end gap-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            {(
              [
                ["draft", "Draft"] as const,
                ["pending", "Pending review"] as const,
                ["approved", "Approved"] as const,
              ]
            ).map(([key, label]) => {
              const active = tabMatches(status, key);
              return (
                <span
                  key={key}
                  className={cn(
                    "relative pb-2.5",
                    active ? "text-[#111827]" : "text-neutral-400",
                  )}
                >
                  {label}
                  {active ? (
                    <span
                      className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#E87722]"
                      aria-hidden
                    />
                  ) : null}
                </span>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
              title="Use Ctrl+F (Cmd+F) to find text on the page"
              aria-label="Search: use browser find (Ctrl+F)"
            >
              <Search className="size-4" />
            </button>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-40"
              aria-label="Zoom out"
              disabled={zoomPct <= 70}
              onClick={() => setZoomPct((z) => Math.max(70, z - 10))}
            >
              <Minus className="size-4" />
            </button>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-40"
              aria-label="Zoom in"
              disabled={zoomPct >= 120}
              onClick={() => setZoomPct((z) => Math.min(120, z + 10))}
            >
              <Plus className="size-4" />
            </button>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
              aria-label="Print"
              onClick={() => window.print()}
            >
              <Printer className="size-4" />
            </button>

            <a
              href={`/api/pdf/${resumeId}`}
              className={cn(
                buttonVariants({ size: "sm" }),
                "ml-1 gap-1.5 bg-[#E87722] text-white hover:bg-primary/90",
              )}
            >
              <Download className="size-3.5" />
              Download PDF
            </a>

            <div
              className="ml-2 flex size-8 items-center justify-center rounded-full bg-[#FFF4EC] text-[11px] font-bold text-[#C2410C]"
              title={reviewerName || reviewerEmail}
            >
              {initials(reviewerName, reviewerEmail)}
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
        {/* ─── Document preview column ─── */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="px-4 py-3 md:px-6 md:py-4">
            <nav
              className="mb-3 flex flex-wrap items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-500"
              aria-label="Document path"
            >
              <span className="text-neutral-400">HR</span>
              <span className="text-neutral-300">/</span>
              <Link
                href="/dashboard/hr/queue"
                className="text-neutral-500 transition-colors hover:text-[#E87722]"
              >
                Queue
              </Link>
              <span className="text-neutral-300">/</span>
              <span className="text-[#111827]">Review</span>
              <span className="text-neutral-300">/</span>
              <span className="font-mono text-[10px] text-neutral-400">
                {resumeId.slice(0, 8).toUpperCase()}
              </span>
            </nav>

            <p className="mb-4 text-[10px] text-neutral-500">
              Preview matches the Brindley resume layout and PDF export. Zoom{" "}
              {zoomPct}%.
            </p>

            <div className="flex min-h-[480px] justify-center overflow-x-auto pb-10 print:overflow-visible print:pb-0">
              <div
                className="origin-top print:scale-100"
                style={{
                  transform: `scale(${scale})`,
                  marginBottom: `${(1 - scale) * 1050}px`,
                }}
              >
                <div className="shadow-xl ring-1 ring-black/5 print:shadow-none print:ring-0">
                  <ResumePreview
                    employeeName={employeeName}
                    profile={profile}
                    experiences={exp}
                    education={edu}
                    skills={sk}
                    certifications={cert}
                    projects={proj}
                    licenses={licenses}
                    achievements={ach}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Right rail: reviewer + audit + metadata ─── */}
        <aside className="w-full shrink-0 border-t border-neutral-200 bg-white print:hidden lg:sticky lg:top-11 lg:h-[calc(100dvh-2.75rem)] lg:w-[400px] lg:self-start lg:border-l lg:border-t-0 lg:overflow-y-auto">
          <div className="max-h-[55vh] overflow-y-auto lg:max-h-none">
            <div className="p-4 md:p-5">
              <HrReviewPanel
                resumeId={resumeId}
                status={status}
                version={version}
                employeeName={employeeName}
                auditLog={auditLog}
                resumeUpdatedAtIso={resumeUpdatedAtIso}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
