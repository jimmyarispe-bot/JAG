import type { WorkflowActionType, WorkflowTriggerEvent } from "@/lib/admissions/automation/types";

export type AdmissionsEntityStatus = "live" | "partial" | "planned";

export type AdmissionsIntegrationStatus = "live" | "partial" | "stub";

/** Canonical Admissions OS pipeline stage keys (B-03). */
export type AdmissionsPipelineStageKey =
  | "inquiry"
  | "information_requested"
  | "application_started"
  | "application_submitted"
  | "documents_pending"
  | "documents_complete"
  | "interview_scheduled"
  | "assessment_scheduled"
  | "assessment_complete"
  | "committee_review"
  | "accepted"
  | "waitlisted"
  | "declined"
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
