/**
 * AlignmentEngine — map decisions to mission / pillars / goals — Sprint 205.
 */

import type {
  AlignmentImpact,
  DecisionStrategicAlignment,
  OrganizationalMission,
  StrategicGoal,
  StrategicPillar,
} from "./types";

export type AlignmentQuery = {
  readonly organizationId: string;
  readonly decisionId: string;
  readonly title: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly contributorIds?: readonly string[];
};

const PILLAR_KEYWORDS: Record<string, readonly string[]> = {
  student_outcomes: ["student", "learning", "achievement", "mastery", "attendance"],
  family_experience: ["family", "parent", "enrollment", "experience"],
  financial_sustainability: ["funding", "budget", "tuition", "finance", "cost"],
  team_excellence: ["teacher", "staff", "hiring", "retention", "turnover"],
  innovation: ["innovation", "pilot", "new program", "technology"],
  operational_excellence: ["operations", "capacity", "schedule", "process"],
  compliance: ["compliance", "policy", "audit", "regulation"],
};

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2)
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let hit = 0;
  for (const t of a) if (b.has(t)) hit += 1;
  return hit / Math.max(a.size, b.size);
}

export function calculateDecisionAlignment(input: {
  readonly query: AlignmentQuery;
  readonly mission: OrganizationalMission | null;
  readonly pillars: readonly StrategicPillar[];
  readonly goals: readonly StrategicGoal[];
}): DecisionStrategicAlignment {
  const hay = `${input.query.title} ${input.query.description ?? ""} ${(input.query.tags ?? []).join(" ")}`;
  const tokens = tokenize(hay);

  const matchedPillars = input.pillars.filter((p) => {
    const keys = PILLAR_KEYWORDS[p.kind] ?? [];
    const labelTokens = tokenize(`${p.label} ${p.description}`);
    return (
      keys.some((k) => hay.toLowerCase().includes(k)) ||
      overlapScore(tokens, labelTokens) >= 0.12
    );
  });

  const matchedGoals = input.goals
    .map((g) => {
      const gTokens = tokenize(`${g.title} ${g.description}`);
      const score =
        overlapScore(tokens, gTokens) +
        (matchedPillars.some((p) => p.id === g.pillarId) ? 0.15 : 0);
      return { goal: g, score };
    })
    .filter((x) => x.score >= 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const missionTokens = tokenize(
    `${input.mission?.mission ?? ""} ${input.mission?.vision ?? ""}`
  );
  const missionAlignment = Number(
    Math.min(
      0.98,
      0.25 +
        overlapScore(tokens, missionTokens) * 0.55 +
        matchedGoals.length * 0.08 +
        matchedPillars.length * 0.05
    ).toFixed(3)
  );

  let impact: AlignmentImpact = "unknown";
  const negative =
    /cut|reduce|close|defer|delay|freeze|cancel|decline/i.test(hay);
  const positive =
    /improve|grow|invest|hire|expand|stabilize|support|launch/i.test(hay);
  if (positive && !negative) impact = "positive";
  else if (negative && !positive) impact = "negative";
  else if (matchedGoals.length > 0) impact = "positive";

  const confidence = Number(
    Math.min(
      0.92,
      0.35 + matchedGoals.length * 0.12 + matchedPillars.length * 0.08
    ).toFixed(3)
  );

  const rationale =
    matchedGoals.length === 0 && matchedPillars.length === 0
      ? "No strong pillar/goal match — mission alignment is weak or unknown."
      : `Aligns with ${matchedPillars.length} pillar(s) and ${matchedGoals.length} goal(s); mission fit ${(missionAlignment * 100).toFixed(0)}%.`;

  return {
    decisionId: input.query.decisionId,
    organizationId: input.query.organizationId,
    goalIds: matchedGoals.map((m) => m.goal.id),
    pillarIds: matchedPillars.map((p) => p.id),
    missionAlignment,
    impact,
    rationale,
    confidence,
  };
}

export function organizationAlignmentScore(input: {
  readonly goals: readonly StrategicGoal[];
  readonly alignments?: readonly DecisionStrategicAlignment[];
}): number {
  if (input.goals.length === 0) return 0;
  const healthWeight: Record<string, number> = {
    achieved: 1,
    on_track: 0.85,
    watch: 0.55,
    at_risk: 0.3,
    blocked: 0.1,
    unknown: 0.4,
  };
  const goalScore =
    input.goals.reduce(
      (a, g) => a + (healthWeight[g.health] ?? 0.4) * (0.5 + g.progress * 0.5),
      0
    ) / input.goals.length;

  const alignments = input.alignments ?? [];
  const alignScore =
    alignments.length === 0
      ? 0.5
      : alignments.reduce((a, x) => a + x.missionAlignment, 0) /
        alignments.length;

  return Number((goalScore * 0.7 + alignScore * 0.3).toFixed(3));
}
