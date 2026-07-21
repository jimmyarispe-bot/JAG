"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

  return (
    <div className="relative">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <span aria-hidden>🔔</span>
          <span className="hidden sm:inline">Notifications</span>
          {unread.length > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-xs text-white">
              {unread.length}
            </span>
          )}
        </summary>
        <div className="absolute right-0 z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">Notification Center</p>
            <Link
              href="/dashboard/communications"
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Communications
            </Link>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-slate-500">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={`${n.source ?? "n"}-${n.id}`}
                  className={`rounded-xl border p-3 text-sm ${
                    n.read_at ? "border-slate-100" : "border-brand-100 bg-brand-50/40"
                  }`}
                >
                  <p className="font-medium text-slate-900">{n.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{n.body}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      {(n.href || n.lead_id) && (
                        <Link
                          href={
                            n.href ??
                            (n.lead_id ? `/dashboard/admissions/leads/${n.lead_id}` : "#")
                          }
                          className="text-xs font-medium text-brand-600"
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
        </div>
      </details>
    </div>
  );
}
