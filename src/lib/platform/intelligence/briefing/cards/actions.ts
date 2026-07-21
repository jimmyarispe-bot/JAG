/**
 * Sprint 062 — every briefing card exposes actionable next steps (UX-003/004).
 */

import type { BriefingActionId, BriefingCardAction, BriefingCardKind } from "@/lib/platform/intelligence/briefing/types";

const ACTION_LABELS: Record<BriefingActionId, string> = {
  open_investigation: "Open Investigation",
  view_evidence: "View Evidence",
  assign_owner: "Assign Owner",
  create_initiative: "Create Initiative",
  schedule_review: "Schedule Review",
  dismiss: "Dismiss",
};

const DEFAULT_BY_KIND: Record<BriefingCardKind, BriefingActionId[]> = {
  risk: ["open_investigation", "view_evidence", "assign_owner", "schedule_review"],
  opportunity: ["create_initiative", "view_evidence", "assign_owner", "schedule_review"],
  decision: ["open_investigation", "view_evidence", "assign_owner", "schedule_review"],
  alert: ["open_investigation", "view_evidence", "dismiss"],
  metric: ["view_evidence", "schedule_review"],
  summary: ["view_evidence", "open_investigation"],
  focus: ["open_investigation", "create_initiative", "schedule_review"],
  action: ["create_initiative", "assign_owner", "schedule_review", "dismiss"],
};

export function cardActions(
  kind: BriefingCardKind,
  hrefBase = "/dashboard/executive"
): BriefingCardAction[] {
  return DEFAULT_BY_KIND[kind].map((id, index) => ({
    id,
    label: ACTION_LABELS[id],
    href: `${hrefBase}?action=${id}`,
    variant: index === 0 ? "primary" : id === "dismiss" ? "ghost" : "secondary",
  }));
}
