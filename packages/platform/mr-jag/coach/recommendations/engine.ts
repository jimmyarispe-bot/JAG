/**
 * Coaching recommendation generation — all coaching types + tones.
 */

import { randomUUID } from "node:crypto";
import { recommendLessons } from "../../academy/recommendations/engine";
import { getAcademyProgress } from "../../academy/store";
import { listRegisteredWalkthroughs } from "../../tutorials/registry";
import { normalizePersona } from "../../personas";
import { bestPracticeRecommendations } from "../best-practices/engine";
import { findBuiltInEvent } from "../events/catalog";
import { listHitMilestones } from "../milestones";
import { detectCoachRisks } from "../risk/detector";
import {
  listEvents,
  listRecommendations,
  listTimeline,
  upsertRecommendation,
  appendTimeline,
} from "../store";
import type {
  CoachEventKind,
  CoachRecommendation,
  CoachingTone,
  CoachingType,
} from "../types";
import { scoreRecommendation } from "./priority";

function toneForMilestone(kind: CoachEventKind): CoachingTone {
  if (String(kind).startsWith("first_")) return "congratulations";
  return "suggestion";
}

function stableRecId(
  persona: string,
  type: CoachingType,
  tone: CoachingTone,
  title: string
): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return `rec:${persona}:${type}:${tone}:${slug}`;
}

function buildRec(input: {
  type: CoachingType;
  tone: CoachingTone;
  persona: ReturnType<typeof normalizePersona>;
  title: string;
  body: string;
  urgency: number;
  businessImpact: number;
  risk: number;
  confidence: number;
  trainingCompletion: number;
  recentActivity: number;
  pageId?: string | null;
  walkthroughId?: string | null;
  lessonId?: string | null;
  relatedEventKind?: CoachEventKind | null;
}): CoachRecommendation {
  const priorityScore = scoreRecommendation({
    urgency: input.urgency,
    businessImpact: input.businessImpact,
    risk: input.risk,
    personaFit: 85,
    recentActivity: input.recentActivity,
    trainingCompletion: input.trainingCompletion,
    confidence: input.confidence,
  });
  return {
    id: stableRecId(input.persona, input.type, input.tone, input.title),
    type: input.type,
    tone: input.tone,
    persona: input.persona,
    title: input.title,
    body: input.body,
    priorityScore,
    urgency: input.urgency,
    businessImpact: input.businessImpact,
    riskScore: input.risk,
    confidence: input.confidence,
    pageId: input.pageId ?? null,
    walkthroughId: input.walkthroughId ?? null,
    lessonId: input.lessonId ?? null,
    relatedEventKind: input.relatedEventKind ?? null,
    createdAt: new Date().toISOString(),
  };
}

export function generateCoachRecommendations(input: {
  organizationId: string;
  userId: string;
  persona?: string | null;
  signals?: Parameters<typeof detectCoachRisks>[0]["signals"];
}): readonly CoachRecommendation[] {
  const persona = normalizePersona(input.persona);
  const academy = getAcademyProgress(input.organizationId, input.userId);
  const training = academy?.pathCompletionPercent ?? 0;
  const recent = listEvents({
    organizationId: input.organizationId,
    userId: input.userId,
    limit: 20,
  });
  const recentActivity = Math.min(100, recent.length * 12);
  const walks = listRegisteredWalkthroughs({ persona });
  const recs: CoachRecommendation[] = [];

  // Milestone congratulations + next steps
  for (const kind of listHitMilestones({
    organizationId: input.organizationId,
    userId: input.userId,
  })) {
    const def = findBuiltInEvent(kind);
    const walk = walks.find((w) =>
      def?.personas.includes(persona)
    );
    recs.push(
      buildRec({
        type: "milestone",
        tone: toneForMilestone(kind),
        persona,
        title: `Congratulations — ${def?.title ?? kind}`,
        body: `You completed ${def?.title ?? kind}. Keep momentum with the recommended next step.`,
        urgency: 35,
        businessImpact: 50,
        risk: 10,
        confidence: 90,
        trainingCompletion: training,
        recentActivity,
        pageId: walk?.pageId ?? null,
        walkthroughId: walk?.id ?? null,
        relatedEventKind: kind,
      })
    );
    recs.push(
      buildRec({
        type: "milestone",
        tone: "next_step",
        persona,
        title: `Recommended next step after ${def?.title ?? kind}`,
        body: "Open the linked walkthrough or Academy lesson to reinforce the workflow.",
        urgency: 55,
        businessImpact: 60,
        risk: 15,
        confidence: 80,
        trainingCompletion: training,
        recentActivity,
        pageId: walk?.pageId ?? null,
        walkthroughId: walk?.id ?? null,
        relatedEventKind: kind,
      })
    );
  }

  // Risk coaching
  for (const risk of detectCoachRisks(input)) {
    recs.push(
      buildRec({
        type: risk.kind.includes("payroll") || risk.kind.includes("cert")
          ? "compliance"
          : "risk",
        tone: "warning",
        persona,
        title: risk.title,
        body: risk.body,
        urgency:
          risk.severity === "critical"
            ? 95
            : risk.severity === "high"
              ? 80
              : 60,
        businessImpact: 75,
        risk:
          risk.severity === "critical"
            ? 95
            : risk.severity === "high"
              ? 80
              : 55,
        confidence: 85,
        trainingCompletion: training,
        recentActivity,
        relatedEventKind: risk.relatedEventKinds[0] ?? null,
      })
    );
  }

  // Best practices / efficiency
  recs.push(
    ...bestPracticeRecommendations({
      persona,
      trainingCompletion: training,
      recentActivityBoost: recentActivity,
    })
  );

  // Behavior coaching
  if (recent.some((e) => e.kind === "first_attendance")) {
    recs.push(
      buildRec({
        type: "behavior",
        tone: "suggestion",
        persona,
        title: "Build a daily attendance habit",
        body: "Complete attendance within the first 10 minutes of class for cleaner family notifications.",
        urgency: 45,
        businessImpact: 50,
        risk: 25,
        confidence: 70,
        trainingCompletion: training,
        recentActivity,
        pageId: "aos.attendance",
      })
    );
  }

  // Learning coaching via Academy (read-only)
  const lessons = recommendLessons({
    organizationId: input.organizationId,
    userId: input.userId,
    persona,
    coachPageIds: recent
      .map((e) => String(e.metadata?.pageId ?? ""))
      .filter(Boolean),
    limit: 3,
  });
  for (const lesson of lessons) {
    recs.push(
      buildRec({
        type: "learning",
        tone: "learning",
        persona,
        title: `Learn: ${lesson.title}`,
        body: lesson.description,
        urgency: 40,
        businessImpact: 45,
        risk: 20,
        confidence: 75,
        trainingCompletion: training,
        recentActivity,
        pageId: lesson.pageId,
        lessonId: lesson.lessonId,
      })
    );
  }

  // Executive coaching
  if (persona === "Executive" || persona === "Founder") {
    recs.push(
      buildRec({
        type: "executive",
        tone: "workflow",
        persona,
        title: "Review operational risks before decisions",
        body: "Open Coach risks and Executive Intelligence before approving major changes.",
        urgency: 50,
        businessImpact: 85,
        risk: 40,
        confidence: 80,
        trainingCompletion: training,
        recentActivity,
      })
    );
  }

  // Workflow guidance
  recs.push(
    buildRec({
      type: "behavior",
      tone: "workflow",
      persona,
      title: `Workflow guidance for ${persona}`,
      body: "Follow persona-focused paths in Academy, then return here for proactive nudges.",
      urgency: 30,
      businessImpact: 40,
      risk: 10,
      confidence: 65,
      trainingCompletion: training,
      recentActivity,
    })
  );

  const sorted = [...recs].sort((a, b) => b.priorityScore - a.priorityScore);
  const top = sorted.slice(0, 24);
  const existingTitles = new Set(
    listTimeline({
      organizationId: input.organizationId,
      userId: input.userId,
      status: "active",
      limit: 200,
    }).map((t) => t.title)
  );
  for (const rec of top) {
    upsertRecommendation(rec);
    if (existingTitles.has(rec.title)) continue;
    existingTitles.add(rec.title);
    appendTimeline({
      id: `tl:${randomUUID()}`,
      organizationId: input.organizationId,
      userId: input.userId,
      kind: "recommendation",
      title: rec.title,
      body: rec.body,
      status: "active",
      relatedId: rec.id,
      createdAt: rec.createdAt,
      updatedAt: rec.createdAt,
    });
  }

  return Object.freeze(top);
}

export function recommendationsForPersona(
  persona?: string | null
): readonly CoachRecommendation[] {
  return listRecommendations({
    persona: persona ? normalizePersona(persona) : undefined,
  });
}
