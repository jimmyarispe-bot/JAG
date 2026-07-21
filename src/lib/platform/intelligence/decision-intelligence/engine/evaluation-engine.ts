import type { OptionSeed } from "@/lib/platform/intelligence/decision-intelligence/engine/option-generator";
import {
  effortLabel,
  scoreConfidence,
  scoreEffort,
  scoreExpectedImpact,
  scoreRoi,
  scoreStrategicAlignment,
  scoreUrgency,
} from "@/lib/platform/intelligence/decision-intelligence/scoring";
import { evaluatePolicies } from "@/lib/platform/intelligence/decision-intelligence/policies/policy-engine";
import type {
  DecisionEvidence,
  DecisionOption,
  DecisionScorecard,
  ExecutiveMemoryResultLight,
  HistoricalLookup,
  OrganizationalPolicy,
  OutcomeScenario,
} from "@/lib/platform/intelligence/decision-intelligence/types";

export function evaluateOption(input: {
  id: string;
  seed: OptionSeed;
  issueDomains: string[];
  issueSeverity?: number;
  impactIfDelayed?: boolean;
  evidence: DecisionEvidence[];
  historical: HistoricalLookup;
  policies: OrganizationalPolicy[];
  hasContradiction: boolean;
}): DecisionOption {
  const { seed } = input;
  const effort = scoreEffort(seed.category);
  const strategicAlignment = scoreStrategicAlignment({
    domains: seed.dependencies,
    issueDomains: input.issueDomains,
    categoryBoost: seed.categoryBoost,
  });
  const expectedImpact = scoreExpectedImpact({
    financial: seed.financial,
    operational: seed.operational,
    strategic: strategicAlignment,
  });
  const urgency = scoreUrgency({
    issueSeverity: input.issueSeverity,
    impactIfDelayed: input.impactIfDelayed,
  });
  const confidence = scoreConfidence({
    evidenceCount: input.evidence.length,
    historicalMatches: input.historical.similarDecisions.length + input.historical.lessons.length,
    hasContradiction: input.hasContradiction,
  });
  const roi = scoreRoi(expectedImpact, effort);
  const dependenciesScore = Math.round(
    Math.min(100, 40 + seed.dependencies.length * 12)
  );

  // Risk score: higher = more risk (we invert for overall)
  const scorecard: DecisionScorecard = {
    strategicAlignment,
    financialImpact: seed.financial,
    operationalImpact: seed.operational,
    risk: seed.risk,
    timeToImplement: seed.timeToImplement,
    resourceRequirements: seed.resourceRequirements,
    confidence,
    dependencies: dependenciesScore,
    urgency,
    effort,
    expectedImpact,
    roi,
    overall: 0,
  };

  // Overall: reward impact/alignment/roi/confidence; penalize risk/effort/time
  scorecard.overall = Math.round(
    expectedImpact * 0.22 +
      strategicAlignment * 0.18 +
      roi * 0.12 +
      confidence * 0.12 +
      urgency * 0.1 +
      (100 - seed.risk) * 0.12 +
      (100 - effort) * 0.08 +
      (100 - seed.timeToImplement) * 0.06
  );

  const scenarios = buildScenarios(seed, expectedImpact);
  const { flags, approvalRequired } = evaluatePolicies(
    { id: input.id, category: seed.category, scorecard, title: seed.title },
    input.policies
  );

  // Soft-penalize blocked options
  if (flags.some((f) => f.severity === "block")) {
    scorecard.overall = Math.max(0, scorecard.overall - 25);
  }

  return {
    id: input.id,
    title: seed.title,
    summary: seed.summary,
    category: seed.category,
    scorecard,
    scenarios,
    benefits: seed.benefits,
    risks: seed.risks,
    assumptions: seed.assumptions,
    dependencies: seed.dependencies,
    estimatedEffort: effortLabel(effort),
    confidence,
    tradeOffs: buildTradeOffs(seed),
    whyRanked: "",
    policyFlags: flags,
    approvalRequired,
    evidence: input.evidence,
    historical: input.historical,
    rank: 0,
  };
}

function buildScenarios(seed: OptionSeed, expectedImpact: number): OutcomeScenario[] {
  return [
    {
      label: "best",
      narrative: `${seed.title} delivers upside: ${seed.benefits[0] ?? "strong improvement"}.`,
      probability: 0.2,
      impactScore: Math.min(100, expectedImpact + 15),
    },
    {
      label: "expected",
      narrative: `${seed.title} produces the planned outcome with manageable friction.`,
      probability: 0.55,
      impactScore: expectedImpact,
    },
    {
      label: "worst",
      narrative: `${seed.title} underperforms: ${seed.risks[0] ?? "material downside"}.`,
      probability: 0.25,
      impactScore: Math.max(0, expectedImpact - 20),
    },
  ];
}

function buildTradeOffs(seed: OptionSeed): string[] {
  return [
    `Gains: ${seed.benefits[0] ?? "improvement"} vs risk: ${seed.risks[0] ?? "uncertainty"}`,
    `Speed (${seed.timeToImplement}/100 time burden) vs durability of outcome`,
  ];
}

export function lookupHistory(
  memory: ExecutiveMemoryResultLight | undefined,
  issueDomains: string[],
  issueTitle: string
): HistoricalLookup {
  const decisions = memory?.decisions ?? [];
  const lessons = memory?.lessons ?? [];
  const needle = issueTitle.toLowerCase();

  const similarDecisions = decisions
    .filter(
      (d) =>
        (d.domains ?? []).some((dom) => issueDomains.includes(dom)) ||
        (d.title ?? "").toLowerCase().includes(needle.split(" ")[0] ?? "") ||
        (d.decision ?? "").toLowerCase().includes("staff") ||
        (d.decision ?? "").toLowerCase().includes("hire")
    )
    .slice(0, 5)
    .map((d) => ({
      id: d.id ?? "decision",
      title: d.title ?? d.decision ?? "Past decision",
      outcome: d.actualOutcome ?? d.expectedOutcome,
      status: d.status,
    }));

  const matchedLessons = lessons
    .filter(
      (l) =>
        (l.domains ?? []).some((dom) => issueDomains.includes(dom)) ||
        (l.title ?? "").toLowerCase().includes(needle.split(" ")[0] ?? "")
    )
    .slice(0, 5)
    .map((l) => ({
      id: l.id ?? "lesson",
      title: l.title ?? "Lesson",
      summary: l.summary ?? l.whatHappened ?? "",
      repeat: l.repeat ?? [],
      change: l.change ?? [],
    }));

  return {
    similarDecisions,
    lessons: matchedLessons,
    comparableInitiatives: similarDecisions.map((d) => `Initiative from: ${d.title}`),
  };
}
