"use client";

import type { ReactNode } from "react";
import { cn } from "../utils";

interface InsightPanelProps {
  children: ReactNode;
  title?: string;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function InsightPanel({
  children,
  title = "Insights",
  className,
  collapsible = true,
}: InsightPanelProps) {
  return (
    <>
      <aside
        className={cn(
          "hidden w-80 shrink-0 flex-col border-l border-slate-200 bg-slate-50/50 xl:flex",
          className
        )}
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
      {collapsible && (
        <details className="xl:hidden rounded-2xl border border-slate-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-900">{title}</summary>
          <div className="border-t border-slate-100 p-4">{children}</div>
        </details>
      )}
    </>
  );
}
