/** RC-2.06 — Executive narratives from normalized Workspace entities. */

export const EXECUTIVE_NARRATIVE_KINDS = [
  "meeting_load",
  "collaboration_trend",
  "document_silence",
  "decision_bottleneck",
  "communication_mix",
] as const;

export type ExecutiveNarrativeKind = (typeof EXECUTIVE_NARRATIVE_KINDS)[number];

export type ExecutiveNarrativeSeverity = "info" | "watch" | "attention";

export type ExecutiveNarrative = {
  id: string;
  kind: ExecutiveNarrativeKind;
  /** Human-readable insight for ECC / exec brief — never raw Google objects. */
  headline: string;
  detail: string;
  severity: ExecutiveNarrativeSeverity;
  /** Supporting metrics (counts, percents) — metadata only. */
  evidence: Record<string, number | string | boolean | null>;
  domains: Array<"gmail" | "calendar" | "drive">;
};

export type WorkspaceCollaborationSignals = {
  meetingLoadMinutesRecent: number;
  meetingLoadMinutesPrior: number;
  meetingLoadDeltaPct: number | null;
  uniqueAttendeeDomainsRecent: number;
  uniqueAttendeeDomainsPrior: number;
  collaborationDeltaPct: number | null;
  quietDocuments: number;
  openDecisionTasks: number;
  executivesWithOpenDecisions: number;
  externalMessages: number;
  internalMessages: number;
  externalShareOfCommsPct: number | null;
  asOf: string;
};
