"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getNotificationsSnapshotAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type NotificationsSnapshotDTO,
} from "@/lib/actions/notifications.actions";

const POLL_MS = 45_000;

function typeLabel(type: string): string {
  if (type === "NEEDS_CHANGES") return "Changes requested";
  if (type === "APPROVED") return "Approved";
  return type;
}

function formatShort(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function NotificationsBell({
  initial,
}: {
  initial: NotificationsSnapshotDTO;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState(initial);
  const [pending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const refresh = useCallback(() => {
    startTransition(async () => {
      const next = await getNotificationsSnapshotAction();
      if (next) setSnapshot(next);
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(refresh, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const unread = snapshot.unreadCount;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) refresh();
        }}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50",
          open && "bg-sidebar-accent/50",
        )}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="size-[18px]" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(calc(100vw-2rem),380px)] rounded-xl border border-topbar-border bg-card py-2 shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-topbar-border/60 px-3 pb-2 pt-0.5">
            <p className="text-[12px] font-semibold text-sidebar-accent-foreground">
              Notifications
            </p>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-7 gap-1 text-[11px] text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/30"
              disabled={pending || unread === 0}
              onClick={() => {
                startTransition(async () => {
                  await markAllNotificationsReadAction();
                  refresh();
                  router.refresh();
                });
              }}
            >
              {pending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCheck className="size-3" />
              )}
              Mark all as read
            </Button>
          </div>

          <div className="max-h-[min(70vh,320px)] overflow-y-auto">
            {snapshot.items.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12px] text-muted-foreground">
                No notifications.
              </p>
            ) : (
              <ul className="py-1">
                {snapshot.items.map((n) => (
                  <li key={n.id} className="border-b border-topbar-border/40 last:border-0">
                    <Link
                      href="/dashboard/resume"
                      className={cn(
                        "block px-3 py-2.5 transition-colors hover:bg-sidebar-accent/20",
                        !n.isRead && "bg-sidebar-accent/40",
                      )}
                      onClick={() => {
                        if (!n.isRead) {
                          startTransition(async () => {
                            await markNotificationReadAction(n.id);
                            refresh();
                            router.refresh();
                          });
                        }
                        setOpen(false);
                      }}
                    >
                      <div className="mb-0.5 flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wide",
                            n.type === "NEEDS_CHANGES"
                              ? "text-red-700"
                              : "text-emerald-700",
                          )}
                        >
                          {typeLabel(n.type)}
                        </span>
                        <time
                          className="shrink-0 text-[10px] text-muted-foreground"
                          dateTime={n.createdAt}
                        >
                          {formatShort(n.createdAt)}
                        </time>
                      </div>
                      <p className="line-clamp-3 text-[12px] leading-snug text-foreground">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-primary">
                        View resume and comments →
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
