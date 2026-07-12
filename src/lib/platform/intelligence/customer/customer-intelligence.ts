/**
 * Customer Intelligence — scores, health, dashboards, briefs, analyzers (Sprint 039).
 */

import type {
  CustomerDashboard as CustomerDashboardContract,
  CustomerHealth as CustomerHealthContract,
  CustomerIntelligence as CustomerIntelligenceContract,
  CustomerOpportunityAnalyzer as CustomerOpportunityAnalyzerContract,
  CustomerRecommendationComposer as CustomerRecommendationComposerContract,
  CustomerRiskAnalyzer as CustomerRiskAnalyzerContract,
  ExecutiveCustomerBriefGenerator as ExecutiveCustomerBriefGeneratorContract,
} from "@/lib/platform/intelligence/customer/contracts";
import {
  buildConfidence,
  buildLenses,
  clamp,
  defaultCreateId,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/customer/models";
import type {
  CommunityHealthResult,
  CustomerBaseline,
  CustomerConfidenceScore,
  CustomerDashboardResult,
  CustomerHealthResult,
  CustomerOpportunityRecord,
  CustomerRecommendationRecord,
  CustomerRequest,
  CustomerRiskRecord,
  CustomerScore,
  EngagementResult,
  ExecutiveCustomerBrief,
  JourneyMapResult,
  RetentionWatchlistResult,
  SatisfactionSuite,
} from "@/lib/platform/intelligence/customer/types";

export function defaultCustomerConfidence(
  baseline: CustomerBaseline,
  journeyMap: JourneyMapResult,
  engagement: EngagementResult,
  satisfaction: SatisfactionSuite
): CustomerConfidenceScore {
  return buildConfidence([
    {
      key: "family_experience",
      label: "Family experience",
      contribution: clamp(baseline.familyExperienceScore / 100),
    },
    {
      key: "journey",
      label: "Journey coverage",
      contribution: clamp(journeyMap.overallScore / 100),
    },
    {
      key: "engagement",
      label: "Engagement coverage",
      contribution: clamp(engagement.overallScore / 100),
    },
    {
      key: "satisfaction",
      label: "Satisfaction signals",
      contribution: clamp(satisfaction.overallScore / 100),
    },
  ]);
}

export class CustomerIntelligence implements CustomerIntelligenceContract {
  composeScores(input: {
    baseline: CustomerBaseline;
    journeyMap: JourneyMapResult;
    engagement: EngagementResult;
    satisfaction: SatisfactionSuite;
    retentionWatchlist: RetentionWatchlistResult;
    communityHealth: CommunityHealthResult;
    risks: CustomerRiskRecord[];
    opportunities: CustomerOpportunityRecord[];
  }): {
    healthScore: CustomerScore;
    engagementScore: CustomerScore;
    journeyScore: CustomerScore;
    satisfactionScore: CustomerScore;
    retentionScore: CustomerScore;
    communityScore: CustomerScore;
    riskScore: CustomerScore;
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

    const journeyValue = clamp(input.journeyMap.overallScore);
    const engagementValue = clamp(input.engagement.overallScore);
    const satisfactionValue = clamp(input.satisfaction.overallScore);
    const retentionValue = clamp(100 - input.retentionWatchlist.overallRisk);
    const communityValue = clamp(input.communityHealth.overallScore);
    const healthValue = clamp(
      journeyValue * 0.18 +
        engagementValue * 0.18 +
        satisfactionValue * 0.18 +
        retentionValue * 0.16 +
        communityValue * 0.14 +
        input.baseline.familyExperienceScore * 0.1 +
        oppLift * 0.06
    );
    const riskValue = clamp(avgRisk);

    return {
      healthScore: {
        key: "customer_health",
        label: "Customer Health Score",
        value: healthValue,
        status: statusFromScore(healthValue),
        band: priorityFromScore(healthValue),
        narrative: scoreNarrative(
          "Customer health",
          healthValue,
          statusFromScore(healthValue)
        ),
      },
      engagementScore: {
        key: "customer_engagement",
        label: "Engagement Score",
        value: engagementValue,
        status: statusFromScore(engagementValue),
        band: priorityFromScore(engagementValue),
        narrative: scoreNarrative(
          "Student engagement",
          engagementValue,
          statusFromScore(engagementValue)
        ),
      },
      journeyScore: {
        key: "customer_journey",
        label: "Journey Score",
        value: journeyValue,
        status: statusFromScore(journeyValue),
        band: priorityFromScore(journeyValue),
        narrative: scoreNarrative(
          "Journey continuity",
          journeyValue,
          statusFromScore(journeyValue)
        ),
      },
      satisfactionScore: {
        key: "customer_satisfaction",
        label: "Satisfaction Score",
        value: satisfactionValue,
        status: statusFromScore(satisfactionValue),
        band: priorityFromScore(satisfactionValue),
        narrative: scoreNarrative(
          "Satisfaction sentiment",
          satisfactionValue,
          statusFromScore(satisfactionValue)
        ),
      },
      retentionScore: {
        key: "customer_retention",
        label: "Retention Score",
        value: retentionValue,
        status: statusFromScore(retentionValue),
        band: priorityFromScore(retentionValue),
        narrative: scoreNarrative(
          "Retention health",
          retentionValue,
          statusFromScore(retentionValue)
        ),
      },
      communityScore: {
        key: "customer_community",
        label: "Community Score",
        value: communityValue,
        status: statusFromScore(communityValue),
        band: priorityFromScore(communityValue),
        narrative: scoreNarrative(
          "Community belonging",
          communityValue,
          statusFromScore(communityValue)
        ),
      },
      riskScore: {
        key: "customer_risk",
        label: "Customer Risk Score",
        value: riskValue,
        status: statusFromScore(100 - riskValue),
        band: priorityFromRisk(riskValue / 100),
        narrative: `Customer risk is ${priorityFromRisk(riskValue / 100)} at ${Math.round(riskValue)}.`,
      },
    };
  }
}

export class CustomerHealth implements CustomerHealthContract {
  assess(input: {
    baseline: CustomerBaseline;
    scores: {
      healthScore: CustomerScore;
      engagementScore: CustomerScore;
      journeyScore: CustomerScore;
      satisfactionScore: CustomerScore;
      retentionScore: CustomerScore;
      communityScore: CustomerScore;
      riskScore: CustomerScore;
    };
    journeyMap: JourneyMapResult;
    engagement: EngagementResult;
  }): CustomerHealthResult {
    const dimensions = {
      family: input.baseline.familyExperienceScore,
      journey: input.scores.journeyScore.value,
      engagement: input.scores.engagementScore.value,
      satisfaction: input.scores.satisfactionScore.value,
      retention: input.scores.retentionScore.value,
      community: input.scores.communityScore.value,
    };
    const overallScore = clamp(
      dimensions.family * 0.18 +
        dimensions.journey * 0.18 +
        dimensions.engagement * 0.18 +
        dimensions.satisfaction * 0.16 +
        dimensions.retention * 0.15 +
        dimensions.community * 0.15
    );
    const status = statusFromScore(overallScore);
    return {
      overallScore,
      status,
      dimensions,
      lenses: buildLenses({
        familyExperience: `Family experience ${Math.round(dimensions.family)}.`,
        studentEngagement: `Engagement ${Math.round(dimensions.engagement)}.`,
        journeyContinuity: `Weakest journey stage ${input.journeyMap.weakestStage}.`,
        satisfactionSentiment: `Satisfaction ${Math.round(dimensions.satisfaction)}.`,
        retentionRisk: `Retention score ${Math.round(dimensions.retention)}.`,
        communityBelonging: `Community ${Math.round(dimensions.community)}.`,
      }),
      narrative: `Customer health ${status} (${Math.round(overallScore)}).`,
    };
  }
}

export class CustomerDashboard implements CustomerDashboardContract {
  compose(input: {
    scores: {
      healthScore: CustomerScore;
      engagementScore: CustomerScore;
      journeyScore: CustomerScore;
      satisfactionScore: CustomerScore;
      retentionScore: CustomerScore;
      communityScore: CustomerScore;
    };
    baseline: CustomerBaseline;
    risks: CustomerRiskRecord[];
    opportunities: CustomerOpportunityRecord[];
    now: Date;
  }): CustomerDashboardResult {
    void input.baseline;
    return {
      generatedAt: input.now.toISOString(),
      headline: `Customer health ${Math.round(input.scores.healthScore.value)} — ${input.scores.healthScore.status}`,
      healthScore: input.scores.healthScore.value,
      engagementScore: input.scores.engagementScore.value,
      journeyScore: input.scores.journeyScore.value,
      satisfactionScore: input.scores.satisfactionScore.value,
      retentionScore: input.scores.retentionScore.value,
      communityScore: input.scores.communityScore.value,
      topRisks: input.risks.slice(0, 5).map((r) => r.title),
      topOpportunities: input.opportunities.slice(0, 5).map((o) => o.title),
      narrative: `Dashboard: journey ${Math.round(input.scores.journeyScore.value)}, engagement ${Math.round(input.scores.engagementScore.value)}, satisfaction ${Math.round(input.scores.satisfactionScore.value)}, retention ${Math.round(input.scores.retentionScore.value)}, community ${Math.round(input.scores.communityScore.value)}.`,
    };
  }
}

export class CustomerRiskAnalyzer implements CustomerRiskAnalyzerContract {
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: {
    baseline: CustomerBaseline;
    journeyMap: JourneyMapResult;
    engagement: EngagementResult;
    satisfaction: SatisfactionSuite;
    retentionWatchlist: RetentionWatchlistResult;
    communityHealth: CommunityHealthResult;
    now: Date;
  }): CustomerRiskRecord[] {
    void input.now;
    const hottest = input.retentionWatchlist.factors.find(
      (f) => f.factor === input.retentionWatchlist.hottestFactor
    );
    const weakestStage = input.journeyMap.stages.find(
      (s) => s.stage === input.journeyMap.weakestStage
    );
    const risks: CustomerRiskRecord[] = [
      {
        id: this.createId("cust-risk"),
        title: "Withdrawal / retention risk",
        severity: priorityFromRisk(input.baseline.withdrawalRisk),
        score: clamp(input.baseline.withdrawalRisk * 100),
        dimension: "retention",
        mitigation: "Activate early-warning outreach and retention playbook",
        lenses: buildLenses({
          familyExperience: "Withdrawal risk erodes family trust.",
          studentEngagement: "At-risk students disengage first.",
          journeyContinuity: "Journey breaks at progression/advocacy.",
          satisfactionSentiment: "Unresolved issues drive exits.",
          retentionRisk: `Withdrawal risk ${(input.baseline.withdrawalRisk * 100).toFixed(0)}%.`,
          communityBelonging: "Belonging gaps accelerate exits.",
        }),
        narrative: "Withdrawal risk elevates customer retention pressure.",
      },
      {
        id: this.createId("cust-risk"),
        title: `Retention factor: ${hottest?.label ?? input.retentionWatchlist.hottestFactor}`,
        severity: priorityFromRisk((hottest?.riskScore ?? 55) / 100),
        score: clamp(hottest?.riskScore ?? 55),
        dimension: input.retentionWatchlist.hottestFactor,
        mitigation: "Own the hottest retention factor with named owners",
        lenses: buildLenses({
          familyExperience: "Hot retention factors hurt family experience.",
          studentEngagement: "Engagement drops feed retention risk.",
          journeyContinuity: "Friction compounds retention signals.",
          satisfactionSentiment: "Satisfaction decline is a leading indicator.",
          retentionRisk: `Hottest factor ${input.retentionWatchlist.hottestFactor}.`,
          communityBelonging: "Belonging gaps amplify retention risk.",
        }),
        narrative: `Retention risk concentrated in ${input.retentionWatchlist.hottestFactor}.`,
      },
      {
        id: this.createId("cust-risk"),
        title: `Journey friction: ${weakestStage?.label ?? input.journeyMap.weakestStage}`,
        severity: priorityFromScore(weakestStage?.score ?? 55),
        score: clamp(weakestStage?.friction ?? 55),
        dimension: input.journeyMap.weakestStage,
        mitigation: "Smooth the weakest journey stage with clear handoffs",
        lenses: buildLenses({
          familyExperience: "Journey friction is felt by families immediately.",
          studentEngagement: "Broken stages reduce engagement.",
          journeyContinuity: `Weakest stage ${input.journeyMap.weakestStage}.`,
          satisfactionSentiment: "Friction drives complaints.",
          retentionRisk: "Journey breaks raise withdrawal odds.",
          communityBelonging: "Belonging suffers when continuity fails.",
        }),
        narrative: `Journey friction concentrated in ${input.journeyMap.weakestStage}.`,
      },
      {
        id: this.createId("cust-risk"),
        title: "Community belonging gap",
        severity: priorityFromScore(input.communityHealth.overallScore),
        score: clamp(100 - input.communityHealth.overallScore),
        dimension: "belonging",
        mitigation: "Strengthen inclusion and family involvement pillars",
        lenses: buildLenses({
          familyExperience: "Belonging is core to family experience.",
          studentEngagement: "Peers and inclusion lift engagement.",
          journeyContinuity: "Belonging supports advocacy stage.",
          satisfactionSentiment: "Belonging correlates with trust.",
          retentionRisk: "Belonging gaps raise exit risk.",
          communityBelonging: `Weakest pillar ${input.communityHealth.weakestPillar}.`,
        }),
        narrative: "Community belonging gap threatens long-term retention.",
      },
    ];
    return risks.sort((a, c) => c.score - a.score);
  }
}

export class CustomerOpportunityAnalyzer
  implements CustomerOpportunityAnalyzerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  analyze(input: {
    baseline: CustomerBaseline;
    journeyMap: JourneyMapResult;
    engagement: EngagementResult;
    satisfaction: SatisfactionSuite;
    communityHealth: CommunityHealthResult;
    now: Date;
  }): CustomerOpportunityRecord[] {
    void input.now;
    const opportunities: CustomerOpportunityRecord[] = [
      {
        id: this.createId("cust-opp"),
        title: `Strengthen ${input.journeyMap.weakestStage} journey stage`,
        priority: priorityFromScore(
          input.journeyMap.stages.find(
            (s) => s.stage === input.journeyMap.weakestStage
          )?.score ?? 55
        ),
        score: clamp(
          60 +
            (input.journeyMap.stages.find(
              (s) => s.stage === input.journeyMap.weakestStage
            )?.friction ?? 40) *
              0.35
        ),
        expectedValue: Math.round(input.baseline.enrollment * 0.4),
        lenses: buildLenses({
          familyExperience: "Smoothing the weak stage improves family experience.",
          studentEngagement: "Continuity keeps students engaged.",
          journeyContinuity: `Directly addresses ${input.journeyMap.weakestStage}.`,
          satisfactionSentiment: "Fewer friction complaints.",
          retentionRisk: "Reduces exit pressure at stage transitions.",
          communityBelonging: "Supports progression toward advocacy.",
        }),
        narrative: `Journey stage opportunity on ${input.journeyMap.weakestStage}.`,
      },
      {
        id: this.createId("cust-opp"),
        title: "Lift student engagement",
        priority: priorityFromScore(input.engagement.overallScore),
        score: clamp(100 - input.engagement.overallScore + 50),
        expectedValue: Math.round(input.baseline.enrollment * 0.25),
        lenses: buildLenses({
          familyExperience: "Engaged students improve family perception.",
          studentEngagement: `Current engagement ${Math.round(input.engagement.overallScore)}.`,
          journeyContinuity: "Engagement sustains active-care and progression.",
          satisfactionSentiment: "Engagement lifts NPS proxy.",
          retentionRisk: "Higher engagement lowers withdrawal risk.",
          communityBelonging: "Engagement feeds peer connection.",
        }),
        narrative: "Student engagement lift is a high-leverage customer lever.",
      },
      {
        id: this.createId("cust-opp"),
        title: `Improve ${input.satisfaction.weakestSignal} satisfaction signal`,
        priority: priorityFromScore(
          input.satisfaction.signals.find(
            (s) => s.signal === input.satisfaction.weakestSignal
          )?.score ?? 55
        ),
        score: clamp(
          55 +
            (100 -
              (input.satisfaction.signals.find(
                (s) => s.signal === input.satisfaction.weakestSignal
              )?.score ?? 50)) *
              0.4
        ),
        expectedValue: Math.round(input.baseline.admissions * 3 + 40),
        lenses: buildLenses({
          familyExperience: "Satisfaction signals shape family experience.",
          studentEngagement: "Resolved issues restore engagement.",
          journeyContinuity: "Trust supports journey continuity.",
          satisfactionSentiment: `Targets ${input.satisfaction.weakestSignal}.`,
          retentionRisk: "Satisfaction recovery reduces exits.",
          communityBelonging: "Trust and referral lift belonging.",
        }),
        narrative: `Satisfaction opportunity on ${input.satisfaction.weakestSignal}.`,
      },
      {
        id: this.createId("cust-opp"),
        title: `Grow ${input.communityHealth.weakestPillar} belonging`,
        priority: priorityFromScore(input.communityHealth.overallScore),
        score: clamp(100 - input.communityHealth.overallScore + 48),
        expectedValue: Math.round(input.baseline.personaCount * 20 + 30),
        lenses: buildLenses({
          familyExperience: "Belonging deepens family experience.",
          studentEngagement: "Community lifts participation.",
          journeyContinuity: "Belonging fuels advocacy stage.",
          satisfactionSentiment: "Inclusion raises trust.",
          retentionRisk: "Belonging is a retention moat.",
          communityBelonging: `Focus on ${input.communityHealth.weakestPillar}.`,
        }),
        narrative: `Community belonging opportunity on ${input.communityHealth.weakestPillar}.`,
      },
    ];
    return opportunities.sort((a, c) => c.score - a.score);
  }
}

export class CustomerRecommendationComposer
  implements CustomerRecommendationComposerContract
{
  private readonly createId: (prefix: string) => string;

  constructor(createId: (prefix: string) => string = defaultCreateId) {
    this.createId = createId;
  }

  compose(input: {
    opportunities: CustomerOpportunityRecord[];
    risks: CustomerRiskRecord[];
    journeyMap: JourneyMapResult;
    retentionWatchlist: RetentionWatchlistResult;
    now: Date;
  }): CustomerRecommendationRecord[] {
    void input.now;
    const fromOpps = input.opportunities.slice(0, 3).map((o) => ({
      id: this.createId("cust-rec"),
      title: o.title,
      priority: o.priority,
      score: o.score,
      rationale: o.narrative,
      lenses: o.lenses,
      narrative: o.narrative,
      expectedLift: `Expected value ~${o.expectedValue}`,
      riskReduction: "Improves family/student experience resilience",
    }));

    const journeyRec: CustomerRecommendationRecord = {
      id: this.createId("cust-rec"),
      title: `Own the ${input.journeyMap.weakestStage} journey stage`,
      priority: "high",
      score: clamp(
        input.journeyMap.stages.find(
          (s) => s.stage === input.journeyMap.weakestStage
        )?.friction ?? 60
      ),
      rationale: input.journeyMap.narrative,
      lenses: buildLenses({
        familyExperience: "Stage ownership restores family confidence.",
        studentEngagement: "Clear handoffs keep students on path.",
        journeyContinuity: `Assign owners for ${input.journeyMap.weakestStage}.`,
        satisfactionSentiment: "Reduces friction-driven complaints.",
        retentionRisk: "Prevents stage-drop exits.",
        communityBelonging: "Continuity builds belonging over time.",
      }),
      narrative: `Establish clear ownership for ${input.journeyMap.weakestStage}.`,
      expectedLift: "Faster stage progression and clearer family handoffs",
      riskReduction: "Reduces unmanaged journey friction",
    };

    const retentionRec: CustomerRecommendationRecord = {
      id: this.createId("cust-rec"),
      title: `Mitigate ${input.retentionWatchlist.hottestFactor}`,
      priority: "high",
      score: clamp(input.retentionWatchlist.overallRisk),
      rationale: input.retentionWatchlist.narrative,
      lenses: buildLenses({
        familyExperience: "Retention mitigation protects family trust.",
        studentEngagement: "Keeps at-risk students engaged.",
        journeyContinuity: "Stabilizes late-stage journey continuity.",
        satisfactionSentiment: "Addresses satisfaction-driven exits.",
        retentionRisk: `Hottest factor ${input.retentionWatchlist.hottestFactor}.`,
        communityBelonging: "Pairs retention with belonging interventions.",
      }),
      narrative: `Prioritize mitigation for ${input.retentionWatchlist.hottestFactor}.`,
      expectedLift: "Lower withdrawal probability",
      riskReduction: input.risks[0]
        ? `Helps mitigate ${input.risks[0].title}`
        : "Reduces retention risk",
    };

    return [...fromOpps, journeyRec, retentionRec]
      .sort((a, c) => c.score - a.score)
      .slice(0, 8);
  }
}

export class ExecutiveCustomerBriefGenerator
  implements ExecutiveCustomerBriefGeneratorContract
{
  generate(input: {
    request: CustomerRequest;
    baseline: CustomerBaseline;
    scores: {
      healthScore: CustomerScore;
      engagementScore: CustomerScore;
      journeyScore: CustomerScore;
      satisfactionScore: CustomerScore;
      retentionScore: CustomerScore;
      communityScore: CustomerScore;
    };
    risks: CustomerRiskRecord[];
    opportunities: CustomerOpportunityRecord[];
    journeyMap: JourneyMapResult;
    recommendations: CustomerRecommendationRecord[];
    confidence: CustomerConfidenceScore;
    now: Date;
  }): ExecutiveCustomerBrief {
    return {
      generatedAt: input.now.toISOString(),
      headline: `Customer health ${Math.round(input.scores.healthScore.value)} — weakest stage ${input.journeyMap.weakestStage}`,
      summary:
        input.request.question ??
        "How should the organization monitor and improve family and student experience?",
      healthScore: input.scores.healthScore.value,
      engagementScore: input.scores.engagementScore.value,
      journeyScore: input.scores.journeyScore.value,
      satisfactionScore: input.scores.satisfactionScore.value,
      retentionScore: input.scores.retentionScore.value,
      communityScore: input.scores.communityScore.value,
      topRecommendations: input.recommendations.slice(0, 5).map((r) => r.title),
      topRisks: input.risks.slice(0, 5).map((r) => r.title),
      topOpportunities: input.opportunities.slice(0, 5).map((o) => o.title),
      weakestJourneyStage: input.journeyMap.weakestStage,
      lenses: buildLenses({
        familyExperience: `Family experience ${Math.round(input.baseline.familyExperienceScore)}.`,
        studentEngagement: `Engagement score ${Math.round(input.scores.engagementScore.value)}.`,
        journeyContinuity: `Weakest stage ${input.journeyMap.weakestStage}.`,
        satisfactionSentiment: `Satisfaction score ${Math.round(input.scores.satisfactionScore.value)}.`,
        retentionRisk: `Retention score ${Math.round(input.scores.retentionScore.value)}.`,
        communityBelonging: `Community score ${Math.round(input.scores.communityScore.value)} (confidence ${input.confidence.level}).`,
      }),
      narrative: `Executive customer brief: family experience ${Math.round(input.baseline.familyExperienceScore)}; weakest stage ${input.journeyMap.weakestStage}.`,
    };
  }
}
