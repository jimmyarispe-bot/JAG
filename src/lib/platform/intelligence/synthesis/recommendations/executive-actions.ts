import type { RootCauseAnalysis, SynthesisScores } from "@/lib/platform/intelligence/synthesis/types";

export function proposeExecutiveActions(
  rootCause: RootCauseAnalysis,
  scores: SynthesisScores
): string[] {
  const actions: string[] = [];
  if (rootCause.affectedDomains.some((d) => /human-capital|hr|staff/i.test(d))) {
    actions.push("Stand up a staffing war-room: vacancy fill targets, retention offers, and substitute coverage plan.");
  }
  if (rootCause.affectedDomains.some((d) => /finance|revenue|funding/i.test(d))) {
    actions.push("Review 13-week cash forecast and freeze non-critical spend until variance is explained.");
  }
  if (rootCause.affectedDomains.some((d) => /customer|admissions|enrollment/i.test(d))) {
    actions.push("Launch parent confidence outreach and admissions pipeline audit for at-risk campuses.");
  }
  if (scores.priority === "critical" || scores.priority === "high") {
    actions.push("Brief CEO/Founder within 24 hours with explainability pack and decision options.");
  }
  if (!actions.length) {
    actions.push("Continue cross-domain monitoring; assign an owner to re-run synthesis after next data refresh.");
  }
  return actions;
}
