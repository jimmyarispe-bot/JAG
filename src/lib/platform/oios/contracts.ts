import type {
  BenchmarkResult, CapabilityRecord, ConfigurationSnapshot, DigitalTwinSnapshot,
  DomainDescriptor, GovernanceModelSnapshot, HealthIndex, ImprovementCycle,
  ImprovementOpportunity, KnowledgeEdge, KnowledgeNode, MaturityAssessment,
  MemoryRecord, Objective, OiosBaseline, OiosHistoryRecord, OiosProjectionResult,
  OiosQueryRequest, OiosQueryResult, OiosRequest, OiosResult, OiosScope,
  OrganizationalContextSnapshot, OrganizationalState, OperatingModel, Policy,
  Scorecard, Standard, Strategy, ExecutionModel,
} from "@/lib/platform/oios/types";
import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";

export interface OrganizationOperatingSystem { bootstrap(scope?: OiosScope): void; build(request: OiosRequest): OiosResult; query(result: OiosResult, request: OiosQueryRequest): OiosQueryResult; }
export interface IntelligenceDomainRegistry { register(descriptor: DomainDescriptor): DomainDescriptor; get(domain: DomainDescriptor["domain"]): DomainDescriptor | null; list(): DomainDescriptor[]; activate(domain: DomainDescriptor["domain"]): DomainDescriptor | null; deactivate(domain: DomainDescriptor["domain"]): DomainDescriptor | null; resolveOrder(domains?: DomainDescriptor["domain"][]): DomainDescriptor[]; }
export interface OrganizationalDigitalTwin { snapshot(input: { scope: OiosScope; state: OrganizationalState; signals: Record<string, number>; dna: OrganizationDNA | null }): DigitalTwinSnapshot; }
export interface OrganizationalLifecycle { resolve(dna: OrganizationDNA | null, baseline: OiosBaseline): OrganizationalState["lifecycle"]; }
export interface OrganizationalStateEngine { derive(input: { lifecycle: OrganizationalState["lifecycle"]; baseline: OiosBaseline; activeDomains: DomainDescriptor["domain"][] }): OrganizationalState; }
export interface OrganizationalContext { create(input: { scope: OiosScope; baseline: OiosBaseline; state: OrganizationalState; dna: OrganizationDNA | null }): OrganizationalContextSnapshot; }
export interface OrganizationalMemory { remember(record: MemoryRecord): MemoryRecord; recall(scope: OiosScope): MemoryRecord[]; }
export interface OrganizationalKnowledgeGraph { addNode(node: KnowledgeNode): KnowledgeNode; addEdge(edge: KnowledgeEdge): KnowledgeEdge; nodes(): KnowledgeNode[]; edges(): KnowledgeEdge[]; }
export interface OrganizationCapabilitiesRegistry { assess(baseline: OiosBaseline): CapabilityRecord[]; }
export interface OrganizationImprovementEngine { prioritize(capabilities: CapabilityRecord[]): ImprovementOpportunity[]; }
export interface ContinuousImprovementLoop { run(opportunities: ImprovementOpportunity[], health: HealthIndex): ImprovementCycle; }
export interface OrganizationalHealthIndex { assess(baseline: OiosBaseline): HealthIndex; }
export interface OrganizationMaturityModel { assess(capabilities: CapabilityRecord[]): MaturityAssessment; }
export interface OrganizationScorecard { build(health: HealthIndex, maturity: MaturityAssessment, baseline: OiosBaseline): Scorecard; }
export interface OrganizationBenchmarking { compare(scorecard: Scorecard, benchmark?: number): BenchmarkResult; }
export interface OrganizationObjectives { build(opportunities: ImprovementOpportunity[]): Objective[]; }
export interface OrganizationStrategy { build(objectives: Objective[]): Strategy; }
export interface OrganizationExecutionModel { build(strategy: Strategy): ExecutionModel; }
export interface OrganizationOperatingModel { build(strategy: Strategy): OperatingModel; }
export interface OrganizationConfiguration { snapshot(): ConfigurationSnapshot; }
export interface OrganizationPolicies { list(): Policy[]; }
export interface OrganizationStandards { list(): Standard[]; }
export interface OrganizationGovernanceModel { build(): GovernanceModelSnapshot; }
export interface OiosEngine { build(request: OiosRequest): OiosResult; project(result: OiosResult): OiosProjectionResult; }
export interface OiosService { build(request: OiosRequest): OiosResult; query(result: OiosResult, request: OiosQueryRequest): OiosQueryResult; history(scope?: Partial<OiosScope>): OiosHistoryRecord[]; }
export interface OiosRepository { save(result: OiosResult): OiosResult; get(requestId: string): OiosResult | null; list(scope?: Partial<OiosScope>): OiosResult[]; saveHistory(record: OiosHistoryRecord): OiosHistoryRecord; listHistory(scope?: Partial<OiosScope>): OiosHistoryRecord[]; clear(): void; }
export interface OiosDependencies { now?: () => Date; createId?: (prefix: string) => string; repository?: OiosRepository; organizationDna?: ((request: OiosRequest) => OrganizationDnaResult | null) | null; }
