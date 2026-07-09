import { CardShell } from "./CardShell";
import { MasteryBadge } from "../status/MasteryBadge";
import type { WdsMasteryLevel } from "../tokens";

export interface AtomicSkillCardProps {
  name: string;
  competency?: string;
  masteryLevel?: WdsMasteryLevel;
  evidenceCount?: number;
  lastAssessed?: string;
}

export function AtomicSkillCard({
  name,
  competency,
  masteryLevel,
  evidenceCount,
  lastAssessed,
}: AtomicSkillCardProps) {
  return (
    <CardShell padding="sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {competency && <p className="text-xs text-slate-400">{competency}</p>}
          <h4 className="font-medium text-slate-900">{name}</h4>
        </div>
        {masteryLevel && <MasteryBadge level={masteryLevel} size="sm" />}
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {evidenceCount !== undefined && (
          <>
            <dt className="sr-only">Evidence count</dt>
            <dd>{evidenceCount} evidence</dd>
          </>
        )}
        {lastAssessed && (
          <>
            <dt className="sr-only">Last assessed</dt>
            <dd>Assessed {lastAssessed}</dd>
          </>
        )}
      </dl>
    </CardShell>
  );
}
