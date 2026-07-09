/** Executive Morning Brief 2.0 — section contracts (extends existing brief). */

import type { OrganizationBranding } from "@/lib/branding";
import type { ExecutiveAlert } from "@/lib/platform/executive-alerts";
import type { ExecutiveDecision } from "@/lib/platform/executive-decisions";
import type { MissionControlAiBrief, MissionControlPriorityItem } from "@/lib/platform/automation/mission-control-compose";
import type { JagWorkItem } from "@/lib/platform/jag-work";

export type NetworkHealthTone = "Green" | "Yellow" | "Red" | "Unknown";

export interface MorningBriefFinancialPulse {
  estimatedCash: number | null;
  collectionsYesterday: number | null;
  receivablesDue: number | null;
  payrollDue: number | null;
  financialRisk: number | null;
  /** FI cash is heuristic until GL Phase 0. */
  confidence: "High" | "Medium" | "Low" | "Unknown" | "estimated";
  methodologyNote: string;
}

export interface MorningBriefNetworkHealthNode {
  level: "Organization" | "Region" | "Campus" | "Program";
  id: string | null;
  label: string;
  tone: NetworkHealthTone;
  score: number | null;
  drivers: string[];
}

export interface MorningBriefNetworkHealth {
  nodes: MorningBriefNetworkHealthNode[];
  overall: NetworkHealthTone;
}

export interface MorningBriefOvernightActivityItem {
  id: string;
  title: string;
  summary: string;
  moduleKey: string;
  eventType: string;
  severity: string | null;
  occurredAt: string;
  href: string | null;
}

export interface MorningBriefKpiChange {
  metricId: string;
  metricName: string;
  currentValue: number | null;
  priorValue: number | null;
  delta: number | null;
  deltaPct: number | null;
  direction: "up" | "down" | "flat" | "unknown";
  unit?: string;
}

export interface MorningBriefKpiChanges {
  largestIncreases: MorningBriefKpiChange[];
  largestDecreases: MorningBriefKpiChange[];
  comparedSnapshotDate: string | null;
  currentSnapshotDate: string | null;
}

export interface MorningBriefWhatChangedItem {
  metricId: string;
  metricName: string;
  summary: string;
  delta: number | null;
  direction: "up" | "down" | "flat" | "unknown";
  statusChanged: boolean;
  priorStatus: string | null;
  currentStatus: string | null;
}

export interface MorningBriefSectionFlags {
  executiveSummary: boolean;
  topDecisions: boolean;
  financialPulse: boolean;
  networkHealth: boolean;
  overnightActivity: boolean;
  missionControl: boolean;
  executiveAlerts: boolean;
  kpiChanges: boolean;
  whatChanged: boolean;
}

/** Extended executive payload — additive; legacy fields preserved. */
export interface FounderMorningBriefExecutiveV2 {
  /** @deprecated Prefer executiveSummary; kept for existing UI. */
  priorities: MissionControlPriorityItem[];
  /** @deprecated Prefer executiveSummary narrative; EDI brief retained for compatibility. */
  aiBrief: MissionControlAiBrief;
  /** @deprecated Prefer topDecisions; mapped from decision queue for legacy UI. */
  decisionsWaiting: JagWorkItem[];
  decisionsCount: number;

  /** 1. Deterministic narrative (4–8 sentences). */
  executiveSummary: string;
  /** 2. Top open decisions from getExecutiveDecisionQueue(). */
  topDecisions: ExecutiveDecision[];
  /** 3. Financial pulse from aggregate metrics / FI. */
  financialPulse: MorningBriefFinancialPulse;
  /** 4. Network health rollup. */
  networkHealth: MorningBriefNetworkHealth;
  /** 5. Overnight Activity Engine strip. */
  overnightActivity: MorningBriefOvernightActivityItem[];
  /** 6. Mission Control critical items only. */
  missionControlCritical: MissionControlPriorityItem[];
  /** 7. Top alerts from getExecutiveAlerts(). */
  executiveAlerts: ExecutiveAlert[];
  /** 8. Largest KPI increases / decreases vs prior snapshot. */
  kpiChanges: MorningBriefKpiChanges;
  /** 9. What's changed since yesterday. */
  whatChangedSinceYesterday: MorningBriefWhatChangedItem[];

  sectionFlags: MorningBriefSectionFlags;
  brandingLabels: Pick<
    OrganizationBranding,
    | "founderWorkspaceLabel"
    | "intelligenceEngineLabel"
    | "missionControlLabel"
    | "financialIntelligenceLabel"
    | "productName"
  >;
  builtAt: string;
}

export const DEFAULT_MORNING_BRIEF_SECTION_FLAGS: MorningBriefSectionFlags = {
  executiveSummary: true,
  topDecisions: true,
  financialPulse: true,
  networkHealth: true,
  overnightActivity: true,
  missionControl: true,
  executiveAlerts: true,
  kpiChanges: true,
  whatChanged: true,
};
