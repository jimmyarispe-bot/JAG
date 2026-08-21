import type { WorkflowActionType, WorkflowTriggerEvent } from "@/lib/admissions/automation/types";

export type AdmissionsEntityStatus = "live" | "partial" | "planned";

export type AdmissionsIntegrationStatus = "live" | "partial" | "stub";

/**
 * Canonical Admissions OS pipeline stage keys (B-03).
 *
 * Aligned to The Academy Way's operating process (Aug 2026 migration). Stages
 * describe the *family's* position in the funnel; staff to-dos ("send the
 * application", "countersign the contract") are modelled as open tasks on the
 * lead, never as stages — a stage must not be able to sit stale with no signal.
 */
export type AdmissionsPipelineStageKey =
  | "inquiry"
  | "interest_meeting_requested"
  | "interest_call_scheduled"
  | "interest_meeting_held"
  | "tour_requested"
  | "tour_scheduled"
  | "tour_conducted"
  | "shadow_day_scheduled"
  | "application_started"
  | "application_submitted"
  | "documents_pending"
  | "committee_review"
  | "accepted"
  | "waitlisted"
  | "declined"
  | "not_returning"
  | "enrollment_complete";

export interface AdmissionsEntityDefinition {
  key: string;
  label: string;
  pluralLabel: string;
  table: string | null;
  moduleKey: "admissions";
  status: AdmissionsEntityStatus;
  description: string;
}

export interface AdmissionsIntegrationDefinition {
  key: string;
  label: string;
  targetModule: string;
  status: AdmissionsIntegrationStatus;
  description: string;
}

export interface PipelineStageDefinition {
  key: AdmissionsPipelineStageKey;
  label: string;
  color: string;
  order: number;
  isTerminal: boolean;
  isActivePipeline: boolean;
  /** Legacy `admissions_leads.lead_stage` values mapped to this OS stage. */
  legacyLeadStages: string[];
  automatedTask?: { taskName: string; dueDays: number };
}

export interface AdmissionsWorkflowCatalogEntry {
  workflowKey: string;
  name: string;
  description: string;
  triggerEvent: WorkflowTriggerEvent;
  category: string;
  pipelineStage?: AdmissionsPipelineStageKey;
  sortOrder: number;
  status: AdmissionsEntityStatus;
  defaultActions: WorkflowActionType[];
}

export type AdmissionsDashboardMetricKey =
  | "newInquiries"
  | "activeLeads"
  | "applicationsStarted"
  | "applicationsSubmitted"
  | "awaitingDocuments"
  | "awaitingStateFunding"
  | "awaitingDecision"
  | "accepted"
  | "waitlisted"
  | "declined"
  | "avgDaysInquiryToAcceptance"
  | "acceptanceRate"
  | "enrollmentConversionRate"
  | "forecastedTuition"
  | "forecastedScholarshipObligations"
  | "forecastedStateFundingRevenue"
  | "pipelineByStage"
  | "funnel";

export interface AdmissionsDashboardTileDefinition {
  id: string;
  title: string;
  metricKey: AdmissionsDashboardMetricKey;
  drillFilter: string;
  accent: "indigo" | "sky" | "violet" | "amber" | "rose" | "emerald";
  sortOrder: number;
}

export interface AdmissionsFunnelStepDefinition {
  id: string;
  label: string;
  sortOrder: number;
}

export interface AdmissionsRegistrySnapshot {
  entities: AdmissionsEntityDefinition[];
  integrations: AdmissionsIntegrationDefinition[];
  pipelineStages: PipelineStageDefinition[];
  workflows: AdmissionsWorkflowCatalogEntry[];
  dashboardTiles: AdmissionsDashboardTileDefinition[];
  funnelSteps: AdmissionsFunnelStepDefinition[];
}
