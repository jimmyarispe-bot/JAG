import "@/lib/platform/ulr/registry/register";
import { validateUlrKeys } from "@/lib/platform/ulr/registry/validate";
import type { ValidateUlrKeysInput } from "@/lib/platform/ulr/types";

/** Validate KEE evidence keys against ULR — unknown keys flagged for enrichment queue (Doc 12 §9). */
export function validateEvidenceAgainstUlr(input: ValidateUlrKeysInput) {
  return validateUlrKeys(input);
}
