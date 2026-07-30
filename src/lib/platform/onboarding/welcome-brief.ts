/**
 * Sprint 212 — Persist Welcome Executive Brief into briefing store.
 * Application layer — constructs a morning_brief titled as Welcome Executive Brief.
 */

import { saveBriefing } from "@/lib/jag-command-center/briefing-engine/store";
import type {
  JagBriefingRecommendation,
  JagBriefingSection,
  JagExecutiveBriefing,
} from "@/lib/jag-command-center/briefing-engine/types";
import { pushJagNotification } from "@/lib/jag-command-center/notifications";
import { WelcomeService } from "./WelcomeService";
import { recordOnboardingObservation } from "./OnboardingObservability";
import type { OnboardingSession } from "./types";

function emptyExplainability(confidence: number) {
  return {
    evidence: [] as const,
    contributors: ["executive-onboarding"] as const,
    policies: [] as const,
    confidence,
    dependencies: [] as const,
    timeline: [] as const,
  };
}

function section(
  id: JagBriefingSection["id"],
  title: string,
  narrative: string,
  bullets: readonly string[],
  recommendations: readonly JagBriefingRecommendation[] = []
): JagBriefingSection {
  return {
    id,
    title,
    narrative,
    bullets: [...bullets],
    confidence: 0.9,
    evidenceReferences: [],
    contributorSources: ["executive-onboarding"],
    policyReferences: [],
    recommendations,
    decisionIds: [],
    availableActions: [],
  };
}

export function generateWelcomeExecutiveBrief(
  session: OnboardingSession,
  organizationId: string,
  organizationName: string,
  generatedBy: string
): string {
  const payload = WelcomeService.buildWelcomeBrief(session);
  const at = new Date().toISOString();
  const id = `brief.welcome.${organizationId}.${Date.now().toString(36)}`;

  const recommendations: JagBriefingRecommendation[] = payload.nextSteps
    .slice(0, 5)
    .map((step, i) => ({
      id: `welcome-rec-${i}`,
      title: step,
      rationale: "Generated during executive onboarding",
      decisionId: null,
      decisionHref: null,
      organizationId,
      explainability: emptyExplainability(0.85),
    }));

  const briefing: JagExecutiveBriefing = {
    id,
    organizationId,
    organizationName,
    organizationIds: [organizationId],
    organizationNames: [organizationName],
    scope: "single",
    kind: "morning_brief",
    kindLabel: "Welcome Executive Brief",
    generatedAt: at,
    generatedBy,
    window: {
      start: at,
      end: at,
      label: "Onboarding",
      timeline: "today",
    },
    title: payload.title,
    overallConfidence: 0.9,
    sourceCount: 1,
    sections: [
      section(
        "executive_summary",
        "Executive summary",
        payload.summary,
        payload.bullets
      ),
      section(
        "todays_priorities",
        "Recommended next steps",
        "Complete these priorities to operationalize your Executive Intelligence Platform.",
        payload.nextSteps
      ),
      section(
        "recommended_executive_actions",
        "Recommended executive actions",
        "Focus the first week on people, systems, and decisions.",
        payload.nextSteps,
        recommendations
      ),
    ],
    insights: [
      {
        kind: "highest_impact_opportunity",
        label: "Capabilities",
        value: String(session.enabledCapabilityIds.length),
        detail: "Enabled for this workspace",
        decisionId: null,
        decisionHref: null,
        confidence: 0.9,
      },
      {
        kind: "fastest_growing_risk",
        label: "Systems",
        value: String(
          session.connectors.filter((c) => c.selected || c.connected).length
        ),
        detail: "Selected or connected",
        decisionId: null,
        decisionHref: null,
        confidence: 0.8,
      },
    ],
    recommendations,
    notes: [],
    scheduledReview: null,
    shareToken: null,
    hasSubstance: true,
  };

  saveBriefing(briefing);

  pushJagNotification({
    kind: "brief_ready",
    title: "Welcome Executive Brief ready",
    body: briefing.title,
    href: `/jag/briefings/${briefing.id}`,
    organizationId,
    briefingId: briefing.id,
  });

  recordOnboardingObservation({
    kind: "brief_generated",
    sessionId: session.id,
    detail: `Welcome Executive Brief ${briefing.id}`,
    metadata: { organizationId, briefingId: briefing.id },
  });

  return briefing.id;
}
