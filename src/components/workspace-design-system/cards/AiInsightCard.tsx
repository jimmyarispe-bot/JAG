import type { ReactNode } from "react";
import { CardShell } from "./CardShell";
import { ConfidenceIndicator } from "../status/ConfidenceIndicator";

export interface AiInsightCardProps {
  title: string;
  insight: string;
  confidence?: number;
  source?: string;
  actions?: ReactNode;
}

export function AiInsightCard({ title, insight, confidence, source, actions }: AiInsightCardProps) {
  return (
    <CardShell accentBar="bg-violet-500" className="bg-gradient-to-br from-violet-50/50 to-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">AI Insight</p>
          <h3 className="mt-1 font-semibold text-slate-900">{title}</h3>
        </div>
        {confidence !== undefined && <ConfidenceIndicator value={confidence} label="Confidence" compact />}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{insight}</p>
      {source && <p className="mt-2 text-xs text-slate-400">Source: {source}</p>}
      {actions && <div className="mt-4 border-t border-violet-100 pt-3">{actions}</div>}
    </CardShell>
  );
}
