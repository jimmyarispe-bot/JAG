/**
 * Operations Intelligence — scores, health, dashboards, briefs, analyzers (Sprint 038).
 */

import type {
  ExecutiveOperationsBriefGenerator as ExecutiveOperationsBriefGeneratorContract,
  OperationsDashboard as OperationsDashboardContract,
  OperationsHealth as OperationsHealthContract,
  OperationsIntelligence as OperationsIntelligenceContract,
  OperationsOpportunityAnalyzer as OperationsOpportunityAnalyzerContract,
  OperationsRecommendationComposer as OperationsRecommendationComposerContract,
  OperationsRiskAnalyzer as OperationsRiskAnalyzerContract,
} from "@/lib/platform/intelligence/operations/contracts";
import {
  buildConfidence,
  buildLenses,
  clamp,
  defaultCreateId,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/operations/models";
import type {
  AutomationOpportunitySuite,
  CapacityPlanResult,
  ExecutiveOperationsBrief,
  OperationsBaseline,
  OperationsConfidenceScore,
  OperationsDashboardResult,
  OperationsHealthResult,
  OperationsOpportunityRecord,
  OperationsRecommendationRecord,
  OperationsRequest,
  OperationsRiskRecord,
  OperationsScore,
  ProcessMonitoringSuite,
  ResourceUtilizationResult,
  StaffingAnalyticsResult,
  WorkflowHealthResult,
} from "@/lib/platform/intelligence/operations/types";

export function defaultOperationsConfidence(
  baseline: OperationsBaseline,
  workflowHealth: WorkflowHealthResult,
  processMonitoring: ProcessMonitoringSuite,
  automation: AutomationOpportunitySuite
): OperationsConfidenceScore {
  return buildConfidence([
    {
      key: "operations",
      label: "Operations pillar",
      contribution: clamp(baseline.operationsScore / 100),
    },
    {
      key: "workflow",
      label: "Workflow coverage",
      contribution: clamp(workflowHealth.overallScore / 100),
    },
    {
      key: "process",
      label: "Process monitoring",
      contribution: clamp(processMonitoring.overallScore / 100),
    },
    {
      key: "automation",
      label: "Automation readiness",
      contribution: clamp(automation.readinessScore / 100),
    },
  ]);
}

export class OperationsIntelligence
  implements OperationsIntelligenceContract
{
  composeScores(input: {
    baseline: OperationsBaseline;
    workflowHealth: WorkflowHealthResult;
    processMonitoring: ProcessMonitoringSuite;
    staffingAnalytics: StaffingAnalyticsResult;
    capacityPlan: CapacityPlanResult;
    automation: AutomationOpportunitySuite;
    resourceUtilization: ResourceUtilizationResult;
    risks: OperationsRiskRecord[];
    opportunities: OperationsOpportunityRecord[];
  }): {
    healthScore: OperationsScore;
    workflowScore: OperationsScore;
    staffingScore: OperationsScore;
    capacityScore: OperationsScore;
    automationScore: OperationsScore;
    riskScore: OperationsScore;
  } {
    const avgRisk =
      input.risks.length > 0
        ? input.risks.reduce((s, r) => s + r.score, 0) / input.risks.length
        : 35;
    const oppLift =
      input.opportunities.length > 0
        ? input.opportunities.reduce((s, o) => s + o.score, 0) /
          input.opportunities.length
        : 50;

    const workflowValue = clamp(
      input.workflowHealth.overallScore * 0.65 +
        input.processMonitoring.overallScore * 0.35
    );
    const staffingValue = clamp(input.staffingAnalytics.adequacyScore);
    const capacityValue = clamp(
      input.capacityPlan.overallHeadroom * 0.7 +
        (100 - input.resourceUtilization.overloadRisk) * 0.3
    );
    const automationValue = clamp(
      input.automation.readinessScore * 0.55 +
        (input.automation.opportunities[0]?.score ?? 50) * 0.25 +
        oppLift * 0.2
    );
    const healthValue = clamp(
      workflowValue * 0.25 +
        staffingValue * 0.2 +
        capacityValue * 0.2 +
        automationValue * 0.15 +
        input.baseline.operationsScore * 0.12 +
        input.resourceUtilization.overallUtilization * 0.08
    );
    const riskValue = clamp(avgRisk);

    return {
      healthScore: {
        key: "operations_health",
        label: "Operations Health Score",
        value: healthValue,
        status: statusFromScore(healthValue),
        band: priorityFromScore(healthValue),
        narrative: scoreNarrative(
          "Operations health",
          healthValue,
          statusFromScore(healthValue)
        ),
      },
      workflowScore: {
        key: "operations_workflow",
        label: "Workflow Score",
        value: workflowValue,
        status: statusFromScore(workflowValue),
        band: priorityFromScore(workflowValue),
        narrative: scoreNarrative(
          "Workflow health",
          workflowValue,
          statusFromScore(workflowValue)
        ),
      },
      staffingScore: {
        key: "operations_staffing",
        label: "Staffing Score",
        value: staffingValue,
        status: statusFromScore(staffingValue),
        band: priorityFromScore(staffingValue),
        narrative: scoreNarrative(
          "Staffing adequacy",
          staffingValue,
          statusFromScore(staffingValue)
        ),
      },
      capacityScore: {
        key: "operations_capacity",
        label: "Capacity Score",
        value: capacityValue,
        status: statusFromScore(capacityValue),
        band: priorityFromScore(capacityValue),
        narrative: scoreNarrative(
          "Capacity outlook",
          capacityValue,
          statusFromScore(capacityValue)
        ),
      },
      automationScore: {
        key: "operations_automation",
        label: "Automation Score",
        value: automationValue,
        status: statusFromScore(automationValue),
        band: priorityFromScore(automationValue),
        narrative: scoreNarrative(
          "Automation readiness",
          automationValue,
          statusFromScore(automationValue)
        ),
      },
      riskScore: {
        key: "operations_risk",
        label: "Operations Risk Score",
        value: riskValue,
        status: statusFromScore(100 - riskValue),
        band: priorityFromRisk(riskValue / 100),
        narrative: `Operations risk is ${priorityFromRisk(riskValue / 100)} at ${Math.round(riskValue)}.`,
      },
    };
  }
}

export class OperationsHealth implements OperationsHealthContract {
  assess(input: {
    baseline: OperationsBaseline;
    scores: {
      healthScore: OperationsScore;
      workflowScore: OperationsScore;
      staffingScore: OperationsScore;
      capacityScore: OperationsScore;
      automationScore: OperationsScore;
      riskScore: OperationsScore;
    };
    workflowHealth: WorkflowHealthResult;
    processMonitoring: ProcessMonitoringSuite;
  }): OperationsHealthResult {
    const dimensions = {
      workflow: input.scores.workflowScore.value,
      process: input.processMonitoring.overallScore,
      staffing: input.scores.staffingScore.value,
      capacity: input.scores.capacityScore.value,
      automation: input.scores.automationScore.value,
      utilization: input.baseline.resourceUtilization,
      operations: input.baseline.operationsScore,
    };
    const overallScore = clamp(
      dimensions.workflow * 0.2 +
        dimensions.process * 0.15 +
        dimensions.staffing * 0.18 +
        dimensions.capacity * 0.17 +
        dimensions.automation * 0.12 +
        dimensions.utilization * 0.1 +
        dimensions.operations * 0.08
    );
    const status = statusFromScore(overallScore);
    return {
      overallScore,
      status,
      dimensions,
      lenses: buildLenses({
        workflowHealth: `Workflow dimension ${Math.round(dimensions.workflow)}.`,
        processBottlenecks: `Hottest bottleneck ${input.processMonitoring.hottestBottleneck}.`,
        staffingAdequacy: `Staffing dimension ${Math.round(dimensions.staffing)}.`,
        automationPotential: `Automation dimension ${Math.round(dimensions.automation)}.`,
        capacityOutlook: `Capacity dimension ${Math.round(dimensions.capacity)}.`,
        resourceUtilization: `Utilization ${Math.round(dimensions.utilization)}.`,
      }),
      narrative: `Operations health ${status} (${Math.round(overallScore)}).`,
    };
  }
}

export class OperationsDashboard implements OperationsDashboardContract {
  compose(input: {
    scores: {
      healthScore: OperationsScore;
      workflowScore: OperationsScore;
      staffingScore: OperationsScore;
      capacityScore: OperationsScore;
      automationScore: OperationsScore;
    };
    baseline: OperationsBaseline;
    risks: OperationsRiskRecord[];
    opportunities: OperationsOpportunityRecord[];
    now: Date;
  }): OperationsDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Operations health ${Math.round(input.scores.healthScore.value)} — ${input.scores.healthScore.status}`,
      healthScore: input.scores.healthScore.value,
      workflowScore: input.scores.workflowScore.value,
      staffingScore: input.scores.staffingScore.value,
      capacityScore: input.scores.capacityScore.value,
      automationScore: input.scores.automationScore.value,
      topRisks: input.risks.slice(0, 5).map((r) => r.title),
      topOpportunities: input.opportunities.slice(0, 5).map((o) => o.title),
      narrative: `Dashboard: workflow ${Math.round(input.scores.workflowScore.value)}, staffing ${Math.round(input.scores.staffingScore.value)}, capacity ${Math.round(input.scores.capacityScore.value)}, automation ${Math.round(input.scores.automationScore.value)}.`,
    };
  }
}

export class OperationsRiskAnalyzer
  implements OperationsRiskAnalyzerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: {
    baseline: OperationsBaseline;
    workflowHealth: WorkflowHealthResult;
    processMonitoring: ProcessMonitoringSuite;
    staffing: StaffingAnalyticsResult;
    capacity: CapacityPlanResult;
    utilization: ResourceUtilizationResult;
    now: Date;
  }): OperationsRiskRecord[] {
    void input.now;
    const hottest = input.processMonitoring.areas.find(
      (a) => a.area === input.processMonitoring.hottestBottleneck
    );
    const risks: OperationsRiskRecord[] = [
      {
        id: this.createId("ops-risk"),
        title: "Workflow backlog pressure",
        severity: priorityFromRisk(input.baseline.backlogPressure),
        score: clamp(input.baseline.backlogPressure * 100),
        dimension: "backlog",
        mitigation: "Clear aged backlog and tighten WIP limits",
        lenses: buildLenses({
          workflowHealth: "Backlog directly depresses workflow health.",
          processBottlenecks: "Backlog amplifies process bottlenecks.",
          staffingAdequacy: "Staffing gaps worsen backlog aging.",
          automationPotential: "Task automation can shrink backlog.",
          capacityOutlook: "Capacity headroom erodes under backlog.",
          resourceUtilization: "Utilization skews toward firefighting.",
        }),
        narrative: "Backlog pressure elevates operational risk.",
      },
      {
        id: this.createId("ops-risk"),
        title: `Bottleneck: ${hottest?.label ?? input.processMonitoring.hottestBottleneck}`,
        severity: priorityFromScore(hottest?.healthScore ?? 55),
        score: clamp(hottest?.bottleneckScore ?? 55),
        dimension: input.processMonitoring.hottestBottleneck,
        mitigation: "Stabilize the hottest process area with owners and SLAs",
        lenses: buildLenses({
          workflowHealth: "Bottlenecks cascade into workflow delays.",
          processBottlenecks: `Primary bottleneck is ${input.processMonitoring.hottestBottleneck}.`,
          staffingAdequacy: "Coverage may be insufficient at the bottleneck.",
          automationPotential: "Orchestration can relieve handoff friction.",
          capacityOutlook: "Constrained process limits capacity release.",
          resourceUtilization: "Resources pile up upstream of the bottleneck.",
        }),
        narrative: `Process bottleneck risk concentrated in ${input.processMonitoring.hottestBottleneck}.`,
      },
      {
        id: this.createId("ops-risk"),
        title: "Staffing coverage risk",
        severity: priorityFromScore(input.staffing.adequacyScore),
        score: clamp(100 - input.staffing.adequacyScore),
        dimension: "staffing",
        mitigation: "Accelerate open-role fill and float coverage",
        lenses: buildLenses({
          workflowHealth: "Understaffing slows throughput.",
          processBottlenecks: "Staffing gaps create process bottlenecks.",
          staffingAdequacy: `Adequacy ${Math.round(input.staffing.adequacyScore)}.`,
          automationPotential: "Automation can offset temporary gaps.",
          capacityOutlook: "Capacity plan depends on coverage recovery.",
          resourceUtilization: "Remaining staff may be overloaded.",
        }),
        narrative: "Staffing coverage risk threatens operational stability.",
      },
      {
        id: this.createId("ops-risk"),
        title: "Capacity overload risk",
        severity: priorityFromRisk(input.utilization.overloadRisk / 100),
        score: clamp(input.utilization.overloadRisk),
        dimension: "capacity",
        mitigation: "Rebalance load across horizons and defer low-value work",
        lenses: buildLenses({
          workflowHealth: "Overload increases error and cycle time.",
          processBottlenecks: "Overloaded teams widen bottlenecks.",
          staffingAdequacy: "Burnout proxy rises under overload.",
          automationPotential: "Automation is a relief valve.",
          capacityOutlook: `Constrained horizon: ${input.capacity.constrainedHorizon}.`,
          resourceUtilization: `Overload risk ${Math.round(input.utilization.overloadRisk)}.`,
        }),
        narrative: "Capacity overload elevates execution risk.",
      },
    ];
    return risks.sort((a, c) => c.score - a.score);
  }
}

export class OperationsOpportunityAnalyzer
  implements OperationsOpportunityAnalyzerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: {
    baseline: OperationsBaseline;
    automation: AutomationOpportunitySuite;
    capacity: CapacityPlanResult;
    processMonitoring: ProcessMonitoringSuite;
    now: Date;
  }): OperationsOpportunityRecord[] {
    void input.now;
    const topAuto = input.automation.opportunities[0];
    const opportunities: OperationsOpportunityRecord[] = [
      {
        id: this.createId("ops-opp"),
        title: topAuto
          ? `Deploy ${topAuto.label}`
          : "Advance automation readiness",
        priority: topAuto?.priority ?? "medium",
        score: topAuto?.score ?? input.automation.readinessScore,
        expectedValue: topAuto?.expectedHoursSaved ?? 80,
        lenses:
          topAuto?.lenses ??
          buildLenses({
            workflowHealth: "Automation lifts workflow consistency.",
            processBottlenecks: "Reduces process friction.",
            staffingAdequacy: "Frees staffing capacity.",
            automationPotential: "Direct automation lift.",
            capacityOutlook: "Releases capacity hours.",
            resourceUtilization: "Improves utilization quality.",
          }),
        narrative: topAuto?.narrative ?? "Automation readiness opportunity.",
      },
      {
        id: this.createId("ops-opp"),
        title: `Relieve ${input.processMonitoring.hottestBottleneck} bottleneck`,
        priority: priorityFromScore(
          input.processMonitoring.areas.find(
            (a) => a.area === input.processMonitoring.hottestBottleneck
          )?.healthScore ?? 55
        ),
        score: clamp(
          60 +
            (input.processMonitoring.areas.find(
              (a) => a.area === input.processMonitoring.hottestBottleneck
            )?.bottleneckScore ?? 40) *
              0.35
        ),
        expectedValue: Math.round(input.baseline.staffCount * 2.5),
        lenses: buildLenses({
          workflowHealth: "Bottleneck relief restores throughput.",
          processBottlenecks: `Directly addresses ${input.processMonitoring.hottestBottleneck}.`,
          staffingAdequacy: "Allows staff to work at designed capacity.",
          automationPotential: "May pair with orchestration automation.",
          capacityOutlook: "Unlocks near-term headroom.",
          resourceUtilization: "Reduces queueing and idle upstream capacity.",
        }),
        narrative: `Bottleneck relief in ${input.processMonitoring.hottestBottleneck}.`,
      },
      {
        id: this.createId("ops-opp"),
        title: `Stabilize ${input.capacity.constrainedHorizon} capacity`,
        priority: priorityFromScore(input.capacity.overallHeadroom),
        score: clamp(100 - input.capacity.overallHeadroom + 45),
        expectedValue: Math.round(input.baseline.openRoles * 120 + 40),
        lenses: buildLenses({
          workflowHealth: "Stable capacity protects workflow SLAs.",
          processBottlenecks: "Prevents bottleneck recurrence.",
          staffingAdequacy: "Aligns staffing to demand horizons.",
          automationPotential: "Capacity plan can include automation offsets.",
          capacityOutlook: `Focus on ${input.capacity.constrainedHorizon}.`,
          resourceUtilization: "Balances utilization across horizons.",
        }),
        narrative: `Capacity stabilization on ${input.capacity.constrainedHorizon} horizon.`,
      },
      {
        id: this.createId("ops-opp"),
        title: "Improve staffing adequacy",
        priority: priorityFromScore(input.baseline.staffingAdequacy),
        score: clamp(100 - input.baseline.staffingAdequacy + 50),
        expectedValue: Math.round(input.baseline.openRoles * 160 + 20),
        lenses: buildLenses({
          workflowHealth: "Adequate staffing restores workflow pace.",
          processBottlenecks: "Reduces staffing-driven bottlenecks.",
          staffingAdequacy: `Current adequacy ${Math.round(input.baseline.staffingAdequacy)}.`,
          automationPotential: "Complements automation with human coverage.",
          capacityOutlook: "Raises supply index across horizons.",
          resourceUtilization: "Lowers overload and burnout proxy.",
        }),
        narrative: "Staffing adequacy improvement is a high-leverage ops lever.",
      },
    ];
    return opportunities.sort((a, c) => c.score - a.score);
  }
}

export class OperationsRecommendationComposer
  implements OperationsRecommendationComposerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  compose(input: {
    opportunities: OperationsOpportunityRecord[];
    risks: OperationsRiskRecord[];
    automation: AutomationOpportunitySuite;
    processMonitoring: ProcessMonitoringSuite;
    now: Date;
  }): OperationsRecommendationRecord[] {
    void input.now;
    const fromOpps = input.opportunities.slice(0, 3).map((o) => ({
      id: this.createId("ops-rec"),
      title: o.title,
      priority: o.priority,
      score: o.score,
      rationale: o.narrative,
      lenses: o.lenses,
      narrative: o.narrative,
      expectedLift: `Expected value ~${o.expectedValue}`,
      riskReduction: "Improves operational resilience and throughput",
    }));

    const autoRec = input.automation.opportunities[0]
      ? {
          id: this.createId("ops-rec"),
          title: `Prioritize ${input.automation.opportunities[0].label}`,
          priority: input.automation.opportunities[0].priority,
          score: input.automation.opportunities[0].score,
          rationale: input.automation.narrative,
          lenses: input.automation.opportunities[0].lenses,
          narrative: input.automation.opportunities[0].narrative,
          expectedLift: `~${input.automation.opportunities[0].expectedHoursSaved}h saved`,
          riskReduction: input.risks[0]
            ? `Helps mitigate ${input.risks[0].title}`
            : "Reduces manual process risk",
        }
      : null;

    const processRec: OperationsRecommendationRecord = {
      id: this.createId("ops-rec"),
      title: `Own the ${input.processMonitoring.hottestBottleneck} process`,
      priority: "high",
      score: clamp(
        input.processMonitoring.areas.find(
          (a) => a.area === input.processMonitoring.hottestBottleneck
        )?.bottleneckScore ?? 60
      ),
      rationale: input.processMonitoring.narrative,
      lenses: buildLenses({
        workflowHealth: "Process ownership restores workflow predictability.",
        processBottlenecks: `Assign owners for ${input.processMonitoring.hottestBottleneck}.`,
        staffingAdequacy: "Clarify who covers the constrained process.",
        automationPotential: "Identify automation candidates after ownership.",
        capacityOutlook: "Owned processes free capacity for planning.",
        resourceUtilization: "Stops ad-hoc resource thrash.",
      }),
      narrative: `Establish clear ownership for ${input.processMonitoring.hottestBottleneck}.`,
      expectedLift: "Faster cycle time and clearer escalation paths",
      riskReduction: "Reduces unmanaged bottleneck risk",
    };

    return [...fromOpps, ...(autoRec ? [autoRec] : []), processRec]
      .sort((a, c) => c.score - a.score)
      .slice(0, 8);
  }
}

export class ExecutiveOperationsBriefGenerator
  implements ExecutiveOperationsBriefGeneratorContract
{
  generate(input: {
    request: OperationsRequest;
    baseline: OperationsBaseline;
    scores: {
      healthScore: OperationsScore;
      workflowScore: OperationsScore;
      staffingScore: OperationsScore;
      capacityScore: OperationsScore;
      automationScore: OperationsScore;
    };
    risks: OperationsRiskRecord[];
    opportunities: OperationsOpportunityRecord[];
    processMonitoring: ProcessMonitoringSuite;
    recommendations: OperationsRecommendationRecord[];
    confidence: OperationsConfidenceScore;
    now: Date;
  }): ExecutiveOperationsBrief {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Operations health ${Math.round(input.scores.healthScore.value)} — bottleneck ${input.processMonitoring.hottestBottleneck}`,
      summary:
        input.request.question ??
        "How should the organization monitor and optimize day-to-day operations?",
      healthScore: input.scores.healthScore.value,
      workflowScore: input.scores.workflowScore.value,
      staffingScore: input.scores.staffingScore.value,
      capacityScore: input.scores.capacityScore.value,
      automationScore: input.scores.automationScore.value,
      topRecommendations: input.recommendations.slice(0, 5).map((r) => r.title),
      topRisks: input.risks.slice(0, 5).map((r) => r.title),
      topOpportunities: input.opportunities.slice(0, 5).map((o) => o.title),
      hottestBottleneck: input.processMonitoring.hottestBottleneck,
      lenses: buildLenses({
        workflowHealth: `Workflow score ${Math.round(input.scores.workflowScore.value)}.`,
        processBottlenecks: `Hottest bottleneck ${input.processMonitoring.hottestBottleneck}.`,
        staffingAdequacy: `Staffing score ${Math.round(input.scores.staffingScore.value)}.`,
        automationPotential: `Automation score ${Math.round(input.scores.automationScore.value)}.`,
        capacityOutlook: `Capacity score ${Math.round(input.scores.capacityScore.value)}.`,
        resourceUtilization: `Utilization ${Math.round(input.baseline.resourceUtilization)} (confidence ${input.confidence.level}).`,
      }),
      narrative: `Executive ops brief: operations pillar ${Math.round(input.baseline.operationsScore)}; bottleneck ${input.processMonitoring.hottestBottleneck}.`,
    };
  }
}
