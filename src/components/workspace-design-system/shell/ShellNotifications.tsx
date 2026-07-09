"use client";

import Link from "next/link";
import { useState } from "react";
import type { WdsNotification } from "../types";
import { cn } from "../utils";

interface ShellNotificationsProps {
  notifications: WdsNotification[];
  onMarkRead?: (id: string) => void;
  className?: string;
}

export function ShellNotifications({ notifications, onMarkRead, className }: ShellNotificationsProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (notifications.length === 0) return null;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Close notifications" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
            </div>
            <ul className="max-h-96 overflow-y-auto p-2">
              {notifications.map((n) => (
                <li key={n.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                  <p className="font-medium text-slate-900">{n.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">{n.body}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <time className="text-xs text-slate-400" dateTime={n.createdAt}>
                      {new Date(n.createdAt).toLocaleString()}
                    </time>
                    <div className="flex gap-2">
                      {n.href && (
                        <Link href={n.href} className="text-xs font-medium text-brand-600" onClick={() => setOpen(false)}>
                          View
                        </Link>
                      )}
                      {onMarkRead && !n.read && (
                        <button type="button" onClick={() => onMarkRead(n.id)} className="text-xs text-slate-500 hover:text-slate-700">
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
