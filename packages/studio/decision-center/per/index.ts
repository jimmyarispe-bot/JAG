/**
 * Decision Center — PER Center grouping.
 */

import type { DecisionEvidenceContext } from "../context";
import { buildDecisionEvidenceContext } from "../context";
import type { PerCenterGroup, PerCenterView } from "../types";

function groupFor(originatingPack: string): PerCenterGroup["group"] {
  if (
    originatingPack === "platform" ||
    originatingPack === "foundation" ||
    originatingPack.includes("platform")
  ) {
    return "Foundation";
  }
  if (originatingPack === "studio") return "Studio";
  if (originatingPack === "academyos") return "AcademyOS";
  return "Industry Packs";
}

export function buildPerCenter(
  root?: string,
  ctx?: DecisionEvidenceContext
): PerCenterView {
  const c = ctx ?? buildDecisionEvidenceContext(root);
  const pers = c.pers;
  const groupsMap = new Map<
    PerCenterGroup["group"],
    PerCenterGroup["pers"][number][]
  >();

  for (const g of [
    "Foundation",
    "Studio",
    "AcademyOS",
    "Industry Packs",
  ] as const) {
    groupsMap.set(g, []);
  }

  for (const p of pers) {
    const group = groupFor(p.originatingPack);
    groupsMap.get(group)!.push({
      id: p.id,
      status: p.status,
      description: p.description,
      promoteToFoundation: p.promoteToFoundation,
      packsMentioning: p.packsMentioning,
    });
  }

  const groups: PerCenterGroup[] = (
    ["Foundation", "Studio", "AcademyOS", "Industry Packs"] as const
  ).map((group) => ({
    group,
    pers: Object.freeze(
      (groupsMap.get(group) ?? []).sort((a, b) => a.id.localeCompare(b.id))
    ),
  }));

  const byDesc = new Map<string, string[]>();
  for (const p of pers) {
    const key = p.description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .slice(0, 80);
    const list = byDesc.get(key) ?? [];
    list.push(p.id);
    byDesc.set(key, list);
  }
  const duplicates = [...byDesc.values()]
    .filter((ids) => ids.length > 1)
    .map((ids) => ids.sort().join(","));

  const foundationCandidates = pers
    .filter((p) => p.promoteToFoundation)
    .map((p) => p.id)
    .sort();

  const byStatus: Record<string, number> = {};
  for (const p of pers) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    groups: Object.freeze(groups),
    duplicates: Object.freeze(duplicates),
    foundationCandidates: Object.freeze(foundationCandidates),
    byStatus: Object.freeze(byStatus),
  };
}
