/**
 * Customer Intelligence — retention risk + community belonging (Sprint 039).
 */

import type {
  CommunityBelongingEngine as CommunityBelongingEngineContract,
  RetentionRiskEngine as RetentionRiskEngineContract,
} from "@/lib/platform/intelligence/customer/contracts";
import {
  clamp,
  statusFromScore,
} from "@/lib/platform/intelligence/customer/models";
import type {
  CommunityBelongingPillar,
  CommunityHealthResult,
  CommunityPillarRecord,
  CustomerBaseline,
  EngagementResult,
  JourneyMapResult,
  RetentionFactorRecord,
  RetentionRiskFactor,
  RetentionWatchlistResult,
  SatisfactionSuite,
} from "@/lib/platform/intelligence/customer/types";
import {
  COMMUNITY_BELONGING_PILLARS,
  RETENTION_RISK_FACTORS,
} from "@/lib/platform/intelligence/customer/types";

const FACTOR_LABELS: Record<RetentionRiskFactor, string> = {
  withdrawal_signal: "Withdrawal Signal",
  engagement_drop: "Engagement Drop",
  satisfaction_decline: "Satisfaction Decline",
  communication_gap: "Communication Gap",
  belonging_gap: "Belonging Gap",
  journey_friction: "Journey Friction",
};

const PILLAR_LABELS: Record<CommunityBelongingPillar, string> = {
  inclusion: "Inclusion",
  family_involvement: "Family Involvement",
  mission_alignment: "Mission Alignment",
  peer_connection: "Peer Connection",
  support_access: "Support Access",
};

export class RetentionRiskEngine implements RetentionRiskEngineContract {
  analyze(input: {
    baseline: CustomerBaseline;
    journeyMap: JourneyMapResult;
    engagement: EngagementResult;
    satisfaction: SatisfactionSuite;
    now: Date;
  }): RetentionWatchlistResult {
    void input.now;
    const b = input.baseline;

    const factors: RetentionFactorRecord[] = RETENTION_RISK_FACTORS.map(
      (factor) => {
        const { riskScore, signals } = resolveFactor(
          factor,
          b,
          input.journeyMap,
          input.engagement,
          input.satisfaction
        );
        return {
          factor,
          label: FACTOR_LABELS[factor],
          riskScore,
          status: statusFromScore(100 - riskScore),
          signals,
          narrative: `${FACTOR_LABELS[factor]} risk ${Math.round(riskScore)}.`,
        };
      }
    );

    const overallRisk = clamp(
      factors.reduce((sum, f) => sum + f.riskScore, 0) / factors.length
    );
    const hottest = [...factors].sort((a, c) => c.riskScore - a.riskScore)[0]!;

    return {
      factors,
      overallRisk,
      hottestFactor: hottest.factor,
      narrative: `Retention watchlist overall risk ${Math.round(overallRisk)}; hottest factor ${FACTOR_LABELS[hottest.factor]}.`,
    };
  }
}

export class CommunityBelongingEngine
  implements CommunityBelongingEngineContract
{
  assess(input: {
    baseline: CustomerBaseline;
    engagement: EngagementResult;
    now: Date;
  }): CommunityHealthResult {
    void input.now;
    const b = input.baseline;

    const pillars: CommunityPillarRecord[] = COMMUNITY_BELONGING_PILLARS.map(
      (pillar) => {
        const { score, signals } = resolvePillar(pillar, b, input.engagement);
        return {
          pillar,
          label: PILLAR_LABELS[pillar],
          score,
          status: statusFromScore(score),
          signals,
          narrative: `${PILLAR_LABELS[pillar]} is ${statusFromScore(score)} at ${Math.round(score)}.`,
        };
      }
    );

    const overallScore = clamp(
      pillars.reduce((sum, p) => sum + p.score, 0) / pillars.length
    );
    const weakest = [...pillars].sort((a, c) => a.score - c.score)[0]!;

    return {
      pillars,
      overallScore,
      weakestPillar: weakest.pillar,
      narrative: `Community belonging ${Math.round(overallScore)}; weakest pillar ${PILLAR_LABELS[weakest.pillar]}.`,
    };
  }
}

function resolveFactor(
  factor: RetentionRiskFactor,
  b: CustomerBaseline,
  journeyMap: JourneyMapResult,
  engagement: EngagementResult,
  satisfaction: SatisfactionSuite
): { riskScore: number; signals: string[] } {
  switch (factor) {
    case "withdrawal_signal":
      return {
        riskScore: clamp(b.withdrawalRisk * 100),
        signals: [
          `Withdrawal risk ${(b.withdrawalRisk * 100).toFixed(0)}%`,
          `Retention health ${Math.round(b.retentionHealthScore)}`,
        ],
      };
    case "engagement_drop":
      return {
        riskScore: clamp(100 - engagement.overallScore),
        signals: [
          `Engagement ${Math.round(engagement.overallScore)}`,
          `Attendance ${(b.studentAttendance * 100).toFixed(1)}%`,
        ],
      };
    case "satisfaction_decline":
      return {
        riskScore: clamp(100 - satisfaction.overallScore),
        signals: [
          `Satisfaction ${Math.round(satisfaction.overallScore)}`,
          `Weakest ${satisfaction.weakestSignal}`,
        ],
      };
    case "communication_gap":
      return {
        riskScore: clamp(100 - b.communicationQuality),
        signals: [
          `Communication quality ${Math.round(b.communicationQuality)}`,
          `Complaint burden ${(b.complaintBurden * 100).toFixed(0)}%`,
        ],
      };
    case "belonging_gap":
      return {
        riskScore: clamp(100 - b.belongingIndex),
        signals: [
          `Belonging index ${Math.round(b.belongingIndex)}`,
          `Persona richness ${b.personaCount}`,
        ],
      };
    case "journey_friction":
      return {
        riskScore: clamp(
          b.journeyFriction * 70 + (100 - journeyMap.overallScore) * 0.3
        ),
        signals: [
          `Journey friction ${(b.journeyFriction * 100).toFixed(0)}%`,
          `Weakest stage ${journeyMap.weakestStage}`,
        ],
      };
  }
}

function resolvePillar(
  pillar: CommunityBelongingPillar,
  b: CustomerBaseline,
  engagement: EngagementResult
): { score: number; signals: string[] } {
  const eventDim = engagement.dimensions.find(
    (d) => d.dimension === "event_involvement"
  );
  switch (pillar) {
    case "inclusion":
      return {
        score: clamp(
          b.belongingIndex * 0.55 +
            b.personaCount * 4 +
            b.familyExperienceScore * 0.2
        ),
        signals: [
          `Belonging ${Math.round(b.belongingIndex)}`,
          `Personas ${b.personaCount}`,
        ],
      };
    case "family_involvement":
      return {
        score: clamp(
          (eventDim?.score ?? 60) * 0.5 +
            b.communicationQuality * 0.3 +
            b.familyExperienceScore * 0.2
        ),
        signals: ["Family events", "Communication cadence"],
      };
    case "mission_alignment":
      return {
        score: clamp(
          b.organizationHealthScore * 0.4 +
            b.communityBelongingScore * 0.35 +
            b.satisfactionScore * 0.25
        ),
        signals: ["Mission narrative", "Value congruence"],
      };
    case "peer_connection":
      return {
        score: clamp(
          engagement.overallScore * 0.45 +
            b.studentEngagementScore * 0.35 +
            b.belongingIndex * 0.2
        ),
        signals: ["Peer networks", "Cohort cohesion"],
      };
    case "support_access":
      return {
        score: clamp(
          b.operationsSupportScore * 0.45 +
            b.communicationQuality * 0.3 +
            (100 - b.complaintBurden * 100) * 0.25
        ),
        signals: ["Support SLA", "Issue resolution path"],
      };
  }
}
