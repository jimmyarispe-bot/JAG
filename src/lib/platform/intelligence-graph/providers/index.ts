import { activityGraphProvider } from "@/lib/platform/intelligence-graph/providers/activity-provider";
import { decisionGraphProvider } from "@/lib/platform/intelligence-graph/providers/decision-provider";
import { evidenceGraphProvider } from "@/lib/platform/intelligence-graph/providers/evidence-provider";
import { eventGraphProvider } from "@/lib/platform/intelligence-graph/providers/event-provider";
import { notesGraphProvider } from "@/lib/platform/intelligence-graph/providers/notes-provider";
import { persistedGraphProvider } from "@/lib/platform/intelligence-graph/providers/persisted-provider";
import { profileGraphProvider } from "@/lib/platform/intelligence-graph/providers/profile-provider";
import { relationshipGraphProvider } from "@/lib/platform/intelligence-graph/providers/relationship-provider";
import { rulesGraphProvider } from "@/lib/platform/intelligence-graph/providers/rules-provider";
import { tagGraphProvider } from "@/lib/platform/intelligence-graph/providers/tag-provider";
import { workflowGraphProvider } from "@/lib/platform/intelligence-graph/providers/workflow-provider";
import { registerGraphProvider } from "@/lib/platform/intelligence-graph/registry/node-registry";
import type { GraphProvider } from "@/lib/platform/intelligence-graph/types";

export const PLATFORM_GRAPH_PROVIDERS: GraphProvider[] = [
  relationshipGraphProvider,
  activityGraphProvider,
  eventGraphProvider,
  workflowGraphProvider,
  decisionGraphProvider,
  notesGraphProvider,
  tagGraphProvider,
  profileGraphProvider,
  persistedGraphProvider,
  evidenceGraphProvider,
  rulesGraphProvider,
];

export function registerPlatformGraphProviders(): void {
  for (const provider of PLATFORM_GRAPH_PROVIDERS) {
    registerGraphProvider(provider);
  }
}

export {
  activityGraphProvider,
  decisionGraphProvider,
  evidenceGraphProvider,
  eventGraphProvider,
  notesGraphProvider,
  persistedGraphProvider,
  profileGraphProvider,
  relationshipGraphProvider,
  rulesGraphProvider,
  tagGraphProvider,
  workflowGraphProvider,
};
