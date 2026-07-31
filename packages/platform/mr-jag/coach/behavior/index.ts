/**
 * Behavior coaching — habits from recent activity patterns.
 */

import { listEvents } from "../store";
import type { CoachRecommendation } from "../types";
import { scoreRecommendation } from "../recommendations/priority";
import { normalizePersona } from "../../personas";

export function behaviorInsights(input: {
  organizationId: string;
  userId: string;
  persona?: string | null;
}): readonly CoachRecommendation[] {
  const persona = normalizePersona(input.persona);
  const events = listEvents({
    organizationId: input.organizationId,
    userId: input.userId,
    limit: 50,
  });
  const kinds = new Set(events.map((e) => e.kind));
  const now = new Date().toISOString();
  const out: CoachRecommendation[] = [];

  if (kinds.has("first_login") && !kinds.has("first_attendance") && persona === "Teacher") {
    const priorityScore = scoreRecommendation({
      urgency: 60,
      businessImpact: 55,
      risk: 30,
      personaFit: 90,
      recentActivity: 40,
      trainingCompletion: 30,
      confidence: 70,
    });
    out.push({
      id: `beh:attendance-habit`,
      type: "behavior",
      tone: "suggestion",
      persona,
      title: "Start attendance early",
      body: "Teachers who record attendance on day one reduce family follow-up volume.",
      priorityScore,
      urgency: 60,
      businessImpact: 55,
      riskScore: 30,
      confidence: 70,
      pageId: "aos.attendance",
      walkthroughId: "wt.teacher.attendance",
      lessonId: "lesson:aos.attendance",
      relatedEventKind: "first_attendance",
      createdAt: now,
    });
  }

  if (kinds.has("first_payroll") && persona === "HR") {
    out.push({
      id: `beh:payroll-checklist`,
      type: "behavior",
      tone: "suggestion",
      persona,
      title: "Use a payroll checklist",
      body: "Review timesheets, certifications, then approvals — in that order — every cycle.",
      priorityScore: scoreRecommendation({
        urgency: 70,
        businessImpact: 80,
        risk: 70,
        personaFit: 90,
        recentActivity: 50,
        trainingCompletion: 40,
        confidence: 80,
      }),
      urgency: 70,
      businessImpact: 80,
      riskScore: 70,
      confidence: 80,
      pageId: "academyos.hr.2",
      walkthroughId: null,
      lessonId: null,
      relatedEventKind: "first_payroll",
      createdAt: now,
    });
  }

  return Object.freeze(out);
}
