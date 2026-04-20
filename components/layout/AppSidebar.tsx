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
  User,
  Users,
  History,
  Search,
} from "lucide-react";

import { useDashboard } from "@/lib/context/dashboard-context";
import { NotificationsBell } from "@/components/layout/NotificationsBell";
import type { NotificationsSnapshotDTO } from "@/lib/actions/notifications.actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { SplashScreen } from "@/components/layout/SplashScreen";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/user-role";

export type AppSidebarProps = {
  userName: string;
  userEmail: string;
  role: UserRole;
  notificationsInitial?: NotificationsSnapshotDTO | null;
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
    onNavigate,
    onSignOut,
  } = props;
  const initials = initialsFromUser(userName, userEmail);
  const mainItems = mainNavItems(role);
  const roleLabel = ROLE_LABELS[role];

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-sidebar border-r border-sidebar-border">
      <div
        className={cn(
          "flex h-[75px] shrink-0 items-center justify-center border-b border-sidebar-border transition-all duration-300",
          collapsed ? "px-2" : "px-4 gap-3",
        )}
      >
        <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-primary shadow-md shadow-primary/10 transition-transform hover:scale-110 active:scale-95">
          <span className="text-[19px] font-black leading-none text-primary-foreground">T</span>
        </div>

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-extrabold leading-tight tracking-tight text-sidebar-foreground truncate">
              Talent<span className="text-primary">Track</span>
            </p>
          </div>
        )}
      </div>

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

      <div className="shrink-0">
        {collapsed ? (
          <div className="flex flex-col items-center gap-3 border-t border-sidebar-border/60 py-4">
            <div
              title={`${userName}\n${userEmail}\n${roleLabel}`}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary"
            >
              <span className="text-[11px] font-bold leading-none text-primary-foreground">
                {initials}
              </span>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-[15px]" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1 px-4 pt-6 pb-3">
              <motion.div
                animate={{ 
                  y: [0, -5, 0],
                  scale: [1, 1.02, 1],
                  rotate: [0, 1, -1, 0]
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/BrindleyLogo.png"
                  alt="Brindley Logo"
                  width={170}
                  height={44}
                  className="h-11 w-auto object-contain"
                  priority
                />
              </motion.div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground">
                Powered By <span className="text-[#E87722]">BE</span>
              </span>
            </div>
            <div className="h-px border-t border-sidebar-border/60" />
            <div className="flex items-center gap-3 px-3.5 py-3.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-[11px]">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold leading-tight text-sidebar-foreground">
                  {userName || "User"}
                </p>
                <p className="text-[10.5px] leading-tight text-sidebar-foreground/60 truncate">
                  {roleLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="shrink-0 rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              >
                <LogOut className="size-[15px]" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function AppSidebar({ userName, userEmail, role, notificationsInitial }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { activeResumeStatus } = useDashboard();
  const initials = initialsFromUser(userName, userEmail);

  // Dynamic title based on route
  const isAboutRoute = pathname === "/dashboard/about";
  const isSettingsRoute = pathname.startsWith("/dashboard/settings");
  const isHrRoute = pathname.startsWith("/dashboard/hr");
  const isHistoryRoute = pathname.startsWith("/dashboard/history");
  const isResumeRoute = pathname === "/dashboard/resume" || pathname === "/dashboard";

  const pageTitle = isAboutRoute ? "About" : 
                    isSettingsRoute ? "Settings" : 
                    isHistoryRoute ? "History" : 
                    isHrRoute ? "HR Management" : 
                    isResumeRoute ? "My Resume" : "TalentTrack";

  function handleSignOut() {
    setSigningOut(true);
    setTimeout(() => signOut({ callbackUrl: "/" }), 1900);
  }

  return (
    <>
      <AnimatePresence>
        {signingOut && <SplashScreen steps={EXIT_STEPS} />}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="relative hidden h-screen shrink-0 md:flex">
        {/* ... existing code ... */}
        <aside
          className={cn(
            "h-full flex-col overflow-hidden border-sidebar-border flex transition-[width] duration-200 ease-in-out",
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

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "absolute top-[50%] -right-3 z-50 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition-all hover:border-primary/30 hover:text-primary",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Mobile top bar (Compact & Informative) */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Open menu" className="size-9 rounded-full">
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

          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-[7px] bg-primary">
              <span className="text-[13px] font-black leading-none text-white">T</span>
            </div>
          </Link>
          
          <div className="min-w-0 border-l border-neutral-200 pl-2">
            <h1 className="truncate text-[14px] font-extrabold tracking-tight text-neutral-900 leading-none">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Status + Notifications + Avatar */}
        <div className="flex shrink-0 items-center gap-2">
          {isResumeRoute && activeResumeStatus && (
            <div className="flex items-center gap-1.5 rounded-full border border-neutral-100 bg-neutral-50 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-neutral-600">
              <span className={cn(
                "size-1.5 shrink-0 rounded-full",
                activeResumeStatus === "APPROVED" ? "bg-green-500" :
                activeResumeStatus === "PENDING_APPROVAL" ? "bg-amber-500" :
                activeResumeStatus === "NEEDS_CHANGES" ? "bg-red-500" : "bg-orange-500"
              )} />
              <span className="truncate max-w-[65px]">{activeResumeStatus.replace('_', ' ')}</span>
            </div>
          )}

          <div className="flex items-center gap-0.5">
            {notificationsInitial && (
              <NotificationsBell initial={notificationsInitial} />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/80 text-[10px] font-bold text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border outline-none transition-all hover:ring-primary/30 active:scale-95" />
                }
              >
                {initials}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 focus:outline-none">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-2">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-semibold text-neutral-900 leading-tight">{userName}</p>
                      <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-tight">{ROLE_LABELS[role]}</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
                <DropdownMenuItem render={<Link href="/dashboard/settings" className="flex w-full items-center gap-2 cursor-pointer px-2 py-2" />}>
                  <User size={14} className="text-neutral-500" />
                  <span className="text-xs font-medium">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/dashboard/settings" className="flex w-full items-center gap-2 cursor-pointer px-2 py-2" />}>
                  <Settings size={14} className="text-neutral-500" />
                  <span className="text-xs font-medium">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-2 py-2 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span className="text-xs font-medium">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}
