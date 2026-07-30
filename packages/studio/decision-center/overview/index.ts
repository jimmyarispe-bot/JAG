/**
 * Decision Center — Overview (5-minute platform status).
 */

import { STUDIO_PACK_VERSION } from "../../manifest";
import { buildTestingWorkspace } from "../../testing/workspace";
import type { DecisionEvidenceContext } from "../context";
import type {
  DecisionOverview,
  ProductDecisionCard,
  ReleaseDecisionView,
  RiskCenterView,
} from "../types";

export function buildDecisionOverview(
  root?: string,
  parts?: {
    products?: readonly ProductDecisionCard[];
    releases?: readonly ReleaseDecisionView[];
    risks?: RiskCenterView;
    ctx?: DecisionEvidenceContext;
  }
): DecisionOverview {
  const c = parts?.ctx;
  const products = parts?.products ?? [];
  const releases = parts?.releases ?? [];
  const risks = parts?.risks;
  const testing = c?.testing ?? buildTestingWorkspace(root);
  const architectureHealth = c?.architecture.healthScore ?? 70;
  const openPers = c
    ? c.pers.filter((p) => p.status === "Open" || p.status === "Accepted")
        .length
    : 0;

  const knowledgeGraphHealth = c
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            55 +
              Math.min(25, c.graph.edges.length / 200) +
              Math.min(20, c.coverage.byService.filter((s) => s.covered > 0).length / 10)
          )
        )
      )
    : 50;

  const overallQualityScore =
    products.length === 0
      ? architectureHealth
      : Math.round(
          (products.reduce((a, p) => a + p.qualityScore, 0) / products.length) *
            10
        ) / 10;

  const builtAt = c?.graph.builtAt ?? new Date().toISOString();
  const ageMs = Date.now() - new Date(builtAt).getTime();
  const repositoryFreshness =
    ageMs < 60_000 ? "fresh" : ageMs < 15 * 60_000 ? "warm" : "stale";

  const technicalDebtProxy = Math.min(100, openPers * 4);
  const platformHealth =
    Math.round(
      (architectureHealth * 0.4 +
        testing.overallPassRate * 0.3 +
        (100 - technicalDebtProxy) * 0.3) *
        10
    ) / 10;

  return {
    generatedAt: new Date().toISOString(),
    platformVersion: STUDIO_PACK_VERSION,
    platformHealth,
    studioHealth:
      Math.round(((knowledgeGraphHealth + architectureHealth) / 2) * 10) / 10,
    knowledgeGraphHealth,
    repositoryFreshness,
    overallQualityScore,
    products,
    topRisks: risks
      ? risks.risks.filter(
          (r) => r.severity === "Error" || r.severity === "Critical"
        ).length
      : 0,
    openPers,
    releaseReadyCount: releases.filter((r) => r.ready).length,
  };
}
