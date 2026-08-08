/**
 * Strategic Intelligence loaders for Command Center — Sprint 205.
 */

import {
  StrategyService,
  listStrategyObservations,
  type DecisionStrategicAlignment,
  type StrategyScorecard,
  type StrategyWorkspaceBundle,
} from "@/lib/platform/intelligence/strategy/index";
import { MemoryService } from "@/lib/platform/intelligence/memory/index";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { resolveActiveWorkspaceOrganization } from "@/lib/jag-platform/active-organization";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

export { listStrategyObservations };

export type JagStrategyWorkspaceModel = {
  readonly organizationId: string | null;
  readonly organizationName: string | null;
  readonly organizations: readonly { id: string; label: string }[];
  readonly bundle: StrategyWorkspaceBundle | null;
  readonly historical: {
    readonly initiativeTitles: readonly string[];
    readonly lessons: readonly string[];
    readonly similar: readonly {
      title: string;
      outcome: string;
      lessons: readonly string[];
      confidence: number;
      href: string;
    }[];
  };
  readonly advisoryNotice: string;
  readonly explanation: string;
};

export function loadStrategyWorkspace(
  session: JagPlatformSession,
  options?: { organizationId?: string }
): JagStrategyWorkspaceModel {
  const orgs = listOrganizationsForSession(session);
  const org = resolveActiveWorkspaceOrganization(session, options?.organizationId);

  const advisoryNotice =
    "Strategic intelligence — why we exist, where we are going, and whether today's work advances tomorrow's vision.";

  if (!org) {
    return {
      organizationId: null,
      organizationName: null,
      organizations: [],
      bundle: null,
      historical: { initiativeTitles: [], lessons: [], similar: [] },
      advisoryNotice,
      explanation: "Select an organization to view mission alignment.",
    };
  }

  const bundle = StrategyService.workspace(org.id, org.name);
  const historical = loadStrategicMemoryContext(org.id);

  return {
    organizationId: org.id,
    organizationName: org.name,
    organizations: orgs.map((o) => ({ id: o.id, label: o.name })),
    bundle,
    historical,
    advisoryNotice: bundle.advisoryNotice,
    explanation:
      "Mission → pillars → goals → initiatives → decisions → outcomes. Alignment is advisory.",
  };
}

export function loadStrategicMemoryContext(organizationId: string): {
  readonly initiativeTitles: readonly string[];
  readonly lessons: readonly string[];
  readonly similar: readonly {
    title: string;
    outcome: string;
    lessons: readonly string[];
    confidence: number;
    href: string;
  }[];
} {
  const search = MemoryService.search(organizationId, {
    q: "strategy initiative goal",
  });
  const lessons = search.records
    .filter((r) => r.type === "lesson_learned")
    .slice(0, 4)
    .map((r) => r.title);
  const initiativeTitles = search.records
    .filter((r) => /initiative|strategy|strategic/i.test(`${r.title} ${r.tags.join(" ")}`))
    .slice(0, 4)
    .map((r) => r.title);
  const similar = MemoryService.similarSituations(
    {
      organizationId,
      title: "Strategic initiative execution",
      description: "Mission-aligned goal delivery and prior strategy cycles",
      tags: ["strategy", "initiative", "goal"],
    },
    4
  ).situations.map((s) => ({
    title: s.title,
    outcome: s.outcome,
    lessons: s.lessons,
    confidence: s.confidence,
    href: s.href,
  }));

  return { initiativeTitles, lessons, similar };
}

export function loadDecisionStrategicAlignment(input: {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly decisionId: string;
  readonly title: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly contributorIds?: readonly string[];
}): DecisionStrategicAlignment {
  StrategyService.ensureOrganization(
    input.organizationId,
    input.organizationName
  );
  return StrategyService.alignDecision({
    organizationId: input.organizationId,
    decisionId: input.decisionId,
    title: input.title,
    description: input.description,
    tags: input.tags,
    contributorIds: input.contributorIds,
  });
}

export function runStrategicAlignmentForBriefing(input: {
  readonly organizationId: string;
  readonly organizationName: string;
}): {
  readonly scorecard: StrategyScorecard;
  readonly forecastTrend: string;
  readonly strategicRisks: readonly string[];
} {
  StrategyService.ensureOrganization(
    input.organizationId,
    input.organizationName
  );
  const scorecard = StrategyService.scorecard(
    input.organizationId,
    input.organizationName
  );
  const forecast = StrategyService.forecast(input.organizationId);
  return {
    scorecard,
    forecastTrend: forecast.missionProgressTrend,
    strategicRisks: forecast.strategicRisks,
  };
}

export function scenarioStrategicImpact(input: {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly scenarioTitle: string;
  readonly scenarioSummary: string;
}): {
  readonly goalImpact: string;
  readonly missionImpact: string;
  readonly tradeOffs: readonly string[];
  readonly alignmentScore: number;
} {
  StrategyService.ensureOrganization(
    input.organizationId,
    input.organizationName
  );
  const alignment = StrategyService.alignDecision({
    organizationId: input.organizationId,
    decisionId: `scenario-${input.scenarioTitle.slice(0, 24)}`,
    title: input.scenarioTitle,
    description: input.scenarioSummary,
    tags: ["scenario", "strategy"],
  });
  const goals = StrategyService.listGoals(input.organizationId);
  const linked = goals.filter((g) => alignment.goalIds.includes(g.id));
  const goalImpact =
    linked.length === 0
      ? "No strong goal linkage detected for this scenario."
      : `Likely affects: ${linked.map((g) => g.title).join("; ")}.`;
  const mission = StrategyService.getMission(input.organizationId);
  const missionImpact = `Mission alignment ${(alignment.missionAlignment * 100).toFixed(0)}% (${alignment.impact}). ${mission?.mission.slice(0, 100) ?? ""}`;
  const tradeOffs = [
    alignment.impact === "negative"
      ? "Trade-off: may slow mission progress while addressing near-term pressure."
      : "Trade-off: advances selected goals; monitor capacity and funding side-effects.",
    ...StrategyService.forecast(input.organizationId).strategicRisks.slice(0, 2),
  ];
  return {
    goalImpact,
    missionImpact,
    tradeOffs,
    alignmentScore: alignment.missionAlignment,
  };
}
