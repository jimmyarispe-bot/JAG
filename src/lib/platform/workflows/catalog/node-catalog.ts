import type { StudioNodeType } from "@/lib/platform/workflows/types";

export type StudioNodeCatalogEntry = {
  type: StudioNodeType;
  label: string;
  description: string;
  colorHint: string;
};

export const STUDIO_NODE_CATALOG: StudioNodeCatalogEntry[] = [
  {
    type: "trigger",
    label: "Trigger",
    description: "Starts a run from manual, event, schedule, webhook, or system signals",
    colorHint: "emerald",
  },
  {
    type: "condition",
    label: "Condition",
    description: "Branches the graph on field comparisons",
    colorHint: "amber",
  },
  {
    type: "action",
    label: "Action",
    description: "Creates tasks, audits, escalations, or custom side effects (dry-run safe)",
    colorHint: "sky",
  },
  {
    type: "approval",
    label: "Approval",
    description: "Human-gated decision — never auto-approved",
    colorHint: "rose",
  },
  {
    type: "delay",
    label: "Delay",
    description: "Waits a configured duration before continuing",
    colorHint: "slate",
  },
  {
    type: "notification",
    label: "Notification",
    description: "Queues email, SMS, portal, or dashboard messages",
    colorHint: "violet",
  },
  {
    type: "integration",
    label: "Integration",
    description: "Soft-reads domain feeds or plans connector sync — never raw vendor APIs",
    colorHint: "cyan",
  },
  {
    type: "ai_step",
    label: "AI Step",
    description: "Soft-reads Executive Copilot 2.0 for reasoning only",
    colorHint: "indigo",
  },
  {
    type: "graph_update",
    label: "Graph Update",
    description: "Rebuilds the unified knowledge graph from canonical stores",
    colorHint: "teal",
  },
];

export function getStudioNodeCatalog(): StudioNodeCatalogEntry[] {
  return STUDIO_NODE_CATALOG;
}
