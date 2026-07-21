export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export function average(values: number[], fallback = 50): number {
  if (!values.length) return fallback;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function effortLabel(effort: number): "low" | "medium" | "high" {
  if (effort >= 70) return "high";
  if (effort >= 40) return "medium";
  return "low";
}
