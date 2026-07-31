/**
 * P-002 — Intelligent Help types (additive; does not alter HelpResponse).
 */

import type { HelpEvidence, MrJagPersona } from "../../types";

export type DiagnosisConfidence = "High" | "Medium" | "Low";

export type RootCauseDiagnosis = {
  readonly problem: string;
  readonly rootCause: string;
  readonly confidence: DiagnosisConfidence;
  readonly evidence: readonly HelpEvidence[];
  readonly recommendedFix: string;
  readonly preventativeGuidance: readonly string[];
  readonly relatedTutorialId: string | null;
  readonly relatedWalkthroughId: string | null;
  readonly intent: string;
};

export type DiagnosticSignal = {
  readonly id: string;
  readonly category:
    | "documentation"
    | "knowledge_graph"
    | "release"
    | "configuration"
    | "operations"
    | "connector"
    | "permissions"
    | "role"
    | "organization";
  readonly ok: boolean;
  readonly detail: string;
  readonly evidence: readonly string[];
  readonly weight: number;
};

export type DiagnosticBundle = {
  readonly generatedAt: string;
  readonly question: string;
  readonly persona: MrJagPersona;
  readonly signals: readonly DiagnosticSignal[];
  readonly searchHits: readonly HelpEvidence[];
};

export type IncidentStatus =
  | "Open"
  | "Diagnosed"
  | "Resolved"
  | "Verified"
  | "Captured";

export type HelpIncident = {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly question: string;
  readonly persona: MrJagPersona;
  readonly status: IncidentStatus;
  readonly diagnosis: RootCauseDiagnosis | null;
  readonly resolution: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly verifiedAt: string | null;
  readonly knowledgeEntryId: string | null;
};

export type CapturedKnowledgeEntry = {
  readonly id: string;
  readonly problem: string;
  readonly cause: string;
  readonly resolution: string;
  readonly verified: boolean;
  readonly intent: string;
  readonly evidenceIds: readonly string[];
  readonly incidentId: string;
  readonly createdAt: string;
};

export type IntelligentHelpResult = {
  readonly diagnosis: RootCauseDiagnosis;
  readonly diagnostics: DiagnosticBundle;
  readonly incident: HelpIncident;
  readonly recommendations: readonly string[];
  /** Primary answer is the diagnosis — not documentation-first. */
  readonly answer: string;
  readonly generatedAt: string;
};

export type IntelligentHelpDashboard = {
  readonly generatedAt: string;
  readonly recentIssues: readonly HelpIncident[];
  readonly suggestedFixes: readonly string[];
  readonly frequentlySolved: readonly CapturedKnowledgeEntry[];
  readonly topRootCauses: readonly {
    readonly cause: string;
    readonly count: number;
  }[];
};
