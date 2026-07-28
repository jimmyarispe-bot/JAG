import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";

export function newId(prefix: string): string {
  return `${prefix}:${randomUUID()}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function contentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/** Deterministic vector-ready embedding placeholder (32 dims). */
export function hashVector(text: string, dims = 32): readonly number[] {
  const hash = createHash("sha256").update(text).digest();
  const out: number[] = [];
  for (let i = 0; i < dims; i++) {
    out.push((hash[i % hash.length]! / 255) * 2 - 1);
  }
  return Object.freeze(out);
}
