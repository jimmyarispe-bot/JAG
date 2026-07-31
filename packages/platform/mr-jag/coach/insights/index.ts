/**
 * Coach insights — summary strings for dashboard / timeline.
 */

import { listEvents, listRisks, listTimeline } from "../store";
import { listCoachGoals } from "../goals/service";
import { onboardingCompletionPercent } from "../milestones";
import { normalizePersona } from "../../personas";

export function buildCoachInsights(input: {
  organizationId: string;
  userId: string;
  persona?: string | null;
}): readonly string[] {
  const persona = normalizePersona(input.persona);
  const events = listEvents({
    organizationId: input.organizationId,
    userId: input.userId,
    limit: 50,
  });
  const risks = listRisks({
    organizationId: input.organizationId,
    userId: input.userId,
    openOnly: true,
  });
  const goals = listCoachGoals(input);
  const accepted = listTimeline({
    organizationId: input.organizationId,
    userId: input.userId,
    status: "accepted",
    limit: 50,
  }).length;
  const onboarding = onboardingCompletionPercent({
    organizationId: input.organizationId,
    userId: input.userId,
    persona,
  });

  return Object.freeze([
    `${persona} has ${events.length} observed coach event(s).`,
    `Onboarding milestones at ${onboarding}%.`,
    `${risks.length} open risk(s) need attention.`,
    `${accepted} recommendation(s) accepted.`,
    `Average goal completion ${
      goals.length === 0
        ? 0
        : Math.round(
            goals.reduce((a, g) => a + g.completionPercent, 0) / goals.length
          )
    }%.`,
  ]);
}
