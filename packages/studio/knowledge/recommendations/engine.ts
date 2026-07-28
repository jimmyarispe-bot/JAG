/**
 * JS-005 — Evidence-backed engineering recommendations from the Knowledge Graph.
 */

import { buildKnowledgeCoverage } from "../coverage/metrics";
import { buildKnowledgeGraph } from "../graph/builder";
import { evaluateReleaseReadiness } from "../release/readiness";

export type EngineeringRecommendation = {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly severity: "Info" | "Warning" | "Error" | "Critical";
  readonly confidence: "High" | "Medium" | "Low";
  readonly affectedProducts: readonly string[];
  readonly affectedPackages: readonly string[];
  readonly affectedServices: readonly string[];
  readonly evidence: readonly string[];
  readonly estimatedImpact: "Low" | "Medium" | "High";
  readonly score: number;
};

export type RecommendationReport = {
  readonly generatedAt: string;
  readonly graphVersion: string;
  readonly recommendations: readonly EngineeringRecommendation[];
  readonly countsBySeverity: Readonly<
    Record<"Info" | "Warning" | "Error" | "Critical", number>
  >;
};

function sevScore(s: EngineeringRecommendation["severity"]): number {
  return { Info: 15, Warning: 45, Error: 75, Critical: 95 }[s];
}

export function generateKnowledgeRecommendations(input?: {
  root?: string;
  productId?: string;
}): RecommendationReport {
  const root = input?.root;
  const productId = input?.productId ?? "academyos";
  const g = buildKnowledgeGraph({ root });
  const coverage = buildKnowledgeCoverage(root);
  const readiness = evaluateReleaseReadiness({
    productId,
    targetStage: "RC-3",
    root,
  });
  const recs: EngineeringRecommendation[] = [];

  // Untested services
  for (const sid of coverage.untestedServices.slice(0, 40)) {
    const svc = g.nodes.find((n) => n.id === sid);
    if (!svc) continue;
    if (productId && svc.ownerPackage && svc.ownerPackage !== productId && svc.productId !== productId)
      continue;
    recs.push({
      id: `rec:untested.service:${sid}`,
      title: `Increase coverage for ${svc.label}`,
      detail: `Service has no VALIDATES / VALIDATED_BY edges in the Knowledge Graph.`,
      severity: "Warning",
      confidence: "High",
      affectedProducts: Object.freeze([
        svc.productId ?? svc.ownerPackage ?? productId,
      ].filter(Boolean) as string[]),
      affectedPackages: Object.freeze(
        [svc.ownerPackage].filter(Boolean) as string[]
      ),
      affectedServices: Object.freeze([svc.label]),
      evidence: Object.freeze([
        `node=${sid}`,
        "No VALIDATED_BY edges",
        `package=${svc.ownerPackage ?? "unknown"}`,
      ]),
      estimatedImpact: "Medium",
      score: sevScore("Warning") + 5,
    });
  }

  // Weakly tested APIs
  for (const aid of coverage.weaklyTestedApis.slice(0, 25)) {
    const api = g.nodes.find((n) => n.id === aid);
    if (!api) continue;
    if (
      productId &&
      api.ownerPackage &&
      api.ownerPackage !== productId &&
      !aid.includes(productId)
    )
      continue;
    recs.push({
      id: `rec:weak.api:${aid}`,
      title: `Add tests for API ${api.path ?? api.label}`,
      detail: "API lacks VALIDATES relationships from test nodes.",
      severity: "Warning",
      confidence: "High",
      affectedProducts: Object.freeze([api.ownerPackage ?? productId].filter(Boolean) as string[]),
      affectedPackages: Object.freeze(
        [api.ownerPackage].filter(Boolean) as string[]
      ),
      affectedServices: Object.freeze(
        coverage.apiIntelligence
          .find((a) => a.apiId === aid)
          ?.ownerService
          ? [
              coverage.apiIntelligence.find((a) => a.apiId === aid)!
                .ownerService!,
            ]
          : []
      ),
      evidence: Object.freeze([`api=${aid}`, "missing VALIDATES edge"]),
      estimatedImpact: "Medium",
      score: sevScore("Warning"),
    });
  }

  // Undocumented APIs
  for (const aid of coverage.undocumentedApis.slice(0, 20)) {
    const api = g.nodes.find((n) => n.id === aid);
    if (!api) continue;
    recs.push({
      id: `rec:undoc.api:${aid}`,
      title: `Document API ${api.path ?? api.label}`,
      detail: "No DOCUMENTS/DESCRIBES edge points at this API.",
      severity: "Info",
      confidence: "High",
      affectedProducts: Object.freeze(
        [api.ownerPackage ?? productId].filter(Boolean) as string[]
      ),
      affectedPackages: Object.freeze(
        [api.ownerPackage].filter(Boolean) as string[]
      ),
      affectedServices: Object.freeze([]),
      evidence: Object.freeze([`api=${aid}`, "missing DOCUMENTS edge"]),
      estimatedImpact: "Low",
      score: sevScore("Info") + 5,
    });
  }

  // RC-3 blockers as recommendations
  for (const b of readiness.blockers) {
    recs.push({
      id: `rec:rc3.blocker:${b.id}`,
      title: b.title,
      detail: b.detail,
      severity: b.severity,
      confidence: "High",
      affectedProducts: Object.freeze([productId]),
      affectedPackages: Object.freeze(b.affectedPackages),
      affectedServices: Object.freeze(b.affectedServices),
      evidence: Object.freeze(b.evidence),
      estimatedImpact: "High",
      score: sevScore(b.severity) + 20,
    });
  }

  // Orphan PERs (no AFFECTS edge)
  const orphanPers = g.nodes.filter(
    (n) =>
      n.kind === "per" &&
      !g.edges.some((e) => e.from === n.id && e.kind === "AFFECTS")
  );
  for (const per of orphanPers.slice(0, 10)) {
    recs.push({
      id: `rec:orphan.per:${per.id}`,
      title: `Link PER ${per.label} to affected packages`,
      detail: "PER node has no AFFECTS edges in the Knowledge Graph.",
      severity: "Info",
      confidence: "Medium",
      affectedProducts: Object.freeze(
        [per.productId ?? productId].filter(Boolean) as string[]
      ),
      affectedPackages: Object.freeze(
        [per.ownerPackage].filter(Boolean) as string[]
      ),
      affectedServices: Object.freeze([]),
      evidence: Object.freeze([`per=${per.id}`, "missing AFFECTS edge"]),
      estimatedImpact: "Low",
      score: sevScore("Info"),
    });
  }

  const map = new Map<string, EngineeringRecommendation>();
  for (const r of recs) map.set(r.id, r);
  const recommendations = [...map.values()].sort(
    (a, b) => b.score - a.score || a.id.localeCompare(b.id)
  );

  const countsBySeverity = {
    Info: 0,
    Warning: 0,
    Error: 0,
    Critical: 0,
  } as Record<"Info" | "Warning" | "Error" | "Critical", number>;
  for (const r of recommendations) countsBySeverity[r.severity] += 1;

  return {
    generatedAt: new Date().toISOString(),
    graphVersion: g.version,
    recommendations: Object.freeze(recommendations),
    countsBySeverity: Object.freeze(countsBySeverity),
  };
}

export function createKnowledgeRecommendationService() {
  return { generate: generateKnowledgeRecommendations };
}
