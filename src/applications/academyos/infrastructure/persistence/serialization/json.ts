/** Safe JSON helpers for persistence payloads (no vendor types). */
export function serializeJson(value: unknown): string {
  return JSON.stringify(value);
}

export function deserializeJson<T>(raw: string | null | undefined): T | null {
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function asString(value: unknown, fallback = ""): string {
  return value == null ? fallback : String(value);
}

export function asNullableString(value: unknown): string | null {
  return value == null ? null : String(value);
}

export function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function asNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
