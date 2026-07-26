"use client";

import Link from "next/link";
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
import { markStaffNotificationRead } from "@/lib/admissions/communications/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";

interface StaffNotification {
  id: string;
  title: string;
  body: string;
  lead_id: string | null;
  created_at: string;
  notification_type: string;
}

interface StaffNotificationsBellProps {
  notifications: StaffNotification[];
}

export function StaffNotificationsBell({ notifications }: StaffNotificationsBellProps) {
  const action = useActionFeedback({
    verb: "custom",
    labels: { idle: "Mark read", loading: "Updating…", success: "✓ Read", error: "Unable to update" },
    successToast: "✓ Marked as read.",
    errorToast: "Unable to update notification.",
    progressLabel: "Updating notification…",
  });
  const unread = notifications.filter((n) => !("read_at" in n && n.read_at));
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

  if (notifications.length === 0) return null;

  const panel =
    open && mounted
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label="Staff notifications"
            className="fixed z-50 w-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg"
            style={{
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              visibility: coords ? "visible" : "hidden",
              maxHeight: `calc(100vh - ${ANCHORED_MENU_VIEWPORT_MARGIN * 2}px)`,
            }}
          >
            <div className="p-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-slate-100 p-3 text-sm"
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
                      {n.lead_id && (
                        <Link
                          href={`/dashboard/admissions/leads/${n.lead_id}`}
                          className="text-xs font-medium text-brand-600"
                          onClick={() => {
                            setOpen(false);
                            triggerRef.current?.focus();
                          }}
                        >
                          View lead
                        </Link>
                      )}
                      <ActionButton
                        type="button"
                        status={action.status}
                        verb="custom"
                        variant="ghost"
                        size="xs"
                        labels={{
                          idle: "Mark read",
                          loading: "Updating…",
                          success: "✓ Read",
                          error: "Unable to update",
                        }}
                        errorMessage={action.errorMessage}
                        onClick={() => {
                          void action.run(async () => {
                            const result = await markStaffNotificationRead(n.id);
                            assertActionResult(result);
                            return result;
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
