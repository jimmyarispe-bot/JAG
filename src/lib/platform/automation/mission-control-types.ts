/**
 * Mission Control compose types (Phase B / H-A12 facet extraction).
 * Public re-exports remain on mission-control-compose.ts for compatibility.
 */

import type { getMissionControlFeed } from "@/lib/platform/automation/mission-control";
import type { PlatformActivityEvent } from "@/lib/platform/activity/types";
import type { CommandCenterMetrics } from "@/lib/executive/types";
import type { NetworkDimensionRow } from "@/lib/executive/types";
import type { OperationalLoopSummary } from "@/lib/platform/operational-loop/types";
import type { LoopGapReport } from "@/lib/platform/operational-loop/types";

export interface MissionControlPriorityItem {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  href: string | null;
  source: "mission_control" | "jag_work" | "insight";
  module?: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt?: string;
}

export interface MissionControlOeiDimension {
  key: string;
  label: string;
  score: number;
}

export interface MissionControlHealth {
  operationalHealthScore: number;
  operationalExcellenceIndex: number;
  oeiDimensions: MissionControlOeiDimension[];
  activeAlerts: number;
  studentsRequiringAttention: number;
  familiesRequiringAttention: number;
  teacherIssues: number;
  staffingIssues: number;
  schedulingIssues: number;
  admissionsPipeline: number;
  financialStatus: "healthy" | "warning" | "critical";
  loopHealthPct: number;
}

export interface MissionControlAiBrief {
  executiveBrief: string | null;
  highestRisks: Array<{ id: string; title: string; body: string; href: string | null }>;
  opportunities: Array<{ id: string; title: string; body: string; href: string | null }>;
  recommendedActions: Array<{ id: string; title: string; action: string; href: string | null }>;
  projectedProblems: Array<{ horizon: "7d" | "30d" | "90d"; items: string[] }>;
}

export interface MissionControlCommandCenter {
  feed: Awaited<ReturnType<typeof getMissionControlFeed>>;
  queueMetrics: Record<string, number>;
  marketplaceCount: number;
  summary: {
    pendingTasks: number;
    overdueTasks: number;
    failedAutomations: number;
    openItems: number;
  };
  userRole: string | null;
  accessDenied: boolean;
  schoolId: string | null;
  health: MissionControlHealth;
  priorities: Record<"critical" | "high" | "medium" | "low", MissionControlPriorityItem[]>;
  activityStream: MissionControlActivityEvent[];
  metrics: CommandCenterMetrics;
  loopSummary: OperationalLoopSummary;
  loopGapReports: LoopGapReport[];
  loopStages: Array<{ stage: string; label: string; count: number }>;
  networkMap: NetworkDimensionRow[];
  aiBrief: MissionControlAiBrief;
}

export interface MissionControlActivityEvent extends PlatformActivityEvent {
  href?: string | null;
}
