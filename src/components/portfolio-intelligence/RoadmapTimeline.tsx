"use client";

import type { RoadmapItem } from "@/lib/platform/intelligence/portfolio-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function RoadmapTimeline({
  roadmap,
  className,
}: {
  roadmap: RoadmapItem[];
  className?: string;
}) {
  return (
    <ol className={cn("space-y-3 border-l border-slate-200 pl-4", className)}>
      {roadmap.map((item) => (
        <li key={item.initiativeId} className="relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-500" />
          <p className="text-xs text-slate-500">Sequence {item.sequence}</p>
          <p className="text-sm font-medium text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-600">
            {item.theme ?? "theme n/a"} · target {item.endHint ?? "TBD"}
          </p>
        </li>
      ))}
    </ol>
  );
}
