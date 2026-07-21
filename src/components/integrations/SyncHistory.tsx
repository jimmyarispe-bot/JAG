"use client";

import type { SyncResult } from "@/lib/platform/integrations/types";
import { cn } from "@/components/workspace-design-system/utils";

export function SyncHistory({
  rows,
  className,
}: {
  rows: readonly SyncResult[];
  className?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className={cn("rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500", className)}>
        No sync history yet.
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200", className)}>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium">Job</th>
            <th className="px-3 py-2 font-medium">Mode</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Records</th>
            <th className="px-3 py-2 font-medium">Duration</th>
            <th className="px-3 py-2 font-medium">Finished</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.jobId} className="border-t border-slate-100 text-slate-700">
              <td className="px-3 py-2 font-mono text-xs">{row.jobId}</td>
              <td className="px-3 py-2 capitalize">{row.mode}</td>
              <td className="px-3 py-2 capitalize">{row.status}</td>
              <td className="px-3 py-2">{row.recordsFetched}</td>
              <td className="px-3 py-2">{row.durationMs}ms</td>
              <td className="px-3 py-2 text-xs text-slate-500">{row.finishedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
