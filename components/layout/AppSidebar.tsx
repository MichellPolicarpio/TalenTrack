"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
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
  Search,
} from "lucide-react";

import { SplashScreen, EXIT_STEPS } from "@/components/layout/SplashScreen";
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
      label: "Resume History",
      icon: <History className="size-[17px] shrink-0" />,
    },
  ];
  if (role === "HR_Revisor" || role === "Admin") {
    items.push({
      href: "/dashboard/hr/queue",
      label: "HR Management",
      icon: <ClipboardList className="size-[17px] shrink-0" />,
    });
    items.push({
      href: "/dashboard/hr/query",
      label: "Query Resumes",
      icon: <Search className="size-[17px] shrink-0" />,
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
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
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
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground",
      )}
    >
      <span className={cn(
        "transition-colors",
        active ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground",
      )}>
        {item.icon}
      </span>
      <span className="truncate">{item.label}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-sidebar-accent-foreground" />
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
        <p className="mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-sidebar-label">
          {label}
        </p>
      ) : (
        <div className="mx-auto my-2 h-px w-6 bg-sidebar-border" />
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
    <div className="flex h-full min-h-0 w-full flex-col bg-sidebar border-r border-sidebar-border">

      {/* ── Brand header ──────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex h-[75px] shrink-0 items-center justify-center border-b border-sidebar-border transition-all duration-300",
          collapsed ? "px-2" : "px-4 gap-3",
        )}
      >
        {/* TalentTrack logo image badge */}
        <div className="flex size-[38px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-primary shadow-md shadow-primary/10 transition-transform hover:scale-110 active:scale-95">
          <Image
            src="/TalentTrack_Logo.png"
            alt="TalentTrack Logo"
            width={38}
            height={38}
            className="size-full object-contain"
          />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[18px] font-extrabold leading-tight tracking-tight text-sidebar-foreground">
              Talent<span className="text-primary">Track</span>
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
      <div className="shrink-0">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1 px-3 pb-6 pt-2">
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="size-[17px] shrink-0" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1 px-4 pt-6 pb-3">
              <Image
                src="/BrindleyLogo.png"
                alt="Brindley Logo"
                width={170}
                height={44}
                className="animate-logo-breathe h-11 w-auto object-contain transition-transform duration-500 hover:scale-110"
                priority
              />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground">
                Powered By <span className="text-[#FF6C06]">BE</span>
              </span>
            </div>
            <div className="mx-4 border-t border-sidebar-border/60" />
            {/* Footer Actions — SurvBE Style */}
            <div className="flex flex-col gap-0.5 px-3 pb-6 pt-4">
              <button
                type="button"
                onClick={onSignOut}
                className="group flex items-center justify-center gap-3 rounded-lg py-2.5 px-4 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="size-[17px] shrink-0" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Sign Out
                </span>
              </button>
            </div>
        </>
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
    // 5 steps * 700ms = 3500ms. We wait 4000ms to ensure the "See you soon!" step is seen.
    setTimeout(() => signOut({ callbackUrl: "/" }), 4000);
  }

  return (
    <>
      <AnimatePresence>
        {signingOut && (
          <SplashScreen 
            steps={EXIT_STEPS} 
            intervalMs={700}
          />
        )}
      </AnimatePresence>

      {/* Desktop */}
      <div className="relative hidden h-screen shrink-0 md:flex">
        <aside
          className={cn(
            "h-full flex-col overflow-hidden border-sidebar-border flex",
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
            "absolute top-[50%] -right-3 z-50 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition-all hover:border-primary/30 hover:text-primary hover:shadow-md",
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
          <div className="flex size-7 items-center justify-center overflow-hidden rounded-[7px] bg-[#FF6C06]">
            <Image
              src="/TalentTrack_Logo.png"
              alt="TalentTrack Logo"
              width={28}
              height={28}
              className="size-full object-contain"
            />
          </div>
          <span className="text-[13px] font-bold tracking-tight text-neutral-900">
            Talent<span className="text-[#FF6C06]">Track</span>
          </span>
        </div>
      </div>
    </>
  );
}
