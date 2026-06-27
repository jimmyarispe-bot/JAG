import type {
  AdmissionsDashboardTileDefinition,
  AdmissionsFunnelStepDefinition,
} from "@/lib/admissions/registry/types";

/** Registry-driven KPI tiles for the Admissions Operating Dashboard. */
export const ADMISSIONS_DASHBOARD_TILES: AdmissionsDashboardTileDefinition[] = [
  {
    id: "new_inquiries",
    title: "New Inquiries",
    metricKey: "newInquiries",
    drillFilter: "new_inquiries",
    accent: "indigo",
    sortOrder: 0,
  },
  {
    id: "active_leads",
    title: "Active Leads",
    metricKey: "activeLeads",
    drillFilter: "active",
    accent: "sky",
    sortOrder: 10,
  },
  {
    id: "apps_started",
    title: "Apps Started",
    metricKey: "applicationsStarted",
    drillFilter: "stage:application_started",
    accent: "violet",
    sortOrder: 20,
  },
  {
    id: "apps_submitted",
    title: "Apps Submitted",
    metricKey: "applicationsSubmitted",
    drillFilter: "awaiting_decision",
    accent: "amber",
    sortOrder: 30,
  },
  {
    id: "awaiting_documents",
    title: "Awaiting Documents",
    metricKey: "awaitingDocuments",
    drillFilter: "pipeline:documents_pending",
    accent: "rose",
    sortOrder: 40,
  },
  {
    id: "awaiting_state_funding",
    title: "Awaiting State Funding",
    metricKey: "awaitingStateFunding",
    drillFilter: "active",
    accent: "emerald",
    sortOrder: 50,
  },
  {
    id: "awaiting_decision",
    title: "Awaiting Decision",
    metricKey: "awaitingDecision",
    drillFilter: "pipeline:committee_review",
    accent: "indigo",
    sortOrder: 60,
  },
  {
    id: "accepted",
    title: "Accepted",
    metricKey: "accepted",
    drillFilter: "accepted",
    accent: "emerald",
    sortOrder: 70,
  },
  {
    id: "waitlisted",
    title: "Waitlisted",
    metricKey: "waitlisted",
    drillFilter: "waitlisted",
    accent: "amber",
    sortOrder: 80,
  },
  {
    id: "declined",
    title: "Declined",
    metricKey: "declined",
    drillFilter: "declined",
    accent: "rose",
    sortOrder: 90,
  },
];

/** Registry-driven conversion funnel steps. */
export const ADMISSIONS_FUNNEL_STEPS: AdmissionsFunnelStepDefinition[] = [
  { id: "inquiries", label: "Inquiries", sortOrder: 0 },
  { id: "information", label: "Information Requested", sortOrder: 10 },
  { id: "applications", label: "Applications", sortOrder: 20 },
  { id: "submitted", label: "Submitted", sortOrder: 30 },
  { id: "review", label: "Committee Review", sortOrder: 40 },
  { id: "accepted", label: "Accepted", sortOrder: 50 },
  { id: "enrolled", label: "Enrollment Complete", sortOrder: 60 },
];

export function getAdmissionsDashboardTiles(): AdmissionsDashboardTileDefinition[] {
  return [...ADMISSIONS_DASHBOARD_TILES].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getAdmissionsFunnelSteps(): AdmissionsFunnelStepDefinition[] {
  return [...ADMISSIONS_FUNNEL_STEPS].sort((a, b) => a.sortOrder - b.sortOrder);
}
