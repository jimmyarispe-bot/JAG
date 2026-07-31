import type { ApplicationModelCompileResult } from "@/jag/modeling/runtime";

/** Collect contribution ids by kind from a compile result. */
export function contributionIdsByKind(
  result: ApplicationModelCompileResult
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const c of result.contributions) {
    out[c.kind] = [...c.ids].sort();
  }
  return out;
}

export function sortedIds(ids: readonly string[]): string[] {
  return [...ids].sort();
}
