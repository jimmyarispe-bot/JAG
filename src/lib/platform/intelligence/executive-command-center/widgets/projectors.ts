/**
 * Widget projectors — map soft-read domain outputs to workspace cards.
 * No domain engine logic is reimplemented here.
 */

import { actionsForWidget } from "@/lib/platform/intelligence/executive-command-center/actions/drill-downs";
import type {
  AutonomousResultLight,
  BriefingResultLight,
  CopilotResultLight,
  DecisionIntelligenceResultLight,
  ExecutiveMemoryResultLight,
  ExecutivePredictiveResultLight,
  DigitalTwinResultLight,
  EcosystemIntelligenceResultLight,
  InitiativeResultLight,
  PortfolioResultLight,
  SynthesisResultLight,
  WidgetKind,
  WorkspaceWidget,
} from "@/lib/platform/intelligence/executive-command-center/types";
import type { GoogleWorkspaceEccWidgets } from "@/lib/platform/integrations/connectors/google-workspace/services/ecc-widgets";
import type { Microsoft365EccWidgets } from "@/lib/platform/integrations/connectors/microsoft-365/services/ecc-widgets";
import type { UnifiedCommunicationDashboard } from "@/lib/platform/integrations/connectors/microsoft-365/services/unified-communication";
import type { CollaborationEccWidgets } from "@/lib/platform/integrations/connectors/collaboration/intelligence/ecc-widgets";
import type { FinanceEccWidgets } from "@/lib/platform/integrations/connectors/finance/intelligence/ecc-widgets";
import type { EnterpriseEccWidgets } from "@/lib/platform/integrations/connectors/enterprise/intelligence/ecc-widgets";
import type { HrEccWidgets } from "@/lib/platform/integrations/connectors/hr/intelligence/ecc-widgets";
import type { CrmEccWidgets } from "@/lib/platform/integrations/connectors/crm/intelligence/ecc-widgets";
import type { EducationEccWidgets } from "@/lib/platform/integrations/connectors/education/intelligence/ecc-widgets";
import type { KnowledgeGraphEccWidgets } from "@/lib/platform/knowledge-graph/widgets/organizational-graph";
import type { MissionControlWorkspace } from "@/lib/platform/executive-command-center";
import {
  projectMissionControlSummary,
  projectOrganizationTimeline,
  projectAlertCenter,
  projectApprovalCenter,
  projectInvestigationWorkspace,
  projectAiWorkspace,
  projectDigitalTwinControls,
  projectScenarioSimulator,
  projectRiskCenter,
  projectInitiativeMonitor,
  projectOrganizationGraphViewer,
} from "@/lib/platform/intelligence/executive-command-center/widgets/mission-control-projectors";

export interface ProjectorInput {
  synthesis?: SynthesisResultLight;
  briefing?: BriefingResultLight;
  memory?: ExecutiveMemoryResultLight;
  decision?: DecisionIntelligenceResultLight;
  predictive?: ExecutivePredictiveResultLight;
  autonomous?: AutonomousResultLight;
  copilot?: CopilotResultLight;
  initiative?: InitiativeResultLight;
  portfolio?: PortfolioResultLight;
  digitalTwin?: DigitalTwinResultLight;
  ecosystemIntelligence?: EcosystemIntelligenceResultLight;
  /** Sprint 074 — soft-read Google Workspace ECC widgets (never raw Google objects). */
  googleWorkspace?: GoogleWorkspaceEccWidgets | null;
  /** RC-3.01 — soft-read Microsoft 365 ECC widgets (Communication / Meetings / Documents). */
  microsoft365?: Microsoft365EccWidgets | null;
  /** Sprint 075 — provider-neutral Google + Microsoft communication surface. */
  unifiedCommunication?: UnifiedCommunicationDashboard | null;
  /** Sprint 076 — Slack / Teams / Zoom communication graph widgets. */
  collaboration?: CollaborationEccWidgets | null;
  /** Sprint 077 — QuickBooks / Stripe / Square / Plaid financial widgets. */
  finance?: FinanceEccWidgets | null;
  /** Sprint 078 — CRM / Education / Government operational widgets. */
  enterprise?: EnterpriseEccWidgets | null;
  /** RC-3.05 — HR intelligence widgets (Turnover / Hiring / Capacity / Payroll / Comp / Succession). */
  hr?: HrEccWidgets | null;
  /** RC-3.04 — CRM intelligence widgets (Forecast / Health / Concentration / Graph / Attribution). */
  crm?: CrmEccWidgets | null;
  /** RC-3.06 — Education intelligence widgets. */
  education?: EducationEccWidgets | null;
  /** RC-4 — Unified organizational knowledge graph. */
  knowledgeGraph?: KnowledgeGraphEccWidgets | null;
  /** RC-6 — Mission Control soft-read workspace. */
  missionControl?: MissionControlWorkspace | null;
  createId: (prefix: string) => string;
  nowIso: string;
}

function widget(
  kind: WidgetKind,
  title: string,
  sourceDomain: string,
  cards: WorkspaceWidget["cards"],
  emptyMessage: string,
  input: ProjectorInput,
  subtitle?: string
): WorkspaceWidget {
  return {
    id: input.createId(`widget-${kind}`),
    kind,
    title,
    subtitle,
    sourceDomain,
    priority: 0,
    cards,
    emptyMessage,
    actions: actionsForWidget(kind),
    refreshedAt: input.nowIso,
  };
}

export function projectHealth(input: ProjectorInput): WorkspaceWidget {
  const health =
    input.briefing?.healthScore ?? input.predictive?.healthScore ?? { value: 50, label: "unknown" };
  return widget(
    "health",
    "Organizational health",
    "briefing",
    [
      {
        id: input.createId("card-health"),
        title: health.label ?? "Health",
        summary: `Score ${health.value ?? "—"} from briefing / predictive soft-reads.`,
        score: health.value,
        domains: ["briefing", "executive-predictive"],
        sourceDomain: "briefing",
      },
    ],
    "No health score attached.",
    input
  );
}

export function projectBriefing(input: ProjectorInput): WorkspaceWidget {
  const summary =
    input.briefing?.briefing?.sections?.executiveSummary ??
    input.synthesis?.brief?.executiveSummary;
  const cards = summary
    ? [
        {
          id: input.createId("card-brief"),
          title: "Executive brief",
          summary,
          domains: ["briefing", "synthesis"],
          sourceDomain: "briefing",
        },
      ]
    : [];
  if (input.briefing?.overnight?.summary) {
    cards.push({
      id: input.createId("card-overnight"),
      title: "Overnight",
      summary: input.briefing.overnight.summary,
      domains: ["briefing"],
      sourceDomain: "briefing",
    });
  }
  return widget(
    "briefing",
    "Executive briefing",
    "briefing",
    cards,
    "No briefing summary attached.",
    input
  );
}

export function projectRisks(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.briefing?.briefing?.sections?.topRisks ?? []).map((r, i) => ({
    id: r.id ?? input.createId(`card-risk-${i}`),
    title: r.title ?? "Risk",
    summary: r.summary ?? r.title ?? "Risk signal",
    severity: r.severity,
    domains: r.domains ?? ["briefing"],
    sourceDomain: "briefing",
  }));
  return widget("risks", "Top risks", "briefing", cards, "No top risks in briefing.", input);
}

export function projectOpportunities(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.briefing?.briefing?.sections?.topOpportunities ?? []).map((o, i) => ({
    id: o.id ?? input.createId(`card-opp-${i}`),
    title: o.title ?? "Opportunity",
    summary: o.summary ?? o.title ?? "Opportunity",
    score: o.estimatedImpact,
    domains: o.domains ?? ["briefing"],
    sourceDomain: "briefing",
  }));
  return widget(
    "opportunities",
    "Opportunities",
    "briefing",
    cards,
    "No opportunities in briefing.",
    input
  );
}

export function projectDecisions(input: ProjectorInput): WorkspaceWidget {
  const ranked = input.decision?.recommendation?.rankedOptions ?? [];
  const cards =
    ranked.length > 0
      ? ranked.slice(0, 5).map((o, i) => ({
          id: o.id ?? input.createId(`card-dec-${i}`),
          title: o.title ?? "Option",
          summary: o.summary ?? o.title ?? "Recommendation",
          score: o.scorecard?.roi ?? o.scorecard?.overall ?? Math.round((o.confidence ?? 0.5) * 100),
          domains: [o.category ?? "decision-intelligence"],
          sourceDomain: "decision-intelligence",
        }))
      : (input.briefing?.decisionQueue ?? []).map((d, i) => ({
          id: d.id ?? input.createId(`card-dq-${i}`),
          title: d.title ?? "Open decision",
          summary: d.decisionNeeded ?? d.recommendedDecision ?? "Pending decision",
          domains: ["briefing"],
          sourceDomain: "briefing",
        }));
  return widget(
    "decisions",
    "Decisions & recommendations",
    "decision-intelligence",
    cards,
    "No decisions attached.",
    input,
    input.decision?.recommendation?.executiveSummary
  );
}

export function projectForecasts(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.predictive?.forecasts ?? []).slice(0, 6).map((f, i) => ({
    id: input.createId(`card-fc-${i}`),
    title: `${f.subject ?? "forecast"} · ${f.horizon ?? "horizon"}`,
    summary: `Direction: ${f.direction ?? "mixed"} (confidence ${Math.round((f.confidence ?? 0.5) * 100)}%)`,
    score: Math.round((f.confidence ?? 0.5) * 100),
    domains: ["executive-predictive"],
    sourceDomain: "executive-predictive",
  }));
  return widget(
    "forecasts",
    "Forecasts",
    "executive-predictive",
    cards,
    "No forecasts attached.",
    input
  );
}

export function projectSignals(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.predictive?.emergingSignals ?? []).slice(0, 5).map((s, i) => ({
    id: input.createId(`card-sig-${i}`),
    title: s.title ?? s.subject ?? "Signal",
    summary: s.narrative ?? s.title ?? "Emerging signal",
    severity: Math.round((s.strength ?? 0.5) * 100),
    domains: [s.subject ?? "executive-predictive"],
    sourceDomain: "executive-predictive",
  }));
  return widget(
    "signals",
    "Emerging signals",
    "executive-predictive",
    cards,
    "No emerging signals attached.",
    input
  );
}

export function projectApprovals(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.autonomous?.approvalQueue ?? [])
    .filter((a) => a.status === "pending")
    .map((a, i) => ({
      id: input.createId(`card-appr-${i}`),
      title: (a.role ?? "role").replace(/_/g, " "),
      summary: a.rationale ?? "Pending approval",
      domains: ["executive-autonomous"],
      sourceDomain: "executive-autonomous",
    }));
  return widget(
    "approvals",
    "Approval queue",
    "executive-autonomous",
    cards,
    "No pending approvals.",
    input
  );
}

export function projectPlans(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.autonomous?.plans ?? []).slice(0, 5).map((p, i) => ({
    id: p.id ?? input.createId(`card-plan-${i}`),
    title: p.optionTitle ?? p.objective ?? "Plan",
    summary: `${p.workflowKind ?? "workflow"} · readiness ${p.readiness ?? "unknown"} · human auth required`,
    domains: ["executive-autonomous"],
    sourceDomain: "executive-autonomous",
    meta: { autoExecute: p.autoExecute ?? false },
  }));
  return widget(
    "plans",
    "Execution plans",
    "executive-autonomous",
    cards,
    "No Autonomous plans attached.",
    input
  );
}

export function projectMemory(input: ProjectorInput): WorkspaceWidget {
  const cards = [
    ...(input.memory?.decisions ?? []).slice(0, 3).map((d, i) => ({
      id: d.id ?? input.createId(`card-mem-d-${i}`),
      title: d.title ?? "Decision",
      summary: d.actualOutcome ?? d.expectedOutcome ?? "Historical decision",
      domains: d.domains ?? ["executive-memory"],
      sourceDomain: "executive-memory",
    })),
    ...(input.memory?.timeline ?? []).slice(0, 3).map((t, i) => ({
      id: input.createId(`card-mem-t-${i}`),
      title: t.title ?? "Timeline",
      summary: t.summary ?? t.title ?? "Memory event",
      domains: t.domains ?? ["executive-memory"],
      sourceDomain: "executive-memory",
    })),
  ];
  return widget(
    "memory",
    "Executive memory",
    "executive-memory",
    cards,
    "No memory entries attached.",
    input
  );
}

export function projectCopilot(input: ProjectorInput): WorkspaceWidget {
  const summary =
    input.copilot?.explainability?.executiveSummary ?? input.copilot?.answer;
  const cards = summary
    ? [
        {
          id: input.createId("card-copilot"),
          title: `Copilot · ${input.copilot?.intent ?? "assist"}`,
          summary,
          score: Math.round((input.copilot?.explainability?.confidence ?? 0.5) * 100),
          domains: input.copilot?.explainability?.contributingDomains ?? ["executive-copilot"],
          sourceDomain: "executive-copilot",
        },
      ]
    : [];
  for (const f of input.copilot?.followUps?.slice(0, 2) ?? []) {
    cards.push({
      id: input.createId("card-follow"),
      title: "Suggested follow-up",
      summary: f.prompt ?? "Ask Copilot",
      score: 50,
      domains: ["executive-copilot"],
      sourceDomain: "executive-copilot",
    });
  }
  return widget(
    "copilot",
    "Executive Copilot",
    "executive-copilot",
    cards,
    "No Copilot answer attached.",
    input
  );
}

const ACTIVE_STATES = new Set(["active", "planned", "approved", "at_risk"]);

export function projectActiveInitiatives(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.initiative?.initiatives ?? [])
    .filter((i) => ACTIVE_STATES.has(i.state ?? ""))
    .slice(0, 6)
    .map((i, idx) => ({
      id: i.id ?? input.createId(`card-init-active-${idx}`),
      title: i.title ?? "Initiative",
      summary: `${i.state ?? "—"} · ${i.progress?.percentComplete ?? 0}% · ${i.executiveSummary ?? ""}`,
      score: i.progress?.healthScore ?? i.progress?.percentComplete,
      domains: ["initiative-intelligence"],
      sourceDomain: "initiative-intelligence",
      meta: { state: i.state, healthStatus: i.progress?.healthStatus },
    }));
  return widget(
    "active_initiatives",
    "Active Initiatives",
    "initiative-intelligence",
    cards,
    "No active initiatives attached.",
    input,
    `${input.initiative?.activeCount ?? 0} in pipeline`
  );
}

export function projectAtRiskInitiatives(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.initiative?.initiatives ?? [])
    .filter(
      (i) =>
        i.state === "at_risk" ||
        i.progress?.healthStatus === "at_risk" ||
        i.progress?.healthStatus === "critical"
    )
    .slice(0, 6)
    .map((i, idx) => ({
      id: i.id ?? input.createId(`card-init-risk-${idx}`),
      title: i.title ?? "At-risk initiative",
      summary: `Health ${i.progress?.healthStatus ?? "at_risk"} · ${i.executiveSummary ?? ""}`,
      severity: 100 - (i.progress?.healthScore ?? 40),
      score: i.progress?.healthScore,
      domains: ["initiative-intelligence"],
      sourceDomain: "initiative-intelligence",
    }));
  return widget(
    "at_risk_initiatives",
    "At-Risk Initiatives",
    "initiative-intelligence",
    cards,
    "No at-risk initiatives.",
    input,
    `${input.initiative?.atRiskCount ?? 0} flagged`
  );
}

export function projectUpcomingMilestones(input: ProjectorInput): WorkspaceWidget {
  const milestones = (input.initiative?.initiatives ?? []).flatMap((i) =>
    (i.milestones ?? [])
      .filter((m) => m.status !== "done")
      .map((m) => ({ initiative: i.title ?? "Initiative", milestone: m }))
  );
  const cards = milestones.slice(0, 8).map((row, idx) => ({
    id: row.milestone.id ?? input.createId(`card-ms-${idx}`),
    title: row.milestone.title ?? "Milestone",
    summary: `${row.initiative} · due ${row.milestone.dueDate ?? "TBD"} · ${row.milestone.percentComplete ?? 0}%`,
    score: row.milestone.percentComplete,
    domains: ["initiative-intelligence"],
    sourceDomain: "initiative-intelligence",
  }));
  return widget(
    "upcoming_milestones",
    "Upcoming Milestones",
    "initiative-intelligence",
    cards,
    "No upcoming milestones.",
    input
  );
}

export function projectBudgetVariance(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.initiative?.initiatives ?? [])
    .filter((i) => i.budget)
    .slice(0, 6)
    .map((i, idx) => {
      const planned = i.budget?.planned ?? 0;
      const actual = i.budget?.actual ?? 0;
      const variance = i.progress?.budgetVariance ?? actual - planned;
      const pct = i.progress?.budgetVariancePct ?? (planned ? Math.round((variance / planned) * 100) : 0);
      return {
        id: i.id ?? input.createId(`card-budget-${idx}`),
        title: i.title ?? "Initiative budget",
        summary: `Planned ${planned} · Actual ${actual} · Variance ${variance} (${pct}%)`,
        score: pct,
        domains: ["initiative-intelligence"],
        sourceDomain: "initiative-intelligence",
      };
    });
  return widget(
    "budget_variance",
    "Budget Variance",
    "initiative-intelligence",
    cards,
    "No initiative budgets attached.",
    input
  );
}

export function projectCompletedInitiatives(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.initiative?.initiatives ?? [])
    .filter((i) => i.state === "completed" || i.state === "archived")
    .slice(0, 6)
    .map((i, idx) => ({
      id: i.id ?? input.createId(`card-init-done-${idx}`),
      title: i.title ?? "Completed initiative",
      summary: i.executiveSummary ?? "Completed",
      score: i.progress?.percentComplete ?? 100,
      domains: ["initiative-intelligence"],
      sourceDomain: "initiative-intelligence",
    }));
  return widget(
    "completed_initiatives",
    "Recently Completed Initiatives",
    "initiative-intelligence",
    cards,
    "No recently completed initiatives.",
    input,
    `${input.initiative?.completedCount ?? 0} completed`
  );
}

export function projectRecentMeetings(input: ProjectorInput): WorkspaceWidget {
  const fromGoogle = input.googleWorkspace?.recentMeetings.meetings ?? [];
  const fromMicrosoft = input.microsoft365?.meetings.meetings ?? [];
  const source = fromGoogle.length
    ? "google-workspace"
    : fromMicrosoft.length
      ? "microsoft-365"
      : "google-workspace";
  const meetings = fromGoogle.length ? fromGoogle : fromMicrosoft;
  const cards = meetings.map((m, idx) => ({
    id: m.id ?? input.createId(`card-meet-${idx}`),
    title: m.title,
    summary: `${m.durationMinutes} min · ${m.participantCount} participants · ${m.startAt}`,
    score: m.participantCount,
    domains: [source],
    sourceDomain: source,
  }));
  return widget(
    "recent_meetings",
    "Meetings",
    source,
    cards,
    "No recent meetings from Workspace or Microsoft 365.",
    input
  );
}

export function projectCalendarSummary(input: ProjectorInput): WorkspaceWidget {
  const summary = input.googleWorkspace?.calendarSummary;
  const cards = summary
    ? [
        {
          id: input.createId("card-gw-cal"),
          title: summary.nextMeeting?.title ?? "Calendar",
          summary: `${summary.upcomingMeetings} upcoming · ${summary.meetingLoadMinutes7d} min load · ${summary.schedulingConflicts} conflict(s)`,
          score: summary.upcomingMeetings,
          domains: ["google-workspace"],
          sourceDomain: "google-workspace",
        },
      ]
    : [];
  return widget(
    "calendar_summary",
    "Calendar Summary",
    "google-workspace",
    cards,
    "No calendar summary from Google Workspace.",
    input
  );
}

export function projectCommunicationPulse(input: ProjectorInput): WorkspaceWidget {
  const googlePulse = input.googleWorkspace?.communicationPulse;
  const msPulse = input.microsoft365?.communication;
  const pulse = googlePulse ??
    (msPulse
      ? {
          messages: msPulse.messages,
          unread: msPulse.unread,
          communicationActivity: msPulse.communicationActivity,
        }
      : null);
  const source = googlePulse ? "google-workspace" : msPulse ? "microsoft-365" : "google-workspace";
  const cards = pulse
    ? [
        {
          id: input.createId("card-comms"),
          title: "Communication",
          summary: `${pulse.messages} messages · ${pulse.unread} unread · activity ${pulse.communicationActivity}`,
          score: pulse.communicationActivity,
          domains: [source],
          sourceDomain: source,
        },
      ]
    : [];
  return widget(
    "communication_pulse",
    "Communication",
    source,
    cards,
    "No communication pulse from Workspace or Microsoft 365.",
    input
  );
}

export function projectSharedDocuments(input: ProjectorInput): WorkspaceWidget {
  const fromGoogle = input.googleWorkspace?.sharedDocuments.documents ?? [];
  const fromMicrosoft = input.microsoft365?.documents.documents ?? [];
  const source = fromGoogle.length
    ? "google-workspace"
    : fromMicrosoft.length
      ? "microsoft-365"
      : "google-workspace";
  const docs = fromGoogle.length ? fromGoogle : fromMicrosoft;
  const cards = docs.map((d, idx) => ({
    id: d.id ?? input.createId(`card-doc-${idx}`),
    title: d.name,
    summary: d.ownerEmail ? `Owner ${d.ownerEmail}` : "Shared document",
    domains: [source],
    sourceDomain: source,
  }));
  return widget(
    "shared_documents",
    "Documents",
    source,
    cards,
    "No shared documents from Workspace or Microsoft 365.",
    input
  );
}

export function projectCollaborationActivity(input: ProjectorInput): WorkspaceWidget {
  const collab = input.googleWorkspace?.collaborationActivity;
  const cards = collab
    ? [
        {
          id: input.createId("card-gw-collab"),
          title: `Collaboration ${collab.collaborationScore}`,
          summary: `${collab.openTasks} open tasks · ${collab.driveFiles} files · ${collab.users} users`,
          score: collab.collaborationScore,
          domains: ["google-workspace"],
          sourceDomain: "google-workspace",
        },
        ...collab.timeline.slice(0, 3).map((t, idx) => ({
          id: t.id ?? input.createId(`card-gw-tl-${idx}`),
          title: t.title,
          summary: t.subtitle,
          domains: ["google-workspace"],
          sourceDomain: "google-workspace",
        })),
      ]
    : [];
  return widget(
    "collaboration_activity",
    "Collaboration Activity",
    "google-workspace",
    cards,
    "No collaboration activity from Google Workspace.",
    input
  );
}

export function projectExecutiveNarratives(input: ProjectorInput): WorkspaceWidget {
  const narratives = input.googleWorkspace?.executiveNarratives.narratives ?? [];
  const cards = narratives.map((n, idx) => ({
    id: n.id ?? input.createId(`card-gw-nar-${idx}`),
    title: n.headline,
    summary: n.detail,
    score:
      n.severity === "attention" ? 90 : n.severity === "watch" ? 70 : 50,
    domains: ["google-workspace", ...n.domains],
    sourceDomain: "google-workspace",
  }));
  return widget(
    "executive_narratives",
    "Executive Narratives",
    "google-workspace",
    cards,
    "No executive narratives from Google Workspace yet — sync Gmail, Calendar, and Drive first.",
    input,
    "Organizational insights from Workspace collaboration"
  );
}

export const WIDGET_PROJECTORS: Record<
  WidgetKind,
  (input: ProjectorInput) => WorkspaceWidget
> = {
  health: projectHealth,
  briefing: projectBriefing,
  risks: projectRisks,
  opportunities: projectOpportunities,
  decisions: projectDecisions,
  forecasts: projectForecasts,
  signals: projectSignals,
  approvals: projectApprovals,
  plans: projectPlans,
  memory: projectMemory,
  copilot: projectCopilot,
  active_initiatives: projectActiveInitiatives,
  at_risk_initiatives: projectAtRiskInitiatives,
  upcoming_milestones: projectUpcomingMilestones,
  budget_variance: projectBudgetVariance,
  completed_initiatives: projectCompletedInitiatives,
  portfolio_health: projectPortfolioHealth,
  priority_matrix: projectPriorityMatrix,
  capacity_utilization: projectCapacityUtilization,
  budget_allocation: projectBudgetAllocation,
  cross_initiative_risks: projectCrossInitiativeRisks,
  portfolio_changes: projectPortfolioChanges,
  active_simulations: projectActiveSimulations,
  scenario_comparison: projectScenarioComparison,
  highest_impact_opportunities: projectHighestImpactOpportunities,
  constraint_alerts: projectConstraintAlerts,
  recommended_scenario: projectRecommendedScenario,
  ecosystem_health: projectEcosystemHealth,
  cross_organization_risks: projectCrossOrganizationRisks,
  shared_opportunities: projectSharedOpportunities,
  geographic_coverage: projectGeographicCoverage,
  federated_portfolio: projectFederatedPortfolio,
  organization_network: projectOrganizationNetwork,
  recent_meetings: projectRecentMeetings,
  calendar_summary: projectCalendarSummary,
  communication_pulse: projectCommunicationPulse,
  shared_documents: projectSharedDocuments,
  collaboration_activity: projectCollaborationActivity,
  executive_narratives: projectExecutiveNarratives,
  unified_communication_dashboard: projectUnifiedCommunicationDashboard,
  communication_health: projectCommunicationHealth,
  response_time: projectResponseTime,
  active_teams: projectActiveTeams,
  meeting_load: projectMeetingLoad,
  collaboration_heatmap: projectCollaborationHeatmap,
  cash_position: projectCashPosition,
  revenue: projectRevenue,
  burn_rate: projectBurnRate,
  receivables: projectReceivables,
  payables: projectPayables,
  subscriptions: projectSubscriptions,
  revenue_forecast: projectRevenueForecast,
  expense_anomalies: projectExpenseAnomalies,
  profitability: projectProfitability,
  ebitda: projectEbitda,
  crm_pipeline: projectCrmPipeline,
  sales_forecast: projectSalesForecast,
  pipeline_health: projectPipelineHealth,
  customer_concentration: projectCustomerConcentration,
  executive_relationship_graph: projectExecutiveRelationshipGraph,
  revenue_attribution: projectRevenueAttribution,
  workforce: projectWorkforce,
  hr_turnover: projectHrTurnover,
  hr_hiring: projectHrHiring,
  hr_capacity: projectHrCapacity,
  hr_payroll: projectHrPayroll,
  hr_compensation: projectHrCompensation,
  hr_succession: projectHrSuccession,
  student_enrollment: projectStudentEnrollment,
  student_health: projectStudentHealth,
  teacher_workload: projectTeacherWorkload,
  academic_performance: projectAcademicPerformance,
  education_attendance: projectEducationAttendance,
  scholarship_analytics: projectScholarshipAnalytics,
  organizational_graph: projectOrganizationalGraph,
  program_funding: projectProgramFunding,
  // RC-6 — Mission Control
  mission_control_summary: projectMissionControlSummary,
  organization_timeline: projectOrganizationTimeline,
  alert_center: projectAlertCenter,
  approval_center: projectApprovalCenter,
  investigation_workspace: projectInvestigationWorkspace,
  ai_workspace: projectAiWorkspace,
  digital_twin_controls: projectDigitalTwinControls,
  scenario_simulator: projectScenarioSimulator,
  risk_center: projectRiskCenter,
  initiative_monitor: projectInitiativeMonitor,
  organization_graph_viewer: projectOrganizationGraphViewer,
};

export function projectCrmPipeline(input: ProjectorInput): WorkspaceWidget {
  const w = input.crm?.crmPipeline ?? input.enterprise?.crmPipeline;
  const cards = w
    ? [
        {
          id: input.createId("card-crm-pipe"),
          title: fmtMoney(w.pipelineValue),
          summary: `${w.openDeals} open deal(s)`,
          score: w.pipelineValue,
          domains: ["crm"],
          sourceDomain: "crm",
        },
      ]
    : [];
  return widget(
    "crm_pipeline",
    "CRM Pipeline",
    "crm",
    cards,
    "Connect HubSpot or Salesforce for pipeline insights.",
    input
  );
}

export function projectSalesForecast(input: ProjectorInput): WorkspaceWidget {
  const w = input.crm?.salesForecast;
  const cards = w
    ? [
        {
          id: input.createId("card-sales-forecast"),
          title: fmtMoney(w.salesForecast),
          summary: `Pipeline ${fmtMoney(w.pipelineValue)} · ${w.openDeals} open`,
          score: w.salesForecast,
          domains: ["crm"],
          sourceDomain: "crm",
        },
      ]
    : [];
  return widget(
    "sales_forecast",
    "Sales Forecast",
    "crm",
    cards,
    "Connect HubSpot or Salesforce for sales forecasting.",
    input
  );
}

export function projectPipelineHealth(input: ProjectorInput): WorkspaceWidget {
  const w = input.crm?.pipelineHealth;
  const cards = w
    ? [
        {
          id: input.createId("card-pipe-health"),
          title: `Health ${w.pipelineHealth}`,
          summary: `${w.openDeals} open · ${w.activityCount} activities`,
          score: w.pipelineHealth,
          domains: ["crm"],
          sourceDomain: "crm",
        },
      ]
    : [];
  return widget(
    "pipeline_health",
    "Pipeline Health",
    "crm",
    cards,
    "No pipeline health signals from CRM connectors.",
    input
  );
}

export function projectCustomerConcentration(input: ProjectorInput): WorkspaceWidget {
  const w = input.crm?.customerConcentration;
  const cards = w
    ? [
        {
          id: input.createId("card-cust-conc"),
          title: `Concentration ${w.customerConcentration}`,
          summary: `Top customer ${w.topCustomerSharePct}% of open pipeline`,
          score: w.customerConcentration,
          domains: ["crm"],
          sourceDomain: "crm",
        },
      ]
    : [];
  return widget(
    "customer_concentration",
    "Customer Concentration",
    "crm",
    cards,
    "No customer concentration signals yet.",
    input
  );
}

export function projectExecutiveRelationshipGraph(input: ProjectorInput): WorkspaceWidget {
  const w = input.crm?.executiveRelationshipGraph;
  const cards = w
    ? [
        {
          id: input.createId("card-rel-graph"),
          title: `${w.nodeCount} nodes`,
          summary: `${w.edgeCount} edges · density ${w.density}`,
          score: w.nodeCount,
          domains: ["crm"],
          sourceDomain: "crm",
        },
      ]
    : [];
  return widget(
    "executive_relationship_graph",
    "Executive Relationship Graph",
    "crm",
    cards,
    "Connect HubSpot or Salesforce for relationship graph.",
    input
  );
}

export function projectRevenueAttribution(input: ProjectorInput): WorkspaceWidget {
  const w = input.crm?.revenueAttribution;
  const top = w?.byCompany[0] ?? w?.bySource[0];
  const cards = w
    ? [
        {
          id: input.createId("card-rev-attr"),
          title: top ? `${top.label} ${top.sharePct}%` : "Attribution",
          summary: `${w.byCompany.length} company slice(s) · ${w.bySource.length} source(s)`,
          score: top?.sharePct ?? 0,
          domains: ["crm"],
          sourceDomain: "crm",
        },
        ...w.bySource.slice(0, 2).map((s, idx) => ({
          id: input.createId(`card-rev-src-${idx}`),
          title: s.label,
          summary: `${fmtMoney(s.amount)} · ${s.sharePct}%`,
          score: s.sharePct,
          domains: ["crm"],
          sourceDomain: "crm",
        })),
      ]
    : [];
  return widget(
    "revenue_attribution",
    "Revenue Attribution",
    "crm",
    cards,
    "No revenue attribution from CRM connectors.",
    input
  );
}

export function projectWorkforce(input: ProjectorInput): WorkspaceWidget {
  const w = input.hr?.workforce ?? input.enterprise?.workforce;
  const cards = w
    ? [
        {
          id: input.createId("card-workforce"),
          title: `${w.headcount} employees`,
          summary: `${w.openRoles} open role(s)`,
          score: w.headcount,
          domains: ["hr"],
          sourceDomain: "hr",
        },
      ]
    : [];
  return widget(
    "workforce",
    "Workforce",
    "hr",
    cards,
    "Connect ADP, Gusto, Paylocity, or BambooHR for workforce insights.",
    input
  );
}

export function projectHrTurnover(input: ProjectorInput): WorkspaceWidget {
  const w = input.hr?.turnover;
  const cards = w
    ? [
        {
          id: input.createId("card-hr-turnover"),
          title: `${w.turnoverRate}% turnover`,
          summary: `${w.terminations12m} exits · ${w.headcount} active`,
          score: Math.round(100 - w.turnoverRate),
          domains: ["hr"],
          sourceDomain: "hr",
        },
      ]
    : [];
  return widget("hr_turnover", "Turnover", "hr", cards, "No turnover signals yet.", input);
}

export function projectHrHiring(input: ProjectorInput): WorkspaceWidget {
  const w = input.hr?.hiring;
  const cards = w
    ? [
        {
          id: input.createId("card-hr-hiring"),
          title: `${w.openRoles} open roles`,
          summary: `Hiring velocity ${w.hiringVelocity}`,
          score: w.openRoles,
          domains: ["hr"],
          sourceDomain: "hr",
        },
      ]
    : [];
  return widget("hr_hiring", "Hiring", "hr", cards, "No hiring pipeline yet.", input);
}

export function projectHrCapacity(input: ProjectorInput): WorkspaceWidget {
  const w = input.hr?.capacity;
  const cards = w
    ? [
        {
          id: input.createId("card-hr-capacity"),
          title: `${w.capacityGapFte} FTE gap`,
          summary: `${w.timeOffPendingHours}h pending time off · ${w.headcount} headcount`,
          score: Math.max(0, 100 - Math.round(w.capacityGapFte * 10)),
          domains: ["hr"],
          sourceDomain: "hr",
        },
      ]
    : [];
  return widget("hr_capacity", "Capacity", "hr", cards, "No capacity signals yet.", input);
}

export function projectHrPayroll(input: ProjectorInput): WorkspaceWidget {
  const w = input.hr?.payroll;
  const cards = w
    ? [
        {
          id: input.createId("card-hr-payroll"),
          title: `$${Math.round(w.payrollTotalLatest).toLocaleString()} payroll`,
          summary: `Trend ${w.payrollTrendPct >= 0 ? "+" : ""}${w.payrollTrendPct}% vs prior period`,
          score: Math.min(100, Math.round(w.payrollTotalLatest / 1000)),
          domains: ["hr"],
          sourceDomain: "hr",
        },
      ]
    : [];
  return widget("hr_payroll", "Payroll", "hr", cards, "No payroll signals yet.", input);
}

export function projectHrCompensation(input: ProjectorInput): WorkspaceWidget {
  const w = input.hr?.compensation;
  const cards = w
    ? [
        {
          id: input.createId("card-hr-comp"),
          title: `$${w.avgCompensation.toLocaleString()} avg compensation`,
          summary: `Spread $${w.compensationSpread.toLocaleString()}`,
          score: Math.min(100, Math.round(w.avgCompensation / 2000)),
          domains: ["hr"],
          sourceDomain: "hr",
        },
      ]
    : [];
  return widget(
    "hr_compensation",
    "Compensation trends",
    "hr",
    cards,
    "No compensation trends yet.",
    input
  );
}

export function projectHrSuccession(input: ProjectorInput): WorkspaceWidget {
  const w = input.hr?.succession;
  const cards = w
    ? [
        {
          id: input.createId("card-hr-succession"),
          title: `${w.successionCoveragePct}% succession coverage`,
          summary: `${w.successionReadyManagers} ready manager(s)`,
          score: Math.round(w.successionCoveragePct),
          domains: ["hr"],
          sourceDomain: "hr",
        },
      ]
    : [];
  return widget(
    "hr_succession",
    "Succession readiness",
    "hr",
    cards,
    "No succession readiness signals yet.",
    input
  );
}

export function projectStudentEnrollment(input: ProjectorInput): WorkspaceWidget {
  const w = input.education?.studentEnrollment ?? input.enterprise?.studentEnrollment;
  const cards = w
    ? [
        {
          id: input.createId("card-enrollment"),
          title: `${w.activeStudents} students`,
          summary: `Attendance ${w.attendanceRate}%`,
          score: w.attendanceRate,
          domains: ["education"],
          sourceDomain: "education",
        },
      ]
    : [];
  return widget(
    "student_enrollment",
    "Student Enrollment",
    "education",
    cards,
    "Connect Canvas, PowerSchool, or Google Classroom.",
    input
  );
}

export function projectStudentHealth(input: ProjectorInput): WorkspaceWidget {
  const w = input.education?.studentHealth;
  const cards = w
    ? [
        {
          id: input.createId("card-stu-health"),
          title: `Health ${w.studentHealth}`,
          summary: `${w.atRiskStudents} at-risk · ${w.activeStudents} active`,
          score: w.studentHealth,
          domains: ["education"],
          sourceDomain: "education",
        },
      ]
    : [];
  return widget(
    "student_health",
    "Student Health",
    "education",
    cards,
    "No student health signals from education connectors.",
    input
  );
}

export function projectTeacherWorkload(input: ProjectorInput): WorkspaceWidget {
  const w = input.education?.teacherWorkload;
  const cards = w
    ? [
        {
          id: input.createId("card-tch-load"),
          title: `Workload ${w.teacherWorkload}`,
          summary: `${w.teacherCount} teacher(s) · ${w.courseCount} course(s)`,
          score: w.teacherWorkload,
          domains: ["education"],
          sourceDomain: "education",
        },
      ]
    : [];
  return widget(
    "teacher_workload",
    "Teacher Workload",
    "education",
    cards,
    "No teacher workload signals yet.",
    input
  );
}

export function projectAcademicPerformance(input: ProjectorInput): WorkspaceWidget {
  const w = input.education?.academicPerformance;
  const cards = w
    ? [
        {
          id: input.createId("card-acad-perf"),
          title: `${w.academicPerformance}%`,
          summary: `Across ${w.activeStudents} student(s)`,
          score: w.academicPerformance,
          domains: ["education"],
          sourceDomain: "education",
        },
      ]
    : [];
  return widget(
    "academic_performance",
    "Academic Performance",
    "education",
    cards,
    "No academic performance signals from grades.",
    input
  );
}

export function projectEducationAttendance(input: ProjectorInput): WorkspaceWidget {
  const w = input.education?.attendance;
  const cards = w
    ? [
        {
          id: input.createId("card-edu-att"),
          title: `${w.attendanceRate}%`,
          summary: `${w.activeStudents} enrolled student(s)`,
          score: w.attendanceRate,
          domains: ["education"],
          sourceDomain: "education",
        },
      ]
    : [];
  return widget(
    "education_attendance",
    "Attendance",
    "education",
    cards,
    "No attendance signals from education connectors.",
    input
  );
}

export function projectScholarshipAnalytics(input: ProjectorInput): WorkspaceWidget {
  const w = input.education?.scholarshipAnalytics;
  const cards = w
    ? [
        {
          id: input.createId("card-schol"),
          title: fmtMoney(w.scholarshipAwardTotal),
          summary: `${w.scholarshipAwardCount} award(s) · ${w.scholarshipCoveragePct}% coverage`,
          score: w.scholarshipAwardTotal,
          domains: ["education", "government"],
          sourceDomain: "education",
        },
      ]
    : [];
  return widget(
    "scholarship_analytics",
    "Scholarship Analytics",
    "education",
    cards,
    "Connect Scholarship Systems for award analytics.",
    input
  );
}

export function projectOrganizationalGraph(input: ProjectorInput): WorkspaceWidget {
  const w = input.knowledgeGraph?.organizationalGraph;
  const top = w?.topKinds[0];
  const cards = w
    ? [
        {
          id: input.createId("card-org-graph"),
          title: `${w.nodeCount} nodes · ${w.edgeCount} edges`,
          summary: `${w.domainsConnected.join(", ") || "no domains"} · ${w.kindsPresent.length} kinds`,
          score: w.nodeCount,
          domains: ["knowledge-graph"],
          sourceDomain: "knowledge-graph",
        },
        ...(top
          ? [
              {
                id: input.createId("card-org-graph-top"),
                title: top.label,
                summary: `${top.count} entit${top.count === 1 ? "y" : "ies"}`,
                score: top.count,
                domains: ["knowledge-graph"],
                sourceDomain: "knowledge-graph",
              },
            ]
          : []),
      ]
    : [];
  return widget(
    "organizational_graph",
    "Organizational Graph",
    "knowledge-graph",
    cards,
    "Sync CRM, HR, Finance, Education, or Collaboration connectors to populate the graph.",
    input
  );
}

export function projectProgramFunding(input: ProjectorInput): WorkspaceWidget {
  const w = input.enterprise?.programFunding;
  const cards = w
    ? [
        {
          id: input.createId("card-funding"),
          title: fmtMoney(w.programFunding),
          summary: `${w.openCompliance} open compliance item(s)`,
          score: w.programFunding,
          domains: ["government"],
          sourceDomain: "government",
        },
      ]
    : [];
  return widget(
    "program_funding",
    "Program Funding",
    "government",
    cards,
    "Connect state education, scholarship, Medicaid, or grant systems.",
    input
  );
}

function fmtMoney(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

export function projectCashPosition(input: ProjectorInput): WorkspaceWidget {
  const w = input.finance?.cashPosition;
  const cards = w
    ? [
        {
          id: input.createId("card-cash"),
          title: fmtMoney(w.cashPosition),
          summary: `Health ${w.financialHealth} · ${w.providersConnected.join(", ") || "no providers"}`,
          score: w.financialHealth,
          domains: ["finance"],
          sourceDomain: "finance",
        },
      ]
    : [];
  return widget(
    "cash_position",
    "Cash Position",
    "finance",
    cards,
    "Connect QuickBooks, Stripe, Square, or Plaid for cash position.",
    input
  );
}

export function projectRevenue(input: ProjectorInput): WorkspaceWidget {
  const w = input.finance?.revenue;
  const cards = w
    ? [
        {
          id: input.createId("card-rev"),
          title: fmtMoney(w.revenue),
          summary: `MRR ${fmtMoney(w.subscriptionMrr)}`,
          score: w.revenue,
          domains: ["finance"],
          sourceDomain: "finance",
        },
      ]
    : [];
  return widget(
    "revenue",
    "Revenue",
    "finance",
    cards,
    "No revenue signals from finance connectors.",
    input
  );
}

export function projectBurnRate(input: ProjectorInput): WorkspaceWidget {
  const w = input.finance?.burnRate;
  const cards = w
    ? [
        {
          id: input.createId("card-burn"),
          title: `${fmtMoney(w.burnRateMonthly)}/mo`,
          summary:
            w.runwayMonths != null
              ? `Runway ${w.runwayMonths} mo · severity ${w.severity}`
              : `Severity ${w.severity}`,
          score: w.burnRateMonthly,
          domains: ["finance"],
          sourceDomain: "finance",
        },
      ]
    : [];
  return widget(
    "burn_rate",
    "Burn Rate",
    "finance",
    cards,
    "No burn-rate signals yet.",
    input
  );
}

export function projectReceivables(input: ProjectorInput): WorkspaceWidget {
  const w = input.finance?.receivables;
  const cards = w
    ? [
        {
          id: input.createId("card-ar"),
          title: fmtMoney(w.receivables),
          summary: "Accounts receivable outstanding",
          score: w.receivables,
          domains: ["finance"],
          sourceDomain: "finance",
        },
      ]
    : [];
  return widget(
    "receivables",
    "Receivables",
    "finance",
    cards,
    "No receivables from finance connectors.",
    input
  );
}

export function projectPayables(input: ProjectorInput): WorkspaceWidget {
  const w = input.finance?.payables;
  const cards = w
    ? [
        {
          id: input.createId("card-ap"),
          title: fmtMoney(w.payables),
          summary: "Accounts payable outstanding",
          score: w.payables,
          domains: ["finance"],
          sourceDomain: "finance",
        },
      ]
    : [];
  return widget(
    "payables",
    "Payables",
    "finance",
    cards,
    "No payables from finance connectors.",
    input
  );
}

export function projectSubscriptions(input: ProjectorInput): WorkspaceWidget {
  const w = input.finance?.subscriptions;
  const cards = w
    ? [
        {
          id: input.createId("card-subs"),
          title: fmtMoney(w.subscriptionMrr),
          summary: `${w.activeCount} active subscription(s)`,
          score: w.subscriptionMrr,
          domains: ["finance"],
          sourceDomain: "finance",
        },
      ]
    : [];
  return widget(
    "subscriptions",
    "Subscriptions",
    "finance",
    cards,
    "No subscription MRR from Stripe.",
    input
  );
}

export function projectRevenueForecast(input: ProjectorInput): WorkspaceWidget {
  const w = input.finance?.revenueForecast;
  const cards = w
    ? [
        {
          id: input.createId("card-rev-forecast"),
          title: fmtMoney(w.revenueForecast),
          summary: `Current ${fmtMoney(w.currentRevenue)} · MRR ${fmtMoney(w.subscriptionMrr)}`,
          score: w.revenueForecast,
          domains: ["finance"],
          sourceDomain: "finance",
        },
      ]
    : [];
  return widget(
    "revenue_forecast",
    "Revenue Forecast",
    "finance",
    cards,
    "Connect Stripe / Plaid for revenue forecast.",
    input
  );
}

export function projectExpenseAnomalies(input: ProjectorInput): WorkspaceWidget {
  const w = input.finance?.expenseAnomalies;
  const cards = w
    ? [
        {
          id: input.createId("card-exp-anom"),
          title: `Anomaly ${w.expenseAnomalyScore}`,
          summary: `${w.anomalies.length} flagged outflow(s)`,
          score: w.expenseAnomalyScore,
          domains: ["finance"],
          sourceDomain: "finance",
        },
        ...w.anomalies.slice(0, 3).map((a, idx) => ({
          id: a.id ?? input.createId(`card-exp-${idx}`),
          title: a.label,
          summary: `${fmtMoney(a.amount)} · ${a.severity}${a.category ? ` · ${a.category}` : ""}`,
          score: a.severity === "high" ? 90 : a.severity === "medium" ? 70 : 40,
          domains: ["finance"],
          sourceDomain: "finance",
        })),
      ]
    : [];
  return widget(
    "expense_anomalies",
    "Expense Anomalies",
    "finance",
    cards,
    "No expense anomalies detected from bank transactions.",
    input
  );
}

export function projectProfitability(input: ProjectorInput): WorkspaceWidget {
  const w = input.finance?.profitability;
  const cards = w
    ? [
        {
          id: input.createId("card-profit"),
          title: `${w.profitability}%`,
          summary: `EBITDA ${fmtMoney(w.ebitda)} on ${fmtMoney(w.revenue)} revenue`,
          score: w.profitability,
          domains: ["finance"],
          sourceDomain: "finance",
        },
      ]
    : [];
  return widget(
    "profitability",
    "Profitability",
    "finance",
    cards,
    "No profitability signals from finance connectors.",
    input
  );
}

export function projectEbitda(input: ProjectorInput): WorkspaceWidget {
  const w = input.finance?.ebitda;
  const cards = w
    ? [
        {
          id: input.createId("card-ebitda"),
          title: fmtMoney(w.ebitda),
          summary: `Revenue ${fmtMoney(w.revenue)} · burn ${fmtMoney(w.burnRateMonthly)}/mo`,
          score: w.ebitda,
          domains: ["finance"],
          sourceDomain: "finance",
        },
      ]
    : [];
  return widget(
    "ebitda",
    "EBITDA",
    "finance",
    cards,
    "No EBITDA estimate from finance connectors.",
    input
  );
}

export function projectCommunicationHealth(input: ProjectorInput): WorkspaceWidget {
  const health = input.collaboration?.communicationHealth;
  const cards = health
    ? [
        {
          id: input.createId("card-comm-health"),
          title: `Health ${health.score}`,
          summary: `${health.siloCount} silo(s) · ${health.bottleneckCount} bottleneck(s) · ${health.alertCount ?? 0} alert(s) · ${health.explainability}`,
          score: health.score,
          domains: ["collaboration"],
          sourceDomain: "collaboration",
        },
        ...(health.alerts ?? []).slice(0, 3).map((a, idx) => ({
          id: a.id ?? input.createId(`card-comm-alert-${idx}`),
          title: a.title,
          summary: `${a.kind.replace(/_/g, " ")} · ${a.explainability}`,
          score: a.severity === "high" ? 90 : a.severity === "medium" ? 70 : 50,
          domains: ["collaboration"],
          sourceDomain: "collaboration",
        })),
      ]
    : [];
  return widget(
    "communication_health",
    "Communication Health",
    "collaboration",
    cards,
    "Connect Slack, Teams, Zoom, or Google Meet to measure communication health.",
    input
  );
}

export function projectCollaborationHeatmap(input: ProjectorInput): WorkspaceWidget {
  const heat = input.collaboration?.collaborationHeatmap;
  const cards = heat
    ? [
        {
          id: input.createId("card-heatmap-summary"),
          title: heat.title,
          summary: `${heat.rows.length} × ${heat.columns.length} departments · ${heat.cells.length} cells`,
          score: heat.cells.reduce((s, c) => s + c.value, 0),
          domains: ["collaboration"],
          sourceDomain: "collaboration",
        },
        ...heat.cells
          .slice()
          .sort((a, b) => b.value - a.value)
          .slice(0, 6)
          .map((c, idx) => ({
            id: input.createId(`card-heat-${idx}`),
            title: `${c.row} → ${c.column}`,
            summary: `Strength ${c.value} · ${c.messageCount} messages`,
            score: c.value,
            domains: ["collaboration"],
            sourceDomain: "collaboration",
          })),
      ]
    : [];
  return widget(
    "collaboration_heatmap",
    "Collaboration Heatmap",
    "collaboration",
    cards,
    "No collaboration heatmap yet — sync Slack, Teams, Zoom, or Google Meet.",
    input
  );
}

export function projectResponseTime(input: ProjectorInput): WorkspaceWidget {
  const rt = input.collaboration?.responseTime;
  const cards = rt
    ? [
        {
          id: input.createId("card-resp-avg"),
          title: `Avg ${rt.avgResponseMinutes} min`,
          summary: "Organization-wide average response latency",
          score: rt.avgResponseMinutes,
          domains: ["collaboration"],
          sourceDomain: "collaboration",
        },
        ...rt.channels.slice(0, 4).map((c, idx) => ({
          id: input.createId(`card-resp-${idx}`),
          title: c.label,
          summary: `${c.avgMinutes} min · ${c.severity}`,
          score: c.avgMinutes,
          domains: ["collaboration"],
          sourceDomain: "collaboration",
        })),
      ]
    : [];
  return widget(
    "response_time",
    "Response Time",
    "collaboration",
    cards,
    "No response-time samples yet.",
    input
  );
}

export function projectActiveTeams(input: ProjectorInput): WorkspaceWidget {
  const teams = input.collaboration?.activeTeams;
  const cards = teams
    ? [
        {
          id: input.createId("card-active-teams"),
          title: `${teams.activeTeams} active`,
          summary: "Teams/channels with recent participation",
          score: teams.activeTeams,
          domains: ["collaboration"],
          sourceDomain: "collaboration",
        },
        ...teams.teams.slice(0, 5).map((t, idx) => ({
          id: input.createId(`card-team-${idx}`),
          title: t.label,
          summary: `Density ${t.density}% · ${t.messageCount} messages`,
          score: t.density,
          domains: ["collaboration"],
          sourceDomain: "collaboration",
        })),
      ]
    : [];
  return widget(
    "active_teams",
    "Active Teams",
    "collaboration",
    cards,
    "No active teams detected.",
    input
  );
}

export function projectMeetingLoad(input: ProjectorInput): WorkspaceWidget {
  const load = input.collaboration?.meetingLoad;
  const cards = load
    ? [
        {
          id: input.createId("card-meet-load"),
          title: `${load.meetingLoadMinutes} minutes`,
          summary: `${load.meetingCount} meetings · density ${load.meetingDensityScore ?? 0} · severity ${load.severity}`,
          score: load.meetingLoadMinutes,
          domains: ["collaboration"],
          sourceDomain: "collaboration",
        },
      ]
    : [];
  return widget(
    "meeting_load",
    "Meeting Load",
    "collaboration",
    cards,
    "No meeting load from collaboration platforms.",
    input
  );
}

export function projectUnifiedCommunicationDashboard(
  input: ProjectorInput
): WorkspaceWidget {
  const dash = input.unifiedCommunication;
  const cards = dash
    ? [
        {
          id: input.createId("card-unified-totals"),
          title: dash.title,
          summary: `${dash.totals.upcomingMeetings} meetings · ${dash.totals.messages} messages · ${dash.totals.chats} chats · score ${dash.totals.collaborationScore}`,
          score: dash.totals.collaborationScore,
          domains: ["productivity"],
          sourceDomain: "productivity",
        },
        ...dash.recentMeetings.slice(0, 4).map((m, idx) => ({
          id: m.id ?? input.createId(`card-unified-meet-${idx}`),
          title: m.title,
          // Copilot-facing summary uses kind only — not Outlook vs Google.
          summary: `Meeting · ${m.durationMinutes} min · ${m.participantCount} participants · ${m.startAt}`,
          score: m.participantCount,
          domains: ["productivity"],
          sourceDomain: "productivity",
        })),
        ...dash.recentCommunications.slice(0, 3).map((c, idx) => ({
          id: c.id ?? input.createId(`card-unified-comms-${idx}`),
          title: c.title,
          summary: `Communication · ${c.at}`,
          domains: ["productivity"],
          sourceDomain: "productivity",
        })),
      ]
    : [];
  return widget(
    "unified_communication_dashboard",
    "Unified Communication Dashboard",
    "productivity",
    cards,
    "Connect Google Workspace or Microsoft 365 to populate communications.",
    input,
    dash ? `${dash.providersConnected.length} provider(s)` : undefined
  );
}

export function projectPortfolioHealth(input: ProjectorInput): WorkspaceWidget {
  const health = input.portfolio?.health;
  const mcCards = (input.missionControl?.panels.portfolio_health.cards ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    summary: c.summary,
    severity: c.severity,
    score: c.score,
    domains: c.domains ?? [],
    sourceDomain: "executive-command-center-v2",
  }));
  const cards = health
    ? [
        {
          id: input.createId("card-pf-health"),
          title: `Portfolio ${health.state ?? "watch"}`,
          summary:
            health.explainability ??
            `Score ${health.value ?? "—"} · coverage ${health.strategicCoverage ?? "—"} · risk ${health.riskIndex ?? "—"}`,
          score: health.value,
          domains: ["portfolio-intelligence"],
          sourceDomain: "portfolio-intelligence",
        },
        ...mcCards.slice(0, 4),
      ]
    : mcCards;
  return widget(
    "portfolio_health",
    "Portfolio Health",
    health ? "portfolio-intelligence" : "executive-command-center-v2",
    cards,
    "No portfolio health attached.",
    input
  );
}

export function projectPriorityMatrix(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.portfolio?.prioritization ?? []).slice(0, 6).map((p, idx) => ({
    id: p.initiativeId ?? input.createId(`card-pf-pri-${idx}`),
    title: `#${p.rank ?? idx + 1} ${p.title ?? "Initiative"}`,
    summary: `Composite ${p.composite ?? "—"} · alignment ${p.alignment ?? "—"} · risk ${p.risk ?? "—"}`,
    score: p.composite,
    domains: ["portfolio-intelligence"],
    sourceDomain: "portfolio-intelligence",
  }));
  return widget(
    "priority_matrix",
    "Priority Matrix",
    "portfolio-intelligence",
    cards,
    "No prioritization attached.",
    input
  );
}

export function projectCapacityUtilization(input: ProjectorInput): WorkspaceWidget {
  const c = input.portfolio?.capacity;
  const cards = c
    ? [
        {
          id: input.createId("card-pf-cap"),
          title: c.overcommitted ? "Overcommitted" : "Capacity in band",
          summary: `Budget ${c.budgetUtilization ?? 0}% · Staff ${c.staffUtilization ?? 0}% · Leadership ${c.leadershipAttention ?? 0}%${
            c.bottlenecks?.length ? ` · Bottlenecks: ${c.bottlenecks.join(", ")}` : ""
          }`,
          score: c.staffUtilization,
          domains: ["portfolio-intelligence"],
          sourceDomain: "portfolio-intelligence",
        },
        ...(c.recommendations ?? []).slice(0, 2).map((r, i) => ({
          id: input.createId(`card-pf-cap-rec-${i}`),
          title: "Capacity recommendation",
          summary: r,
          score: 50,
          domains: ["portfolio-intelligence"],
          sourceDomain: "portfolio-intelligence",
        })),
      ]
    : [];
  return widget(
    "capacity_utilization",
    "Capacity Utilization",
    "portfolio-intelligence",
    cards,
    "No capacity snapshot attached.",
    input
  );
}

export function projectBudgetAllocation(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.portfolio?.allocations ?? []).slice(0, 6).map((a, idx) => ({
    id: a.initiativeId ?? input.createId(`card-pf-alloc-${idx}`),
    title: a.title ?? "Allocation",
    summary: `Advisory budget share ${a.budgetShare ?? 0}%`,
    score: a.budgetShare,
    domains: ["portfolio-intelligence"],
    sourceDomain: "portfolio-intelligence",
  }));
  return widget(
    "budget_allocation",
    "Budget Allocation",
    "portfolio-intelligence",
    cards,
    "No budget allocation attached.",
    input
  );
}

export function projectCrossInitiativeRisks(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.portfolio?.dependencies ?? [])
    .filter((d) => (d.severity ?? 0) >= 50)
    .slice(0, 6)
    .map((d, idx) => ({
      id: d.id ?? input.createId(`card-pf-dep-${idx}`),
      title: d.kind ?? "Dependency",
      summary: d.label ?? `${d.fromInitiativeId} ↔ ${d.toInitiativeId}`,
      severity: d.severity,
      score: d.severity,
      domains: ["portfolio-intelligence"],
      sourceDomain: "portfolio-intelligence",
    }));
  return widget(
    "cross_initiative_risks",
    "Cross-Initiative Risks",
    "portfolio-intelligence",
    cards,
    "No cross-initiative risks attached.",
    input
  );
}

export function projectPortfolioChanges(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.portfolio?.optimizations ?? []).slice(0, 6).map((o, idx) => ({
    id: o.id ?? input.createId(`card-pf-opt-${idx}`),
    title: o.title ?? o.kind ?? "Recommendation",
    summary: `${o.summary ?? ""} (advisory · expected impact ${o.expectedImpact ?? "—"})`,
    score: o.expectedImpact,
    domains: ["portfolio-intelligence"],
    sourceDomain: "portfolio-intelligence",
  }));
  return widget(
    "portfolio_changes",
    "Recommended Portfolio Changes",
    "portfolio-intelligence",
    cards,
    "No portfolio change recommendations.",
    input
  );
}

export function projectActiveSimulations(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.digitalTwin?.simulations ?? []).slice(0, 8).map((s, idx) => ({
    id: s.id ?? input.createId(`card-sim-${idx}`),
    title: `Simulation ${s.scenarioId ?? idx + 1}`,
    summary: `${s.valid ? "Valid" : "Invalid"} · confidence ${Math.round((s.confidence ?? 0) * 100)}%`,
    score: Math.round((s.confidence ?? 0) * 100),
    severity: s.valid ? undefined : 70,
    domains: ["digital-twin"],
    sourceDomain: "digital-twin",
  }));
  return widget(
    "active_simulations",
    "Active Simulations",
    "digital-twin",
    cards,
    "No active simulations.",
    input
  );
}

export function projectScenarioComparison(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.digitalTwin?.comparisons ?? []).slice(0, 4).map((c, idx) => ({
    id: input.createId(`card-cmp-${idx}`),
    title: "Scenario comparison",
    summary: c.highlight ?? `Compared ${(c.scenarioIds ?? []).length} scenarios`,
    domains: ["digital-twin"],
    sourceDomain: "digital-twin",
  }));
  return widget(
    "scenario_comparison",
    "Scenario Comparison",
    "digital-twin",
    cards,
    "No scenario comparisons.",
    input
  );
}

export function projectHighestImpactOpportunities(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.digitalTwin?.scenarios ?? []).slice(0, 6).map((s, idx) => ({
    id: s.id ?? input.createId(`card-opp-${idx}`),
    title: s.label ?? s.kind ?? "Scenario",
    summary: `Sandbox opportunity · ${s.kind ?? "custom"}`,
    score: 70 - idx * 5,
    domains: ["digital-twin"],
    sourceDomain: "digital-twin",
  }));
  return widget(
    "highest_impact_opportunities",
    "Highest-Impact Opportunities",
    "digital-twin",
    cards,
    "No twin opportunities attached.",
    input
  );
}

export function projectConstraintAlerts(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.digitalTwin?.simulations ?? [])
    .filter((s) => s.valid === false)
    .flatMap((s, idx) =>
      (s.invalidReasons ?? ["Constraint violation"]).slice(0, 2).map((reason, rIdx) => ({
        id: input.createId(`card-c-${idx}-${rIdx}`),
        title: `Constraint · ${s.scenarioId ?? "scenario"}`,
        summary: reason,
        severity: 80,
        domains: ["digital-twin"],
        sourceDomain: "digital-twin",
      }))
    )
    .slice(0, 8);
  return widget(
    "constraint_alerts",
    "Constraint Alerts",
    "digital-twin",
    cards,
    "No constraint alerts.",
    input
  );
}

export function projectRecommendedScenario(input: ProjectorInput): WorkspaceWidget {
  const rec = input.digitalTwin?.recommendation;
  const cards = rec
    ? [
        {
          id: input.createId("card-rec-sc"),
          title: rec.preferredScenarioId
            ? `Preferred: ${rec.preferredScenarioId}`
            : "No preferred scenario",
          summary: [
            ...(rec.tradeOffs ?? []).slice(0, 2),
            ...(rec.majorRisks ?? []).slice(0, 1),
            "Advisory only — human authorization required",
          ].join(" · "),
          score: Math.round((input.digitalTwin?.explainability?.confidence ?? 0.5) * 100),
          domains: ["digital-twin"],
          sourceDomain: "digital-twin",
          meta: { mayAutoExecute: false },
        },
      ]
    : [];
  return widget(
    "recommended_scenario",
    "Recommended Scenario",
    "digital-twin",
    cards,
    "No recommended scenario.",
    input
  );
}

export function projectEcosystemHealth(input: ProjectorInput): WorkspaceWidget {
  const health = input.ecosystemIntelligence?.metrics?.find((m) => m.key === "ecosystem_health");
  const fed = input.ecosystemIntelligence?.federation;
  const cards = health
    ? [
        {
          id: input.createId("card-eco-health"),
          title: `Ecosystem health ${Math.round(health.value ?? 0)}`,
          summary: `${fed?.authorizedCount ?? 0} authorized org(s) · ${fed?.excludedCount ?? 0} excluded · contributors ${(health.contributingOrganizationIds ?? []).length}`,
          score: health.value,
          domains: ["ecosystem-intelligence"],
          sourceDomain: "ecosystem-intelligence",
        },
      ]
    : [];
  return widget(
    "ecosystem_health",
    "Ecosystem Health",
    "ecosystem-intelligence",
    cards,
    "No federated ecosystem health.",
    input
  );
}

export function projectCrossOrganizationRisks(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.ecosystemIntelligence?.risks ?? []).slice(0, 8).map((r, idx) => ({
    id: r.id ?? input.createId(`card-eco-risk-${idx}`),
    title: r.title ?? r.kind ?? "Cross-org risk",
    summary: `${r.severity ?? "medium"} · ${(r.organizationIds ?? []).length} org(s)`,
    severity: r.severity === "critical" ? 90 : r.severity === "high" ? 75 : 55,
    domains: ["ecosystem-intelligence"],
    sourceDomain: "ecosystem-intelligence",
  }));
  return widget(
    "cross_organization_risks",
    "Cross-Organization Risks",
    "ecosystem-intelligence",
    cards,
    "No cross-organization risks.",
    input
  );
}

export function projectSharedOpportunities(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.ecosystemIntelligence?.opportunities ?? [])
    .slice(0, 8)
    .map((o, idx) => ({
      id: o.id ?? input.createId(`card-eco-opp-${idx}`),
      title: o.title ?? o.kind ?? "Shared opportunity",
      summary: `Impact ${o.estimatedImpact ?? "—"} · ${(o.organizationIds ?? []).length} org(s) · advisory`,
      score: Math.round((o.estimatedImpact ?? 0) * 100),
      domains: ["ecosystem-intelligence"],
      sourceDomain: "ecosystem-intelligence",
      meta: { mayAutoExecute: false },
    }));
  return widget(
    "shared_opportunities",
    "Shared Opportunities",
    "ecosystem-intelligence",
    cards,
    "No shared opportunities.",
    input
  );
}

export function projectGeographicCoverage(input: ProjectorInput): WorkspaceWidget {
  const cards = (input.ecosystemIntelligence?.geographicCoverage ?? [])
    .slice(0, 8)
    .map((g, idx) => ({
      id: input.createId(`card-eco-geo-${idx}`),
      title: g.region ?? "Region",
      summary: `${(g.organizationIds ?? []).length} org(s) · enrollment index ${g.enrollmentIndex ?? 0}`,
      score: g.enrollmentIndex,
      domains: ["ecosystem-intelligence"],
      sourceDomain: "ecosystem-intelligence",
    }));
  return widget(
    "geographic_coverage",
    "Geographic Coverage",
    "ecosystem-intelligence",
    cards,
    "No geographic coverage attached.",
    input
  );
}

export function projectFederatedPortfolio(input: ProjectorInput): WorkspaceWidget {
  const portfolio = input.ecosystemIntelligence?.metrics?.find(
    (m) => m.key === "combined_portfolio_value"
  );
  const cards = portfolio
    ? [
        {
          id: input.createId("card-eco-pf"),
          title: "Federated portfolio value",
          summary: `Combined ${portfolio.value ?? 0} · ${(portfolio.contributingOrganizationIds ?? []).length} contributors`,
          score: portfolio.value,
          domains: ["ecosystem-intelligence"],
          sourceDomain: "ecosystem-intelligence",
        },
      ]
    : [];
  return widget(
    "federated_portfolio",
    "Federated Portfolio",
    "ecosystem-intelligence",
    cards,
    "No federated portfolio attached.",
    input
  );
}

export function projectOrganizationNetwork(input: ProjectorInput): WorkspaceWidget {
  const graph = input.ecosystemIntelligence?.graph;
  const cards = [
    ...(graph
      ? [
          {
            id: input.createId("card-eco-net"),
            title: "Organization network",
            summary: `${graph.nodeCount ?? 0} nodes · ${graph.relationshipCount ?? 0} relationships`,
            score: graph.nodeCount,
            domains: ["ecosystem-intelligence"],
            sourceDomain: "ecosystem-intelligence",
          },
        ]
      : []),
    ...(graph?.nodes ?? []).slice(0, 5).map((n, idx) => ({
      id: input.createId(`card-eco-node-${idx}`),
      title: n.displayName ?? n.organizationId ?? "Organization",
      summary: n.kind ?? "organization",
      domains: ["ecosystem-intelligence"],
      sourceDomain: "ecosystem-intelligence",
    })),
  ];
  return widget(
    "organization_network",
    "Organization Network",
    "ecosystem-intelligence",
    cards,
    "No organization network attached.",
    input
  );
}
