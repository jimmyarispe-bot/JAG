/**
 * Business Model Intelligence — scores, health, dashboards, briefs, analyzers (Sprint 037).
 */

import type {
  BusinessModelDashboard as BusinessModelDashboardContract,
  BusinessModelEvolutionPlanner as BusinessModelEvolutionPlannerContract,
  BusinessModelHealth as BusinessModelHealthContract,
  BusinessModelIntelligence as BusinessModelIntelligenceContract,
  BusinessModelOpportunityAnalyzer as BusinessModelOpportunityAnalyzerContract,
  BusinessModelRecommendationComposer as BusinessModelRecommendationComposerContract,
  BusinessModelRiskAnalyzer as BusinessModelRiskAnalyzerContract,
  CompetitivePositionAnalyzer as CompetitivePositionAnalyzerContract,
  ExecutiveBusinessBriefGenerator as ExecutiveBusinessBriefGeneratorContract,
} from "@/lib/platform/intelligence/business-model/contracts";
import {
  buildConfidence,
  buildLenses,
  clamp,
  defaultCreateId,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/business-model/models";
import type {
  BusinessModelBaseline,
  BusinessModelCanvasResult,
  BusinessModelConfidenceScore,
  BusinessModelDashboardResult,
  BusinessModelEvolutionRoadmap,
  BusinessModelHealthResult,
  BusinessModelOpportunityRecord,
  BusinessModelRecommendationRecord,
  BusinessModelRequest,
  BusinessModelRiskRecord,
  BusinessModelScenarioSuite,
  BusinessModelScore,
  CompetitivePositionResult,
  LeanCanvasResult,
  OrganizationDesignSuite,
} from "@/lib/platform/intelligence/business-model/types";

export function defaultBusinessModelConfidence(
  baseline: BusinessModelBaseline,
  canvas: BusinessModelCanvasResult,
  lean: LeanCanvasResult
): BusinessModelConfidenceScore {
  return buildConfidence([
    {
      key: "clarity",
      label: "Model clarity",
      contribution: clamp(baseline.clarityScore / 100),
    },
    {
      key: "canvas",
      label: "Canvas completeness",
      contribution: clamp(canvas.completeness / 100),
    },
    {
      key: "lean",
      label: "Lean completeness",
      contribution: clamp(lean.completeness / 100),
    },
    {
      key: "unit_economics",
      label: "Unit economics",
      contribution: clamp(baseline.unitEconomicsScore / 100),
    },
  ]);
}

export class BusinessModelIntelligence
  implements BusinessModelIntelligenceContract
{
  composeScores(input: {
    baseline: BusinessModelBaseline;
    canvas: BusinessModelCanvasResult;
    leanCanvas: LeanCanvasResult;
    risks: BusinessModelRiskRecord[];
    opportunities: BusinessModelOpportunityRecord[];
    competitive: CompetitivePositionResult;
  }): {
    healthScore: BusinessModelScore;
    clarityScore: BusinessModelScore;
    scalabilityScore: BusinessModelScore;
    sustainabilityScore: BusinessModelScore;
    riskScore: BusinessModelScore;
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

    const clarityValue = clamp(
      input.baseline.clarityScore * 0.55 +
        input.canvas.completeness * 0.25 +
        input.leanCanvas.completeness * 0.2
    );
    const scalabilityValue = clamp(
      input.baseline.scalabilityScore * 0.7 +
        input.competitive.score * 0.15 +
        oppLift * 0.15
    );
    const sustainabilityValue = clamp(
      input.baseline.sustainabilityScore * 0.65 +
        input.baseline.missionAlignment * 0.2 +
        (100 - avgRisk) * 0.15
    );
    const healthValue = clamp(
      clarityValue * 0.25 +
        input.baseline.valueCreationScore * 0.15 +
        input.baseline.valueDeliveryScore * 0.15 +
        input.baseline.valueCaptureScore * 0.2 +
        scalabilityValue * 0.15 +
        sustainabilityValue * 0.1
    );
    const riskValue = clamp(avgRisk);

    return {
      healthScore: {
        key: "business_model_health",
        label: "Business Model Health Score",
        value: healthValue,
        status: statusFromScore(healthValue),
        band: priorityFromScore(healthValue),
        narrative: scoreNarrative(
          "Business model health",
          healthValue,
          statusFromScore(healthValue)
        ),
      },
      clarityScore: {
        key: "business_model_clarity",
        label: "Business Model Clarity Score",
        value: clarityValue,
        status: statusFromScore(clarityValue),
        band: priorityFromScore(clarityValue),
        narrative: scoreNarrative(
          "Business model clarity",
          clarityValue,
          statusFromScore(clarityValue)
        ),
      },
      scalabilityScore: {
        key: "business_model_scalability",
        label: "Business Model Scalability Score",
        value: scalabilityValue,
        status: statusFromScore(scalabilityValue),
        band: priorityFromScore(scalabilityValue),
        narrative: scoreNarrative(
          "Business model scalability",
          scalabilityValue,
          statusFromScore(scalabilityValue)
        ),
      },
      sustainabilityScore: {
        key: "business_model_sustainability",
        label: "Business Model Sustainability Score",
        value: sustainabilityValue,
        status: statusFromScore(sustainabilityValue),
        band: priorityFromScore(sustainabilityValue),
        narrative: scoreNarrative(
          "Business model sustainability",
          sustainabilityValue,
          statusFromScore(sustainabilityValue)
        ),
      },
      riskScore: {
        key: "business_model_risk",
        label: "Business Model Risk Score",
        value: riskValue,
        status: statusFromScore(100 - riskValue),
        band: priorityFromRisk(riskValue / 100),
        narrative: `Business model risk is ${priorityFromRisk(riskValue / 100)} at ${Math.round(riskValue)}.`,
      },
    };
  }
}

export class BusinessModelHealth implements BusinessModelHealthContract {
  assess(input: {
    baseline: BusinessModelBaseline;
    scores: {
      healthScore: BusinessModelScore;
      clarityScore: BusinessModelScore;
      scalabilityScore: BusinessModelScore;
      sustainabilityScore: BusinessModelScore;
      riskScore: BusinessModelScore;
    };
    canvas: BusinessModelCanvasResult;
    competitive: CompetitivePositionResult;
  }): BusinessModelHealthResult {
    const dimensions = {
      clarity: input.scores.clarityScore.value,
      valueCreation: input.baseline.valueCreationScore,
      valueDelivery: input.baseline.valueDeliveryScore,
      valueCapture: input.baseline.valueCaptureScore,
      scalability: input.scores.scalabilityScore.value,
      sustainability: input.scores.sustainabilityScore.value,
      competitive: input.competitive.score,
      canvas: input.canvas.completeness,
    };
    const overallScore = clamp(
      dimensions.clarity * 0.15 +
        dimensions.valueCreation * 0.12 +
        dimensions.valueDelivery * 0.12 +
        dimensions.valueCapture * 0.15 +
        dimensions.scalability * 0.14 +
        dimensions.sustainability * 0.14 +
        dimensions.competitive * 0.1 +
        dimensions.canvas * 0.08
    );
    const status = statusFromScore(overallScore);
    return {
      overallScore,
      status,
      dimensions,
      lenses: buildLenses({
        valueCreated: `Value creation dimension ${Math.round(dimensions.valueCreation)}.`,
        valueDelivered: `Value delivery dimension ${Math.round(dimensions.valueDelivery)}.`,
        valueCaptured: `Value capture dimension ${Math.round(dimensions.valueCapture)}.`,
        canImprove: `Overall health ${status} at ${Math.round(overallScore)}.`,
        canScale: `Scalability ${Math.round(dimensions.scalability)}.`,
        canSustain: `Sustainability ${Math.round(dimensions.sustainability)}.`,
      }),
      narrative: `Business model health ${status} (${Math.round(overallScore)}).`,
    };
  }
}

export class BusinessModelDashboard implements BusinessModelDashboardContract {
  compose(input: {
    scores: {
      healthScore: BusinessModelScore;
      clarityScore: BusinessModelScore;
      scalabilityScore: BusinessModelScore;
      sustainabilityScore: BusinessModelScore;
    };
    baseline: BusinessModelBaseline;
    risks: BusinessModelRiskRecord[];
    opportunities: BusinessModelOpportunityRecord[];
    now: Date;
  }): BusinessModelDashboardResult {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Business model health ${Math.round(input.scores.healthScore.value)} — ${input.scores.healthScore.status}`,
      healthScore: input.scores.healthScore.value,
      clarityScore: input.scores.clarityScore.value,
      scalabilityScore: input.scores.scalabilityScore.value,
      sustainabilityScore: input.scores.sustainabilityScore.value,
      competitivePosition: input.baseline.competitivePosition,
      topRisks: input.risks.slice(0, 5).map((r) => r.title),
      topOpportunities: input.opportunities.slice(0, 5).map((o) => o.title),
      narrative: `Dashboard: clarity ${Math.round(input.scores.clarityScore.value)}, scale ${Math.round(input.scores.scalabilityScore.value)}, sustain ${Math.round(input.scores.sustainabilityScore.value)}.`,
    };
  }
}

export class CompetitivePositionAnalyzer
  implements CompetitivePositionAnalyzerContract
{
  analyze(input: {
    baseline: BusinessModelBaseline;
    canvas: BusinessModelCanvasResult;
    now: Date;
  }): CompetitivePositionResult {
    void input.now;
    const score = clamp(
      input.baseline.competitivePosition * 0.6 +
        input.baseline.differentiationScore * 0.25 +
        input.canvas.completeness * 0.15
    );
    return {
      score,
      status: statusFromScore(score),
      strengths: [
        `Differentiation ${Math.round(input.baseline.differentiationScore)}`,
        `Value capture ${Math.round(input.baseline.valueCaptureScore)}`,
      ],
      weaknesses: [
        input.baseline.scalabilityScore < 65
          ? "Scalability lag"
          : "Execution consistency",
        input.baseline.capitalIntensity > 0.5
          ? "Capital intensity"
          : "Competitive proof points",
      ],
      competitorGaps: [
        "Channel coverage vs peers",
        "Unit economics transparency",
        "Platform leverage",
      ],
      narrative: `Competitive position ${statusFromScore(score)} at ${Math.round(score)}.`,
    };
  }
}

export class BusinessModelRiskAnalyzer
  implements BusinessModelRiskAnalyzerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: {
    baseline: BusinessModelBaseline;
    canvas: BusinessModelCanvasResult;
    design: OrganizationDesignSuite;
    now: Date;
  }): BusinessModelRiskRecord[] {
    void input.now;
    const risks: BusinessModelRiskRecord[] = [
      {
        id: this.createId("bm-risk"),
        title: "Value capture fragility",
        severity: priorityFromScore(input.baseline.valueCaptureScore),
        score: clamp(100 - input.baseline.valueCaptureScore),
        dimension: "profitability",
        mitigation: "Strengthen recurring streams and margin discipline",
        lenses: buildLenses({
          valueCreated: "Capture risk does not erase creation strength.",
          valueDelivered: "Delivery remains viable if capture is repaired.",
          valueCaptured: "Primary risk sits in monetization durability.",
          canImprove: "Pricing and mix redesign can lift capture.",
          canScale: "Fragile capture limits scalable economics.",
          canSustain: "Unsustainable capture threatens long-term model.",
        }),
        narrative: "Value capture fragility threatens model durability.",
      },
      {
        id: this.createId("bm-risk"),
        title: "Operational complexity drag",
        severity: priorityFromRisk(input.baseline.operationalComplexity),
        score: clamp(input.baseline.operationalComplexity * 100),
        dimension: "operational_complexity",
        mitigation: "Simplify design toward shared services / clearer units",
        lenses: buildLenses({
          valueCreated: "Complexity can obscure value creation focus.",
          valueDelivered: "Delivery consistency suffers under complexity.",
          valueCaptured: "Complexity raises cost-to-serve.",
          canImprove: `Current design ${input.design.current.label} can be simplified.`,
          canScale: "Complexity reduces scalable throughput.",
          canSustain: "Sustainable operations need lower complexity.",
        }),
        narrative: "Operational complexity elevates execution risk.",
      },
      {
        id: this.createId("bm-risk"),
        title: "Canvas completeness gaps",
        severity: priorityFromScore(input.canvas.completeness),
        score: clamp(100 - input.canvas.completeness),
        dimension: "model_clarity",
        mitigation: "Close weakest BMC blocks with explicit owners",
        lenses: buildLenses({
          valueCreated: "Unclear blocks hide creation mechanics.",
          valueDelivered: "Channel and relationship gaps hurt delivery.",
          valueCaptured: "Revenue stream gaps weaken capture.",
          canImprove: "Completeness lift is a direct improvement lever.",
          canScale: "Ambiguous models do not scale cleanly.",
          canSustain: "Clarity underpins sustainable governance.",
        }),
        narrative: `Canvas completeness ${Math.round(input.canvas.completeness)} leaves gaps.`,
      },
      {
        id: this.createId("bm-risk"),
        title: "Capital intensity pressure",
        severity: priorityFromRisk(input.baseline.capitalIntensity),
        score: clamp(input.baseline.capitalIntensity * 100),
        dimension: "capital_requirements",
        mitigation: "Shift toward asset-lighter capture where mission allows",
        lenses: buildLenses({
          valueCreated: "Capital needs fund creation capacity.",
          valueDelivered: "Delivery scale may require capital.",
          valueCaptured: "Capture must cover capital cost of capital.",
          canImprove: "Licensing/platform hybrids can reduce intensity.",
          canScale: "High capital intensity slows scale.",
          canSustain: "Runway risk threatens sustainability.",
        }),
        narrative: "Capital intensity pressures model sustainability.",
      },
    ];
    return risks.sort((a, b) => b.score - a.score);
  }
}

export class BusinessModelOpportunityAnalyzer
  implements BusinessModelOpportunityAnalyzerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: {
    baseline: BusinessModelBaseline;
    canvas: BusinessModelCanvasResult;
    leanCanvas: LeanCanvasResult;
    scenarios: BusinessModelScenarioSuite;
    now: Date;
  }): BusinessModelOpportunityRecord[] {
    void input.now;
    const preferred =
      input.scenarios.scenarios.find(
        (s) => s.id === input.scenarios.preferredId
      ) ?? input.scenarios.scenarios[0]!;

    const opportunities: BusinessModelOpportunityRecord[] = [
      {
        id: this.createId("bm-opp"),
        title: "Strengthen unique value proposition",
        priority: priorityFromScore(input.leanCanvas.completeness),
        score: clamp(100 - input.leanCanvas.completeness + 55),
        expectedValue: Math.round(input.baseline.annualRevenue * 0.04),
        lenses: buildLenses({
          valueCreated: "Sharper UVP clarifies what value is created.",
          valueDelivered: "Clearer promise improves delivery focus.",
          valueCaptured: "Differentiation supports pricing power.",
          canImprove: "Lean canvas gaps are actionable.",
          canScale: "Clear UVP enables repeatable GTM.",
          canSustain: "Mission-aligned UVP sustains trust.",
        }),
        narrative: "UVP clarity is a high-leverage opportunity.",
      },
      {
        id: this.createId("bm-opp"),
        title: `Adopt ${preferred.label}`,
        priority: preferred.priority,
        score: preferred.score,
        expectedValue: Math.round(input.baseline.annualRevenue * 0.08),
        lenses: preferred.lenses,
        narrative: `Scenario shift toward ${preferred.label}.`,
      },
      {
        id: this.createId("bm-opp"),
        title: "Diversify revenue streams",
        priority: priorityFromScore(input.baseline.valueCaptureScore),
        score: clamp(70 + (100 - input.baseline.valueCaptureScore) * 0.2),
        expectedValue: Math.round(input.baseline.annualRevenue * 0.06),
        lenses: buildLenses({
          valueCreated: "New streams can extend created value.",
          valueDelivered: "Channels must support new streams.",
          valueCaptured: "Diversification stabilizes capture.",
          canImprove: "Mix redesign is a proven improvement path.",
          canScale: "Multiple streams support scalable growth.",
          canSustain: "Lower concentration risk improves sustainability.",
        }),
        narrative: "Revenue diversification improves capture resilience.",
      },
      {
        id: this.createId("bm-opp"),
        title: "Close weakest canvas blocks",
        priority: priorityFromScore(input.canvas.completeness),
        score: clamp(
          65 +
            (100 -
              Math.min(...input.canvas.blocks.map((b) => b.strength))) *
              0.25
        ),
        expectedValue: Math.round(input.baseline.annualRevenue * 0.03),
        lenses: buildLenses({
          valueCreated: "Completing creation blocks clarifies mechanics.",
          valueDelivered: "Channel/relationship blocks improve delivery.",
          valueCaptured: "Revenue/cost blocks improve capture.",
          canImprove: "Block-level gaps are concrete improvements.",
          canScale: "Complete models scale with less ambiguity.",
          canSustain: "Governance needs a complete canvas.",
        }),
        narrative: "Canvas gap closure unlocks model clarity.",
      },
    ];
    return opportunities.sort((a, b) => b.score - a.score);
  }
}

export class BusinessModelEvolutionPlanner
  implements BusinessModelEvolutionPlannerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  plan(input: {
    baseline: BusinessModelBaseline;
    opportunities: BusinessModelOpportunityRecord[];
    risks: BusinessModelRiskRecord[];
    scenarios: BusinessModelScenarioSuite;
    now: Date;
  }): BusinessModelEvolutionRoadmap {
    void input.now;
    const steps = [
      {
        horizon: "now" as const,
        title: input.opportunities[0]?.title ?? "Clarify current model",
        score: input.opportunities[0]?.score ?? 70,
        dependencies: [],
        lenses:
          input.opportunities[0]?.lenses ??
          buildLenses({
            valueCreated: "Clarify creation.",
            valueDelivered: "Clarify delivery.",
            valueCaptured: "Clarify capture.",
            canImprove: "Immediate clarity lift.",
            canScale: "Foundation for scale.",
            canSustain: "Foundation for sustainability.",
          }),
      },
      {
        horizon: "near" as const,
        title: input.risks[0]
          ? `Mitigate: ${input.risks[0].title}`
          : "Reduce model risk",
        score: input.risks[0]?.score ?? 60,
        dependencies: ["now"],
        lenses:
          input.risks[0]?.lenses ??
          buildLenses({
            valueCreated: "Protect creation.",
            valueDelivered: "Protect delivery.",
            valueCaptured: "Protect capture.",
            canImprove: "Risk reduction is improvement.",
            canScale: "Lower risk enables scale.",
            canSustain: "Lower risk enables sustainability.",
          }),
      },
      {
        horizon: "mid" as const,
        title: `Pilot ${input.scenarios.scenarios.find((s) => s.id === input.scenarios.preferredId)?.label ?? "preferred scenario"}`,
        score:
          input.scenarios.scenarios.find(
            (s) => s.id === input.scenarios.preferredId
          )?.score ?? 65,
        dependencies: ["near"],
        lenses: buildLenses({
          valueCreated: "Pilot validates creation mechanics.",
          valueDelivered: "Pilot tests delivery channels.",
          valueCaptured: "Pilot measures capture lift.",
          canImprove: "Controlled redesign path.",
          canScale: "Pilot informs scale plan.",
          canSustain: "Pilot checks sustainability.",
        }),
      },
      {
        horizon: "long" as const,
        title: "Institutionalize evolved business model",
        score: clamp(input.baseline.scalabilityScore + 10),
        dependencies: ["mid"],
        lenses: buildLenses({
          valueCreated: "Institutionalize creation systems.",
          valueDelivered: "Institutionalize delivery systems.",
          valueCaptured: "Institutionalize capture systems.",
          canImprove: "Continuous improvement cadence.",
          canScale: "Scale becomes default operating mode.",
          canSustain: "Sustainability becomes governed.",
        }),
      },
    ].map((step) => ({
      id: this.createId(`bm-step-${step.horizon}`),
      horizon: step.horizon,
      title: step.title,
      priority: priorityFromScore(step.score),
      score: step.score,
      dependencies: step.dependencies,
      lenses: step.lenses,
      narrative: `${step.horizon}: ${step.title}`,
    }));

    return {
      steps,
      narrative: `Evolution roadmap spans ${steps.length} horizons from now to long-term institutionalization.`,
    };
  }
}

export class BusinessModelRecommendationComposer
  implements BusinessModelRecommendationComposerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  compose(input: {
    opportunities: BusinessModelOpportunityRecord[];
    risks: BusinessModelRiskRecord[];
    roadmap: BusinessModelEvolutionRoadmap;
    design: OrganizationDesignSuite;
    now: Date;
  }): BusinessModelRecommendationRecord[] {
    void input.now;
    const fromOpps = input.opportunities.slice(0, 3).map((o) => ({
      id: this.createId("bm-rec"),
      title: o.title,
      priority: o.priority,
      score: o.score,
      rationale: o.narrative,
      lenses: o.lenses,
      narrative: o.narrative,
      expectedLift: `Expected value ~$${o.expectedValue.toLocaleString()}`,
      riskReduction: "Improves model clarity and capture resilience",
    }));

    const designRec: BusinessModelRecommendationRecord = {
      id: this.createId("bm-rec"),
      title: `Evaluate shift to ${input.design.recommended.label}`,
      priority: input.design.recommended.priority,
      score: input.design.recommended.fitScore,
      rationale: input.design.narrative,
      lenses: input.design.recommended.lenses,
      narrative: input.design.recommended.narrative,
      expectedLift: "Higher fit and scalability vs current design",
      riskReduction: "Addresses structural mismatch risk",
    };

    const roadmapRec = input.roadmap.steps[0]
      ? {
          id: this.createId("bm-rec"),
          title: input.roadmap.steps[0].title,
          priority: input.roadmap.steps[0].priority,
          score: input.roadmap.steps[0].score,
          rationale: input.roadmap.narrative,
          lenses: input.roadmap.steps[0].lenses,
          narrative: input.roadmap.steps[0].narrative,
          expectedLift: "Immediate clarity and priority alignment",
          riskReduction: input.risks[0]
            ? `Starts mitigating ${input.risks[0].title}`
            : "Reduces model ambiguity",
        }
      : null;

    return [...fromOpps, designRec, ...(roadmapRec ? [roadmapRec] : [])]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }
}

export class ExecutiveBusinessBriefGenerator
  implements ExecutiveBusinessBriefGeneratorContract
{
  generate(input: {
    request: BusinessModelRequest;
    baseline: BusinessModelBaseline;
    scores: {
      healthScore: BusinessModelScore;
      clarityScore: BusinessModelScore;
      scalabilityScore: BusinessModelScore;
      sustainabilityScore: BusinessModelScore;
    };
    risks: BusinessModelRiskRecord[];
    opportunities: BusinessModelOpportunityRecord[];
    scenarios: BusinessModelScenarioSuite;
    recommendations: BusinessModelRecommendationRecord[];
    confidence: BusinessModelConfidenceScore;
    now: Date;
  }): import("@/lib/platform/intelligence/business-model/types").ExecutiveBusinessBrief {
    const preferred =
      input.scenarios.scenarios.find(
        (s) => s.id === input.scenarios.preferredId
      )?.label ?? "Current Model";

    return {
      generatedAt: input.now.toISOString(),
      headline: `Business model health ${Math.round(input.scores.healthScore.value)} — prefer ${preferred}`,
      summary:
        input.request.question ??
        "How should the organization create, deliver, and capture value more effectively?",
      healthScore: input.scores.healthScore.value,
      clarityScore: input.scores.clarityScore.value,
      scalabilityScore: input.scores.scalabilityScore.value,
      sustainabilityScore: input.scores.sustainabilityScore.value,
      topRecommendations: input.recommendations.slice(0, 5).map((r) => r.title),
      topRisks: input.risks.slice(0, 5).map((r) => r.title),
      topOpportunities: input.opportunities.slice(0, 5).map((o) => o.title),
      preferredScenario: preferred,
      lenses: buildLenses({
        valueCreated: `Creation score ${Math.round(input.baseline.valueCreationScore)}.`,
        valueDelivered: `Delivery score ${Math.round(input.baseline.valueDeliveryScore)}.`,
        valueCaptured: `Capture score ${Math.round(input.baseline.valueCaptureScore)}.`,
        canImprove: `Top recommendation: ${input.recommendations[0]?.title ?? "Clarify model"}.`,
        canScale: `Scalability ${Math.round(input.scores.scalabilityScore.value)}.`,
        canSustain: `Sustainability ${Math.round(input.scores.sustainabilityScore.value)} (confidence ${input.confidence.level}).`,
      }),
      narrative: `Executive brief: archetype ${input.baseline.archetype}; preferred ${preferred}.`,
    };
  }
}
