import type {
  CompanyBuilderSeed,
  OrganizationDNA,
  OrganizationDnaResult,
  OrganizationStage,
} from "@/lib/platform/intelligence/organization-dna/types";

export const OIOS_VERSION = "0.1.0";
export const OIOS_INTELLIGENCE_DOMAINS = [
  "organization-dna", "organization-health", "financial", "founder", "executive",
  "executive-graph", "executive-decision", "predictive", "board-governance",
  "human-capital", "revenue", "funding", "opportunity", "operations", "customer",
  "knowledge", "document", "legal", "compliance", "risk", "market", "innovation", "impact",
] as const;
export type OiosIntelligenceDomain = (typeof OIOS_INTELLIGENCE_DOMAINS)[number];
export type OiosDomainStatus = "registered" | "active" | "dormant" | "deprecated";
export type OiosLifecyclePhase = OrganizationStage;
export type OiosMaturityLevel = "nascent" | "emerging" | "defined" | "managed" | "optimizing";
export type OiosHealthBand = "critical" | "at-risk" | "stable" | "healthy" | "thriving";
export type OiosPriorityBand = "critical" | "high" | "medium" | "low" | "monitor";
export interface OiosScope { organizationId: string | null; schoolId: string | null; }
export type OiosMetadata = Record<string, unknown>;

export interface DomainDescriptor {
  domain: OiosIntelligenceDomain;
  status: OiosDomainStatus;
  dependencies: OiosIntelligenceDomain[];
  priority: number;
  description: string;
}
export interface DigitalTwinSnapshot {
  id: string; scope: OiosScope; lifecycle: OiosLifecyclePhase; state: OrganizationalState;
  domainSignals: Record<string, number>; updatedAt: string; metadata: OiosMetadata;
}
export interface OrganizationalState {
  lifecycle: OiosLifecyclePhase; healthScore: number; maturityScore: number;
  readinessScore: number; activeDomains: OiosIntelligenceDomain[]; risks: string[];
}
export interface OrganizationalContextSnapshot {
  scope: OiosScope; generatedAt: string; baseline: OiosBaseline;
  state: OrganizationalState; dna: OrganizationDNA | null; metadata: OiosMetadata;
}
export interface MemoryRecord {
  id: string; scope: OiosScope; kind: string; content: string; createdAt: string;
  metadata: OiosMetadata;
}
export interface KnowledgeNode { id: string; label: string; kind: string; metadata: OiosMetadata; }
export interface KnowledgeEdge { id: string; fromId: string; toId: string; relation: string; weight: number; }
export interface CapabilityRecord {
  id: string; name: string; domain: OiosIntelligenceDomain; score: number;
  maturity: OiosMaturityLevel; evidence: string[];
}
export interface ImprovementOpportunity {
  id: string; title: string; domain: OiosIntelligenceDomain; score: number;
  priority: OiosPriorityBand; recommendation: string;
}
export interface ImprovementCycle {
  id: string; status: "planned" | "executing" | "measured" | "learned";
  opportunities: ImprovementOpportunity[]; actions: string[]; measuredScore: number | null;
  learnedAt: string | null;
  stages: Array<"assess" | "prioritize" | "plan" | "execute" | "measure" | "learn">;
}
export interface HealthIndex { score: number; band: OiosHealthBand; dimensions: Record<string, number>; }
export interface MaturityAssessment { score: number; level: OiosMaturityLevel; dimensions: Record<string, number>; }
export interface Scorecard { overall: number; measures: Record<string, number>; generatedAt: string; }
export interface BenchmarkResult { benchmark: string; score: number; delta: number; narrative: string; }
export interface Objective { id: string; title: string; target: string; priority: OiosPriorityBand; }
export interface Strategy { id: string; title: string; objectives: Objective[]; themes: string[]; }
export interface ExecutionModel { cadence: string; owners: string[]; measures: string[]; }
export interface OperatingModel { structure: string; decisionRights: string[]; processes: string[]; }
export interface ConfigurationSnapshot { version: string; values: OiosMetadata; updatedAt: string; }
export interface Policy { id: string; name: string; statement: string; status: "draft" | "active" | "retired"; }
export interface Standard { id: string; name: string; requirement: string; score: number; }
export interface GovernanceModelSnapshot { decisionBodies: string[]; policies: Policy[]; standards: Standard[]; }
export interface OiosBaseline {
  healthScore: number; financialScore: number; complianceScore: number; riskScore: number;
  executionScore: number; capabilityScore: number;
}
export interface OiosRequest {
  requestId: string; scope?: OiosScope; dnaResult?: OrganizationDnaResult;
  dna?: OrganizationDNA; dnaSeed?: CompanyBuilderSeed; baselineOverrides?: Partial<OiosBaseline>; metadata?: OiosMetadata;
}
export interface OiosResult {
  requestId: string;
  version: string;
  generatedAt: string;
  scope: OiosScope;
  baseline: OiosBaseline;
  twin: DigitalTwinSnapshot;
  context: OrganizationalContextSnapshot;
  health: HealthIndex;
  maturity: MaturityAssessment;
  scorecard: Scorecard;
  capabilities: CapabilityRecord[];
  opportunities: ImprovementOpportunity[];
  improvementCycle: ImprovementCycle;
  strategy: Strategy;
  execution: ExecutionModel;
  operatingModel: OperatingModel;
  governance: GovernanceModelSnapshot;
  configuration: ConfigurationSnapshot;
  benchmarks: BenchmarkResult[];
  memory: MemoryRecord[];
  knowledge: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] };
  domains: DomainDescriptor[];
  dna: OrganizationDNA | null;
  historyRecord: OiosHistoryRecord;
}
export interface OiosHistoryRecord {
  id: string; requestId: string; scope: OiosScope; generatedAt: string; summary: string; score: number;
}
export interface OiosQueryRequest { question: string; focus?: "health" | "maturity" | "strategy" | "general"; }
export interface OiosQueryResult { question: string; answer: string; references: string[]; }
export interface OiosProjectionResult {
  headline: string; health: OiosHealthBand; maturity: OiosMaturityLevel;
  score: number; priorities: string[];
}
