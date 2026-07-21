/**
 * Executive Command Center — shared types / DTOs (Sprint 068).
 *
 * Leaf module: soft-reads prior executive-stack lights into a workspace.
 * Widgets project domain outputs — they do not duplicate domain logic.
 */

import type { ResultLightBase } from "@/lib/platform/intelligence/common/result-lights";

export const EXECUTIVE_COMMAND_CENTER_VERSION = "0.1.0";
export const EXECUTIVE_COMMAND_CENTER_MODULE_ID = "executive-command-center" as const;

export const COMMAND_CENTER_ROLES = [
  "founder",
  "ceo",
  "board",
  "school_leader",
  "mission_control",
] as const;

export const WIDGET_KINDS = [
  "briefing",
  "risks",
  "opportunities",
  "decisions",
  "forecasts",
  "signals",
  "approvals",
  "plans",
  "memory",
  "copilot",
  "health",
  "active_initiatives",
  "at_risk_initiatives",
  "upcoming_milestones",
  "budget_variance",
  "completed_initiatives",
  "portfolio_health",
  "priority_matrix",
  "capacity_utilization",
  "budget_allocation",
  "cross_initiative_risks",
  "portfolio_changes",
  "active_simulations",
  "scenario_comparison",
  "highest_impact_opportunities",
  "constraint_alerts",
  "recommended_scenario",
  "ecosystem_health",
  "cross_organization_risks",
  "shared_opportunities",
  "geographic_coverage",
  "federated_portfolio",
  "organization_network",
  // Sprint 074 — Google Workspace collaboration surfaces
  "recent_meetings",
  "calendar_summary",
  "communication_pulse",
  "shared_documents",
  "collaboration_activity",
  // RC-2.06 — Executive narratives from Workspace intelligence
  "executive_narratives",
  // Sprint 075 — Unified Google + Microsoft communication
  "unified_communication_dashboard",
  // Sprint 076 / RC-3.02 — Collaboration Intelligence
  "communication_health",
  "response_time",
  "active_teams",
  "meeting_load",
  "collaboration_heatmap",
  // Sprint 077 / RC-3.03 — Financial Intelligence Connectors
  "cash_position",
  "revenue",
  "burn_rate",
  "receivables",
  "payables",
  "subscriptions",
  "revenue_forecast",
  "expense_anomalies",
  "profitability",
  "ebitda",
  // Sprint 078 — Enterprise Connectors
  "crm_pipeline",
  "workforce",
  "student_enrollment",
  "program_funding",
  // RC-3.04 — CRM Connectors intelligence
  "sales_forecast",
  "pipeline_health",
  "customer_concentration",
  "executive_relationship_graph",
  "revenue_attribution",
  // RC-3.05 — HR Connectors intelligence
  "hr_turnover",
  "hr_hiring",
  "hr_capacity",
  "hr_payroll",
  "hr_compensation",
  "hr_succession",
  // RC-3.06 — Education Connectors intelligence
  "student_health",
  "teacher_workload",
  "academic_performance",
  "education_attendance",
  "scholarship_analytics",
  // RC-4 — Unified Knowledge Graph
  "organizational_graph",
  // RC-6 — Executive Command Center 2.0 (Mission Control)
  "organization_timeline",
  "alert_center",
  "approval_center",
  "investigation_workspace",
  "ai_workspace",
  "digital_twin_controls",
  "scenario_simulator",
  "risk_center",
  "initiative_monitor",
  "organization_graph_viewer",
  "mission_control_summary",
] as const;

export const DRILL_DOWN_ACTIONS = [
  "open_investigation",
  "view_evidence",
  "compare",
  "forecast",
  "assign",
  "create_initiative",
] as const;

export type CommandCenterRole = (typeof COMMAND_CENTER_ROLES)[number];
export type WidgetKind = (typeof WIDGET_KINDS)[number];
export type DrillDownAction = (typeof DRILL_DOWN_ACTIONS)[number];
export type CommandCenterMetadata = Record<string, unknown>;

export interface CommandCenterScope {
  organizationId: string | null;
  schoolId: string | null;
}

/** Soft-read lights — same contract style as executive-copilot. */
export interface SynthesisResultLight extends ResultLightBase {
  brief?: { executiveSummary?: string; headline?: string };
  recommendations?: Array<{ title?: string; summary?: string; priority?: number }>;
  contributingDomains?: string[];
}

export interface BriefingResultLight extends ResultLightBase {
  healthScore?: { value?: number; label?: string };
  overnight?: { summary?: string; newRisks?: string[] };
  briefing?: {
    sections?: {
      executiveSummary?: string;
      topRisks?: Array<{
        id?: string;
        title?: string;
        summary?: string;
        severity?: number;
        urgency?: number;
        domains?: string[];
      }>;
      topOpportunities?: Array<{
        id?: string;
        title?: string;
        summary?: string;
        estimatedImpact?: number;
        domains?: string[];
      }>;
    };
  };
  decisionQueue?: Array<{
    id?: string;
    title?: string;
    decisionNeeded?: string;
    recommendedDecision?: string;
  }>;
  contributingDomains?: string[];
}

export interface ExecutiveMemoryResultLight extends ResultLightBase {
  timeline?: Array<{
    at?: string;
    kind?: string;
    title?: string;
    summary?: string;
    domains?: string[];
  }>;
  decisions?: Array<{
    id?: string;
    title?: string;
    expectedOutcome?: string;
    actualOutcome?: string;
    domains?: string[];
  }>;
  contributingDomains?: string[];
}

export interface DecisionIntelligenceResultLight extends ResultLightBase {
  recommendation?: {
    id?: string;
    executiveSummary?: string;
    recommendedOptionId?: string | null;
    rankedOptions?: Array<{
      id?: string;
      title?: string;
      summary?: string;
      category?: string;
      confidence?: number;
      scorecard?: { overall?: number; roi?: number };
    }>;
    confidence?: number;
  };
  contributingDomains?: string[];
}

export interface ExecutivePredictiveResultLight extends ResultLightBase {
  healthScore?: { value?: number; label?: string };
  forecasts?: Array<{
    subject?: string;
    horizon?: string;
    direction?: string;
    confidence?: number;
  }>;
  emergingSignals?: Array<{
    title?: string;
    subject?: string;
    narrative?: string;
    strength?: number;
  }>;
  scenarios?: Array<{ kind?: string; label?: string; narrative?: string }>;
  contributingDomains?: string[];
}

export interface AutonomousResultLight extends ResultLightBase {
  plans?: Array<{
    id?: string;
    workflowKind?: string;
    objective?: string;
    optionTitle?: string;
    readiness?: string;
    humanAuthorizationRequired?: boolean;
    autoExecute?: boolean;
  }>;
  approvalQueue?: Array<{
    role?: string;
    status?: string;
    rationale?: string;
  }>;
  autoExecute?: boolean;
  contributingDomains?: string[];
}

export interface CopilotResultLight extends ResultLightBase {
  intent?: string;
  answer?: string;
  explainability?: {
    executiveSummary?: string;
    confidence?: number;
    contributingDomains?: string[];
  };
  followUps?: Array<{ prompt?: string; intent?: string }>;
  contributingDomains?: string[];
}

/** Soft-read from Portfolio Intelligence (Sprint 070) — no package import. */
export interface PortfolioResultLight extends ResultLightBase {
  health?: {
    value?: number;
    state?: string;
    riskIndex?: number;
    capacityUtilization?: number;
    strategicCoverage?: number;
    explainability?: string;
  };
  prioritization?: Array<{
    initiativeId?: string;
    title?: string;
    composite?: number;
    rank?: number;
    alignment?: number;
    risk?: number;
  }>;
  capacity?: {
    budgetUtilization?: number;
    staffUtilization?: number;
    leadershipAttention?: number;
    overcommitted?: boolean;
    bottlenecks?: string[];
    recommendations?: string[];
  };
  allocations?: Array<{
    initiativeId?: string;
    title?: string;
    budgetShare?: number;
  }>;
  dependencies?: Array<{
    id?: string;
    kind?: string;
    label?: string;
    severity?: number;
    fromInitiativeId?: string;
    toInitiativeId?: string;
  }>;
  optimizations?: Array<{
    id?: string;
    kind?: string;
    title?: string;
    summary?: string;
    expectedImpact?: number;
  }>;
  analytics?: {
    portfolioValue?: number;
    expectedRoi?: number;
    resourceUtilization?: number;
  };
  contributingDomains?: string[];
}

/** Soft-read from Digital Twin (Sprint 071) — no package import. */
export interface DigitalTwinResultLight extends ResultLightBase {
  simulations?: Array<{
    id?: string;
    scenarioId?: string;
    valid?: boolean;
    confidence?: number;
    invalidReasons?: string[];
  }>;
  scenarios?: Array<{ id?: string; kind?: string; label?: string }>;
  comparisons?: Array<{ highlight?: string; scenarioIds?: string[] }>;
  recommendation?: {
    preferredScenarioId?: string | null;
    tradeOffs?: string[];
    majorRisks?: string[];
    mayAutoExecute?: boolean;
  };
  explainability?: { executiveSummary?: string; confidence?: number };
  contributingDomains?: string[];
}

/** Soft-read from Ecosystem Intelligence (Sprint 072) — no package import. */
export interface EcosystemIntelligenceResultLight extends ResultLightBase {
  federation?: { authorizedCount?: number; excludedCount?: number };
  metrics?: Array<{
    key?: string;
    label?: string;
    value?: number;
    contributingOrganizationIds?: string[];
  }>;
  risks?: Array<{
    id?: string;
    kind?: string;
    severity?: string;
    title?: string;
    organizationIds?: string[];
  }>;
  opportunities?: Array<{
    id?: string;
    kind?: string;
    title?: string;
    estimatedImpact?: number;
    organizationIds?: string[];
  }>;
  geographicCoverage?: Array<{
    region?: string;
    organizationIds?: string[];
    enrollmentIndex?: number;
  }>;
  graph?: {
    nodeCount?: number;
    relationshipCount?: number;
    nodes?: Array<{ organizationId?: string; displayName?: string; kind?: string }>;
  };
  recommendation?: {
    preferredOpportunityIds?: string[];
    majorRisks?: string[];
    mayAutoExecute?: boolean;
  };
  explainability?: { executiveSummary?: string; confidence?: number };
  contributingDomains?: string[];
}

/** Soft-read from Initiative Intelligence (Sprint 069) — no package import. */
export interface InitiativeResultLight extends ResultLightBase {
  initiatives?: Array<{
    id?: string;
    title?: string;
    state?: string;
    executiveSummary?: string;
    progress?: {
      percentComplete?: number;
      healthScore?: number;
      healthStatus?: string;
      budgetVariance?: number;
      budgetVariancePct?: number;
      scheduleVarianceDays?: number;
    };
    budget?: { planned?: number; actual?: number; forecast?: number };
    milestones?: Array<{
      id?: string;
      title?: string;
      dueDate?: string;
      status?: string;
      percentComplete?: number;
    }>;
    targetCompletionDate?: string;
  }>;
  activeCount?: number;
  atRiskCount?: number;
  completedCount?: number;
  portfolioHealth?: { value?: number; label?: string };
  contributingDomains?: string[];
}

export interface WidgetCard {
  id: string;
  title: string;
  summary: string;
  severity?: number;
  score?: number;
  domains: string[];
  sourceDomain: string;
  meta?: CommandCenterMetadata;
}

export interface WorkspaceWidget {
  id: string;
  kind: WidgetKind;
  title: string;
  subtitle?: string;
  sourceDomain: string;
  priority: number;
  cards: WidgetCard[];
  emptyMessage: string;
  actions: DrillDownAction[];
  refreshedAt: string;
}

export interface WorkspaceLayout {
  role: CommandCenterRole;
  label: string;
  description: string;
  /** Ordered widget kinds for this persona. */
  widgetOrder: WidgetKind[];
}

export interface CommandCenterRequest {
  requestId: string;
  scope: CommandCenterScope;
  role?: CommandCenterRole;
  synthesisResult?: SynthesisResultLight;
  briefingResult?: BriefingResultLight;
  memoryResult?: ExecutiveMemoryResultLight;
  decisionResult?: DecisionIntelligenceResultLight;
  predictiveResult?: ExecutivePredictiveResultLight;
  autonomousResult?: AutonomousResultLight;
  copilotResult?: CopilotResultLight;
  initiativeResult?: InitiativeResultLight;
  portfolioResult?: PortfolioResultLight;
  digitalTwinResult?: DigitalTwinResultLight;
  ecosystemIntelligenceResult?: EcosystemIntelligenceResultLight;
  periodLabel?: string;
  metadata?: CommandCenterMetadata;
}

export interface CommandCenterResult {
  requestId: string;
  version: string;
  scope: CommandCenterScope;
  generatedAt: string;
  role: CommandCenterRole;
  layout: WorkspaceLayout;
  widgets: WorkspaceWidget[];
  healthScore: { value: number; label: string };
  refresh: {
    source: "intelligence-pipeline";
    refreshedAt: string;
    contributingDomains: string[];
  };
  drillDownActions: DrillDownAction[];
  contributingDomains: string[];
  metadata: CommandCenterMetadata;
}
