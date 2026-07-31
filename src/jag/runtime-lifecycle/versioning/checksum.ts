import type { RuntimeSpecification } from "@/jag/blueprints/contracts";
import {
  runtimeSpecificationFingerprint,
  stableStringify,
} from "@/jag/runtime-generation";

/** Deterministic checksum for an immutable Runtime Specification. */
export function checksumRuntimeSpecification(
  specification: RuntimeSpecification
): string {
  return runtimeSpecificationFingerprint(specification);
}

export function checksumPayload(value: unknown): string {
  return stableStringify(value);
}
