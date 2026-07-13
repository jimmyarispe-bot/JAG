"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ExecNav } from "@/components/exec/ExecNav";
import { cn } from "@/components/workspace-design-system/utils";

type ExecShellProps = {
  fullName: string;
  roleLabel: string;
  children: React.ReactNode;
};

export function ExecShell({ fullName, roleLabel, children }: ExecShellProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const openNav = useCallback(() => setOpen(true), []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <a
        href="#exec-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to main content
      </a>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={close}
        />
      )}

      <aside
        className={cn(
          "flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:transition-transform max-lg:duration-200",
          open ? "max-lg:translate-x-0" : "max-lg:pointer-events-none max-lg:-translate-x-full",
          "lg:relative"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            JAG
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Command Center</p>
            <p className="text-xs text-slate-400">Executive surface</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <ExecNav />
        </div>
        <div className="border-t border-sidebar-border px-5 py-4">
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white">
            ← Back to dashboard
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 lg:hidden"
              onClick={openNav}
            >
              Menu
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-900">Executive Command Center</p>
              <p className="text-xs text-slate-500">OIOS · situational awareness</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{fullName}</p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
            <span
              className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500"
              title="Ask JAG — Phase 2"
            >
              Ask JAG
            </span>
          </div>
        </header>
        <main id="exec-main" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
