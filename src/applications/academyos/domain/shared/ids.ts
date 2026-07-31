/** Deterministic-enough id helper for domain drafts (no platform crypto). */
export function newDomainId(prefix: string): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${stamp}_${rand}`;
}
