/**
 * Operations Intelligence — contracts / interfaces only (Sprint 038).
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type * as T from "@/lib/platform/intelligence/operations/types";

/** Core orchestration engine. */
export interface OperationsIntelligenceEngine {
  build(request: T.OperationsRequest): T.OperationsResult;
}

/** Alias matching Sprint naming for the core engine. */
export type OperationsEngine = OperationsIntelligenceEngine;

/** Scores + health composer. */
export interface OperationsIntelligence {
  composeScores(input: {
    baseline: T.OperationsBaseline;
    workflowHealth: T.WorkflowHealthResult;
    processMonitoring: T.ProcessMonitoringSuite;
    staffingAnalytics: T.StaffingAnalyticsResult;
    capacityPlan: T.CapacityPlanResult;
    automation: T.AutomationOpportunitySuite;
    resourceUtilization: T.ResourceUtilizationResult;
    risks: T.OperationsRiskRecord[];
    opportunities: T.OperationsOpportunityRecord[];
  }): {
    healthScore: T.OperationsScore;
    workflowScore: T.OperationsScore;
    staffingScore: T.OperationsScore;
    capacityScore: T.OperationsScore;
    automationScore: T.OperationsScore;
    riskScore: T.OperationsScore;
  };
}

export interface OperationsDashboard {
  compose(input: {
    scores: {
      healthScore: T.OperationsScore;
      workflowScore: T.OperationsScore;
      staffingScore: T.OperationsScore;
      capacityScore: T.OperationsScore;
      automationScore: T.OperationsScore;
    };
    baseline: T.OperationsBaseline;
    risks: T.OperationsRiskRecord[];
    opportunities: T.OperationsOpportunityRecord[];
    now: Date;
  }): T.OperationsDashboardResult;
}

export interface OperationsHealth {
  assess(input: {
    baseline: T.OperationsBaseline;
    scores: {
      healthScore: T.OperationsScore;
      workflowScore: T.OperationsScore;
      staffingScore: T.OperationsScore;
      capacityScore: T.OperationsScore;
      automationScore: T.OperationsScore;
      riskScore: T.OperationsScore;
    };
    workflowHealth: T.WorkflowHealthResult;
    processMonitoring: T.ProcessMonitoringSuite;
  }): T.OperationsHealthResult;
}

export interface WorkflowHealthEngine {
  assess(input: {
    baseline: T.OperationsBaseline;
    now: Date;
  }): T.WorkflowHealthResult;
}

export interface ProcessMonitoringEngine {
  monitor(input: {
    baseline: T.OperationsBaseline;
    now: Date;
  }): T.ProcessMonitoringSuite;
}

export interface StaffingAnalyticsEngine {
  analyze(input: {
    baseline: T.OperationsBaseline;
    now: Date;
  }): T.StaffingAnalyticsResult;
}

export interface CapacityPlanner {
  plan(input: {
    baseline: T.OperationsBaseline;
    staffing: T.StaffingAnalyticsResult;
    now: Date;
  }): T.CapacityPlanResult;
}

export interface ResourceUtilizationAnalyzer {
  analyze(input: {
    baseline: T.OperationsBaseline;
    staffing: T.StaffingAnalyticsResult;
    capacity: T.CapacityPlanResult;
    now: Date;
  }): T.ResourceUtilizationResult;
}

export interface AutomationOpportunityEngine {
  discover(input: {
    baseline: T.OperationsBaseline;
    workflowHealth: T.WorkflowHealthResult;
    processMonitoring: T.ProcessMonitoringSuite;
    now: Date;
  }): T.AutomationOpportunitySuite;
}

export interface OperationsRiskAnalyzer {
  analyze(input: {
    baseline: T.OperationsBaseline;
    workflowHealth: T.WorkflowHealthResult;
    processMonitoring: T.ProcessMonitoringSuite;
    staffing: T.StaffingAnalyticsResult;
    capacity: T.CapacityPlanResult;
    utilization: T.ResourceUtilizationResult;
    now: Date;
  }): T.OperationsRiskRecord[];
}

export interface OperationsOpportunityAnalyzer {
  analyze(input: {
    baseline: T.OperationsBaseline;
    automation: T.AutomationOpportunitySuite;
    capacity: T.CapacityPlanResult;
    processMonitoring: T.ProcessMonitoringSuite;
    now: Date;
  }): T.OperationsOpportunityRecord[];
}

export interface OperationsRecommendationComposer {
  compose(input: {
    opportunities: T.OperationsOpportunityRecord[];
    risks: T.OperationsRiskRecord[];
    automation: T.AutomationOpportunitySuite;
    processMonitoring: T.ProcessMonitoringSuite;
    now: Date;
  }): T.OperationsRecommendationRecord[];
}

export interface ExecutiveOperationsBriefGenerator {
  generate(input: {
    request: T.OperationsRequest;
    baseline: T.OperationsBaseline;
    scores: {
      healthScore: T.OperationsScore;
      workflowScore: T.OperationsScore;
      staffingScore: T.OperationsScore;
      capacityScore: T.OperationsScore;
      automationScore: T.OperationsScore;
    };
    risks: T.OperationsRiskRecord[];
    opportunities: T.OperationsOpportunityRecord[];
    processMonitoring: T.ProcessMonitoringSuite;
    recommendations: T.OperationsRecommendationRecord[];
    confidence: T.OperationsConfidenceScore;
    now: Date;
  }): T.ExecutiveOperationsBrief;
}

export interface OperationsProjection {
  project(input: {
    request: T.OperationsRequest;
    healthScore: T.OperationsScore;
    workflowScore: T.OperationsScore;
    staffingScore: T.OperationsScore;
    capacityScore: T.OperationsScore;
    automationScore: T.OperationsScore;
    workflowHealth: T.WorkflowHealthResult;
    processMonitoring: T.ProcessMonitoringSuite;
    capacityPlan: T.CapacityPlanResult;
    brief: T.ExecutiveOperationsBrief;
    confidence: T.OperationsConfidenceScore;
    dashboard: T.OperationsDashboardResult;
    baseline: T.OperationsBaseline;
  }): T.OperationsProjectionResult;
}

export interface OperationsQueries {
  ask(
    result: T.OperationsResult,
    request: T.OperationsQueryRequest
  ): T.OperationsQueryResult;
}

export interface OperationsRegistry {
  register(domain: string, capability: string): void;
  list(): T.OperationsPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}

export interface OperationsRepository {
  save(result: T.OperationsResult): T.OperationsResult;
  get(requestId: string): T.OperationsResult | null;
  list(scope?: Partial<T.GraphScope>): T.OperationsResult[];
  remove(requestId: string): boolean;
  saveHistory(
    record: T.OperationsHistoryRecord
  ): T.OperationsHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.OperationsHistoryRecord[];
  clear(): void;
}

export interface OperationsIntelligenceService {
  build(request: T.OperationsRequest): T.OperationsResult;
  query(
    result: T.OperationsResult,
    request: T.OperationsQueryRequest
  ): T.OperationsQueryResult;
  repository(): OperationsRepository;
}

/** Alias matching Sprint naming. */
export type OperationsService = OperationsIntelligenceService;

/** DI bag for the full Operations Intelligence stack. */
export interface OperationsDependencies {
  engine?: OperationsIntelligenceEngine;
  operationsIntelligence?: OperationsIntelligence;
  operationsDashboard?: OperationsDashboard;
  operationsHealth?: OperationsHealth;
  workflowHealthEngine?: WorkflowHealthEngine;
  processMonitoringEngine?: ProcessMonitoringEngine;
  staffingAnalyticsEngine?: StaffingAnalyticsEngine;
  capacityPlanner?: CapacityPlanner;
  resourceUtilizationAnalyzer?: ResourceUtilizationAnalyzer;
  automationOpportunityEngine?: AutomationOpportunityEngine;
  operationsRiskAnalyzer?: OperationsRiskAnalyzer;
  operationsOpportunityAnalyzer?: OperationsOpportunityAnalyzer;
  operationsRecommendationComposer?: OperationsRecommendationComposer;
  briefGenerator?: ExecutiveOperationsBriefGenerator;
  projection?: OperationsProjection;
  queries?: OperationsQueries;
  registry?: OperationsRegistry;
  repository?: OperationsRepository;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
