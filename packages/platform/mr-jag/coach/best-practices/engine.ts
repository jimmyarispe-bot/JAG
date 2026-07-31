/**
 * Best-practice recommendations — workflows, automation, training.
 */

import type { MrJagPersona } from "../../types";
import type { CoachingTone, CoachRecommendation } from "../types";
import { scoreRecommendation } from "../recommendations/priority";

const PRACTICES: readonly {
  persona: MrJagPersona;
  title: string;
  body: string;
  tone: CoachingTone;
  pageId?: string;
}[] = [
  {
    persona: "Teacher",
    title: "Automate attendance reminders",
    body: "Save attendance once, then let notifications handle family updates.",
    tone: "best_practice",
    pageId: "aos.attendance",
  },
  {
    persona: "Finance",
    title: "Confirm invoice channels before send",
    body: "Validate family account, due date, and notification channel.",
    tone: "best_practice",
    pageId: "academyos.finance.2",
  },
  {
    persona: "HR",
    title: "Gate payroll on certifications",
    body: "Block export until timesheets and certifications are verified.",
    tone: "best_practice",
    pageId: "academyos.hr.2",
  },
  {
    persona: "Founder",
    title: "Review release health weekly",
    body: "Use Mission Control and backup milestones before growth pushes.",
    tone: "best_practice",
  },
  {
    persona: "Executive",
    title: "Schedule EI review cadence",
    body: "Open Executive Intelligence after each major operational change.",
    tone: "best_practice",
  },
  {
    persona: "Support",
    title: "Capture resolutions into knowledge",
    body: "After each diagnosis, capture the fix so Coach can nudge sooner next time.",
    tone: "best_practice",
  },
  {
    persona: "Developer",
    title: "Register extensions with evidence",
    body: "Validate APIs through Studio evidence gates before shipping.",
    tone: "best_practice",
  },
  {
    persona: "Admissions",
    title: "Close document gaps early",
    body: "Chase missing documents before enrollment day to avoid last-minute blockers.",
    tone: "best_practice",
  },
  {
    persona: "School Leader",
    title: "Pair staffing with enrollment signals",
    body: "Review campus overview after enrollment spikes.",
    tone: "best_practice",
  },
  {
    persona: "Parent",
    title: "Check progress before billing questions",
    body: "Open student progress, then billing, so context is ready for support.",
    tone: "best_practice",
  },
  {
    persona: "Student",
    title: "Update goals weekly",
    body: "Keep schedule and goals current so coaches can guide accurately.",
    tone: "best_practice",
  },
];

export function bestPracticeRecommendations(input: {
  persona: MrJagPersona;
  trainingCompletion?: number;
  recentActivityBoost?: number;
}): readonly CoachRecommendation[] {
  const now = new Date().toISOString();
  return Object.freeze(
    PRACTICES.filter((p) => p.persona === input.persona).map((p, idx) => {
      const scored = scoreRecommendation({
        urgency: 40,
        businessImpact: 55,
        risk: 20,
        personaFit: 80,
        recentActivity: input.recentActivityBoost ?? 30,
        trainingCompletion: input.trainingCompletion ?? 50,
        confidence: 75,
      });
      return {
        id: `bp:${input.persona}:${idx}`,
        type: "efficiency" as const,
        tone: p.tone,
        persona: input.persona,
        title: p.title,
        body: p.body,
        priorityScore: scored,
        urgency: 40,
        businessImpact: 55,
        riskScore: 20,
        confidence: 75,
        pageId: p.pageId ?? null,
        walkthroughId: null,
        lessonId: null,
        relatedEventKind: null,
        createdAt: now,
      };
    })
  );
}
