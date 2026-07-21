"use client";

import { ActionChip } from "@/components/experience-system/feedback/ActionChip";
import {
  drillDownLabel,
  type DrillDownAction,
  type WidgetCard,
} from "@/lib/platform/intelligence/executive-command-center";

export interface WidgetCardActionsProps {
  card: WidgetCard;
  actions: DrillDownAction[];
  onAction?: (action: DrillDownAction, card: WidgetCard) => void;
}

export function WidgetCardActions({ card, actions, onAction }: WidgetCardActionsProps) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <ActionChip
          key={action}
          size="sm"
          variant={action === "open_investigation" ? "primary" : "outline"}
          onClick={() => onAction?.(action, card)}
        >
          {drillDownLabel(action)}
        </ActionChip>
      ))}
    </div>
  );
}
