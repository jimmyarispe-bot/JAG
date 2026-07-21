"use client";

import type { DecisionOption } from "@/lib/platform/intelligence/decision-intelligence";
import { cn } from "@/components/workspace-design-system/utils";

export interface OptionComparisonTableProps {
  options: DecisionOption[];
  className?: string;
}

export function OptionComparisonTable({ options, className }: OptionComparisonTableProps) {
  const rows = [...options].sort((a, b) => a.rank - b.rank);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2 font-medium">Rank</th>
            <th className="px-3 py-2 font-medium">Option</th>
            <th className="px-3 py-2 font-medium">Overall</th>
            <th className="px-3 py-2 font-medium">Impact</th>
            <th className="px-3 py-2 font-medium">Risk</th>
            <th className="px-3 py-2 font-medium">Effort</th>
            <th className="px-3 py-2 font-medium">Confidence</th>
            <th className="px-3 py-2 font-medium">Approval</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((opt) => (
            <tr key={opt.id} className="border-b border-slate-100 text-slate-800">
              <td className="px-3 py-2 font-semibold">#{opt.rank}</td>
              <td className="px-3 py-2">
                <div className="font-medium text-slate-900">{opt.title}</div>
                <div className="text-xs text-slate-500">{opt.category}</div>
              </td>
              <td className="px-3 py-2">{opt.scorecard.overall}</td>
              <td className="px-3 py-2">{opt.scorecard.expectedImpact}</td>
              <td className="px-3 py-2">{opt.scorecard.risk}</td>
              <td className="px-3 py-2">{opt.estimatedEffort}</td>
              <td className="px-3 py-2">{opt.confidence}</td>
              <td className="px-3 py-2 capitalize">{opt.approvalRequired}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
