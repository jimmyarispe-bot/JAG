/**
 * Operations Intelligence — OperationsIntelligenceEngine (Sprint 038).
 *
 * Orchestrates workflow health, process monitoring, staffing analytics,
 * capacity planning, automation opportunities, and resource utilization.
 *
 * Distinct from organization-health's operations.ts stub.
 */

import type {
  AutomationOpportunityEngine as AutomationOpportunityEngineContract,
  CapacityPlanner as CapacityPlannerContract,
  ExecutiveOperationsBriefGenerator as ExecutiveOperationsBriefGeneratorContract,
  OperationsDashboard as OperationsDashboardContract,
  OperationsDependencies,
  OperationsHealth as OperationsHealthContract,
  OperationsIntelligence as OperationsIntelligenceContract,
  OperationsIntelligenceEngine as OperationsIntelligenceEngineContract,
  OperationsOpportunityAnalyzer as OperationsOpportunityAnalyzerContract,
  OperationsProjection as OperationsProjectionContract,
  OperationsQueries as OperationsQueriesContract,
  OperationsRecommendationComposer as OperationsRecommendationComposerContract,
  OperationsRegistry as OperationsRegistryContract,
  OperationsRepository as OperationsRepositoryContract,
  OperationsRiskAnalyzer as OperationsRiskAnalyzerContract,
  ProcessMonitoringEngine as ProcessMonitoringEngineContract,
  ResourceUtilizationAnalyzer as ResourceUtilizationAnalyzerContract,
  StaffingAnalyticsEngine as StaffingAnalyticsEngineContract,
  WorkflowHealthEngine as WorkflowHealthEngineContract,
} from "@/lib/platform/intelligence/operations/contracts";
import { AutomationOpportunityEngine } from "@/lib/platform/intelligence/operations/automation-intelligence";
import {
  CapacityPlanner,
  ResourceUtilizationAnalyzer,
  StaffingAnalyticsEngine,
} from "@/lib/platform/intelligence/operations/capacity-intelligence";
import { OperationsRegistryStore } from "@/lib/platform/intelligence/operations/operations-registry";
import {
  defaultOperationsConfidence,
  ExecutiveOperationsBriefGenerator,
  OperationsDashboard,
  OperationsHealth,
  OperationsIntelligence,
  OperationsOpportunityAnalyzer,
  OperationsRecommendationComposer,
  OperationsRiskAnalyzer,
} from "@/lib/platform/intelligence/operations/operations-intelligence";
import {
  OperationsProjection,
  OperationsQueries,
} from "@/lib/platform/intelligence/operations/projection";
import { OperationsRepositoryStore } from "@/lib/platform/intelligence/operations/repository";
import {
  ProcessMonitoringEngine,
  WorkflowHealthEngine,
} from "@/lib/platform/intelligence/operations/workflow-intelligence";
import {
  defaultCreateId,
  defaultPeriodLabel,
  deriveOperationsBaseline,
  emptyOperationsScope,
} from "@/lib/platform/intelligence/operations/models";
import {
  OPERATIONS_INTELLIGENCE_VERSION,
  type OperationsRequest,
  type OperationsResult,
} from "@/lib/platform/intelligence/operations/types";

export type OperationsEngineDependencies = OperationsDependencies;

/**
 * OperationsIntelligenceEngine — core orchestrator for operations outputs.
 */
export class OperationsIntelligenceEngineImpl
  implements OperationsIntelligenceEngineContract
{
  private readonly operationsIntelligence: OperationsIntelligenceContract;
  private readonly operationsDashboard: OperationsDashboardContract;
  private readonly operationsHealth: OperationsHealthContract;
  private readonly workflowHealthEngine: WorkflowHealthEngineContract;
  private readonly processMonitoringEngine: ProcessMonitoringEngineContract;
  private readonly staffingAnalyticsEngine: StaffingAnalyticsEngineContract;
  private readonly capacityPlanner: CapacityPlannerContract;
  private readonly resourceUtilizationAnalyzer: ResourceUtilizationAnalyzerContract;
  private readonly automationOpportunityEngine: AutomationOpportunityEngineContract;
  private readonly operationsRiskAnalyzer: OperationsRiskAnalyzerContract;
  private readonly operationsOpportunityAnalyzer: OperationsOpportunityAnalyzerContract;
  private readonly operationsRecommendationComposer: OperationsRecommendationComposerContract;
  private readonly briefGenerator: ExecutiveOperationsBriefGeneratorContract;
  private readonly projectionEngine: OperationsProjectionContract;
  readonly queries: OperationsQueriesContract;
  readonly registry: OperationsRegistryContract;
  readonly repository: OperationsRepositoryContract;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(d: OperationsEngineDependencies = {}) {
    this.createId = d.createId ?? defaultCreateId;
    this.now = d.now ?? (() => new Date());
    this.operationsIntelligence =
      d.operationsIntelligence ?? new OperationsIntelligence();
    this.operationsDashboard =
      d.operationsDashboard ?? new OperationsDashboard();
    this.operationsHealth = d.operationsHealth ?? new OperationsHealth();
    this.workflowHealthEngine =
      d.workflowHealthEngine ?? new WorkflowHealthEngine();
    this.processMonitoringEngine =
      d.processMonitoringEngine ?? new ProcessMonitoringEngine();
    this.staffingAnalyticsEngine =
      d.staffingAnalyticsEngine ?? new StaffingAnalyticsEngine();
    this.capacityPlanner = d.capacityPlanner ?? new CapacityPlanner();
    this.resourceUtilizationAnalyzer =
      d.resourceUtilizationAnalyzer ?? new ResourceUtilizationAnalyzer();
    this.automationOpportunityEngine =
      d.automationOpportunityEngine ??
      new AutomationOpportunityEngine(this.createId);
    this.operationsRiskAnalyzer =
      d.operationsRiskAnalyzer ?? new OperationsRiskAnalyzer(this.createId);
    this.operationsOpportunityAnalyzer =
      d.operationsOpportunityAnalyzer ??
      new OperationsOpportunityAnalyzer(this.createId);
    this.operationsRecommendationComposer =
      d.operationsRecommendationComposer ??
      new OperationsRecommendationComposer(this.createId);
    this.briefGenerator =
      d.briefGenerator ?? new ExecutiveOperationsBriefGenerator();
    this.projectionEngine = d.projection ?? new OperationsProjection();
    this.queries = d.queries ?? new OperationsQueries();
    this.registry = d.registry ?? new OperationsRegistryStore();
    this.repository = d.repository ?? new OperationsRepositoryStore();
  }

  build(request: OperationsRequest): OperationsResult {
    const now = this.now();
    const scope = request.scope ?? emptyOperationsScope();
    const dna = request.dna ?? request.dnaResult?.dna ?? null;

    // 1. Baseline
    const baseline = deriveOperationsBaseline(
      dna,
      request.oiosResult,
      request.analysis,
      request.graphInput,
      request.predictionResult,
      request.financialSignal,
      request.humanCapitalResult,
      request.businessModelResult,
      request.improvementResult,
      request.baselineOverrides
    );

    // 2. Workflow + process
    const workflowHealth = this.workflowHealthEngine.assess({ baseline, now });
    const processMonitoring = this.processMonitoringEngine.monitor({
      baseline,
      now,
    });

    // 3. Staffing + capacity + utilization
    const staffingAnalytics = this.staffingAnalyticsEngine.analyze({
      baseline,
      now,
    });
    const capacityPlan = this.capacityPlanner.plan({
      baseline,
      staffing: staffingAnalytics,
      now,
    });
    const resourceUtilization = this.resourceUtilizationAnalyzer.analyze({
      baseline,
      staffing: staffingAnalytics,
      capacity: capacityPlan,
      now,
    });

    // 4. Automation
    const automationOpportunities = this.automationOpportunityEngine.discover({
      baseline,
      workflowHealth,
      processMonitoring,
      now,
    });

    // 5. Risks + opportunities + recommendations
    const risks = this.operationsRiskAnalyzer.analyze({
      baseline,
      workflowHealth,
      processMonitoring,
      staffing: staffingAnalytics,
      capacity: capacityPlan,
      utilization: resourceUtilization,
      now,
    });
    const opportunities = this.operationsOpportunityAnalyzer.analyze({
      baseline,
      automation: automationOpportunities,
      capacity: capacityPlan,
      processMonitoring,
      now,
    });
    const recommendations = this.operationsRecommendationComposer.compose({
      opportunities,
      risks,
      automation: automationOpportunities,
      processMonitoring,
      now,
    });

    // 6. Scores + health + dashboard
    const scores = this.operationsIntelligence.composeScores({
      baseline,
      workflowHealth,
      processMonitoring,
      staffingAnalytics,
      capacityPlan,
      automation: automationOpportunities,
      resourceUtilization,
      risks,
      opportunities,
    });
    const operationsHealth = this.operationsHealth.assess({
      baseline,
      scores,
      workflowHealth,
      processMonitoring,
    });
    const dashboard = this.operationsDashboard.compose({
      scores,
      baseline,
      risks,
      opportunities,
      now,
    });

    // 7. Brief, projection, confidence, history → persist
    const confidence = defaultOperationsConfidence(
      baseline,
      workflowHealth,
      processMonitoring,
      automationOpportunities
    );
    const brief = this.briefGenerator.generate({
      request,
      baseline,
      scores,
      risks,
      opportunities,
      processMonitoring,
      recommendations,
      confidence,
      now,
    });
    const projection = this.projectionEngine.project({
      request,
      healthScore: scores.healthScore,
      workflowScore: scores.workflowScore,
      staffingScore: scores.staffingScore,
      capacityScore: scores.capacityScore,
      automationScore: scores.automationScore,
      workflowHealth,
      processMonitoring,
      capacityPlan,
      brief,
      confidence,
      dashboard,
      baseline,
    });

    const historyRecord = {
      id: this.createId("ops-history"),
      requestId: request.requestId,
      scope,
      status: "generated" as const,
      healthScore: scores.healthScore.value,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: OperationsResult = {
      requestId: request.requestId,
      version: OPERATIONS_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      workflowScore: scores.workflowScore,
      staffingScore: scores.staffingScore,
      capacityScore: scores.capacityScore,
      automationScore: scores.automationScore,
      riskScore: scores.riskScore,
      operationsHealth,
      workflowHealth,
      processMonitoring,
      staffingAnalytics,
      capacityPlan,
      automationOpportunities,
      resourceUtilization,
      dashboard,
      risks,
      opportunities,
      brief,
      projection,
      confidence,
      recommendations,
      historyRecord,
      metadata: {
        ...(request.metadata ?? {}),
        registryPublishers: this.registry.list().length,
        decisionAligned: Boolean(request.decisionResult),
        predictionAligned: Boolean(request.predictionResult),
      },
    };

    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

/** Aliases matching Sprint naming. */
export { OperationsIntelligenceEngineImpl as OperationsIntelligenceEngine };
export { OperationsIntelligenceEngineImpl as OperationsEngine };
export { OperationsIntelligenceEngineImpl as OperationsEngineImpl };
