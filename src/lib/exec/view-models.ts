import type { ExecDataMode } from "@/lib/exec/data-mode";

export type ExecWidgetMeta = {
  widgetId: string;
  title: string;
  domains: string[];
  dataMode: ExecDataMode;
  href?: string;
};

export type ExecListItem = {
  id: string;
  title: string;
  subtitle?: string;
  priority?: string;
  score?: number;
  href?: string;
};

export type ExecHomeViewModel = {
  generatedAt: string;
  health: ExecWidgetMeta & {
    score: number;
    band: string;
    dimensions: Array<{ key: string; label: string; score: number }>;
  };
  brief: ExecWidgetMeta & {
    headline: string;
    summary: string;
    outlook: string;
  };
  alerts: ExecWidgetMeta & {
    criticalCount: number;
    items: ExecListItem[];
  };
  topRecommendation: ExecWidgetMeta & {
    item: ExecListItem | null;
  };
  opportunities: ExecWidgetMeta & { items: ExecListItem[] };
  risks: ExecWidgetMeta & { items: ExecListItem[] };
  finance: ExecWidgetMeta & { score: number; label: string; detail: string };
  workforce: ExecWidgetMeta & { score: number; label: string; detail: string };
  customer: ExecWidgetMeta & { score: number; label: string; detail: string };
  actions: ExecWidgetMeta & { items: ExecListItem[] };
  predictive: ExecWidgetMeta & {
    outlook: string;
    headline: string;
    score: number;
  };
  timeline: ExecWidgetMeta & { items: ExecListItem[] };
  graph: ExecWidgetMeta & { status: string; moduleCount: number };
};

export type ExecBriefViewModel = {
  generatedAt: string;
  headline: string;
  whatHappened: string[];
  whyItMatters: string[];
  recommendedActions: ExecListItem[];
  risks: ExecListItem[];
  opportunities: ExecListItem[];
  confidence: {
    value: number;
    level: string;
    factors: Array<{ label: string; contribution: number }>;
  };
  evidence: string[];
  relatedDomains: string[];
  judgment: {
    whatLeadershipShouldDo: string;
    why: string;
    whyNow: string;
    expectedOutcome: string;
  };
  dataMode: ExecDataMode;
};

export type ExecHealthViewModel = {
  generatedAt: string;
  overall: {
    score: number;
    band: string;
    narrative: string;
  };
  departments: Array<{
    key: string;
    label: string;
    score: number;
    href: string;
    domain: string;
  }>;
  trends: Array<{ label: string; delta: number; direction: "up" | "down" | "flat" }>;
  history: Array<{ period: string; score: number }>;
  dataMode: ExecDataMode;
};

export type ExecWisdomViewModel = {
  generatedAt: string;
  recommendations: Array<{
    id: string;
    title: string;
    priority: string;
    confidence: number;
    rationale: string;
    action: string;
    lenses: Record<string, string>;
    evidenceRefs: string[];
    narrative: string;
  }>;
  tradeOffs: string[];
  judgment: {
    whatLeadershipShouldDo: string;
    why: string;
    whyNow: string;
    whyNotAlternatives: string;
    risksRemaining: string;
    assumptions: string;
    evidence: string;
    expectedOutcome: string;
  };
  ethical: string[];
  longTerm: string[];
  confidence: { value: number; level: string };
  dataMode: ExecDataMode;
};

export type ExecRiskCategory =
  | "financial"
  | "operational"
  | "legal"
  | "compliance"
  | "cyber"
  | "reputation"
  | "economic"
  | "political"
  | "environmental";

export type ExecRiskViewModel = {
  generatedAt: string;
  categories: Array<{
    key: ExecRiskCategory;
    label: string;
    domains: string[];
    pressure: number;
    items: ExecListItem[];
  }>;
  prioritized: ExecListItem[];
  dataMode: ExecDataMode;
};

export type ExecOpportunityTab =
  | "all"
  | "revenue"
  | "funding"
  | "partnerships"
  | "innovation"
  | "savings"
  | "operational";

export type ExecOpportunityViewModel = {
  generatedAt: string;
  tabs: Array<{
    key: ExecOpportunityTab;
    label: string;
    items: ExecListItem[];
  }>;
  dataMode: ExecDataMode;
};

export type ExecAskViewModel = {
  generatedAt: string;
  dataMode: ExecDataMode;
  organizationId: string;
  executiveRole: string;
  brief: {
    headline: string;
    cash: string;
    revenue: string;
    workforce: string;
    topOpportunities: string[];
    topRisks: string[];
    meetings: string[];
    deadlines: string[];
  };
  systemsPresent: string[];
  systemsMissing: string[];
  opener: import("@/lib/platform/copilot").CopilotAskResult;
  session: import("@/lib/platform/copilot").SessionMemory;
  suggestedPrompts: string[];
};
