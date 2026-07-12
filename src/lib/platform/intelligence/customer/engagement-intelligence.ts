/**
 * Customer Intelligence — engagement + satisfaction engines (Sprint 039).
 */

import type {
  EngagementEngine as EngagementEngineContract,
  SatisfactionEngine as SatisfactionEngineContract,
} from "@/lib/platform/intelligence/customer/contracts";
import {
  clamp,
  statusFromScore,
} from "@/lib/platform/intelligence/customer/models";
import type {
  CustomerBaseline,
  EngagementDimension,
  EngagementDimensionRecord,
  EngagementResult,
  SatisfactionSignal,
  SatisfactionSignalRecord,
  SatisfactionSuite,
} from "@/lib/platform/intelligence/customer/types";
import {
  ENGAGEMENT_DIMENSIONS,
  SATISFACTION_SIGNALS,
} from "@/lib/platform/intelligence/customer/types";

const ENGAGEMENT_LABELS: Record<EngagementDimension, string> = {
  attendance: "Attendance",
  participation: "Participation",
  communication_response: "Communication Response",
  portal_activity: "Portal Activity",
  event_involvement: "Event Involvement",
  learning_progress: "Learning Progress",
};

const SATISFACTION_LABELS: Record<SatisfactionSignal, string> = {
  nps_proxy: "NPS Proxy",
  complaint_burden: "Complaint Burden",
  response_quality: "Response Quality",
  trust_index: "Trust Index",
  referral_likelihood: "Referral Likelihood",
  issue_resolution: "Issue Resolution",
};

export class EngagementEngine implements EngagementEngineContract {
  assess(input: {
    baseline: CustomerBaseline;
    now: Date;
  }): EngagementResult {
    void input.now;
    const b = input.baseline;

    const scores: Record<EngagementDimension, number> = {
      attendance: clamp(b.studentAttendance * 100),
      participation: clamp(
        b.studentEngagementScore * 0.6 + b.belongingIndex * 0.25 + 10
      ),
      communication_response: clamp(b.communicationQuality),
      portal_activity: clamp(
        50 +
          b.communicationQuality * 0.3 +
          b.personaCount * 2 +
          b.studentEngagementScore * 0.15
      ),
      event_involvement: clamp(
        b.communityBelongingScore * 0.55 + b.familyExperienceScore * 0.3 + 8
      ),
      learning_progress: clamp(
        b.studentEngagementScore * 0.5 +
          b.enrollmentScore * 0.25 +
          b.executionScore * 0.25
      ),
    };

    const dimensions: EngagementDimensionRecord[] = ENGAGEMENT_DIMENSIONS.map(
      (dimension) => {
        const score = scores[dimension];
        return {
          dimension,
          label: ENGAGEMENT_LABELS[dimension],
          score,
          status: statusFromScore(score),
          signal: signalForEngagement(dimension, score, b),
          narrative: `${ENGAGEMENT_LABELS[dimension]} is ${statusFromScore(score)} at ${Math.round(score)}.`,
        };
      }
    );

    const overallScore = clamp(
      dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
    );

    return {
      dimensions,
      overallScore,
      status: statusFromScore(overallScore),
      narrative: `Student engagement ${statusFromScore(overallScore)} at ${Math.round(overallScore)}.`,
    };
  }
}

export class SatisfactionEngine implements SatisfactionEngineContract {
  assess(input: {
    baseline: CustomerBaseline;
    engagement: EngagementResult;
    now: Date;
  }): SatisfactionSuite {
    void input.now;
    const b = input.baseline;

    const signals: SatisfactionSignalRecord[] = SATISFACTION_SIGNALS.map(
      (signal) => {
        const { score, weight } = resolveSatisfaction(signal, b, input.engagement);
        return {
          signal,
          label: SATISFACTION_LABELS[signal],
          score,
          status: statusFromScore(score),
          weight,
          narrative: `${SATISFACTION_LABELS[signal]} is ${statusFromScore(score)} at ${Math.round(score)}.`,
        };
      }
    );

    const weightSum = signals.reduce((sum, s) => sum + s.weight, 0);
    const overallScore = clamp(
      signals.reduce((sum, s) => sum + s.score * s.weight, 0) /
        Math.max(1, weightSum)
    );
    const weakest = [...signals].sort((a, c) => a.score - c.score)[0]!;

    return {
      signals,
      overallScore,
      weakestSignal: weakest.signal,
      narrative: `Satisfaction ${Math.round(overallScore)}; weakest signal ${SATISFACTION_LABELS[weakest.signal]}.`,
    };
  }
}

function signalForEngagement(
  dimension: EngagementDimension,
  score: number,
  baseline: CustomerBaseline
): string {
  switch (dimension) {
    case "attendance":
      return baseline.studentAttendance < 0.9
        ? "Attendance below target"
        : "Attendance within band";
    case "participation":
      return score < 60
        ? "Participation lagging"
        : "Participation healthy";
    case "communication_response":
      return baseline.communicationQuality < 60
        ? "Family response lag elevated"
        : "Communication response timely";
    case "portal_activity":
      return score < 55
        ? "Portal activity soft"
        : "Portal activity steady";
    case "event_involvement":
      return score < 60
        ? "Event involvement limited"
        : "Event involvement solid";
    case "learning_progress":
      return score < 60
        ? "Learning progress at risk"
        : "Learning progress on track";
  }
}

function resolveSatisfaction(
  signal: SatisfactionSignal,
  b: CustomerBaseline,
  engagement: EngagementResult
): { score: number; weight: number } {
  switch (signal) {
    case "nps_proxy":
      return {
        score: clamp(
          b.satisfactionScore * 0.55 +
            engagement.overallScore * 0.25 +
            (100 - b.complaintBurden * 100) * 0.2
        ),
        weight: 1.2,
      };
    case "complaint_burden":
      return {
        score: clamp(100 - b.complaintBurden * 100),
        weight: 1.1,
      };
    case "response_quality":
      return {
        score: clamp(b.communicationQuality),
        weight: 1.0,
      };
    case "trust_index":
      return {
        score: clamp(
          b.organizationHealthScore * 0.4 +
            b.familyExperienceScore * 0.35 +
            b.belongingIndex * 0.25
        ),
        weight: 1.0,
      };
    case "referral_likelihood":
      return {
        score: clamp(
          b.satisfactionScore * 0.45 +
            b.communityBelongingScore * 0.35 +
            (100 - b.withdrawalRisk * 100) * 0.2
        ),
        weight: 0.9,
      };
    case "issue_resolution":
      return {
        score: clamp(
          b.operationsSupportScore * 0.45 +
            (100 - b.complaintBurden * 100) * 0.35 +
            b.communicationQuality * 0.2
        ),
        weight: 1.0,
      };
  }
}
