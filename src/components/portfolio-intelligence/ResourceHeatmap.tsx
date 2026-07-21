"use client";

import type { ResourceAllocation } from "@/lib/platform/intelligence/portfolio-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export function ResourceHeatmap({
  allocations,
  className,
}: {
  allocations: ResourceAllocation[];
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="py-2 pr-3">Initiative</th>
            <th className="py-2 pr-3">Budget</th>
            <th className="py-2 pr-3">Staff</th>
            <th className="py-2 pr-3">Sponsor</th>
            <th className="py-2">Shared</th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((a) => (
            <tr key={a.initiativeId} className="border-t border-slate-100">
              <td className="py-2 pr-3 font-medium text-slate-900">{a.title}</td>
              <td className="py-2 pr-3">{a.budgetShare}%</td>
              <td className="py-2 pr-3">{a.staffShare}%</td>
              <td className="py-2 pr-3">{a.sponsorShare}%</td>
              <td className="py-2">{a.sharedServicesShare}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
