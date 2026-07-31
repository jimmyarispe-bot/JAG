/**
 * Deterministic checksum for marketplace manifests (integrity representation).
 * Not a cryptographic signature.
 */

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

/** Simple non-crypto checksum (djb2 hex). */
export function marketplaceChecksum(value: unknown): string {
  const s = stableStringify(value);
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
  }
  return `djb2:${(hash >>> 0).toString(16)}`;
}
