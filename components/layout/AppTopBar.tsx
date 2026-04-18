"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useDashboard } from "@/lib/context/dashboard-context";
import { ResumeStatus } from "@/lib/db/types";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/user-role";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import type { NotificationsSnapshotDTO } from "@/lib/actions/notifications.actions";
import { EditorActionBar } from "@/components/resume/EditorActionBar";

const ROLE_LABELS: Record<UserRole, string> = {
  Employee: "Employee",
  HR_Revisor: "HR Reviewer",
  Admin: "Administrator",
};

const STATUS_TABS: { key: ResumeStatus; label: string }[] = [
  { key: "DRAFT", label: "Draft" },
  { key: "PENDING_APPROVAL", label: "Pending Review" },
  { key: "APPROVED", label: "Approved" },
];

function resolveActiveTab(status: ResumeStatus): ResumeStatus {
  if (status === "NEEDS_CHANGES") return "DRAFT";
  return status;
}

function initialsFromName(name: string, email: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  if (parts[0] && parts[0].length > 0) return parts[0][0]!.toUpperCase();
  return email[0]?.toUpperCase() ?? "?";
}

export type AppTopBarProps = {
  userName: string;
  userEmail: string;
  role: UserRole;
  /** Destino al hacer clic en el avatar (default: settings). */
  profileHref?: string;
  /** Campana in-app; si no hay empleado en BD, omitir. */
  notificationsInitial?: NotificationsSnapshotDTO | null;
};

export function AppTopBar({
  userName,
  userEmail,
  role,
  profileHref = "/dashboard/settings",
  notificationsInitial,
}: AppTopBarProps) {
  const initials = initialsFromName(userName, userEmail);
  const roleLabel = ROLE_LABELS[role];
  const pathname = usePathname();
  const isAboutRoute = pathname === "/dashboard/about";
  const isHrRoute = pathname.startsWith("/dashboard/hr");
  const isHistoryRoute = pathname.startsWith("/dashboard/history");
  const { activeResumeStatus, editorActions } = useDashboard();
  const activeTab = activeResumeStatus ? resolveActiveTab(activeResumeStatus) : null;

  return (
    <div className="hidden h-[75px] shrink-0 items-center gap-4 border-b border-neutral-200 bg-sidebar px-5 md:flex">
      {/* Left: app label */}
      {isAboutRoute ? (
        <div className="min-w-0 shrink-0">
          <p className="truncate text-[13px] font-semibold tracking-[0.01em] text-[#111827]">
            About
          </p>
          <p className="truncate text-[10.5px] leading-tight text-[#9CA3AF]">
            Resume Builder Proposal for Brindley Engineering.
          </p>
        </div>
      ) : isHrRoute ? (
        <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FF6C06]">
          HR Administration
        </p>
      ) : activeResumeStatus ? (
        <div className="flex h-full min-w-0 items-stretch gap-6">
          {STATUS_TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                className={cn(
                  "relative flex items-center text-[13px] font-medium tracking-[0.01em] transition-colors",
                  isActive
                    ? "text-[#111827]"
                    : "text-[#9CA3AF] hover:text-[#6B7280]",
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-[#FF6C06]" />
                )}
              </button>
            );
          })}
        </div>
      ) : isHistoryRoute ? (
        <div className="min-w-0 shrink-0">
          <p className="truncate text-[13px] font-semibold tracking-[0.01em] text-[#111827]">
            Resume History
          </p>
          <p className="truncate text-[10.5px] leading-tight text-[#9CA3AF]">
            Viewing historical snapshots of your professional profile.
          </p>
        </div>
      ) : (
        <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
          TalentTrack
        </p>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Actions or User profile */}
      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-3 border-l border-neutral-200 pl-4">
          {notificationsInitial && (
            <NotificationsBell initial={notificationsInitial} />
          )}

          <Link
            href={profileHref}
            className="group flex items-center gap-3 rounded-full border border-neutral-200 bg-white py-1.5 pl-1.5 pr-4 shadow-sm transition-all hover:border-[#FF6C06]/30 hover:shadow-md"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-[#FF6C06] text-[11px] font-bold text-white ring-2 ring-white transition-transform group-hover:scale-105">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#111827]">
                {userName.split(" ")[0]}
              </p>
              <p className="text-[10px] font-medium text-[#9CA3AF]">{roleLabel}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
