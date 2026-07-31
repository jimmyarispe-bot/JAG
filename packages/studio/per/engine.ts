/**
 * PER Engine — first-class Platform Enhancement Requests.
 * Parses pack PER markdown tables; detects multi-pack promotion candidates.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  getPer,
  listPers,
  upsertPer,
} from "../store";
import type { PerStatus, StudioPer } from "../types";
import { PER_STATUSES } from "../types";
import { createProductRegistryService } from "../products/registry";

const PER_ROW =
  /^\|\s*(PER-[A-Za-z0-9-]+)\s*\|\s*([^|]+)\|\s*([^|]+)\|/;

function discoverPerFiles(root: string): { pack: string; path: string }[] {
  const found: { pack: string; path: string }[] = [];
  const docs = join(/* turbopackIgnore: true */ root, "docs");
  if (!existsSync(/* turbopackIgnore: true */ docs)) return found;

  for (const name of readdirSync(/* turbopackIgnore: true */ docs)) {
    const dir = join(/* turbopackIgnore: true */ docs, name);
    try {
      if (!statSync(/* turbopackIgnore: true */ dir).isDirectory()) continue;
    } catch {
      continue;
    }
    const candidates = [
      join(/* turbopackIgnore: true */ dir, "06_PLATFORM_ENHANCEMENT_REQUESTS.md"),
      join(/* turbopackIgnore: true */ dir, "PER.md"),
      join(/* turbopackIgnore: true */ dir, "pers.md"),
    ];
    for (const c of candidates) {
      if (existsSync(/* turbopackIgnore: true */ c)) {
        found.push({ pack: name, path: c });
      }
    }
  }
  return found;
}

function parsePerMarkdown(
  pack: string,
  content: string
): Omit<StudioPer, "createdAt" | "updatedAt" | "implementationHistory" | "packsMentioning" | "promoteToFoundation" | "status" | "affectedServices" | "recommendation">[] {
  const rows: {
    id: string;
    description: string;
    originatingPack: string;
    workaround: string;
  }[] = [];
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(PER_ROW);
    if (!m) continue;
    if (m[1] === "ID") continue;
    rows.push({
      id: m[1]!.trim(),
      description: m[2]!.trim(),
      originatingPack: pack,
      workaround: m[3]!.trim(),
    });
  }
  return rows;
}

export function syncPersFromRepository(root?: string): StudioPer[] {
  const repoRoot = root ?? process.cwd();
  const files = discoverPerFiles(repoRoot);
  const byId = new Map<
    string,
    {
      description: string;
      originatingPack: string;
      workaround: string;
      packs: Set<string>;
    }
  >();

  for (const f of files) {
    let content = "";
    try {
      content = readFileSync(/* turbopackIgnore: true */ f.path, "utf8");
    } catch {
      continue;
    }
    for (const row of parsePerMarkdown(f.pack, content)) {
      const existing = byId.get(row.id);
      if (existing) {
        existing.packs.add(f.pack);
        if (f.pack === "academyos") {
          existing.originatingPack = "academyos";
          existing.description = row.description;
          existing.workaround = row.workaround;
        }
      } else {
        byId.set(row.id, {
          description: row.description,
          originatingPack: row.originatingPack,
          workaround: row.workaround,
          packs: new Set([f.pack]),
        });
      }
    }
  }

  const now = new Date().toISOString();
  const synced: StudioPer[] = [];
  for (const [id, data] of byId) {
    const packsMentioning = [...data.packs].sort();
    const promoteToFoundation = packsMentioning.length > 1;
    const previous = getPer(id);
    const per = upsertPer({
      id,
      description: data.description,
      originatingPack: data.originatingPack,
      affectedServices: previous?.affectedServices ?? Object.freeze([]),
      status: previous?.status ?? (promoteToFoundation ? "Accepted" : "Open"),
      recommendation: promoteToFoundation
        ? "Appears in multiple industry packs — recommend promotion to Platform Foundation."
        : previous?.recommendation ||
          "Keep as pack-local workaround until Foundation constitution review.",
      workaround: data.workaround,
      implementationHistory: previous?.implementationHistory ?? Object.freeze([]),
      packsMentioning: Object.freeze(packsMentioning),
      promoteToFoundation,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    });
    synced.push(per);
  }

  // Reflect open PERs onto AcademyOS product
  const products = createProductRegistryService();
  const openIds = synced
    .filter((p) => p.status === "Open" || p.status === "Accepted")
    .filter((p) => p.originatingPack === "academyos" || p.packsMentioning.includes("academyos"))
    .map((p) => p.id);
  products.upsert({ id: "academyos", openPerIds: openIds });

  return synced;
}

export function createPerEngine() {
  return {
    sync: syncPersFromRepository,
    list() {
      if (listPers().length === 0) syncPersFromRepository();
      return Object.freeze(listPers());
    },
    get: getPer,

    upsert(input: {
      id: string;
      description: string;
      originatingPack: string;
      affectedServices?: readonly string[];
      status?: PerStatus;
      recommendation?: string;
      workaround?: string;
      actor: string;
    }): StudioPer | { error: string } {
      if (!input.id.startsWith("PER-")) {
        return { error: "PER id must start with PER-." };
      }
      if (
        input.status &&
        !(PER_STATUSES as readonly string[]).includes(input.status)
      ) {
        return { error: "Invalid PER status." };
      }
      const previous = getPer(input.id);
      const now = new Date().toISOString();
      const history = [
        ...(previous?.implementationHistory ?? []),
        {
          at: now,
          note: input.status
            ? `Status → ${input.status}`
            : "PER upserted via Studio",
          actor: input.actor,
        },
      ];
      const packs = new Set([
        ...(previous?.packsMentioning ?? []),
        input.originatingPack,
      ]);
      const packsMentioning = [...packs].sort();
      const promoteToFoundation =
        packsMentioning.length > 1 ||
        previous?.promoteToFoundation === true;
      return upsertPer({
        id: input.id,
        description: input.description,
        originatingPack: input.originatingPack,
        affectedServices: Object.freeze([
          ...(input.affectedServices ?? previous?.affectedServices ?? []),
        ]),
        status: input.status ?? previous?.status ?? "Open",
        recommendation:
          input.recommendation ??
          previous?.recommendation ??
          (promoteToFoundation
            ? "Appears in multiple industry packs — recommend promotion to Platform Foundation."
            : "Keep as pack-local workaround until Foundation constitution review."),
        workaround: input.workaround ?? previous?.workaround ?? "",
        implementationHistory: Object.freeze(history),
        packsMentioning: Object.freeze(packsMentioning),
        promoteToFoundation,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
      });
    },

    promotionCandidates() {
      return Object.freeze(
        this.list().filter((p) => p.promoteToFoundation)
      );
    },

    search(input: {
      q?: string;
      status?: PerStatus;
      pack?: string;
      promoteOnly?: boolean;
    }) {
      const q = input.q?.trim().toLowerCase();
      return Object.freeze(
        this.list().filter((p) => {
          if (input.status && p.status !== input.status) return false;
          if (input.pack && !p.packsMentioning.includes(input.pack) && p.originatingPack !== input.pack)
            return false;
          if (input.promoteOnly && !p.promoteToFoundation) return false;
          if (!q) return true;
          return (
            p.id.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.workaround.toLowerCase().includes(q)
          );
        })
      );
    },
  };
}
