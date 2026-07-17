/**
 * Shared intelligence scoring primitives (Stabilization A2).
 *
 * Leaf package: imports nothing from domain packages.
 * Domains may import these; never the reverse.
 *
 * Extract only generic math/band helpers. Domain baselines, lenses,
 * and engines stay inside each domain.
 */

/** Clamp to [min, max], replacing non-finite values with min. */
export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

/**
 * Clamp without finite-guard (preserves NaN/Infinity passthrough edge cases
 * used by early product domains such as customer / funding).
 */
export function clampUnchecked(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/** Clamp to [0, 1] via unchecked path (matches early-domain clamp01). */
export function clamp01(value: number): number {
  return clampUnchecked(value, 0, 1);
}

/**
 * Clamp to [0, 1], mapping NaN → 0 (executive-graph / decision / predictive).
 */
export function clamp01NaNSafe(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Normalize an unknown soft-read into a 0–100-ish score.
 * Numbers ≤ 1 are treated as ratios and scaled ×100.
 */
export function lightScore(value: unknown, fallback: number): number {
  return typeof value === "number" ? (value <= 1 ? value * 100 : value) : fallback;
}

/**
 * Same as {@link lightScore}, then clamped with the finite-safe clamp.
 * Used by systems / wisdom-style late domains.
 */
export function lightScoreClamped(value: unknown, fallback: number): number {
  return clamp(lightScore(value, fallback));
}
