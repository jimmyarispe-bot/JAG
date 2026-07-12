/**
 * Customer Intelligence — journey map across lifecycle stages (Sprint 039).
 */

import type { JourneyMapEngine as JourneyMapEngineContract } from "@/lib/platform/intelligence/customer/contracts";
import {
  clamp,
  statusFromScore,
} from "@/lib/platform/intelligence/customer/models";
import type {
  CustomerBaseline,
  JourneyMapResult,
  JourneyStage,
  JourneyStageRecord,
} from "@/lib/platform/intelligence/customer/types";
import { JOURNEY_STAGES } from "@/lib/platform/intelligence/customer/types";

const STAGE_LABELS: Record<JourneyStage, string> = {
  inquiry: "Inquiry",
  enrollment: "Enrollment",
  onboarding: "Onboarding",
  active_care: "Active Care",
  progression: "Progression",
  advocacy: "Advocacy",
};

export class JourneyMapEngine implements JourneyMapEngineContract {
  map(input: {
    baseline: CustomerBaseline;
    now: Date;
  }): JourneyMapResult {
    void input.now;
    const b = input.baseline;

    const stages: JourneyStageRecord[] = JOURNEY_STAGES.map((stage) => {
      const { score, friction, signal } = resolveStage(stage, b);
      return {
        stage,
        label: STAGE_LABELS[stage],
        score,
        status: statusFromScore(score),
        friction,
        signal,
        narrative: `${STAGE_LABELS[stage]} is ${statusFromScore(score)} at ${Math.round(score)} (friction ${Math.round(friction)}).`,
      };
    });

    const overallScore = clamp(
      stages.reduce((sum, s) => sum + s.score, 0) / stages.length
    );
    const weakest = [...stages].sort((a, c) => a.score - c.score)[0]!;

    return {
      stages,
      overallScore,
      weakestStage: weakest.stage,
      status: statusFromScore(overallScore),
      narrative: `Journey continuity ${statusFromScore(overallScore)} at ${Math.round(overallScore)}; weakest stage ${STAGE_LABELS[weakest.stage]}.`,
    };
  }
}

function resolveStage(
  stage: JourneyStage,
  b: CustomerBaseline
): { score: number; friction: number; signal: string } {
  switch (stage) {
    case "inquiry":
      return {
        score: clamp(
          b.enrollmentScore * 0.4 +
            (b.admissions > 20 ? 75 : 58) * 0.35 +
            b.communicationQuality * 0.25
        ),
        friction: clamp(b.journeyFriction * 80 + (100 - b.enrollmentScore) * 0.2),
        signal:
          b.admissions < 15
            ? "Inquiry pipeline thin"
            : "Inquiry flow within band",
      };
    case "enrollment":
      return {
        score: clamp(
          b.enrollmentScore * 0.55 +
            (100 - b.journeyFriction * 100) * 0.25 +
            b.operationsSupportScore * 0.2
        ),
        friction: clamp(b.journeyFriction * 100),
        signal:
          b.journeyFriction > 0.4
            ? "Enrollment friction elevated"
            : "Enrollment path stable",
      };
    case "onboarding":
      return {
        score: clamp(
          b.journeyContinuityScore * 0.45 +
            b.communicationQuality * 0.35 +
            b.familyExperienceScore * 0.2
        ),
        friction: clamp(
          (100 - b.communicationQuality) * 0.5 + b.complaintBurden * 50
        ),
        signal:
          b.communicationQuality < 60
            ? "Onboarding communications lagging"
            : "Onboarding cadence healthy",
      };
    case "active_care":
      return {
        score: clamp(
          b.studentEngagementScore * 0.5 +
            b.studentAttendance * 40 +
            b.familyExperienceScore * 0.15
        ),
        friction: clamp((1 - b.studentAttendance) * 70 + b.complaintBurden * 30),
        signal:
          b.studentAttendance < 0.9
            ? "Active-care attendance soft"
            : "Active-care engagement steady",
      };
    case "progression":
      return {
        score: clamp(
          b.studentEngagementScore * 0.4 +
            b.retentionHealthScore * 0.35 +
            b.executionScore * 0.25
        ),
        friction: clamp(
          b.withdrawalRisk * 60 + (100 - b.retentionHealthScore) * 0.3
        ),
        signal:
          b.withdrawalRisk > 0.35
            ? "Progression threatened by withdrawal risk"
            : "Progression path intact",
      };
    case "advocacy":
      return {
        score: clamp(
          b.satisfactionScore * 0.4 +
            b.communityBelongingScore * 0.35 +
            (100 - b.complaintBurden * 100) * 0.25
        ),
        friction: clamp(b.complaintBurden * 70 + (100 - b.belongingIndex) * 0.25),
        signal:
          b.satisfactionScore < 65
            ? "Advocacy constrained by satisfaction"
            : "Advocacy potential strong",
      };
  }
}
