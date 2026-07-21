/**
 * RC-2.06 — Executive Intelligence from Google Workspace
 * Narratives for ECC / exec brief — canonical entities only.
 */

export type {
  ExecutiveNarrative,
  ExecutiveNarrativeKind,
  ExecutiveNarrativeSeverity,
  WorkspaceCollaborationSignals,
} from "@/lib/platform/integrations/google-workspace/intelligence/types";

export { EXECUTIVE_NARRATIVE_KINDS } from "@/lib/platform/integrations/google-workspace/intelligence/types";

export {
  recordsByKind,
  emailsFromStore,
  meetingsFromStore,
  calendarEventsFromStore,
  documentsFromStore,
  attendeesFromStore,
  tasksFromStore,
} from "@/lib/platform/integrations/google-workspace/intelligence/from-store";

export { computeWorkspaceCollaborationSignals } from "@/lib/platform/integrations/google-workspace/intelligence/signals";

export {
  buildExecutiveNarratives,
  buildExecutiveNarrativesFromSignals,
  narrativeHeadlines,
} from "@/lib/platform/integrations/google-workspace/intelligence/narrative-builder";
