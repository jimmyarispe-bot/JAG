import { activityGraphProvider } from "@/lib/platform/intelligence-graph/providers/activity-provider";
import { decisionGraphProvider } from "@/lib/platform/intelligence-graph/providers/decision-provider";
import { eventGraphProvider } from "@/lib/platform/intelligence-graph/providers/event-provider";
import { notesGraphProvider } from "@/lib/platform/intelligence-graph/providers/notes-provider";
import { profileGraphProvider } from "@/lib/platform/intelligence-graph/providers/profile-provider";
import { relationshipGraphProvider } from "@/lib/platform/intelligence-graph/providers/relationship-provider";
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
];

export function registerPlatformGraphProviders(): void {
  for (const provider of PLATFORM_GRAPH_PROVIDERS) {
    registerGraphProvider(provider);
  }
}

export {
  activityGraphProvider,
  decisionGraphProvider,
  eventGraphProvider,
  notesGraphProvider,
  profileGraphProvider,
  relationshipGraphProvider,
  tagGraphProvider,
  workflowGraphProvider,
};
