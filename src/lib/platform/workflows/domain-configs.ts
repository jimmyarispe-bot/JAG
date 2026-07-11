/**
 * End-to-End Workflow Engine — domain pack configurations.
 *
 * Specialization only: labels, agents, metric emphasis, authority domain.
 * Business logic remains in existing Intelligence / Autonomy / Governance services.
 */

import type { WorkflowDomain, WorkflowDomainConfig } from "@/lib/platform/workflows/types";

export const WORKFLOW_DOMAIN_CONFIGS: Readonly<
  Record<WorkflowDomain, WorkflowDomainConfig>
> = {
  executive: {
    domain: "executive",
    label: "Executive",
    defaultSubject: "Executive organizational operating cycle",
    authorityDomain: "strategic",
    preferredAgents: ["executive", "strategic", "decision"],
    metricKeys: [
      "days_cash",
      "attendance_rate",
      "enrollment_count",
      "execution_health",
      "strategic_goal_progress",
    ],
    description: "Cross-cutting executive lifecycle from detection through brief/health updates",
  },
  strategic: {
    domain: "strategic",
    label: "Strategic",
    defaultSubject: "Strategic initiative lifecycle",
    authorityDomain: "strategic",
    preferredAgents: ["strategic", "executive", "decision"],
    metricKeys: ["strategic_goal_progress", "execution_health", "enrollment_count"],
    description: "Strategic opportunity → goal → execution → reflection lifecycle",
  },
  governance: {
    domain: "governance",
    label: "Governance",
    defaultSubject: "Governance and accountability lifecycle",
    authorityDomain: "mission",
    preferredAgents: ["decision", "executive", "strategic"],
    metricKeys: ["open_findings", "execution_health", "days_cash"],
    description: "Governance-first lifecycle emphasizing approvals and oversight",
  },
  finance: {
    domain: "finance",
    label: "Finance",
    defaultSubject: "Financial stewardship lifecycle",
    authorityDomain: "financial",
    preferredAgents: ["executive", "decision", "strategic"],
    metricKeys: ["days_cash", "enrollment_count", "execution_health"],
    description: "Cash, receivables, and financial risk lifecycle",
  },
  hr: {
    domain: "hr",
    label: "Human Resources",
    defaultSubject: "Workforce capacity lifecycle",
    authorityDomain: "hr",
    preferredAgents: ["executive", "strategic", "decision"],
    metricKeys: ["vacancy_rate", "execution_health", "satisfaction_score"],
    description: "Staffing, vacancy, and workforce risk lifecycle",
  },
  operations: {
    domain: "operations",
    label: "Operations",
    defaultSubject: "Operational continuity lifecycle",
    authorityDomain: "operational",
    preferredAgents: ["executive", "decision", "strategic"],
    metricKeys: ["execution_health", "attendance_rate", "vacancy_rate"],
    description: "Day-to-day operational issue lifecycle",
  },
  enrollment: {
    domain: "enrollment",
    label: "Enrollment",
    defaultSubject: "Enrollment growth and retention lifecycle",
    authorityDomain: "operational",
    preferredAgents: ["strategic", "executive", "decision"],
    metricKeys: ["enrollment_count", "attendance_rate", "satisfaction_score"],
    description: "Enrollment signal → strategy → execution lifecycle",
  },
  academics: {
    domain: "academics",
    label: "Academics",
    defaultSubject: "Academic performance lifecycle",
    authorityDomain: "academic",
    preferredAgents: ["strategic", "executive", "decision"],
    metricKeys: ["attendance_rate", "satisfaction_score", "strategic_goal_progress"],
    description: "Learning outcomes and academic risk lifecycle",
  },
  compliance: {
    domain: "compliance",
    label: "Compliance",
    defaultSubject: "Compliance remediation lifecycle",
    authorityDomain: "mission",
    preferredAgents: ["decision", "executive", "strategic"],
    metricKeys: ["open_findings", "days_cash", "execution_health"],
    description: "Findings → approval → remediation → audit lifecycle",
  },
  board: {
    domain: "board",
    label: "Board",
    defaultSubject: "Board decision and resolution lifecycle",
    authorityDomain: "mission",
    preferredAgents: ["decision", "executive", "strategic"],
    metricKeys: [
      "days_cash",
      "open_findings",
      "strategic_goal_progress",
      "execution_health",
    ],
    description: "Board motion / resolution oriented executive lifecycle",
  },
};

export function getWorkflowDomainConfig(domain: WorkflowDomain): WorkflowDomainConfig {
  return WORKFLOW_DOMAIN_CONFIGS[domain];
}
