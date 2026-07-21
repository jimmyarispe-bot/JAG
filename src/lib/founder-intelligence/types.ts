export type InsightSeverity = "info" | "low" | "medium" | "high" | "critical";
export type TrendDirection = "up" | "down" | "stable";

export type FounderDomain =
  | "admissions"
  | "enrollment"
  | "students"
  | "families"
  | "finance"
  | "human_capital"
  | "communications"
  | "workflows"
  | "documents"
  | "calendar"
  | "technology"
  | "organization";

export type InsightType =
  | "brief_item"
  | "health"
  | "risk"
  | "opportunity"
  | "prediction"
  | "recommendation"
  | "correlation"
  | "priority";

export type DecisionStatus =
  | "pending"
  | "approved"
  | "dismissed"
  | "delegated"
  | "scheduled"
  | "tracking"
  | "resolved";

export type MemoryType =
  | "pinned_priority"
  | "strategic_initiative"
  | "long_term_goal"
  | "delegated_item"
  | "open_decision"
  | "resolved_decision"
  | "note";

export interface Explainability {
  why: string;
  evidence: string[];
  relatedEventIds: string[];
  confidence: number;
  lastUpdated: string;
}

export interface DomainHealthScore {
  domain: FounderDomain;
  score: number;
  trend: TrendDirection;
  confidence: number;
  factors: string[];
  lastUpdated: string;
}

export interface FounderRisk {
  id: string;
  title: string;
  summary: string;
  domain: FounderDomain;
  probability: number;
  impact: number;
  severity: InsightSeverity;
  recommendedAction: string;
  explainability: Explainability;
}

export interface FounderOpportunity {
  id: string;
  title: string;
  summary: string;
  domain: FounderDomain;
  estimatedValue: number;
  confidence: number;
  recommendedAction: string;
  explainability: Explainability;
}

export interface FounderPrediction {
  id: string;
  title: string;
  domain: FounderDomain;
  metric: string;
  low: number;
  mid: number;
  high: number;
  unit: string;
  confidence: number;
  factors: string[];
  explainability: Explainability;
}

export interface FounderRecommendation {
  id: string;
  title: string;
  summary: string;
  domain: FounderDomain;
  priority: number;
  impact: string;
  confidence: number;
  relatedEntities: Array<{ type: string; id: string; label?: string }>;
  suggestedActions: string[];
  explainability: Explainability;
}

export interface BriefItem {
  id: string;
  title: string;
  summary: string;
  domain: FounderDomain;
  severity: InsightSeverity;
  priority: number;
  explainability: Explainability;
}

export interface CorrelationInsight {
  id: string;
  title: string;
  summary: string;
  domains: FounderDomain[];
  confidence: number;
  explainability: Explainability;
}

export interface FounderDecisionRecord {
  id: string;
  auditId: string;
  insightId?: string | null;
  title: string;
  description: string;
  status: DecisionStatus;
  priority: number;
  impact?: string | null;
  confidence: number;
  delegatedTo?: string | null;
  scheduledFor?: string | null;
  relatedEntities: Array<{ type: string; id: string; label?: string }>;
  suggestedActions: string[];
  history: Array<{ at: string; action: string; actorUserId?: string | null; note?: string | null }>;
  createdAt: string;
  updatedAt: string;
}

export interface FounderMemoryItem {
  id: string;
  memoryType: MemoryType;
  title: string;
  body: string;
  status: string;
  pinned: boolean;
  relatedDecisionId?: string | null;
  relatedInsightId?: string | null;
}

export interface TimelineEntry {
  id: string;
  occurredAt: string;
  category: string;
  title: string;
  summary?: string | null;
  eventType: string;
  moduleKey: string;
  source: "ei" | "founder_insight" | "founder_decision";
}

export interface FounderKpi {
  key: string;
  label: string;
  value: number;
  unit?: string;
  trend: TrendDirection;
  domain: FounderDomain;
}

export interface FounderDashboardBundle {
  generatedAt: string;
  executiveBrief: BriefItem[];
  organizationHealth: DomainHealthScore[];
  overallHealth: DomainHealthScore;
  risks: FounderRisk[];
  opportunities: FounderOpportunity[];
  predictions: FounderPrediction[];
  recommendations: FounderRecommendation[];
  correlations: CorrelationInsight[];
  kpis: FounderKpi[];
  decisions: FounderDecisionRecord[];
  priorities: BriefItem[];
  timeline: TimelineEntry[];
  memory: FounderMemoryItem[];
}

export const FOUNDER_DOMAINS: FounderDomain[] = [
  "admissions",
  "enrollment",
  "students",
  "families",
  "finance",
  "human_capital",
  "communications",
  "workflows",
  "documents",
  "calendar",
  "technology",
  "organization",
];

export const DOMAIN_EVENT_HINTS: Record<FounderDomain, string[]> = {
  admissions: ["lead.", "enrollment.", "admission."],
  enrollment: ["enrollment.", "student.created", "student.restored"],
  students: ["student.", "attendance."],
  families: ["family."],
  finance: ["invoice.", "payment.", "finance.", "billing.", "refund.", "scholarship."],
  human_capital: ["employee.", "payroll.", "hr."],
  communications: ["communication.", "message."],
  workflows: ["workflow."],
  documents: ["document.", "signature.", "template."],
  calendar: ["calendar.", "meeting.", "class.scheduled", "room."],
  technology: ["identity.", "integration.", "provider."],
  organization: [],
};
