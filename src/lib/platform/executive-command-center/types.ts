/**
 * RC-6 — Executive Command Center 2.0 (Mission Control)
 * Soft-reads KG, domain feeds, Copilot 2.0, and optional Sprint lights.
 */

import type {
  CenterCard,
  CenterControl,
  CenterPanelShell,
} from "@/lib/platform/types";

export const EXECUTIVE_COMMAND_CENTER_V2_VERSION = "2.0.0";

export const MISSION_CONTROL_PANELS = [
  "organization_timeline",
  "alert_center",
  "approval_center",
  "investigation_workspace",
  "ai_workspace",
  "digital_twin_controls",
  "scenario_simulator",
  "risk_center",
  "initiative_monitor",
  "portfolio_health",
  "organization_graph_viewer",
] as const;

export type MissionControlPanelId = (typeof MISSION_CONTROL_PANELS)[number];

export type MissionControlCard = CenterCard;

export type MissionControlPanel = CenterPanelShell & {
  id: MissionControlPanelId;
  cards: MissionControlCard[];
  controls?: CenterControl[];
};

export type MissionControlWorkspace = {
  version: string;
  organizationId: string;
  generatedAt: string;
  panels: Record<MissionControlPanelId, MissionControlPanel>;
  panelOrder: MissionControlPanelId[];
  healthScore: { value: number; label: string };
  contributingDomains: string[];
  missionSummary: string;
};

/** Optional Sprint lights — soft-read shapes only (no package imports). */
export type MissionControlLights = {
  briefing?: {
    healthScore?: { value?: number; label?: string };
    briefing?: {
      sections?: {
        executiveSummary?: string;
        topRisks?: Array<{ title?: string; summary?: string; severity?: number }>;
        topOpportunities?: Array<{ title?: string; summary?: string }>;
      };
    };
    decisionQueue?: Array<{ title?: string; decisionNeeded?: string }>;
  };
  autonomous?: {
    approvalQueue?: Array<{ role?: string; status?: string; rationale?: string }>;
    plans?: Array<{ optionTitle?: string; readiness?: string }>;
  };
  initiative?: {
    initiatives?: Array<{
      id?: string;
      title?: string;
      state?: string;
      progress?: { percentComplete?: number; healthStatus?: string };
    }>;
    activeCount?: number;
    atRiskCount?: number;
  };
  portfolio?: {
    health?: {
      value?: number;
      state?: string;
      riskIndex?: number;
      explainability?: string;
    };
    capacity?: { overcommitted?: boolean; bottlenecks?: string[] };
    prioritization?: Array<{ title?: string; rank?: number; composite?: number }>;
  };
  digitalTwin?: {
    simulations?: Array<{ id?: string; scenarioId?: string; valid?: boolean; confidence?: number }>;
    scenarios?: Array<{ id?: string; kind?: string; label?: string }>;
    comparisons?: Array<{ highlight?: string }>;
    recommendation?: {
      preferredScenarioId?: string | null;
      tradeOffs?: string[];
      majorRisks?: string[];
    };
    explainability?: { executiveSummary?: string };
  };
  memory?: {
    decisions?: Array<{ title?: string; decision?: string }>;
    timeline?: Array<{ title?: string; summary?: string }>;
  };
  decision?: {
    recommendation?: {
      executiveSummary?: string;
      rankedOptions?: Array<{ title?: string; summary?: string }>;
    };
  };
  predictive?: {
    healthScore?: { value?: number; label?: string };
    forecasts?: Array<{ subject?: string; direction?: string; narrative?: string }>;
  };
  copilot?: {
    answer?: string;
    intent?: string;
    contributingDomains?: string[];
  };
};
