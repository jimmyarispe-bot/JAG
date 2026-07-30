/**
 * Decision Center — Activity Feed from Studio evidence (no git required).
 */

import { ensureCertificationRecord } from "../../certification/engine";
import { listApprovals } from "../../governance/approvals";
import { listReleases } from "../../store";
import type { DecisionEvidenceContext } from "../context";
import { buildDecisionEvidenceContext } from "../context";
import type { ActivityItem } from "../types";

export function buildActivityFeed(input?: {
  root?: string;
  limit?: number;
  ctx?: DecisionEvidenceContext;
}): readonly ActivityItem[] {
  const c = input?.ctx ?? buildDecisionEvidenceContext(input?.root);
  const limit = input?.limit ?? 50;
  const items: ActivityItem[] = [];

  for (const rel of listReleases()) {
    items.push({
      id: `act:release:${rel.id}`,
      at: rel.createdAt,
      kind: "release",
      summary: `Release ${rel.productId}@${rel.version} → ${rel.status}`,
      evidence: Object.freeze([rel.id, rel.createdBy]),
    });
    if (rel.certifiedAt) {
      items.push({
        id: `act:cert:${rel.id}`,
        at: rel.certifiedAt,
        kind: "certification",
        summary: `Certified ${rel.productId}@${rel.version}`,
        evidence: Object.freeze([rel.id]),
      });
    }
    for (const m of rel.migrationHistory.slice(0, 8)) {
      items.push({
        id: `act:commit:${rel.id}:${m}`,
        at: rel.createdAt,
        kind: "commit",
        summary: `Migration/history: ${m}`,
        evidence: Object.freeze([rel.productId, rel.version]),
      });
    }
  }

  for (const p of c.products) {
    const cert = ensureCertificationRecord(p.id, input?.root, {
      lightweight: true,
    });
    for (const h of cert.certificationHistory.slice(-5)) {
      items.push({
        id: `act:certhist:${p.id}:${h.at}`,
        at: h.at,
        kind: "certification",
        summary: `${p.name}: ${h.note}`,
        evidence: Object.freeze([h.actor, h.stage]),
      });
    }
  }

  for (const per of c.pers) {
    items.push({
      id: `act:per:${per.id}:${per.updatedAt}`,
      at: per.updatedAt,
      kind: "per",
      summary: `PER ${per.id} is ${per.status}`,
      evidence: Object.freeze([
        per.originatingPack,
        ...per.packsMentioning.slice(0, 3),
      ]),
    });
  }

  for (const doc of c.graph.nodes
    .filter((n) => n.kind === "document")
    .slice(0, 30)) {
    items.push({
      id: `act:doc:${doc.id}`,
      at: doc.updatedAt,
      kind: "documentation",
      summary: `Doc indexed: ${doc.label}`,
      evidence: Object.freeze([doc.path ?? doc.id]),
    });
  }

  for (const r of c.academyRecommendations.recommendations.slice(0, 15)) {
    items.push({
      id: `act:rec:${r.id}`,
      at: c.academyRecommendations.generatedAt,
      kind: "recommendation",
      summary: `[${r.severity}] ${r.title}`,
      evidence: Object.freeze(r.evidence.slice(0, 5)),
    });
  }

  for (const a of listApprovals().slice(0, 20)) {
    items.push({
      id: `act:approval:${a.id}`,
      at: a.timestamp,
      kind: "certification",
      summary: `${a.role} ${a.decision} for ${a.productId}`,
      evidence: Object.freeze([a.approver, a.comments]),
    });
  }

  const map = new Map<string, ActivityItem>();
  for (const i of items) map.set(i.id, i);
  return Object.freeze(
    [...map.values()]
      .sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id))
      .slice(0, limit)
  );
}
