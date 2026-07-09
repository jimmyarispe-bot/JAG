import type { ReactNode } from "react";
import { CardShell } from "./CardShell";
import { ConfidenceIndicator } from "../status/ConfidenceIndicator";

export interface EvidenceCardProps {
  title: string;
  artifactType: string;
  createdAt: string;
  qualityScore?: number;
  subject?: string;
  actions?: ReactNode;
}

export function EvidenceCard({
  title,
  artifactType,
  createdAt,
  qualityScore,
  subject,
  actions,
}: EvidenceCardProps) {
  return (
    <CardShell padding="sm" interactive>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium capitalize text-brand-600">{artifactType.replace(/_/g, " ")}</p>
          <h4 className="mt-1 font-medium text-slate-900">{title}</h4>
          {subject && <p className="mt-1 text-xs text-slate-500">{subject}</p>}
        </div>
        {qualityScore !== undefined && (
          <ConfidenceIndicator value={qualityScore} label="Quality" compact />
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
        <time dateTime={createdAt}>{new Date(createdAt).toLocaleDateString()}</time>
        {actions}
      </div>
    </CardShell>
  );
}
