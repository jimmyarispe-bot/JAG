/**
 * Decision Center — per-product status cards.
 */

import { ensureCertificationRecord } from "../../certification/engine";
import type { DecisionEvidenceContext } from "../context";
import { buildDecisionEvidenceContext } from "../context";
import type { ProductDecisionCard } from "../types";

export function buildProductDecisionCards(
  root?: string,
  ctx?: DecisionEvidenceContext
): readonly ProductDecisionCard[] {
  const c = ctx ?? buildDecisionEvidenceContext(root);

  return Object.freeze(
    c.products.map((p) => {
      const active =
        p.releaseStatus !== "Development" && p.certification !== "None";
      const cert = ensureCertificationRecord(p.id, root, { lightweight: true });
      const readiness = active && p.id === "academyos" ? c.academyReadiness : null;
      const recCount =
        active && p.id === "academyos"
          ? c.academyRecommendations.recommendations.length
          : 0;

      const pkgCov = c.coverage.byPackage.find((b) => b.id === `package:${p.id}`);
      const prodCov = c.coverage.byProduct.find((b) => b.id === `product:${p.id}`);
      const testCoverage =
        prodCov?.coveragePercent ??
        pkgCov?.coveragePercent ??
        (active ? 0 : 100);
      const undocForProduct = c.coverage.undocumentedApis.filter((a) =>
        a.includes(p.id)
      ).length;
      const apiTotal = Math.max(
        1,
        c.coverage.apiIntelligence.filter((a) => a.ownerPackage === p.id).length
      );
      const documentationCoverage = active
        ? Math.max(
            0,
            Math.min(
              100,
              Math.round((1 - undocForProduct / apiTotal) * 1000) / 10
            )
          )
        : 100;
      const openPers = c.pers.filter(
        (x) =>
          (x.originatingPack === p.id || x.packsMentioning.includes(p.id)) &&
          (x.status === "Open" || x.status === "Accepted")
      ).length;
      const blockerCount =
        readiness?.blockers.filter(
          (b) => b.severity === "Error" || b.severity === "Critical"
        ).length ?? 0;
      const technicalDebt = Math.min(
        100,
        openPers * 4 +
          (readiness?.untestedServiceCount ?? 0) * 2 +
          cert.outstandingBlockers.length * 5
      );

      return {
        productId: p.id,
        name: p.name,
        version: p.version,
        releaseStage: p.releaseStatus,
        qualityScore: c.qualityByProduct[p.id] ?? 0,
        certificationStatus: p.certification,
        openBlockers: blockerCount,
        openRecommendations: recCount,
        technicalDebt,
        testCoverage,
        documentationCoverage,
      };
    })
  );
}
