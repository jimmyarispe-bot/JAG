/**
 * Decision Center — Engineering Timeline from repository / Studio evidence.
 */

import { ensureCertificationRecord } from "../../certification/engine";
import { listReleases } from "../../store";
import type { DecisionEvidenceContext } from "../context";
import { buildDecisionEvidenceContext } from "../context";
import type { TimelineEvent } from "../types";

export function buildEngineeringTimeline(
  root?: string,
  ctx?: DecisionEvidenceContext
): readonly TimelineEvent[] {
  const c = ctx ?? buildDecisionEvidenceContext(root);
  const events: TimelineEvent[] = [];

  for (const rel of listReleases()) {
    events.push({
      id: `tl:release:${rel.id}`,
      at: rel.certifiedAt ?? rel.releasedAt ?? rel.createdAt,
      title: `${rel.productId} ${rel.status} ${rel.version}`,
      kind: "release",
      evidence: Object.freeze([
        `release:${rel.id}`,
        rel.releaseNotes.slice(0, 120),
      ]),
    });
  }

  for (const p of c.products) {
    const cert = ensureCertificationRecord(p.id, root, { lightweight: true });
    for (const h of cert.certificationHistory) {
      events.push({
        id: `tl:cert:${p.id}:${h.at}:${h.note.slice(0, 24)}`,
        at: h.at,
        title: `${p.name}: ${h.note}`,
        kind: "certification",
        evidence: Object.freeze([`stage=${h.stage}`, `actor=${h.actor}`]),
      });
    }
  }

  for (const per of c.pers.filter(
    (p) =>
      p.promoteToFoundation ||
      p.status === "Promoted" ||
      p.status === "Implemented"
  )) {
    events.push({
      id: `tl:per:${per.id}:${per.updatedAt}`,
      at: per.updatedAt,
      title:
        per.status === "Promoted" || per.promoteToFoundation
          ? `PER promoted candidate: ${per.id}`
          : `PER ${per.status}: ${per.id}`,
      kind: "per",
      evidence: Object.freeze([per.id, per.status, ...per.packsMentioning]),
    });
  }

  for (const doc of c.graph.nodes.filter((n) => n.kind === "document")) {
    const path = doc.path?.toLowerCase() ?? "";
    if (path.includes("rc2") || path.includes("rc-2")) {
      events.push({
        id: `tl:doc:rc2:${doc.id}`,
        at: doc.updatedAt,
        title: "RC-2 Complete (docs evidence)",
        kind: "release",
        evidence: Object.freeze([doc.path ?? doc.id]),
      });
    }
    if (path.includes("18_knowledge") || path.includes("knowledge_graph")) {
      events.push({
        id: `tl:doc:js004:${doc.id}`,
        at: doc.updatedAt,
        title: "JS-004 Complete (Knowledge Graph docs)",
        kind: "sprint",
        evidence: Object.freeze([doc.path ?? doc.id]),
      });
    }
    if (path.includes("23_graph_health") || path.includes("25_engineering")) {
      events.push({
        id: `tl:doc:js005:${doc.id}`,
        at: doc.updatedAt,
        title: "JS-005 Complete (graph health / recommendations docs)",
        kind: "sprint",
        evidence: Object.freeze([doc.path ?? doc.id]),
      });
    }
  }

  events.push({
    id: `tl:kg:${c.graph.version}`,
    at: c.graph.builtAt,
    title: `Knowledge Graph refresh (${c.graph.nodes.length} nodes / ${c.graph.edges.length} edges)`,
    kind: "knowledge",
    evidence: Object.freeze([
      `version=${c.graph.version}`,
      `catalog=${c.graph.catalogVersion}`,
    ]),
  });

  const academy = c.products.find((p) => p.id === "academyos");
  if (
    academy &&
    (academy.releaseStatus === "RC-2" || academy.releaseStatus === "RC")
  ) {
    events.push({
      id: "tl:rc3:started",
      at: academy.updatedAt,
      title: "RC-3 track active (AcademyOS at RC-2)",
      kind: "release",
      evidence: Object.freeze([
        `stage=${academy.releaseStatus}`,
        `version=${academy.version}`,
      ]),
    });
  }

  const map = new Map<string, TimelineEvent>();
  for (const e of events) map.set(e.id, e);
  return Object.freeze(
    [...map.values()].sort(
      (a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id)
    )
  );
}
