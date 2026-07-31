/**
 * MrJagCoachEngine — proactive operational coaching orchestrator (P-004).
 */

import { normalizePersona } from "../../personas";
import { getCoachAnalytics } from "../analytics/service";
import { behaviorInsights } from "../behavior";
import {
  listRegisteredCoachEvents,
  observeCoachEvent,
  registerCoachEvent,
} from "../events/observe";
import { syncHelpIncidentsIntoCoach } from "../events/help-bridge";
import {
  createCoachGoal,
  incrementGoalProgress,
  listCoachGoals,
  seedDefaultGoals,
} from "../goals/service";
import { buildCoachInsights } from "../insights";
import {
  listHitMilestones,
  milestoneCount,
  onboardingCompletionPercent,
  recentMilestoneEvents,
} from "../milestones";
import { buildNudges } from "../nudges";
import {
  generateCoachRecommendations,
  recommendationsForPersona,
} from "../recommendations/engine";
import { closeCoachRisk, detectCoachRisks } from "../risk/detector";
import {
  getRecommendation,
  listEvents,
  listRisks,
  listTimeline,
  updateTimeline,
} from "../store";
import type {
  CoachDashboard,
  CoachEventKind,
  CustomEventRegistration,
} from "../types";

export class MrJagCoachEngine {
  registerEvent = registerCoachEvent;
  listEventCatalog = listRegisteredCoachEvents;

  observe(input: {
    kind: CoachEventKind;
    organizationId: string;
    userId: string;
    persona?: string | null;
    metadata?: Readonly<Record<string, string | number | boolean>>;
    allowRepeat?: boolean;
    /** When true, regenerate recommendations after observe. */
    refresh?: boolean;
    signals?: Parameters<typeof detectCoachRisks>[0]["signals"];
  }) {
    const event = observeCoachEvent(input);
    const recommendations =
      input.refresh === false
        ? recommendationsForPersona(input.persona)
        : this.recommend({
            organizationId: input.organizationId,
            userId: input.userId,
            persona: input.persona,
            signals: input.signals,
          });
    return { event, recommendations };
  }

  observeMany(input: {
    kinds: readonly CoachEventKind[];
    organizationId: string;
    userId: string;
    persona?: string | null;
    signals?: Parameters<typeof detectCoachRisks>[0]["signals"];
  }) {
    const events = input.kinds.map((kind) =>
      observeCoachEvent({
        kind,
        organizationId: input.organizationId,
        userId: input.userId,
        persona: input.persona,
      })
    );
    const recommendations = this.recommend({
      organizationId: input.organizationId,
      userId: input.userId,
      persona: input.persona,
      signals: input.signals,
    });
    return { events, recommendations };
  }

  /** Pull Help Center incidents into coach signals (Help unchanged). */
  syncFromHelpCenter(input: {
    organizationId: string;
    userId?: string;
  }) {
    return syncHelpIncidentsIntoCoach(input);
  }

  listEvents = listEvents;
  milestones = listHitMilestones;
  milestoneCount = milestoneCount;
  onboardingPercent = onboardingCompletionPercent;
  recentMilestones = recentMilestoneEvents;

  recommend = generateCoachRecommendations;
  recommendationsForPersona = recommendationsForPersona;
  behavior = behaviorInsights;
  nudges = buildNudges;
  insights = buildCoachInsights;

  detectRisks = detectCoachRisks;
  closeRisk = closeCoachRisk;
  listRisks = listRisks;

  createGoal = createCoachGoal;
  listGoals = listCoachGoals;
  seedGoals = seedDefaultGoals;
  incrementGoal = incrementGoalProgress;

  timeline(input: {
    organizationId: string;
    userId: string;
    status?: "active" | "accepted" | "dismissed" | "completed";
    limit?: number;
  }) {
    return listTimeline(input);
  }

  acceptRecommendation(input: {
    organizationId: string;
    userId: string;
    recommendationId: string;
  }) {
    const rec = getRecommendation(input.recommendationId);
    const entries = listTimeline({
      organizationId: input.organizationId,
      userId: input.userId,
      limit: 200,
    }).filter(
      (t) =>
        t.relatedId === input.recommendationId ||
        (rec != null && t.title === rec.title)
    );
    const updated = entries.map((e) =>
      updateTimeline(e.id, { status: "accepted" })
    );
    const daily = listCoachGoals({
      organizationId: input.organizationId,
      userId: input.userId,
    }).find((g) => g.horizon === "daily");
    if (daily) incrementGoalProgress(daily.id, 1);
    return { recommendation: rec, timeline: updated };
  }

  dismissRecommendation(input: {
    organizationId: string;
    userId: string;
    recommendationId: string;
  }) {
    const rec = getRecommendation(input.recommendationId);
    const entries = listTimeline({
      organizationId: input.organizationId,
      userId: input.userId,
      limit: 200,
    }).filter(
      (t) =>
        t.relatedId === input.recommendationId ||
        (rec != null && t.title === rec.title)
    );
    const updated = entries.map((e) =>
      updateTimeline(e.id, { status: "dismissed" })
    );
    return { recommendation: rec, timeline: updated };
  }

  completeGuidance(input: {
    organizationId: string;
    userId: string;
    timelineId: string;
  }) {
    return updateTimeline(input.timelineId, { status: "completed" });
  }

  analytics = getCoachAnalytics;

  dashboard(input: {
    organizationId: string;
    userId: string;
    persona?: string | null;
    signals?: Parameters<typeof detectCoachRisks>[0]["signals"];
  }): CoachDashboard {
    const persona = normalizePersona(input.persona);
    seedDefaultGoals({ ...input, persona });
    const recommendations = this.recommend({
      organizationId: input.organizationId,
      userId: input.userId,
      persona,
      signals: input.signals,
    });
    const openRisks = this.detectRisks({
      organizationId: input.organizationId,
      userId: input.userId,
      persona,
      signals: input.signals,
    });
    const goals = this.listGoals({
      organizationId: input.organizationId,
      userId: input.userId,
    });
    const timeline = this.timeline({
      organizationId: input.organizationId,
      userId: input.userId,
      limit: 100,
    });
    const accepted = timeline.filter((t) => t.status === "accepted").length;
    const goalsPct =
      goals.length === 0
        ? 0
        : Math.round(
            goals.reduce((a, g) => a + g.completionPercent, 0) / goals.length
          );

    const todays = recommendations.slice(0, 6);
    return {
      generatedAt: new Date().toISOString(),
      todaysCoaching: todays,
      recommendedActions: recommendations
        .filter((r) => r.tone === "next_step" || r.tone === "suggestion")
        .slice(0, 8),
      congratulations: recommendations
        .filter((r) => r.tone === "congratulations")
        .slice(0, 6),
      warnings: recommendations.filter((r) => r.tone === "warning").slice(0, 6),
      openRisks,
      learningSuggestions: recommendations
        .filter((r) => r.type === "learning" || r.tone === "learning")
        .slice(0, 6),
      progress: {
        eventsObserved: listEvents({
          organizationId: input.organizationId,
          userId: input.userId,
          limit: 500,
        }).length,
        milestonesHit: milestoneCount(input.organizationId, input.userId),
        goalsCompletionPercent: goalsPct,
        acceptedRecommendations: accepted,
      },
      upcomingGoals: Object.freeze(
        goals.filter((g) => g.completionPercent < 100).slice(0, 6)
      ),
    };
  }

  registerCustomEvent(reg: CustomEventRegistration) {
    return this.registerEvent(reg);
  }
}

export function createMrJagCoachEngine(): MrJagCoachEngine {
  return new MrJagCoachEngine();
}
