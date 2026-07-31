/**
 * Founder Workspace — JAG Executive Operating System (Sprint 063).
 *
 * AcademyOS is Application #1 inside JAG. This module aggregates
 * FounderWorkspaceContext for the Founder Command Center.
 */

import type { PlatformApplicationKey } from "@/lib/platform/applications/types";
import type { OrganizationFeatureFlags } from "@/lib/platform/organizations/types";

export type FounderNavScope =
  | { kind: "platform" }
  | { kind: "application"; applicationKey: PlatformApplicationKey }
  | { kind: "organization"; organizationId: string }
  | {
      kind: "application_organization";
      applicationKey: PlatformApplicationKey;
      organizationId: string;
    };

export type FounderAlertCategory =
  | "critical"
  | "high"
  | "medium"
  | "informational";

export type FounderAlertDomain =
  | "operations"
  | "security"
  | "admissions"
  | "finance"
  | "platform"
  | "staffing"
  | "enrollment"
  | "technology";

export type FounderHealthBand = "excellent" | "healthy" | "watch" | "critical" | "unknown";

export type FounderMetricKey =
  | "active_students"
  | "active_staff"
  | "new_applications"
  | "enrollment_trend"
  | "attendance"
  | "tuition_collected"
  | "outstanding_balances"
  | "open_risks"
  | "pending_approvals"
  | "system_health";

export type FounderBriefingSectionId =
  | "platform_status"
  | "admissions"
  | "enrollment"
  | "attendance"
  | "finance"
  | "staffing"
  | "technology"
  | "security"
  | "critical_issues"
  | "ai_summary";

export type FounderActor = {
  userId: string;
  displayName: string;
  email: string | null;
  hasJagAccess: boolean;
};

export type FounderOrganizationSummary = {
  id: string;
  slug: string;
  name: string;
  status: string;
  healthScore: number | null;
  healthBand: FounderHealthBand;
  featureFlags: OrganizationFeatureFlags;
  enabledApplicationKeys: PlatformApplicationKey[];
};

export type FounderApplicationSummary = {
  key: PlatformApplicationKey;
  name: string;
  description: string;
  homeRoute: string | null;
  status: string;
  organizationCount: number;
};

export type FounderMetric = {
  key: FounderMetricKey;
  label: string;
  value: number | null;
  unit?: string;
  status: "healthy" | "watch" | "at_risk" | "critical" | "unknown";
  trendDirection: "up" | "down" | "flat" | "unknown";
  source: string;
  /** Underlying executive metric id when mapped. */
  executiveMetricId: string | null;
};

export type FounderAlert = {
  id: string;
  title: string;
  message: string;
  category: FounderAlertCategory;
  domain: FounderAlertDomain;
  organizationId: string | null;
  applicationKey: PlatformApplicationKey | null;
  href: string | null;
  createdAt: string;
  unread: boolean;
};

export type FounderBriefingSection = {
  id: FounderBriefingSectionId;
  title: string;
  summary: string;
  status: FounderHealthBand;
  highlights: string[];
  metricKeys: FounderMetricKey[];
  alertIds: string[];
  /** Sprint 064 — key insight from Executive Intelligence Layer. */
  keyInsight?: string | null;
  /** Sprint 064 — supporting metric rows from intelligence. */
  supportingMetrics?: Array<{
    key: string;
    label: string;
    value: number | null;
    unit: string | null;
  }>;
  /** Sprint 064 — recommended actions traceable to signals. */
  recommendedActions?: string[];
};

export type FounderMorningBrief = {
  generatedAt: string;
  asOfDate: string;
  scope: FounderNavScope;
  sections: FounderBriefingSection[];
  /** Deterministic template summary — not LLM-generated. */
  aiSummary: string;
  /** Present when brief was enriched by Executive Intelligence Layer v1. */
  intelligenceSummary?: string | null;
};

export type FounderNavNode = {
  id: string;
  label: string;
  href: string;
  scope: FounderNavScope;
  children?: FounderNavNode[];
};

export type FounderWorkspaceContext = {
  actor: FounderActor;
  scope: FounderNavScope;
  platformName: "JAG";
  organizations: FounderOrganizationSummary[];
  applications: FounderApplicationSummary[];
  /** Focused organization when scope drills into one. */
  activeOrganization: FounderOrganizationSummary | null;
  /** Focused application when scope drills into one. */
  activeApplication: FounderApplicationSummary | null;
  metrics: FounderMetric[];
  alerts: FounderAlert[];
  unreadAlertCount: number;
  health: {
    overallScore: number | null;
    overallBand: FounderHealthBand;
    byOrganization: Record<string, { score: number | null; band: FounderHealthBand }>;
  };
  openRiskCount: number;
  pendingApprovalCount: number;
  navigation: FounderNavNode[];
  briefing: FounderMorningBrief;
  /** Sprint 064/065 — full intelligence result for UI surfaces. */
  intelligence: import("@/lib/platform/intelligence/executive-layer").ExecutiveIntelligenceResult | null;
  /** Sprint 066 — tracked decision queue from recommendations. */
  decisionQueue: import("@/lib/platform/decisions").DecisionQueue | null;
  /** Sprint 067 — Founder accountability buckets over the decision queue. */
  decisionAccountability: import("@/lib/platform/notifications").DecisionAccountabilityBuckets | null;
  /** Sprint 068 — read-only automation engine status. */
  automationStatus: import("@/lib/platform/automation/operating").AutomationStatusSnapshot | null;
  /** Sprint 070 — deterministic forecasts (explainable; may be insufficient_data). */
  forecasts: import("@/lib/platform/intelligence/forecasting").ForecastingResult | null;
  generatedAt: string;
};

export type ResolveFounderWorkspaceInput = {
  organizationId?: string | null;
  applicationKey?: PlatformApplicationKey | null;
  /** When true, do not call identity/DB — used with assemble helpers in tests. */
  skipLoad?: boolean;
};
