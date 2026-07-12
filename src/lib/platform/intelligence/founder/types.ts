/**
 * Founder Intelligence Domain Types
 *
 * Sprint 021
 * JAG Executive Intelligence Platform
 */

export type Severity =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type Trend =
  | "up"
  | "down"
  | "stable";

export type OrganizationStatus =
  | "excellent"
  | "healthy"
  | "warning"
  | "critical";

export type IntelligenceSource =
  | "Admissions"
  | "Student Success"
  | "Scheduling"
  | "Finance"
  | "Human Capital"
  | "Compliance"
  | "Executive Intelligence"
  | "Mission Control"
  | "JAG";

export interface OrganizationHealth {
  score: number;

  status: OrganizationStatus;

  trend: Trend;

  summary: string;

  lastUpdated: Date;
}

export interface Priority {
  id: string;

  title: string;

  description: string;

  severity: Severity;

  source: IntelligenceSource;

  owner?: string;

  dueDate?: Date;

  confidence: number;
}

export interface ExecutiveAlert {
  id: string;

  title: string;

  message: string;

  severity: Severity;

  requiresAction: boolean;

  source: IntelligenceSource;

  createdAt: Date;
}

export interface Recommendation {
  id: string;

  title: string;

  action: string;

  reason: string;

  expectedImpact: string;

  confidence: number;

  source: IntelligenceSource;
}

export interface Risk {
  id: string;

  title: string;

  description: string;

  probability: number;

  impact: number;

  severity: Severity;

  source: IntelligenceSource;
}

export interface Opportunity {
  id: string;

  title: string;

  description: string;

  estimatedValue: number;

  confidence: number;

  source: IntelligenceSource;
}

export interface RecentChange {
  id: string;

  category: string;

  title: string;

  description: string;

  occurredAt: Date;

  source: IntelligenceSource;
}

export interface DecisionRequest {
  id: string;

  title: string;

  description: string;

  options: string[];

  recommendedOption: string;

  reason: string;

  deadline?: Date;

  confidence: number;
}

export interface FinancialSummary {
  revenue: number;

  expenses: number;

  cashPosition: number;

  ebitda: number;

  collectionRate: number;
}

export interface OperationalSummary {
  enrollment: number;

  admissionsPipeline: number;

  employees: number;

  upcomingClasses: number;

  attendanceRate: number;
}

export interface FounderBrief {
  id: string;

  briefNumber: number;

  generatedAt: Date;

  greeting: string;

  executiveSummary: string;

  organizationHealth: OrganizationHealth;

  priorities: Priority[];

  alerts: ExecutiveAlert[];

  recommendations: Recommendation[];

  risks: Risk[];

  opportunities: Opportunity[];

  recentChanges: RecentChange[];

  decisions: DecisionRequest[];

  financial: FinancialSummary;

  operations: OperationalSummary;
}