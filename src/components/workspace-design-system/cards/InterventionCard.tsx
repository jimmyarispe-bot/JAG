import type { ReactNode } from "react";
import { CardShell } from "./CardShell";
import { InterventionIndicator } from "../status/InterventionIndicator";

export interface InterventionCardProps {
  type: string;
  goal?: string;
  reviewDate?: string;
  status?: "active" | "planned" | "completed" | "paused";
  studentName?: string;
  actions?: ReactNode;
}

export function InterventionCard({
  type,
  goal,
  reviewDate,
  status = "active",
  studentName,
  actions,
}: InterventionCardProps) {
  return (
    <CardShell>
      <div className="flex items-start justify-between gap-2">
        <div>
          <InterventionIndicator status={status} />
          <h3 className="mt-2 font-semibold text-slate-900">{type}</h3>
          {studentName && <p className="text-sm text-slate-500">{studentName}</p>}
        </div>
      </div>
      {goal && <p className="mt-2 text-sm text-slate-600">{goal}</p>}
      {reviewDate && (
        <p className="mt-2 text-xs text-slate-400">Review: {reviewDate}</p>
      )}
      {actions && <div className="mt-4 border-t border-slate-100 pt-3">{actions}</div>}
    </CardShell>
  );
}
