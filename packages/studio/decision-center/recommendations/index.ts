/**
 * Decision Center — prioritized engineering recommendation queue.
 */

import type { DecisionEvidenceContext } from "../context";
import { buildDecisionEvidenceContext } from "../context";
import type { DecisionRecommendation, RecommendationSort } from "../types";

function effortFromImpact(
  impact: "Low" | "Medium" | "High",
  severity: string
): DecisionRecommendation["estimatedEffort"] {
  if (impact === "Low" && severity === "Info") return "XS";
  if (impact === "Low") return "S";
  if (impact === "Medium") return "M";
  if (severity === "Critical") return "XL";
  return "L";
}

function effortRank(e: DecisionRecommendation["estimatedEffort"]): number {
  return { XS: 1, S: 2, M: 3, L: 4, XL: 5 }[e];
}

function impactRank(i: "Low" | "Medium" | "High"): number {
  return { Low: 1, Medium: 2, High: 3 }[i];
}

export function buildDecisionRecommendations(input?: {
  root?: string;
  productId?: string;
  sort?: RecommendationSort;
  ctx?: DecisionEvidenceContext;
}): readonly DecisionRecommendation[] {
  const productId = input?.productId ?? "academyos";
  const sort = input?.sort ?? "highest_impact";
  const c = input?.ctx ?? buildDecisionEvidenceContext(input?.root);
  const report = c.academyRecommendations;
  const readiness = c.academyReadiness;
  const blockerTitles = new Set(
    readiness.blockers.map((b) => b.title.toLowerCase())
  );

  const items: DecisionRecommendation[] = report.recommendations.map((r) => {
    const blocking = readiness.blockers
      .filter(
        (b) =>
          r.evidence.some((e) =>
            b.evidence.some((be) => be.includes(e) || e.includes(be))
          ) ||
          b.affectedPackages.some((p) => r.affectedPackages.includes(p)) ||
          blockerTitles.has(r.title.toLowerCase())
      )
      .map((b) => `${productId}:${b.id}`);
    const isArch = /architect|depend|circular|orphan/i.test(
      r.title + r.detail
    );
    return {
      id: r.id,
      title: r.title,
      detail: r.detail,
      severity: r.severity,
      confidence: r.confidence,
      impact: r.estimatedImpact,
      evidence: r.evidence,
      affectedProducts: r.affectedProducts,
      affectedPackages: r.affectedPackages,
      estimatedEffort: effortFromImpact(r.estimatedImpact, r.severity),
      blockingReleases: Object.freeze(
        blocking.length > 0
          ? blocking
          : r.severity === "Error" || r.severity === "Critical"
            ? ([`${productId}:RC-3`] as string[])
            : ([] as string[])
      ),
      score:
        r.score + (blocking.length > 0 ? 25 : 0) + (isArch ? 10 : 0),
    };
  });

  items.sort((a, b) => {
    switch (sort) {
      case "easiest_fix":
        return (
          effortRank(a.estimatedEffort) - effortRank(b.estimatedEffort) ||
          b.score - a.score ||
          a.id.localeCompare(b.id)
        );
      case "release_blockers":
        return (
          b.blockingReleases.length - a.blockingReleases.length ||
          b.score - a.score ||
          a.id.localeCompare(b.id)
        );
      case "architecture_risk": {
        const aArch = /architect|depend|circular|orphan/i.test(a.title) ? 1 : 0;
        const bArch = /architect|depend|circular|orphan/i.test(b.title) ? 1 : 0;
        return bArch - aArch || b.score - a.score || a.id.localeCompare(b.id);
      }
      case "highest_impact":
      default:
        return (
          impactRank(b.impact) - impactRank(a.impact) ||
          b.score - a.score ||
          a.id.localeCompare(b.id)
        );
    }
  });

  return Object.freeze(items);
}
