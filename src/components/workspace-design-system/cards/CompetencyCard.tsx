import type { ReactNode } from "react";
import { CardShell } from "./CardShell";
import { MasteryBadge } from "../status/MasteryBadge";
import type { WdsMasteryLevel } from "../tokens";

export interface CompetencyCardProps {
  title: string;
  domain?: string;
  progress: number;
  masteryLevel?: WdsMasteryLevel;
  description?: string;
  footer?: ReactNode;
}

export function CompetencyCard({
  title,
  domain,
  progress,
  masteryLevel,
  description,
  footer,
}: CompetencyCardProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <CardShell accentBar="bg-brand-500">
      <div className="flex items-start justify-between gap-3">
        <div>
          {domain && <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{domain}</p>}
          <h3 className="mt-1 font-semibold text-slate-900">{title}</h3>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {masteryLevel && <MasteryBadge level={masteryLevel} />}
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Completion</span>
          <span className="font-medium text-slate-700">{clamped}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${clamped}%` }} />
        </div>
      </div>
      {footer && <div className="mt-4 border-t border-slate-100 pt-3">{footer}</div>}
    </CardShell>
  );
}
