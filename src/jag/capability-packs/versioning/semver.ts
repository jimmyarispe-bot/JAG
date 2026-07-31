/**
 * Minimal semver helpers for pack versioning / ranges.
 */

function parse(version: string): [number, number, number] | null {
  const m = version.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function compareSemver(a: string, b: string): number {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return a.localeCompare(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i]! !== pb[i]!) return pa[i]! - pb[i]!;
  }
  return 0;
}

/** Support: `*`, exact, `^1.2.3`, `>=1.0.0`. */
export function satisfiesVersionRange(
  version: string,
  range: string
): boolean {
  const r = range.trim();
  if (!r || r === "*") return true;
  if (r.startsWith("^")) {
    const base = parse(r.slice(1));
    const v = parse(version);
    if (!base || !v) return version === r.slice(1);
    if (v[0] !== base[0]) return false;
    if (v[0] === 0) {
      return v[1] === base[1] && v[2]! >= base[2]!;
    }
    return compareSemver(version, r.slice(1)) >= 0;
  }
  if (r.startsWith(">=")) {
    return compareSemver(version, r.slice(2).trim()) >= 0;
  }
  if (r.startsWith("<=")) {
    return compareSemver(version, r.slice(2).trim()) <= 0;
  }
  return version === r || version.startsWith(`${r}.`);
}

export function packProvidesModules(pack: {
  readonly modules?: readonly string[];
  readonly providesModules?: readonly string[];
}): readonly string[] {
  return pack.providesModules ?? pack.modules ?? [];
}
