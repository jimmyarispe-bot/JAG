/**
 * JS-005 — RC / release readiness from graph evidence + Studio governance.
 * Does not hard-code gate logic; delegates to evaluateReleaseGates + policies.
 */

import { ensureCertificationRecord } from "../../certification/engine";
import { evaluatePolicies } from "../../policies/engine";
import { evaluateReleaseGates } from "../../releases/gates";
import type { ReleaseStatus } from "../../types";
import { buildKnowledgeCoverage } from "../coverage/metrics";
import { buildKnowledgeGraph } from "../graph/builder";

export type ReadinessBlocker = {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly severity: "Info" | "Warning" | "Error" | "Critical";
  readonly evidence: readonly string[];
  readonly affectedPackages: readonly string[];
  readonly affectedServices: readonly string[];
  readonly source: "gate" | "policy" | "graph" | "certification" | "per";
};

export type ReleaseReadinessReport = {
  readonly productId: string;
  readonly targetStage: ReleaseStatus;
  readonly evaluatedAt: string;
  readonly ready: boolean;
  readonly readinessScore: number;
  readonly blockers: readonly ReadinessBlocker[];
  readonly gatePassed: boolean;
  readonly policyPassed: boolean;
  readonly openPerCount: number;
  readonly untestedServiceCount: number;
  readonly undocumentedApiCount: number;
  readonly missingDocumentation: readonly string[];
  readonly incompleteTests: readonly string[];
  readonly orphanedPers: readonly string[];
  readonly policyViolations: readonly string[];
  readonly summary: string;
};

export function evaluateReleaseReadiness(input: {
  productId: string;
  targetStage?: ReleaseStatus;
  root?: string;
}): ReleaseReadinessReport {
  const productId = input.productId;
  const targetStage = input.targetStage ?? "RC-3";
  const root = input.root;
  const g = buildKnowledgeGraph({ root });
  const gates = evaluateReleaseGates({
    productId,
    targetStage,
    root,
  });
  const policies = evaluatePolicies({ productId, root });
  const cert = ensureCertificationRecord(productId, root);
  const coverage = buildKnowledgeCoverage(root);

  const blockers: ReadinessBlocker[] = [];

  for (const gate of gates.gates.filter((x) => x.required && !x.passed)) {
    blockers.push({
      id: `gate:${gate.id}`,
      title: gate.name,
      detail: gate.detail,
      severity: "Error",
      evidence: Object.freeze([...gate.evidence, `category=${gate.category}`]),
      affectedPackages: Object.freeze([productId]),
      affectedServices: Object.freeze([]),
      source: "gate",
    });
  }

  for (const ev of policies.evaluations.filter((e) => !e.passed)) {
    const pol = policies.evaluations.find((x) => x.policyId === ev.policyId);
    blockers.push({
      id: `policy:${ev.policyId}`,
      title: `Policy failed: ${ev.policyId}`,
      detail: ev.detail,
      severity: "Warning",
      evidence: Object.freeze([...ev.evidence]),
      affectedPackages: Object.freeze([productId]),
      affectedServices: Object.freeze([]),
      source: "policy",
    });
    void pol;
  }

  for (const b of cert.outstandingBlockers) {
    blockers.push({
      id: `cert:${b.slice(0, 48)}`,
      title: "Certification blocker",
      detail: b,
      severity: "Error",
      evidence: Object.freeze([b, `stage=${cert.releaseStage}`]),
      affectedPackages: Object.freeze([productId]),
      affectedServices: Object.freeze([]),
      source: "certification",
    });
  }

  const productServices = coverage.untestedServices.filter((id) =>
    id.includes(productId)
  );
  if (productServices.length > 0) {
    blockers.push({
      id: "graph:untested-services",
      title: `${productServices.length} untested ${productId} service(s)`,
      detail:
        "Services lack VALIDATES/VALIDATED_BY edges — weak RC test evidence.",
      severity: productServices.length > 10 ? "Error" : "Warning",
      evidence: Object.freeze(productServices.slice(0, 15)),
      affectedPackages: Object.freeze([productId]),
      affectedServices: Object.freeze(
        productServices.slice(0, 15).map((id) => id.split(":").pop() ?? id)
      ),
      source: "graph",
    });
  }

  const undoc = coverage.undocumentedApis.filter((id) => id.includes(productId));
  if (undoc.length > 0) {
    blockers.push({
      id: "graph:undocumented-apis",
      title: `${undoc.length} undocumented ${productId} API(s)`,
      detail: "APIs missing DOCUMENTS edges in the Knowledge Graph.",
      severity: "Warning",
      evidence: Object.freeze(undoc.slice(0, 15)),
      affectedPackages: Object.freeze([productId]),
      affectedServices: Object.freeze([]),
      source: "graph",
    });
  }

  const orphanedPers = g.nodes
    .filter(
      (n) =>
        n.kind === "per" &&
        (n.ownerPackage === productId || n.productId === productId) &&
        !g.edges.some((e) => e.from === n.id && e.kind === "AFFECTS")
    )
    .map((n) => n.id);

  if (orphanedPers.length > 0) {
    blockers.push({
      id: "graph:orphan-pers",
      title: `${orphanedPers.length} orphaned PER(s)`,
      detail: "PERs for this product lack AFFECTS package edges.",
      severity: "Info",
      evidence: Object.freeze(orphanedPers.slice(0, 15)),
      affectedPackages: Object.freeze([productId]),
      affectedServices: Object.freeze([]),
      source: "per",
    });
  }

  const openPerCount = g.nodes.filter(
    (n) =>
      n.kind === "per" &&
      (n.ownerPackage === productId || n.productId === productId) &&
      (n.metadata.status === "Open" || n.metadata.status === "Accepted")
  ).length;

  const errorBlockers = blockers.filter(
    (b) => b.severity === "Error" || b.severity === "Critical"
  );
  const ready =
    gates.passed &&
    policies.passedRequired &&
    errorBlockers.length === 0;

  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (gates.passed ? 40 : 15) +
          (policies.passedRequired ? 25 : policies.compliancePercent * 0.2) +
          Math.max(0, 20 - productServices.length) +
          Math.max(0, 15 - undoc.length * 0.5)
      )
    )
  );

  return {
    productId,
    targetStage,
    evaluatedAt: new Date().toISOString(),
    ready,
    readinessScore,
    blockers: Object.freeze(blockers),
    gatePassed: gates.passed,
    policyPassed: policies.passedRequired,
    openPerCount,
    untestedServiceCount: productServices.length,
    undocumentedApiCount: undoc.length,
    missingDocumentation: Object.freeze(undoc.slice(0, 30)),
    incompleteTests: Object.freeze(productServices.slice(0, 30)),
    orphanedPers: Object.freeze(orphanedPers),
    policyViolations: Object.freeze(
      policies.evaluations.filter((e) => !e.passed).map((e) => e.policyId)
    ),
    summary: ready
      ? `${productId} is ready for ${targetStage} per graph + governance evidence.`
      : `${productId} not ready for ${targetStage}: ${blockers.length} blocker(s), score=${readinessScore}.`,
  };
}

export function createReleaseReadinessService() {
  return { evaluate: evaluateReleaseReadiness };
}
