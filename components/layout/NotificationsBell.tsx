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
  if (type === "NEEDS_CHANGES") return "Cambios solicitados";
  if (type === "APPROVED") return "Aprobado";
  return type;
}

function formatShort(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-MX", {
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
          "relative flex size-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100",
          open && "bg-neutral-100",
        )}
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        <Bell className="size-[18px]" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FF6C06] px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(calc(100vw-2rem),380px)] rounded-xl border border-neutral-200 bg-white py-2 shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-neutral-100 px-3 pb-2 pt-0.5">
            <p className="text-[12px] font-semibold text-neutral-800">
              Notificaciones
            </p>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="h-7 gap-1 text-[11px] text-neutral-600"
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
              Marcar leídas
            </Button>
          </div>

          <div className="max-h-[min(70vh,320px)] overflow-y-auto">
            {snapshot.items.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12px] text-neutral-500">
                No hay notificaciones.
              </p>
            ) : (
              <ul className="py-1">
                {snapshot.items.map((n) => (
                  <li key={n.id} className="border-b border-neutral-50 last:border-0">
                    <Link
                      href="/dashboard/resume"
                      className={cn(
                        "block px-3 py-2.5 transition-colors hover:bg-neutral-50",
                        !n.isRead && "bg-[#FFF8F3]/80",
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
                          className="shrink-0 text-[10px] text-neutral-400"
                          dateTime={n.createdAt}
                        >
                          {formatShort(n.createdAt)}
                        </time>
                      </div>
                      <p className="line-clamp-3 text-[12px] leading-snug text-neutral-700">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] text-[#FF6C06]">
                        Ver currículum y comentarios →
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
