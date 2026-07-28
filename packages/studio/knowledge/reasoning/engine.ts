/**
 * Deterministic reasoning over Knowledge Graph relationships — no LLM.
 */

import { ensureCertificationRecord } from "../../certification/engine";
import { evaluateReleaseGates } from "../../releases/gates";
import { buildKnowledgeGraph } from "../graph/builder";
import {
  findDependents,
  findDocumentation,
  findNeighbors,
  findNode,
  findPERs,
  findTests,
  searchGraph,
} from "../queries/engine";

export type ReasoningAnswer = {
  readonly question: string;
  readonly intent: string;
  readonly answer: string;
  readonly evidence: readonly string[];
  readonly relatedNodeIds: readonly string[];
  readonly confidence: "High" | "Medium" | "Low";
};

function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

export function reasonOverGraph(input: {
  question: string;
  root?: string;
  productId?: string;
}): ReasoningAnswer {
  const q = normalize(input.question);
  const root = input.root;
  const g = buildKnowledgeGraph({ root });
  const productId = input.productId ?? "academyos";
  const evidence: string[] = [];
  const related: string[] = [];

  // Why is this release blocked?
  if (
    q.includes("release blocked") ||
    q.includes("why is this release blocked") ||
    q.includes("blocked release")
  ) {
    const gates = evaluateReleaseGates({
      productId,
      targetStage: "Certified",
      root,
    });
    const cert = ensureCertificationRecord(productId, root);
    evidence.push(...gates.blockers);
    evidence.push(`stage=${cert.releaseStage}`);
    related.push(`product:${productId}`);
    for (const b of cert.outstandingBlockers) evidence.push(b);
    return {
      question: input.question,
      intent: "release_blocked",
      answer:
        gates.blockers.length === 0 && cert.outstandingBlockers.length === 0
          ? `${productId} has no required gate blockers for Certified (check approvals separately).`
          : `${productId} is blocked by: ${(gates.blockers.length ? gates.blockers : cert.outstandingBlockers).join("; ")}`,
      evidence: Object.freeze(evidence),
      relatedNodeIds: Object.freeze(related),
      confidence: "High",
    };
  }

  // Why is certification failing?
  if (q.includes("certification failing") || q.includes("certification fail")) {
    const cert = ensureCertificationRecord(productId, root);
    const gates = cert.lastGateReport;
    evidence.push(...(cert.outstandingBlockers ?? []));
    if (gates) {
      for (const gate of gates.gates.filter((x) => x.required && !x.passed)) {
        evidence.push(`${gate.id}: ${gate.detail}`);
        related.push(gate.id);
      }
    }
    return {
      question: input.question,
      intent: "certification_failing",
      answer:
        cert.outstandingBlockers.length === 0
          ? `${productId} certification has no outstanding blockers in the current record.`
          : `Certification for ${productId} failing due to: ${cert.outstandingBlockers.join("; ")}`,
      evidence: Object.freeze(evidence),
      relatedNodeIds: Object.freeze([`product:${productId}`, ...related]),
      confidence: "High",
    };
  }

  // Which PER is responsible?
  if (q.includes("which per") || q.includes("per is responsible")) {
    const pers = findPERs(undefined, root);
    const promote = pers.filter(
      (p) => p.metadata.promote === "true" || p.keywords.includes(productId)
    );
    const pick = promote[0] ?? pers[0];
    if (!pick) {
      return {
        question: input.question,
        intent: "per_responsible",
        answer: "No PERs found in the Knowledge Graph.",
        evidence: Object.freeze([]),
        relatedNodeIds: Object.freeze([]),
        confidence: "Low",
      };
    }
    evidence.push(`status=${pick.metadata.status ?? ""}`);
    evidence.push(...pick.keywords.slice(0, 8));
    return {
      question: input.question,
      intent: "per_responsible",
      answer: `${pick.label} is the primary PER linked to ${productId} (status=${pick.metadata.status ?? "unknown"}).`,
      evidence: Object.freeze(evidence),
      relatedNodeIds: Object.freeze([pick.id]),
      confidence: promote.length ? "High" : "Medium",
    };
  }

  // Which package owns this API?
  if (q.includes("owns this api") || q.includes("package owns") || q.includes("who owns")) {
    const needle = input.question
      .replace(/which package owns|who owns|this api/gi, "")
      .trim();
    const apiHit = searchGraph({
      q: needle || "studio",
      kinds: ["api"],
      root,
      limit: 5,
    })[0];
    const api =
      apiHit?.node ??
      g.nodes.find((n) => n.kind === "api" && n.path?.includes("studio")) ??
      g.nodes.find((n) => n.kind === "api") ??
      null;
    if (!api) {
      return {
        question: input.question,
        intent: "api_owner",
        answer: "No matching API node found.",
        evidence: Object.freeze([]),
        relatedNodeIds: Object.freeze([]),
        confidence: "Low",
      };
    }
    const owners = findNeighbors(api.id, root, "out").filter(
      (n) => n.edge.kind === "OWNED_BY" || n.node.kind === "package"
    );
    const pkg =
      owners.find((o) => o.node.kind === "package")?.node ??
      (api.ownerPackage ? findNode(`package:${api.ownerPackage}`, root) : null);
    evidence.push(api.path ?? api.id);
    if (pkg) evidence.push(pkg.id);
    return {
      question: input.question,
      intent: "api_owner",
      answer: pkg
        ? `${pkg.label} owns API ${api.label} (${api.path}).`
        : `API ${api.label} has no package owner edge.`,
      evidence: Object.freeze(evidence),
      relatedNodeIds: Object.freeze([api.id, ...(pkg ? [pkg.id] : [])]),
      confidence: pkg ? "High" : "Medium",
    };
  }

  // Which products reuse this module?
  if (q.includes("reuse this module") || q.includes("products reuse")) {
    const modHit = searchGraph({
      q: input.question.replace(/which products reuse|this module/gi, "").trim() || "module",
      kinds: ["module"],
      root,
      limit: 5,
    })[0];
    const mod = modHit?.node ?? g.nodes.find((n) => n.kind === "module");
    if (!mod) {
      return {
        question: input.question,
        intent: "module_reuse",
        answer: "No module node found.",
        evidence: Object.freeze([]),
        relatedNodeIds: Object.freeze([]),
        confidence: "Low",
      };
    }
    const products = findNeighbors(mod.id, root, "both")
      .filter((n) => n.node.kind === "product")
      .map((n) => n.node);
    const viaPackage = mod.ownerPackage
      ? g.nodes.filter(
          (n) => n.kind === "product" && n.id === `product:${mod.ownerPackage}`
        )
      : [];
    const all = [...new Map([...products, ...viaPackage].map((p) => [p.id, p])).values()];
    evidence.push(mod.id, ...all.map((p) => p.id));
    return {
      question: input.question,
      intent: "module_reuse",
      answer:
        all.length === 0
          ? `Module ${mod.label} is not linked to any product nodes.`
          : `Module ${mod.label} is used by: ${all.map((p) => p.label).join(", ")}.`,
      evidence: Object.freeze(evidence),
      relatedNodeIds: Object.freeze([mod.id, ...all.map((p) => p.id)]),
      confidence: "High",
    };
  }

  // What is preventing RC-3?
  if (q.includes("preventing rc-3") || q.includes("prevent rc-3") || q.includes("rc-3")) {
    const gates = evaluateReleaseGates({
      productId,
      targetStage: "RC-3",
      root,
    });
    evidence.push(...gates.blockers);
    for (const gate of gates.gates.filter((x) => x.required && !x.passed)) {
      evidence.push(`${gate.name}: ${gate.detail}`);
    }
    return {
      question: input.question,
      intent: "preventing_rc3",
      answer:
        gates.blockers.length === 0
          ? `${productId} passes required RC-3 gates in the Knowledge Graph evaluation.`
          : `Preventing RC-3 for ${productId}: ${gates.blockers.join("; ")}`,
      evidence: Object.freeze([...new Set(evidence)]),
      relatedNodeIds: Object.freeze([`product:${productId}`]),
      confidence: "High",
    };
  }

  // Which documentation is missing?
  if (q.includes("documentation is missing") || q.includes("missing doc")) {
    const packages = g.nodes.filter((n) => n.kind === "package");
    const missing: string[] = [];
    for (const pkg of packages) {
      const docs = findDocumentation(pkg.id, root);
      if (docs.length === 0) {
        missing.push(pkg.id);
        related.push(pkg.id);
      }
    }
    evidence.push(`packagesWithoutDocs=${missing.length}`);
    evidence.push(...missing.slice(0, 15));
    return {
      question: input.question,
      intent: "missing_docs",
      answer:
        missing.length === 0
          ? "All package nodes have at least one DESCRIBES/DOCUMENTS link."
          : `${missing.length} package(s) lack documentation edges: ${missing.slice(0, 8).join(", ")}`,
      evidence: Object.freeze(evidence),
      relatedNodeIds: Object.freeze(related.slice(0, 20)),
      confidence: "High",
    };
  }

  // Which services have no tests?
  if (q.includes("services have no tests") || q.includes("no tests")) {
    const services = g.nodes.filter((n) => n.kind === "service");
    const untested = services.filter((s) => findTests(s.id, root).length === 0);
    evidence.push(`untested=${untested.length}`, `services=${services.length}`);
    evidence.push(...untested.slice(0, 15).map((s) => s.id));
    return {
      question: input.question,
      intent: "untested_services",
      answer:
        untested.length === 0
          ? "All service nodes have VALIDATES test links (or package-level tests)."
          : `${untested.length} service(s) have no direct test links: ${untested
              .slice(0, 8)
              .map((s) => s.label)
              .join(", ")}`,
      evidence: Object.freeze(evidence),
      relatedNodeIds: Object.freeze(untested.slice(0, 20).map((s) => s.id)),
      confidence: "High",
    };
  }

  // Fallback — search graph
  const hits = searchGraph({ q: input.question, root, limit: 8 });
  evidence.push(...hits.map((h) => `${h.node.id}#${h.score}`));
  return {
    question: input.question,
    intent: "general_search",
    answer:
      hits.length === 0
        ? "No graph evidence matched the question."
        : `Top graph matches: ${hits.map((h) => h.node.label).join(", ")}.`,
    evidence: Object.freeze(evidence),
    relatedNodeIds: Object.freeze(hits.map((h) => h.node.id)),
    confidence: hits.length ? "Medium" : "Low",
  };
}

export function createKnowledgeReasoningService() {
  return {
    reason: reasonOverGraph,
    intents: Object.freeze([
      "release_blocked",
      "certification_failing",
      "per_responsible",
      "api_owner",
      "module_reuse",
      "preventing_rc3",
      "missing_docs",
      "untested_services",
      "general_search",
    ] as const),
  };
}

// keep findDependents available for future rules
void findDependents;
