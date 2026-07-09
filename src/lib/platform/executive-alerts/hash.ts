/** Stable, deterministic string hash for alert ids / dedupe keys (no crypto dependency). */

export function hashString(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // unsigned 32-bit → hex
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function normalizeToken(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value).trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * Sprint 002 §2.3:
 * dedupe_key = hash(schoolId, alertClass, entityType, entityId, signalKey)
 *
 * Uses campus (school site) when present, else schoolId, else organization.
 */
export function buildDedupeKey(parts: {
  schoolId?: string | null;
  campusId?: string | null;
  organizationId?: string | null;
  category: string;
  entityType?: string | null;
  entityId?: string | null;
  signalKey: string;
}): string {
  const scope =
    parts.campusId ?? parts.schoolId ?? parts.organizationId ?? "global";
  const payload = [
    normalizeToken(scope),
    normalizeToken(parts.category),
    normalizeToken(parts.entityType ?? "none"),
    normalizeToken(parts.entityId ?? "none"),
    normalizeToken(parts.signalKey),
  ].join("|");
  return `ea_${hashString(payload)}`;
}

/** Deterministic alert id from dedupe key (stable across rebuilds). */
export function alertIdFromDedupeKey(dedupeKey: string): string {
  return `alert_${hashString(dedupeKey)}`;
}
