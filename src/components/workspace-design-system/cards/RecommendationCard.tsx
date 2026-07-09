import type { ReactNode } from "react";
import { CardShell } from "./CardShell";
import { RecommendationIndicator } from "../status/RecommendationIndicator";

export interface RecommendationCardProps {
  title: string;
  rationale: string;
  priority?: "low" | "medium" | "high";
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  footer?: ReactNode;
}

export function RecommendationCard({
  title,
  rationale,
  priority = "medium",
  actionLabel,
  actionHref,
  onAction,
  footer,
}: RecommendationCardProps) {
  return (
    <CardShell accentBar="bg-violet-500">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <RecommendationIndicator priority={priority} />
      </div>
      <p className="mt-2 text-sm text-slate-600">{rationale}</p>
      {(actionLabel && (actionHref || onAction)) && (
        <div className="mt-4">
          {actionHref ? (
            <a href={actionHref} className="text-sm font-medium text-brand-600 hover:underline">
              {actionLabel} →
            </a>
          ) : (
            <button type="button" onClick={onAction} className="text-sm font-medium text-brand-600 hover:underline">
              {actionLabel} →
            </button>
          )}
        </div>
      )}
      {footer && <div className="mt-4 border-t border-slate-100 pt-3">{footer}</div>}
    </CardShell>
  );
}
