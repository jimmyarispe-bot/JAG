/**
 * Runtime Diff Engine — compare current vs new Runtime Specifications.
 */

import type { RuntimeSpecification } from "@/jag/blueprints/contracts";
import { stableStringify } from "@/jag/runtime-generation/artifacts";
import type {
  RuntimeArtifactKind,
  RuntimeDiffEntry,
  RuntimeSpecificationDiff,
} from "@/jag/runtime-generation/contracts";

const BREAKING_KINDS = new Set<RuntimeArtifactKind>([
  "entities",
  "processes",
  "decisions",
  "forms",
  "workflows",
]);

type IdItem = { id: string; payload: unknown };

function listIds(
  spec: RuntimeSpecification,
  kind: RuntimeArtifactKind
): IdItem[] {
  switch (kind) {
    case "entities":
      return (spec.entities ?? []).map((e) => ({
        id: e.entityType,
        payload: e,
      }));
    case "processes":
      return (spec.processes ?? []).map((p) => ({ id: p.id, payload: p }));
    case "decisions":
      return (spec.decisions ?? []).map((d) => ({ id: d.id, payload: d }));
    case "forms":
      return (spec.forms ?? []).map((f) => ({ id: f.id, payload: f }));
    case "documents":
      return (spec.documents?.definitions ?? []).map((d) => ({
        id: d.id,
        payload: d,
      }));
    case "communications":
      return (spec.communications?.definitions ?? []).map((c) => ({
        id: c.id,
        payload: c,
      }));
    case "permissions":
      return (spec.permissions ?? []).map((p) => ({ id: p.id, payload: p }));
    case "reports":
      return (spec.reports ?? []).map((r) => ({ id: r.id, payload: r }));
    case "navigation":
      return (spec.navigation ?? []).map((n) => ({ id: n.id, payload: n }));
    case "workflows":
      return (spec.workflows ?? []).map((w) => ({
        id: String(w.id),
        payload: w,
      }));
    case "terminology":
      return (spec.terminology ?? []).map((t) => ({ id: t.id, payload: t }));
    case "localization":
      return (spec.localization ?? []).map((l) => ({ id: l.id, payload: l }));
    case "integrations":
      return (spec.integrations ?? []).map((i) => ({ id: i.id, payload: i }));
    default:
      return [];
  }
}

const KINDS: readonly RuntimeArtifactKind[] = [
  "entities",
  "processes",
  "decisions",
  "forms",
  "documents",
  "communications",
  "permissions",
  "reports",
  "navigation",
  "workflows",
  "terminology",
  "localization",
  "integrations",
];

export function diffRuntimeSpecifications(
  current: RuntimeSpecification | undefined,
  next: RuntimeSpecification
): RuntimeSpecificationDiff {
  const added: RuntimeDiffEntry[] = [];
  const removed: RuntimeDiffEntry[] = [];
  const modified: RuntimeDiffEntry[] = [];
  const breaking: RuntimeDiffEntry[] = [];
  const safe: RuntimeDiffEntry[] = [];

  if (!current) {
    for (const kind of KINDS) {
      for (const item of listIds(next, kind)) {
        const entry: RuntimeDiffEntry = {
          kind,
          id: item.id,
          change: "added",
          detail: "initial generation",
        };
        added.push(entry);
        if (BREAKING_KINDS.has(kind)) breaking.push({ ...entry, change: "breaking" });
        else safe.push({ ...entry, change: "safe" });
      }
    }
    return Object.freeze({
      added: Object.freeze(added),
      removed: Object.freeze(removed),
      modified: Object.freeze(modified),
      breaking: Object.freeze(breaking),
      safe: Object.freeze(safe),
    });
  }

  for (const kind of KINDS) {
    const before = new Map(listIds(current, kind).map((i) => [i.id, i]));
    const after = new Map(listIds(next, kind).map((i) => [i.id, i]));

    for (const [id, item] of after) {
      const prev = before.get(id);
      if (!prev) {
        const entry: RuntimeDiffEntry = { kind, id, change: "added" };
        added.push(entry);
        if (BREAKING_KINDS.has(kind))
          breaking.push({ ...entry, change: "breaking" });
        else safe.push({ ...entry, change: "safe" });
        continue;
      }
      if (stableStringify(prev.payload) !== stableStringify(item.payload)) {
        const entry: RuntimeDiffEntry = {
          kind,
          id,
          change: "modified",
        };
        modified.push(entry);
        if (BREAKING_KINDS.has(kind))
          breaking.push({ ...entry, change: "breaking" });
        else safe.push({ ...entry, change: "safe" });
      }
    }

    for (const id of before.keys()) {
      if (!after.has(id)) {
        const entry: RuntimeDiffEntry = { kind, id, change: "removed" };
        removed.push(entry);
        if (BREAKING_KINDS.has(kind))
          breaking.push({ ...entry, change: "breaking" });
        else safe.push({ ...entry, change: "safe" });
      }
    }
  }

  return Object.freeze({
    added: Object.freeze(added),
    removed: Object.freeze(removed),
    modified: Object.freeze(modified),
    breaking: Object.freeze(breaking),
    safe: Object.freeze(safe),
  });
}
