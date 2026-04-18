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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, Moon, LogOut } from "lucide-react";

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
  const isSettingsRoute = pathname.startsWith("/dashboard/settings");
  const isHrRoute = pathname.startsWith("/dashboard/hr");
  const isHistoryRoute = pathname.startsWith("/dashboard/history");
  const { activeResumeStatus, editorActions } = useDashboard();
  const activeTab = activeResumeStatus ? resolveActiveTab(activeResumeStatus) : null;

  return (
    <div className="hidden h-[75px] shrink-0 items-center gap-4 border-b border-topbar-border bg-topbar px-5 md:flex">
      {/* Left: app label */}
      {isAboutRoute || isSettingsRoute || isHistoryRoute ? (
        <div className="min-w-0 shrink-0">
          <p className="truncate text-[18px] font-black tracking-tight text-sidebar-accent-foreground">
            {isAboutRoute ? "About" : isSettingsRoute ? "Settings" : "CV History"}
          </p>
        </div>
      ) : isHrRoute ? (
        <p className="shrink-0 text-[18px] font-black tracking-tight text-primary">
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
                    ? "text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="shrink-0 text-[18px] font-black tracking-tight text-sidebar-label/40">
          TalentTrack
        </p>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Actions or User profile */}
      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-3 border-l border-topbar-border pl-4">
          {notificationsInitial && (
            <NotificationsBell initial={notificationsInitial} />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <div className="flex shrink-0 cursor-pointer items-center gap-3 rounded-full border border-sidebar-border bg-sidebar px-3 py-1.5 transition-all hover:bg-sidebar-accent/50 hover:shadow-md active:scale-95" />
              }
            >
              <div className="flex flex-col items-end">
                <p className="text-[12px] font-bold text-sidebar-accent-foreground leading-none">{userName}</p>
                <p className="text-[10px] font-medium text-sidebar-foreground/50 mt-1 uppercase tracking-tight">{roleLabel}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent/80 font-bold text-sidebar-accent-foreground shadow-sm ring-2 ring-sidebar-border group-hover:ring-primary/30 group-hover:shadow-primary/20 transition-all">
                {initials}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 min-w-60 p-1.5">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-sidebar-accent-foreground">{userName}</p>
                    <p className="text-[11px] font-medium text-sidebar-foreground/60">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
              <DropdownMenuItem
                render={
                  <Link 
                    href={profileHref} 
                    className="flex w-full items-center gap-2.5 cursor-pointer px-2 py-2" 
                  />
                }
              >
                <User className="size-4 text-sidebar-foreground/70" />
                <span className="text-[13px] font-medium">Ver Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                render={
                  <Link 
                    href="/dashboard/settings" 
                    className="flex w-full items-center gap-2.5 cursor-pointer px-2 py-2" 
                  />
                }
              >
                <Settings className="size-4 text-sidebar-foreground/70" />
                <span className="text-[13px] font-medium">Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
              <DropdownMenuItem disabled className="flex items-center gap-2.5 px-2 py-2 opacity-60">
                <Moon className="size-4 text-sidebar-foreground/70" />
                <span className="text-[13px] font-medium">Modo Oscuro</span>
                <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Off</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
              <DropdownMenuItem className="flex items-center gap-2.5 px-2 py-2 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                <LogOut className="size-4" />
                <span className="text-[13px] font-medium">Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
