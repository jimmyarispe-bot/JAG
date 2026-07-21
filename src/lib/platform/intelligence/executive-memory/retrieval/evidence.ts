import type {
  MemoryEntity,
  MemoryEvidence,
} from "@/lib/platform/intelligence/executive-memory/types";

export function collectEvidence(entities: MemoryEntity[]): MemoryEvidence[] {
  const out: MemoryEvidence[] = [];
  for (const e of entities) {
    for (const ev of e.evidence) out.push(ev);
    if (e.summary) {
      out.push({
        id: `ev-sum-${e.id}`,
        domain: e.domains[0],
        statement: e.summary,
        weight: 0.5,
        supporting: true,
        sourceEntityId: e.id,
      });
    }
  }
  return out;
}
