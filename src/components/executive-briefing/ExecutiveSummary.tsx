"use client";

import { cn } from "@/components/workspace-design-system/utils";

export interface ExecutiveSummaryProps {
  summary: string;
  className?: string;
  title?: string;
}

export function ExecutiveSummary({
  summary,
  className,
  title = "Executive Summary",
}: ExecutiveSummaryProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{summary}</p>
    </section>
  );
}
