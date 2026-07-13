import { DEFAULT_EXEC_SCOPE, getExecIntelligence } from "@/lib/exec/intelligence";
import type { ExecBriefViewModel } from "@/lib/exec/view-models";

/**
 * Executive Brief — composed primarily from Wisdom Intelligence
 * (with OIOS soft context). Structure follows ECC spec §3 order.
 */
export function loadExecBrief(): ExecBriefViewModel {
  const intelligence = getExecIntelligence();
  const scope = { ...DEFAULT_EXEC_SCOPE };
  const requestId = `exec-brief-${Date.now()}`;

  const oios = intelligence.oios.service.build({ requestId: `${requestId}-oios`, scope });
  const wisdom = intelligence.wisdom.service.build({
    requestId: `${requestId}-wisdom`,
    scope,
    oiosResult: oios,
  });
  const opportunity = intelligence.opportunity.service.build({
    requestId: `${requestId}-opp`,
    scope,
  });

  const whatHappened = [
    wisdom.brief.summary,
    `Organization health index at ${Math.round(oios.health.score)} (${oios.health.band}).`,
    `Wisdom outlook: ${wisdom.brief.outlook}.`,
    ...wisdom.dashboard.topRisks.slice(0, 2).map((r) => `Risk signal: ${r}`),
  ].slice(0, 5);

  const whyItMatters = [
    wisdom.brief.judgment.why,
    wisdom.brief.judgment.whyNow,
    `Health dimensions — financial ${Math.round(oios.health.dimensions.financial)}, execution ${Math.round(oios.health.dimensions.execution)}.`,
    wisdom.brief.lenses.longTermImpact,
  ].slice(0, 4);

  const confidence = wisdom.confidence ?? {
    value: wisdom.baseline.confidenceLevel / 100,
    level: "medium",
    factors: [],
  };

  return {
    generatedAt: wisdom.brief.generatedAt || new Date().toISOString(),
    headline: wisdom.brief.headline,
    whatHappened,
    whyItMatters,
    recommendedActions: wisdom.recommendations.slice(0, 5).map((rec) => ({
      id: rec.id,
      title: rec.action || rec.title,
      subtitle: rec.rationale,
      priority: rec.priority,
      score: Math.round(rec.confidenceScore * 100),
      href: "/exec/actions",
    })),
    risks: wisdom.risks.slice(0, 3).map((r) => ({
      id: r.id,
      title: r.title,
      subtitle: r.mitigation,
      priority: r.severity,
      score: Math.round(r.score),
      href: "/exec/risks",
    })),
    opportunities: (opportunity.exchange ?? []).slice(0, 3).map((o) => ({
      id: o.id,
      title: o.title,
      subtitle: o.category.replaceAll("_", " "),
      priority: o.priority,
      score: Math.round(o.score),
      href: "/exec/opportunities",
    })),
    confidence: {
      value: Math.round((confidence.value <= 1 ? confidence.value * 100 : confidence.value) * 10) / 10,
      level: String(confidence.level),
      factors: (confidence.factors ?? []).slice(0, 6).map((f) => ({
        label: f.label,
        contribution: f.contribution,
      })),
    },
    evidence: [
      ...wisdom.recommendations.flatMap((r) => r.evidenceRefs).slice(0, 6),
      wisdom.brief.judgment.evidence,
    ].filter(Boolean),
    relatedDomains: [
      "wisdom",
      "oios-core",
      "opportunity",
      "executive-decision",
      "predictive",
      "collective",
    ],
    judgment: {
      whatLeadershipShouldDo: wisdom.brief.judgment.whatLeadershipShouldDo,
      why: wisdom.brief.judgment.why,
      whyNow: wisdom.brief.judgment.whyNow,
      expectedOutcome: wisdom.brief.judgment.expectedOutcome,
    },
    dataMode: "model-baseline",
  };
}
