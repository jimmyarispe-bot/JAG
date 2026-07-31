/**
 * Lightweight nudges derived from open risks + upcoming goals.
 */

import { listGoals, listRisks } from "../store";
import type { CoachRecommendation } from "../types";
import { normalizePersona } from "../../personas";
import { scoreRecommendation } from "../recommendations/priority";

export function buildNudges(input: {
  organizationId: string;
  userId: string;
  persona?: string | null;
}): readonly CoachRecommendation[] {
  const persona = normalizePersona(input.persona);
  const now = new Date().toISOString();
  const nudges: CoachRecommendation[] = [];

  for (const risk of listRisks({
    organizationId: input.organizationId,
    userId: input.userId,
    openOnly: true,
  }).slice(0, 3)) {
    nudges.push({
      id: `nudge:risk:${risk.id}`,
      type: "risk",
      tone: "warning",
      persona,
      title: `Nudge: ${risk.title}`,
      body: risk.body,
      priorityScore: scoreRecommendation({
        urgency: risk.severity === "critical" ? 95 : 70,
        businessImpact: 70,
        risk: 80,
        personaFit: 80,
        recentActivity: 40,
        trainingCompletion: 40,
        confidence: 75,
      }),
      urgency: 70,
      businessImpact: 70,
      riskScore: 80,
      confidence: 75,
      pageId: null,
      walkthroughId: null,
      lessonId: null,
      relatedEventKind: risk.relatedEventKinds[0] ?? null,
      createdAt: now,
    });
  }

  for (const goal of listGoals(input)
    .filter((g) => g.completionPercent < 100)
    .slice(0, 2)) {
    nudges.push({
      id: `nudge:goal:${goal.id}`,
      type: "behavior",
      tone: "next_step",
      persona,
      title: `Goal nudge: ${goal.title}`,
      body: `${goal.completionPercent}% complete — ${goal.description}`,
      priorityScore: scoreRecommendation({
        urgency: 50,
        businessImpact: 45,
        risk: 15,
        personaFit: 75,
        recentActivity: 35,
        trainingCompletion: 40,
        confidence: 70,
      }),
      urgency: 50,
      businessImpact: 45,
      riskScore: 15,
      confidence: 70,
      pageId: null,
      walkthroughId: null,
      lessonId: null,
      relatedEventKind: goal.relatedEventKind ?? null,
      createdAt: now,
    });
  }

  return Object.freeze(nudges);
}
