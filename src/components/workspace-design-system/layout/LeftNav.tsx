"use client";

import type { ReactNode } from "react";
import { cn } from "../utils";

interface LeftNavProps {
  children: ReactNode;
  title?: string;
  className?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function LeftNav({ children, title, className, mobileOpen = false, onMobileClose }: LeftNavProps) {
  return (
    <>
      {mobileOpen && onMobileClose && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={cn(
          "flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white",
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {title && (
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto p-3">{children}</nav>
      </aside>
    </>
  );
}
