"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Info,
  LogOut,
  Menu,
  Settings,
  Users,
  History,
} from "lucide-react";

import { SplashScreen } from "@/components/layout/SplashScreen";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/user-role";

export type AppSidebarProps = {
  userName: string;
  userEmail: string;
  role: UserRole;
};

const ROLE_LABELS: Record<UserRole, string> = {
  Employee: "Employee",
  HR_Revisor: "HR Reviewer",
  Admin: "Administrator",
};

const EXIT_STEPS = [
  "Signing out safely...",
  "Saving your workspace...",
  "Clearing session cache...",
  "Closing connection...",
  "See you soon!",
] as const;

function initialsFromUser(name: string, email: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  if (parts[0] && parts[0].length > 0) return parts[0][0]!.toUpperCase();
  return email[0]?.toUpperCase() ?? "?";
}

type NavItem = { href: string; label: string; icon: ReactNode };

function mainNavItems(role: UserRole): NavItem[] {
  const items: NavItem[] = [
    {
      href: "/dashboard/resume",
      label: "My Resume",
      icon: <FileText className="size-[17px] shrink-0" />,
    },
    {
      href: "/dashboard/history",
      label: "History",
      icon: <History className="size-[17px] shrink-0" />,
    },
  ];
  if (role === "HR_Revisor" || role === "Admin") {
    items.push({
      href: "/dashboard/hr/queue",
      label: "HR Queue",
      icon: <ClipboardList className="size-[17px] shrink-0" />,
    });
  }
  if (role === "Admin") {
    items.push({
      href: "/dashboard/admin/users",
      label: "Users",
      icon: <Users className="size-[17px] shrink-0" />,
    });
  }
  return items;
}

const SECONDARY_NAV: NavItem[] = [
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: <Settings className="size-[17px] shrink-0" />,
  },
  {
    href: "/dashboard/about",
    label: "About",
    icon: <Info className="size-[17px] shrink-0" />,
  },
];

// ─── Nav item ─────────────────────────────────────────────────────────────────
function NavLink({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const active =
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  if (collapsed) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        title={item.label}
        className={cn(
          "mx-auto flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-[#FFF4EC] text-[#FF6C06]"
            : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700",
        )}
      >
        {item.icon}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-card text-[#FF6C06] shadow-sm"
          : "text-neutral-500 hover:bg-neutral-100/60 hover:text-neutral-800",
      )}
    >
      <span className={cn(
        "transition-colors",
        active ? "text-[#FF6C06]" : "text-neutral-400 group-hover:text-neutral-600",
      )}>
        {item.icon}
      </span>
      <span className="truncate">{item.label}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6C06]" />
      )}
    </Link>
  );
}

// ─── Section group ────────────────────────────────────────────────────────────
function NavGroup({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {!collapsed ? (
        <p className="mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
          {label}
        </p>
      ) : (
        <div className="mx-auto my-2 h-px w-6 bg-neutral-200" />
      )}
      <nav className="flex flex-col gap-1">
        {children}
      </nav>
    </div>
  );
}

// ─── Sidebar body ─────────────────────────────────────────────────────────────
function SidebarBody(
  props: AppSidebarProps & {
    pathname: string;
    collapsed: boolean;
    onToggleCollapse?: () => void;
    onNavigate?: () => void;
    onSignOut: () => void;
  },
) {
  const {
    userName,
    userEmail,
    role,
    pathname,
    collapsed,
    onToggleCollapse,
    onNavigate,
    onSignOut,
  } = props;
  const initials = initialsFromUser(userName, userEmail);
  const mainItems = mainNavItems(role);
  const roleLabel = ROLE_LABELS[role];

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-sidebar">

      {/* ── Brand header ──────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex h-[75px] shrink-0 items-center border-b border-neutral-200",
          collapsed ? "justify-center px-3" : "px-4 gap-3",
        )}
      >
        {/* TalentTrack logo badge */}
        <div className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-[#FF6C06]">
          <span className="text-[15px] font-black leading-none text-white">T</span>
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold leading-tight tracking-tight text-neutral-900">
              Talent<span className="text-[#FF6C06]">Track</span>
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-2.5 pb-4 pt-5">
        <NavGroup label="Workspace" collapsed={collapsed}>
          {mainItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </NavGroup>

        <NavGroup label="General" collapsed={collapsed}>
          {SECONDARY_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </NavGroup>
      </div>

      {/* ── Footer — user row ─────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-neutral-100">
        {collapsed ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div
              title={`${userName}\n${userEmail}\n${roleLabel}`}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FF6C06]"
            >
              <span className="text-[11px] font-bold leading-none text-white">
                {initials}
              </span>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            >
              <LogOut className="size-[15px]" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-3.5 py-3.5">
            {/* Avatar */}
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FF6C06]">
              <span className="text-[11px] font-bold leading-none text-white">
                {initials}
              </span>
            </div>
            {/* Name / role */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold leading-tight text-neutral-800">
                {userName || "User"}
              </p>
              <p className="text-[10.5px] leading-tight text-neutral-400">
                {roleLabel}
              </p>
            </div>
            {/* Sign out */}
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="shrink-0 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            >
              <LogOut className="size-[15px]" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function AppSidebar({ userName, userEmail, role }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  function handleSignOut() {
    setSigningOut(true);
    setTimeout(() => signOut({ callbackUrl: "/" }), 1900);
  }

  return (
    <>
      <AnimatePresence>
        {signingOut && <SplashScreen steps={EXIT_STEPS} />}
      </AnimatePresence>

      {/* Desktop */}
      <div className="relative hidden h-screen shrink-0 md:flex">
        <aside
          className={cn(
            "h-full flex-col overflow-hidden border-r border-neutral-200 bg-white flex",
            "transition-[width] duration-200 ease-in-out",
            collapsed ? "w-[60px]" : "w-[192px]",
          )}
        >
          <SidebarBody
            userName={userName}
            userEmail={userEmail}
            role={role}
            pathname={pathname}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
            onSignOut={handleSignOut}
          />
        </aside>

        {/* Floating circular toggle button ("Grab Handle") */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "absolute top-[50%] -right-3 z-50 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 shadow-sm transition-all hover:border-[#FF6C06]/30 hover:text-[#FF6C06] hover:shadow-md",
            collapsed && "rotate-0",
            !collapsed && "rotate-0", // Icons handle the direction
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="size-3" strokeWidth={3} />
          ) : (
            <ChevronLeft className="size-3" strokeWidth={3} />
          )}
        </button>
      </div>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            }
          />
          <SheetContent
            side="left"
            showCloseButton={false}
            className="flex w-[192px] max-w-[192px] flex-col border-r border-neutral-200 p-0 sm:max-w-[192px]"
          >
            <SidebarBody
              userName={userName}
              userEmail={userEmail}
              role={role}
              pathname={pathname}
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
              onSignOut={handleSignOut}
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-[7px] bg-[#FF6C06]">
            <span className="text-[13px] font-black leading-none text-white">T</span>
          </div>
          <span className="text-[13px] font-bold tracking-tight text-neutral-900">
            Talent<span className="text-[#FF6C06]">Track</span>
          </span>
        </div>
      </div>
    </>
  );
}
