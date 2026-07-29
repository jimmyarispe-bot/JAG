"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/jag-command-center/notifications/actions";
import type { JagNotification } from "@/lib/jag-command-center/notifications/types";

export function JagNotificationBell({
  notifications,
  unreadCount,
}: {
  readonly notifications: readonly JagNotification[];
  readonly unreadCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="relative rounded border border-[var(--jag-border)] bg-[var(--jag-panel)] px-2 py-1.5 text-xs text-[var(--jag-muted)] hover:text-[var(--jag-text)] focus-visible:border-[var(--jag-border-strong)]"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        Alerts
        {unreadCount > 0 ? (
          <span className="ml-1 inline-flex min-w-[1.1rem] justify-center rounded bg-[var(--jag-border-strong)] px-1 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-text)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label="In-app notifications"
          className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-[var(--jag-border-strong)] bg-[var(--jag-panel)] p-2 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--jag-muted)]">
              In-app only
            </p>
            <button
              type="button"
              disabled={pending || unreadCount === 0}
              className="text-[11px] text-[var(--jag-muted)] hover:text-[var(--jag-text)] disabled:opacity-40"
              onClick={() => {
                startTransition(async () => {
                  await markAllNotificationsReadAction();
                  router.refresh();
                });
              }}
            >
              Mark all read
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="px-2 py-4 text-xs text-[var(--jag-muted)]">
              No notifications yet.
            </p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  {n.href ? (
                    <Link
                      href={n.href}
                      className={`block rounded px-2 py-2 hover:bg-[var(--jag-panel-2)] ${
                        n.read ? "opacity-70" : ""
                      }`}
                      onClick={() => {
                        startTransition(async () => {
                          await markNotificationReadAction(n.id);
                          setOpen(false);
                          router.refresh();
                        });
                      }}
                    >
                      <NotificationBody n={n} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={`block w-full rounded px-2 py-2 text-left hover:bg-[var(--jag-panel-2)] ${
                        n.read ? "opacity-70" : ""
                      }`}
                      onClick={() => {
                        startTransition(async () => {
                          await markNotificationReadAction(n.id);
                          router.refresh();
                        });
                      }}
                    >
                      <NotificationBody n={n} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function NotificationBody({ n }: { n: JagNotification }) {
  return (
    <>
      <p className="text-xs text-[var(--jag-text)]">{n.title}</p>
      <p className="mt-0.5 text-[11px] text-[var(--jag-muted)]">{n.body}</p>
      <p className="mt-0.5 font-[family-name:var(--font-jag-mono)] text-[10px] text-[var(--jag-muted-2)]">
        {n.at.slice(0, 16)}
      </p>
    </>
  );
}
