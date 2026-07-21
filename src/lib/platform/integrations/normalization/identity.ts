/**
 * Identity resolution for canonical entities.
 */

import type { IdentityResolver } from "@/lib/platform/integrations/contracts";
import { createHash } from "node:crypto";

export class CanonicalIdentityResolver implements IdentityResolver {
  identityKey(input: {
    sourceSystem: string;
    canonicalType: string;
    externalId: string;
  }): string {
    return `${input.sourceSystem}:${input.canonicalType}:${input.externalId}`.toLowerCase();
  }

  contentHash(data: Record<string, unknown>): string {
    const normalized = stableStringify(data);
    return createHash("sha256").update(normalized).digest("hex").slice(0, 32);
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(",")}}`;
}

export function createIdentityResolver(): CanonicalIdentityResolver {
  return new CanonicalIdentityResolver();
}
