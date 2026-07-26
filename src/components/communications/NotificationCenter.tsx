"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ANCHORED_MENU_VIEWPORT_MARGIN,
  computeAnchoredMenuPosition,
} from "@/components/platform/crud/anchored-menu-position";
import { markNotificationReadAction } from "@/lib/communications/actions";
import { markStaffNotificationRead } from "@/lib/admissions/communications/actions";

export interface NavNotificationItem {
  id: string;
  title: string;
  body: string;
  lead_id: string | null;
  created_at: string;
  notification_type: string;
  read_at?: string | null;
  href?: string | null;
  source?: "platform" | "admissions";
}

interface NotificationCenterProps {
  notifications: NavNotificationItem[];
}

export function NotificationCenter({ notifications }: NotificationCenterProps) {
  const router = useRouter();
  const unread = notifications.filter((n) => !n.read_at);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const triggerRect = trigger.getBoundingClientRect();
    const position = computeAnchoredMenuPosition({
      trigger: {
        top: triggerRect.top,
        left: triggerRect.left,
        right: triggerRect.right,
        bottom: triggerRect.bottom,
        width: triggerRect.width,
        height: triggerRect.height,
      },
      menu: { width: menu.offsetWidth, height: menu.offsetHeight },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      margin: ANCHORED_MENU_VIEWPORT_MARGIN,
      gap: 4,
      preferredAlign: "end",
    });
    setCoords({ top: position.top, left: position.left });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition, notifications.length]);

  useEffect(() => {
    if (!open) return;

    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onReposition() {
      updatePosition();
    }

    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, updatePosition]);

  const panel =
    open && mounted
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label="Notification Center"
            className="fixed z-50 w-96 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg"
            style={{
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              visibility: coords ? "visible" : "hidden",
              maxHeight: `calc(100vh - ${ANCHORED_MENU_VIEWPORT_MARGIN * 2}px)`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <p className="text-sm font-semibold text-slate-900">
                Notification Center
              </p>
              <Link
                href="/dashboard/communications"
                className="text-xs font-medium text-brand-600 hover:underline"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                Communications
              </Link>
            </div>
            <div className="p-2">
              {notifications.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-slate-500">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={`${n.source ?? "n"}-${n.id}`}
                    className={`rounded-xl border p-3 text-sm ${
                      n.read_at
                        ? "border-slate-100"
                        : "border-brand-100 bg-brand-50/40"
                    }`}
                  >
                    <p className="font-medium text-slate-900">{n.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                      {n.body}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                      <div className="flex gap-2">
                        {(n.href || n.lead_id) && (
                          <Link
                            href={
                              n.href ??
                              (n.lead_id
                                ? `/dashboard/admissions/leads/${n.lead_id}`
                                : "#")
                            }
                            className="text-xs font-medium text-brand-600"
                            onClick={() => {
                              setOpen(false);
                              triggerRef.current?.focus();
                            }}
                          >
                            Open
                          </Link>
                        )}
                        {!n.read_at && (
                          <button
                            type="button"
                            className="text-xs font-medium text-slate-600 hover:underline"
                            onClick={() => {
                              void (async () => {
                                if (n.source === "platform") {
                                  await markNotificationReadAction(n.id);
                                } else {
                                  await markStaffNotificationRead(n.id);
                                }
                                router.refresh();
                              })();
                            }}
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        className="flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>🔔</span>
        <span className="hidden sm:inline">Notifications</span>
        {unread.length > 0 && (
          <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-xs text-white">
            {unread.length}
          </span>
        )}
      </button>
      {panel}
    </div>
  );
}
