/** Executive Intelligence™ — deterministic aggregates + evidence-backed insights (no AI). */

import type { DecisionSummary } from "@/lib/executive-intelligence/decisions/types";
import type { InsightDashboardSection } from "@/lib/executive-intelligence/insights/types";
import type { StrategySummary } from "@/lib/goals/types";
import type { RiskSummary } from "@/lib/risk/types";
import type { OrganizationalKnowledgeSummary } from "@/lib/memory/types";
import type { ExecutionSummary } from "@/lib/work/types";

export type {
  ExecutiveInsight,
  InsightDashboardSection,
  InsightDomain,
  InsightSeverity,
  InsightStatus,
} from "@/lib/executive-intelligence/insights/types";

export type {
  DecisionSummary,
  JagDecision,
  DecisionStatus,
} from "@/lib/executive-intelligence/decisions/types";

export type ExecutiveAlertSeverity = "info" | "warning" | "critical";

export type ExecutiveAlert = {
  readonly id: string;
  readonly code: string;
  readonly severity: ExecutiveAlertSeverity;
  readonly title: string;
  readonly message: string;
  readonly organizationId: string;
  readonly createdAt: string;
};

export type ExecutiveBrief = {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly currentDate: string;
  readonly platformVersion: string;
  readonly connectedSystems: number;
  readonly totalEvidence: number;
  readonly evidenceAwaitingReview: number;
  readonly processingQueueStatus: {
    readonly waiting: number;
    readonly running: number;
    readonly failed: number;
    readonly label: string;
  };
};

export type FinancialIntelligenceSection = {
  readonly latestSyncAt: string | null;
  readonly lastImportedReports: readonly string[];
  readonly financialDocumentsImported: number;
  readonly pendingFinancialEvidence: number;
  readonly connectorStatus: string;
  readonly companyName: string | null;
};

export type OrganizationalIntelligenceSection = {
  readonly businessUnits: readonly string[];
  readonly departments: readonly string[];
  readonly evidenceByDomain: Readonly<Record<string, number>>;
  readonly recentActivity: readonly {
    readonly at: string;
    readonly label: string;
  }[];
  readonly recentlyUpdatedDocuments: readonly {
    readonly id: string;
    readonly name: string;
    readonly updatedAt: string;
  }[];
};

export type OperationalIntelligenceSection = {
  readonly processingJobs: number;
  readonly failedJobs: number;
  readonly completedJobs: number;
  readonly connectorHealth: {
    readonly healthy: number;
    readonly warning: number;
    readonly offline: number;
    readonly error: number;
  };
  readonly platformHealthLabel: string;
  readonly syncStatus: string;
};

export type KnowledgeIntelligenceSection = {
  readonly totalGraphNodes: number;
  readonly relationships: number;
  readonly recentlyAddedEvidence: readonly {
    readonly id: string;
    readonly label: string;
    readonly createdAt: string;
  }[];
  readonly recentlyUpdatedRelationships: readonly {
    readonly id: string;
    readonly relationshipType: string;
    readonly updatedAt: string;
  }[];
};

export type ExecutiveTimelineItem = {
  readonly id: string;
  readonly at: string;
  readonly source: "evidence" | "connector" | "pipeline" | "platform";
  readonly title: string;
  readonly detail: string;
  readonly entityType: string;
  readonly entityId: string;
};

export type ExecutiveMetrics = {
  readonly organizations: number;
  readonly connectedSystems: number;
  readonly evidenceDocuments: number;
  readonly evidenceAwaitingReview: number;
  readonly processingJobs: number;
  readonly completedJobs: number;
  readonly failedJobs: number;
  readonly knowledgeNodes: number;
  readonly knowledgeRelationships: number;
  readonly connectorHealthScore: number;
};

export type ExecutiveHealthScore = {
  readonly score: number;
  readonly label: "healthy" | "watch" | "degraded" | "critical";
  readonly inputs: Readonly<{
    failedJobs: number;
    healthyConnectors: number;
    totalConnectors: number;
    pendingEvidence: number;
    recentErrors: number;
    processingQueue: number;
  }>;
  readonly weights: Readonly<Record<string, number>>;
};

export type ExecutiveDashboardCard = {
  readonly id: string;
  readonly title: string;
  readonly value: string | number;
  readonly subtitle?: string;
  readonly href?: string;
};

export type ExecutiveDashboard = {
  readonly brief: ExecutiveBrief;
  readonly financial: FinancialIntelligenceSection;
  readonly organizational: OrganizationalIntelligenceSection;
  readonly operational: OperationalIntelligenceSection;
  readonly knowledge: KnowledgeIntelligenceSection;
  readonly metrics: ExecutiveMetrics;
  readonly health: ExecutiveHealthScore;
  readonly alerts: readonly ExecutiveAlert[];
  readonly insights: InsightDashboardSection;
  readonly decisionSummary: DecisionSummary;
  readonly strategySummary: StrategySummary;
  readonly riskSummary: RiskSummary;
  readonly executionSummary: ExecutionSummary;
  readonly organizationalKnowledge: OrganizationalKnowledgeSummary;
  readonly cards: readonly ExecutiveDashboardCard[];
  readonly timeline: readonly ExecutiveTimelineItem[];
};
