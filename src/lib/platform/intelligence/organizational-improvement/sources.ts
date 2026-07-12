/** Improvement source discovery suite (Sprint 036). */
import type * as C from "@/lib/platform/intelligence/organizational-improvement/contracts";
import {
  clamp,
  defaultImprovementLenses,
  deriveDnaAlignment,
  priorityFromScore,
} from "@/lib/platform/intelligence/organizational-improvement/models";
import type {
  ImprovementBaseline,
  ImprovementDependency,
  ImprovementDnaAlignment,
  ImprovementRecord,
  ImprovementResourceRequirement,
  ImprovementRiskFactor,
  ImprovementSourceDomain,
  ImprovementTheme,
  OpportunityResultLight,
} from "@/lib/platform/intelligence/organizational-improvement/types";
import type { OpportunityExchangeRecord } from "@/lib/platform/intelligence/opportunity/types";

type SourceInput = Parameters<C.SourceAnalyzer["analyze"]>[0];

export interface CreateImprovementRecordInput {
  id: string;
  title: string;
  description: string;
  sourceDomain: ImprovementSourceDomain;
  theme: ImprovementTheme;
  baseline: ImprovementBaseline;
  dnaAlignment?: ImprovementDnaAlignment;
  whyNow?: string;
  expectedRoi?: number;
  estimatedFinancialImpact?: number;
  estimatedMissionImpact?: number;
  estimatedPeopleImpact?: number;
  estimatedRevenueImpact?: number;
  estimatedFundingImpact?: number;
  estimatedOperationalImpact?: number;
  riskReduction?: number;
  implementationCost?: number;
  implementationEffort?: number;
  requiredResources?: ImprovementResourceRequirement[];
  expectedTimelineDays?: number;
  confidence?: number;
  dependencies?: ImprovementDependency[];
  risks?: ImprovementRiskFactor[];
  score?: number;
  narrative?: string;
  publishedAt?: string;
  sourceOpportunityId?: string;
  opportunityLenses?: ImprovementRecord["opportunityLenses"];
  metadata?: ImprovementRecord["metadata"];
}

export function createImprovementRecord(input: CreateImprovementRecordInput): ImprovementRecord {
  const dnaAlignment =
    input.dnaAlignment ??
    deriveDnaAlignment(null, input.baseline);
  const estimatedFinancialImpact =
    input.estimatedFinancialImpact ?? Math.round(input.baseline.annualRevenue * 0.04);
  const implementationCost =
    input.implementationCost ?? Math.round(estimatedFinancialImpact * 0.22);
  const expectedRoi =
    input.expectedRoi ??
    (implementationCost > 0
      ? (estimatedFinancialImpact - implementationCost) / implementationCost
      : estimatedFinancialImpact / 10_000);
  const score =
    input.score ??
    clamp(
      input.baseline.organizationHealthScore * 0.25 +
        input.baseline.executionReadiness * 0.25 +
        input.baseline.missionAlignment * 0.2 +
        input.baseline.organizationalCapacity * 0.15 +
        Math.min(20, expectedRoi * 8)
    );
  const estimatedMissionImpact = input.estimatedMissionImpact ?? clamp(65 + score * 0.15);
  const estimatedPeopleImpact = input.estimatedPeopleImpact ?? clamp(input.baseline.workforceCapacity * 0.85);
  const estimatedRevenueImpact =
    input.estimatedRevenueImpact ?? Math.round(estimatedFinancialImpact * 0.45);
  const estimatedFundingImpact =
    input.estimatedFundingImpact ?? Math.round(estimatedFinancialImpact * 0.25);
  const estimatedOperationalImpact =
    input.estimatedOperationalImpact ?? clamp(input.baseline.executionReadiness * 0.8);
  const riskReduction = input.riskReduction ?? clamp(40 + score * 0.25);
  const implementationEffort = input.implementationEffort ?? clamp(35 + (input.expectedTimelineDays ?? 90) / 8);
  const expectedTimelineDays = input.expectedTimelineDays ?? 90;
  const confidence = input.confidence ?? clamp(0.55 + score / 250, 0, 1);
  const title = input.title;
  const requiredResources =
    input.requiredResources ??
    [
      {
        role: "Improvement owner",
        effortHours: Math.round(expectedTimelineDays * 2.2),
        skills: ["execution", "change management"],
        budget: Math.round(implementationCost * 0.35),
      },
      {
        role: "Domain specialist",
        effortHours: Math.round(expectedTimelineDays * 1.1),
        skills: [input.theme.replace(/_/g, " ")],
        budget: Math.round(implementationCost * 0.2),
      },
    ];
  const dependencies =
    input.dependencies ??
    [
      {
        key: "capacity",
        label: "Organizational delivery capacity",
        blocking: expectedTimelineDays > 180,
        domain: input.sourceDomain,
      },
    ];
  const risks =
    input.risks ??
    [
      {
        key: "execution",
        label: "Execution capacity",
        score: clamp(100 - input.baseline.executionReadiness),
        mitigation: "Stage delivery and assign accountable owners.",
      },
      {
        key: "adoption",
        label: "Change adoption",
        score: clamp(45 + implementationEffort * 0.3),
        mitigation: "Pair delivery with communication and coaching.",
      },
    ];

  return {
    id: input.id,
    title,
    description: input.description,
    sourceDomain: input.sourceDomain,
    theme: input.theme,
    whyNow: input.whyNow ?? `${title} closes a current organizational gap that compounds if deferred.`,
    expectedRoi,
    estimatedFinancialImpact,
    estimatedMissionImpact,
    estimatedPeopleImpact,
    estimatedRevenueImpact,
    estimatedFundingImpact,
    estimatedOperationalImpact,
    riskReduction,
    implementationCost,
    implementationEffort,
    requiredResources,
    expectedTimelineDays,
    confidence,
    priority: priorityFromScore(score),
    dependencies,
    risks,
    organizationalDnaAlignment: dnaAlignment,
    score,
    lenses: defaultImprovementLenses(title),
    opportunityLenses: input.opportunityLenses,
    sourceOpportunityId: input.sourceOpportunityId,
    narrative:
      input.narrative ??
      `${title} scores ${Math.round(score)} with ~$${estimatedFinancialImpact.toLocaleString()} financial impact and ${Math.round(estimatedMissionImpact)} mission impact.`,
    publishedAt: input.publishedAt ?? new Date().toISOString(),
    metadata: input.metadata,
  };
}

function opportunityToImprovement(
  opportunity: OpportunityExchangeRecord,
  baseline: ImprovementBaseline,
  createId: (prefix: string) => string,
  dnaAlignment?: ImprovementDnaAlignment
): ImprovementRecord {
  const theme: ImprovementTheme =
    opportunity.category === "funding"
      ? "funding"
      : opportunity.category === "revenue" || opportunity.category === "pricing"
        ? "revenue"
        : opportunity.category === "mission_impact"
          ? "mission"
          : opportunity.expectedTimelineDays <= 90
            ? "quick_win"
            : "strategic";
  return createImprovementRecord({
    id: createId("opp-imp"),
    title: opportunity.title,
    description: opportunity.description,
    sourceDomain: "opportunity",
    theme,
    baseline,
    dnaAlignment: opportunity.organizationalDnaAlignment ?? dnaAlignment,
    expectedRoi: opportunity.roi,
    estimatedFinancialImpact: opportunity.estimatedFinancialImpact,
    estimatedMissionImpact: opportunity.estimatedMissionImpact,
    implementationCost: opportunity.implementationCost,
    requiredResources: opportunity.requiredResources.map((r) => ({
      role: r.role,
      effortHours: r.effortHours,
      skills: r.skills,
      budget: r.budget,
    })),
    expectedTimelineDays: opportunity.expectedTimelineDays,
    confidence: opportunity.confidence,
    dependencies: opportunity.dependencies.map((d) => ({
      key: d.key,
      label: d.label,
      blocking: d.blocking,
      domain: d.domain,
    })),
    risks: opportunity.risks.map((r) => ({
      key: r.key,
      label: r.label,
      score: r.score,
      mitigation: r.mitigation,
    })),
    score: opportunity.score,
    narrative: opportunity.narrative,
    publishedAt: opportunity.publishedAt,
    sourceOpportunityId: opportunity.id,
    opportunityLenses: opportunity.lenses,
    metadata: { ...(opportunity.metadata ?? {}), originatingDomain: opportunity.originatingDomain, category: opportunity.category },
  });
}

function mergePublished(
  records: ImprovementRecord[],
  published: ImprovementRecord[] | undefined,
  domain: ImprovementSourceDomain
): ImprovementRecord[] {
  if (!published?.length) return records;
  const matching = published.filter((p) => p.sourceDomain === domain);
  if (!matching.length) return records;
  const seen = new Set(records.map((r) => r.id));
  return [...records, ...matching.filter((p) => !seen.has(p.id))];
}

class OrganizationHealthSource implements C.OrganizationHealthSource {
  analyze({ baseline, request, createId }: SourceInput): ImprovementRecord[] {
    const dnaAlignment = deriveDnaAlignment(request.dnaResult?.dna ?? request.dna, baseline);
    const gap = clamp(100 - baseline.organizationHealthScore);
    return [
      createImprovementRecord({
        id: createId("health"),
        title: "Close organization-health score gaps",
        description: "Address the lowest health dimensions with sequenced operating improvements.",
        sourceDomain: "organization-health",
        theme: "operational",
        baseline,
        dnaAlignment,
        estimatedFinancialImpact: Math.round(baseline.annualRevenue * 0.03 * (1 + gap / 200)),
        estimatedOperationalImpact: clamp(baseline.organizationHealthScore + 12),
        expectedTimelineDays: 75,
        score: clamp(baseline.organizationHealthScore * 0.6 + baseline.executionReadiness * 0.4 + gap * 0.15),
      }),
      createImprovementRecord({
        id: createId("health-ops"),
        title: "Stabilize recurring operating rhythms",
        description: "Institutionalize weekly operating reviews that convert health signals into action.",
        sourceDomain: "organization-health",
        theme: "quick_win",
        baseline,
        dnaAlignment,
        estimatedFinancialImpact: Math.round(baseline.annualRevenue * 0.015),
        expectedTimelineDays: 45,
        score: clamp(baseline.executionReadiness * 0.7 + 20),
      }),
    ];
  }
}

class ExecutiveGraphSource implements C.ExecutiveGraphSource {
  analyze({ baseline, request, createId }: SourceInput): ImprovementRecord[] {
    const dnaAlignment = deriveDnaAlignment(request.dnaResult?.dna ?? request.dna, baseline);
    const risk = request.analysis?.dashboard
      ? clamp((request.analysis.dashboard.overallRisk ?? 0.35) * 100)
      : 35;
    return [
      createImprovementRecord({
        id: createId("graph"),
        title: "Resolve high-risk graph paths",
        description: "Prioritize interventions on the highest-risk causal paths in the executive graph.",
        sourceDomain: "executive-graph",
        theme: "risk",
        baseline,
        dnaAlignment,
        riskReduction: clamp(50 + risk * 0.4),
        estimatedOperationalImpact: clamp(60 + risk * 0.2),
        expectedTimelineDays: 60,
        score: clamp(55 + risk * 0.35 + baseline.executionReadiness * 0.15),
      }),
      createImprovementRecord({
        id: createId("graph-leverage"),
        title: "Amplify high-leverage graph interventions",
        description: "Focus capacity on graph nodes that unlock multiple downstream outcomes.",
        sourceDomain: "executive-graph",
        theme: "strategic",
        baseline,
        dnaAlignment,
        expectedTimelineDays: 120,
        score: clamp(baseline.organizationHealthScore * 0.45 + (100 - risk) * 0.25 + 20),
      }),
    ];
  }
}

class ExecutiveDecisionSource implements C.ExecutiveDecisionSource {
  analyze({ baseline, request, createId }: SourceInput): ImprovementRecord[] {
    const dnaAlignment = deriveDnaAlignment(request.dnaResult?.dna ?? request.dna, baseline);
    const decisionCount = request.decisionResult?.recommendations?.length ?? 0;
    return [
      createImprovementRecord({
        id: createId("decision"),
        title: "Convert pending executive decisions into owned actions",
        description: "Close decision backlog by assigning owners, deadlines, and success measures.",
        sourceDomain: "executive-decision",
        theme: "strategic",
        baseline,
        dnaAlignment,
        estimatedOperationalImpact: clamp(55 + decisionCount * 4),
        expectedTimelineDays: 30,
        score: clamp(60 + Math.min(20, decisionCount * 3) + baseline.executionReadiness * 0.2),
      }),
      createImprovementRecord({
        id: createId("decision-quality"),
        title: "Improve decision quality gates",
        description: "Strengthen pre-decision evidence packs and post-decision learning loops.",
        sourceDomain: "executive-decision",
        theme: "governance",
        baseline,
        dnaAlignment,
        expectedTimelineDays: 90,
        score: clamp(baseline.governanceMaturity * 0.5 + baseline.executionReadiness * 0.35 + 10),
      }),
    ];
  }
}

class PredictiveSource implements C.PredictiveSource {
  analyze({ baseline, request, createId }: SourceInput): ImprovementRecord[] {
    const dnaAlignment = deriveDnaAlignment(request.dnaResult?.dna ?? request.dna, baseline);
    const emerging = request.predictionResult?.projection?.emergingRisks?.length ?? 0;
    return [
      createImprovementRecord({
        id: createId("predict"),
        title: "Preempt emerging predictive risks",
        description: "Act on predictive signals before risks materialize into operating damage.",
        sourceDomain: "predictive",
        theme: "risk",
        baseline,
        dnaAlignment,
        riskReduction: clamp(45 + emerging * 6 + baseline.predictiveSignalStrength * 0.2),
        expectedTimelineDays: 60,
        score: clamp(baseline.predictiveSignalStrength * 0.55 + emerging * 5 + 15),
      }),
      createImprovementRecord({
        id: createId("predict-capacity"),
        title: "Build predictive monitoring capacity",
        description: "Institutionalize weekly review of predictive signals with clear escalation paths.",
        sourceDomain: "predictive",
        theme: "operational",
        baseline,
        dnaAlignment,
        expectedTimelineDays: 90,
        score: clamp(50 + baseline.predictiveSignalStrength * 0.35),
      }),
    ];
  }
}

class HumanCapitalSource implements C.HumanCapitalSource {
  analyze({ baseline, request, createId }: SourceInput): ImprovementRecord[] {
    const dnaAlignment = deriveDnaAlignment(request.dnaResult?.dna ?? request.dna, baseline);
    const workforce = request.humanCapitalResult?.workforceHealthScore?.value ?? baseline.workforceCapacity;
    return [
      createImprovementRecord({
        id: createId("hc"),
        title: "Strengthen workforce capacity bottlenecks",
        description: "Close critical role and capability gaps that constrain improvement execution.",
        sourceDomain: "human-capital",
        theme: "people",
        baseline,
        dnaAlignment,
        estimatedPeopleImpact: clamp(workforce + 12),
        expectedTimelineDays: 100,
        score: clamp(workforce * 0.55 + baseline.organizationalCapacity * 0.3 + 10),
      }),
      createImprovementRecord({
        id: createId("hc-leadership"),
        title: "Expand leadership bandwidth for change",
        description: "Free leadership capacity for priority improvements through role redesign and delegation.",
        sourceDomain: "human-capital",
        theme: "people",
        baseline,
        dnaAlignment,
        estimatedPeopleImpact: clamp(workforce * 0.9 + 8),
        expectedTimelineDays: 75,
        score: clamp(baseline.executionReadiness * 0.5 + workforce * 0.35),
      }),
    ];
  }
}

class RevenueSource implements C.RevenueSource {
  analyze({ baseline, request, createId }: SourceInput): ImprovementRecord[] {
    const dnaAlignment = deriveDnaAlignment(request.dnaResult?.dna ?? request.dna, baseline);
    const revenueHealth = request.revenueResult?.healthScore?.value ?? baseline.revenueHealthProxy;
    return [
      createImprovementRecord({
        id: createId("rev"),
        title: "Accelerate high-margin revenue pathways",
        description: "Concentrate growth effort on the most durable, highest-margin revenue motions.",
        sourceDomain: "revenue",
        theme: "revenue",
        baseline,
        dnaAlignment,
        estimatedRevenueImpact: Math.round(baseline.annualRevenue * 0.06),
        estimatedFinancialImpact: Math.round(baseline.annualRevenue * 0.055),
        expectedTimelineDays: 120,
        score: clamp(revenueHealth * 0.5 + baseline.financialScore * 0.35 + 10),
      }),
      createImprovementRecord({
        id: createId("rev-retention"),
        title: "Improve revenue retention economics",
        description: "Reduce churn and leakage that erode recurring revenue quality.",
        sourceDomain: "revenue",
        theme: "revenue",
        baseline,
        dnaAlignment,
        estimatedRevenueImpact: Math.round(baseline.annualRevenue * 0.035),
        expectedTimelineDays: 80,
        score: clamp(revenueHealth * 0.55 + 25),
      }),
    ];
  }
}

class FundingSource implements C.FundingSource {
  analyze({ baseline, request, createId }: SourceInput): ImprovementRecord[] {
    const dnaAlignment = deriveDnaAlignment(request.dnaResult?.dna ?? request.dna, baseline);
    const fundingHealth = request.fundingResult?.healthScore?.value ?? baseline.fundingHealthProxy;
    const pipeline = request.fundingResult?.baseline?.pipelineFunding ?? baseline.plannedImprovementValue;
    return [
      createImprovementRecord({
        id: createId("fund"),
        title: "Convert funding pipeline into secured awards",
        description: "Prioritize the highest-probability funding opportunities already in pipeline.",
        sourceDomain: "funding",
        theme: "funding",
        baseline,
        dnaAlignment,
        estimatedFundingImpact: Math.round(pipeline * 0.35 || baseline.annualRevenue * 0.04),
        estimatedFinancialImpact: Math.round(pipeline * 0.3 || baseline.annualRevenue * 0.035),
        expectedTimelineDays: 140,
        score: clamp(fundingHealth * 0.55 + baseline.financialScore * 0.25 + 12),
      }),
      createImprovementRecord({
        id: createId("fund-diversify"),
        title: "Diversify funding concentration risk",
        description: "Reduce single-source funding dependence while protecting mission continuity.",
        sourceDomain: "funding",
        theme: "funding",
        baseline,
        dnaAlignment,
        riskReduction: clamp(50 + (100 - fundingHealth) * 0.3),
        expectedTimelineDays: 180,
        score: clamp(fundingHealth * 0.4 + baseline.cashRunwayMonths * 1.5 + 15),
      }),
    ];
  }
}

class OpportunitySource implements C.OpportunitySource {
  analyze({ baseline, request, createId, now }: SourceInput): ImprovementRecord[] {
    const dnaAlignment = deriveDnaAlignment(request.dnaResult?.dna ?? request.dna, baseline);
    const fromPublished = (request.publishedOpportunities ?? []).map((o) =>
      opportunityToImprovement(o, baseline, createId, dnaAlignment)
    );
    const exchange =
      (request.opportunityResult as OpportunityResultLight | undefined)?.exchange ??
      (request.opportunityResult as { exchange?: OpportunityExchangeRecord[] } | undefined)?.exchange ??
      [];
    const fromExchange = exchange
      .filter((o) => !fromPublished.some((p) => p.sourceOpportunityId === o.id))
      .map((o) => opportunityToImprovement(o, baseline, createId, dnaAlignment));

    const synthesized =
      fromPublished.length || fromExchange.length
        ? []
        : [
            createImprovementRecord({
              id: createId("opp"),
              title: "Pursue top scored opportunities",
              description: "Convert the highest-scoring opportunity exchange items into owned improvements.",
              sourceDomain: "opportunity",
              theme: "strategic",
              baseline,
              dnaAlignment,
              estimatedFinancialImpact: Math.round(baseline.opportunityPipelineScore * 12_000),
              expectedTimelineDays: 100,
              score: clamp(baseline.opportunityPipelineScore * 0.7 + 15),
              publishedAt: now.toISOString(),
            }),
            createImprovementRecord({
              id: createId("opp-qw"),
              title: "Capture opportunity quick wins",
              description: "Sequence near-term opportunity wins that fund larger strategic bets.",
              sourceDomain: "opportunity",
              theme: "quick_win",
              baseline,
              dnaAlignment,
              expectedTimelineDays: 60,
              score: clamp(baseline.opportunityPipelineScore * 0.55 + baseline.executionReadiness * 0.25),
              publishedAt: now.toISOString(),
            }),
          ];

    let records = [...fromPublished, ...fromExchange, ...synthesized];
    records = mergePublished(records, request.publishedImprovements, "opportunity");
    // Also absorb published improvements with unknown/matching domains into opportunity bucket when domain is opportunity or unset in merge path handled by engine
    if (request.publishedImprovements?.length) {
      const orphans = request.publishedImprovements.filter(
        (p) =>
          !records.some((r) => r.id === p.id) &&
          (p.sourceDomain === "opportunity" ||
            !(
              [
                "organization-health",
                "executive-graph",
                "executive-decision",
                "predictive",
                "human-capital",
                "revenue",
                "funding",
                "board-governance",
                "future-domains",
              ] as ImprovementSourceDomain[]
            ).includes(p.sourceDomain))
      );
      records = [...records, ...orphans];
    }
    return records;
  }
}

class BoardGovernanceSource implements C.BoardGovernanceSource {
  analyze({ baseline, request, createId }: SourceInput): ImprovementRecord[] {
    const dnaAlignment = deriveDnaAlignment(request.dnaResult?.dna ?? request.dna, baseline);
    const governance = request.governanceResult as
      | { healthScore?: { value?: number }; governanceHealth?: { overallScore?: number } }
      | null
      | undefined;
    const governanceScore =
      governance?.healthScore?.value ??
      governance?.governanceHealth?.overallScore ??
      baseline.governanceMaturity;
    return [
      createImprovementRecord({
        id: createId("gov"),
        title: "Strengthen board oversight of improvement priorities",
        description: "Align board dashboards and decision cadence to the continuous improvement loop.",
        sourceDomain: "board-governance",
        theme: "governance",
        baseline,
        dnaAlignment,
        estimatedOperationalImpact: clamp(governanceScore + 8),
        expectedTimelineDays: 90,
        score: clamp(governanceScore * 0.6 + baseline.missionAlignment * 0.25 + 8),
      }),
      createImprovementRecord({
        id: createId("gov-risk"),
        title: "Tighten governance risk reporting",
        description: "Improve board visibility into risk reduction and execution readiness.",
        sourceDomain: "board-governance",
        theme: "risk",
        baseline,
        dnaAlignment,
        riskReduction: clamp(40 + governanceScore * 0.35),
        expectedTimelineDays: 60,
        score: clamp(governanceScore * 0.5 + 25),
      }),
    ];
  }
}

class FutureDomainsSource implements C.FutureDomainsSource {
  analyze({ baseline, request, createId }: SourceInput): ImprovementRecord[] {
    const dnaAlignment = deriveDnaAlignment(request.dnaResult?.dna ?? request.dna, baseline);
    return [
      createImprovementRecord({
        id: createId("future"),
        title: "Prepare future-domain improvement adapters",
        description: "Reserve extensibility for upcoming OIOS domains to publish improvements.",
        sourceDomain: "future-domains",
        theme: "strategic",
        baseline,
        dnaAlignment,
        expectedTimelineDays: 180,
        score: clamp(baseline.organizationalCapacity * 0.45 + 30),
      }),
      createImprovementRecord({
        id: createId("future-learn"),
        title: "Capture cross-domain learning loops",
        description: "Codify learnings so future domains inherit proven improvement patterns.",
        sourceDomain: "future-domains",
        theme: "operational",
        baseline,
        dnaAlignment,
        expectedTimelineDays: 120,
        score: clamp(baseline.executionReadiness * 0.4 + baseline.missionAlignment * 0.3 + 20),
      }),
    ];
  }
}

export class ImprovementSourceEngine implements C.ImprovementSourceEngine {
  private readonly organizationHealth: C.OrganizationHealthSource;
  private readonly executiveGraph: C.ExecutiveGraphSource;
  private readonly executiveDecision: C.ExecutiveDecisionSource;
  private readonly predictive: C.PredictiveSource;
  private readonly humanCapital: C.HumanCapitalSource;
  private readonly revenue: C.RevenueSource;
  private readonly funding: C.FundingSource;
  private readonly opportunity: C.OpportunitySource;
  private readonly boardGovernance: C.BoardGovernanceSource;
  private readonly futureDomains: C.FutureDomainsSource;

  constructor(d: C.ImprovementDependencies = {}) {
    this.organizationHealth = d.organizationHealthSource ?? new OrganizationHealthSource();
    this.executiveGraph = d.executiveGraphSource ?? new ExecutiveGraphSource();
    this.executiveDecision = d.executiveDecisionSource ?? new ExecutiveDecisionSource();
    this.predictive = d.predictiveSource ?? new PredictiveSource();
    this.humanCapital = d.humanCapitalSource ?? new HumanCapitalSource();
    this.revenue = d.revenueSource ?? new RevenueSource();
    this.funding = d.fundingSource ?? new FundingSource();
    this.opportunity = d.opportunitySource ?? new OpportunitySource();
    this.boardGovernance = d.boardGovernanceSource ?? new BoardGovernanceSource();
    this.futureDomains = d.futureDomainsSource ?? new FutureDomainsSource();
  }

  discover(input: SourceInput): Record<ImprovementSourceDomain, ImprovementRecord[]> {
    const published = input.request.publishedImprovements;
    return {
      "organization-health": mergePublished(this.organizationHealth.analyze(input), published, "organization-health"),
      "executive-graph": mergePublished(this.executiveGraph.analyze(input), published, "executive-graph"),
      "executive-decision": mergePublished(this.executiveDecision.analyze(input), published, "executive-decision"),
      predictive: mergePublished(this.predictive.analyze(input), published, "predictive"),
      "human-capital": mergePublished(this.humanCapital.analyze(input), published, "human-capital"),
      revenue: mergePublished(this.revenue.analyze(input), published, "revenue"),
      funding: mergePublished(this.funding.analyze(input), published, "funding"),
      opportunity: this.opportunity.analyze(input),
      "board-governance": mergePublished(this.boardGovernance.analyze(input), published, "board-governance"),
      "future-domains": mergePublished(this.futureDomains.analyze(input), published, "future-domains"),
    };
  }
}

export {
  OrganizationHealthSource,
  ExecutiveGraphSource,
  ExecutiveDecisionSource,
  PredictiveSource,
  HumanCapitalSource,
  RevenueSource,
  FundingSource,
  OpportunitySource,
  BoardGovernanceSource,
  FutureDomainsSource,
};
