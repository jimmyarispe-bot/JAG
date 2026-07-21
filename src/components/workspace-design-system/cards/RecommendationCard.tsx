import type { ReactNode } from "react";
import {
  ActionChip,
  ActionChipGroup,
  inferActionChipVariant,
} from "@/components/ui/cta";
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
  const label = actionLabel?.replace(/\s*→\s*$/, "").trim() || actionLabel;
  const variant = label ? inferActionChipVariant(label) : "primary";

  return (
    <CardShell accentBar="bg-violet-500">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <RecommendationIndicator priority={priority} />
      </div>
      <p className="mt-2 text-sm text-slate-600">{rationale}</p>
      {label && (actionHref || onAction) ? (
        <ActionChipGroup className="mt-4">
          {actionHref ? (
            <ActionChip href={actionHref} variant={variant} size="sm">
              {label}
            </ActionChip>
          ) : (
            <ActionChip type="button" onClick={onAction} variant={variant} size="sm">
              {label}
            </ActionChip>
          )}
        </ActionChipGroup>
      ) : null}
      {footer ? <div className="mt-4 border-t border-slate-100 pt-3">{footer}</div> : null}
    </CardShell>
  );
}
