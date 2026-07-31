/**
 * MemoryValidation — lifecycle gates for Draft → Validated → Published → Archived.
 */

import type { MemoryStatus } from "@/lib/memory/types";

const STATUS_ORDER: readonly MemoryStatus[] = [
  "Draft",
  "Validated",
  "Published",
  "Archived",
];

export type MemoryValidationService = {
  canTransition(from: MemoryStatus, to: MemoryStatus): boolean;
  requiresOwner(status: MemoryStatus): boolean;
  validateForPublish(input: {
    title: string;
    summary: string;
    owner: string | null;
  }): string | null;
};

export function createMemoryValidation(): MemoryValidationService {
  return {
    canTransition(from, to) {
      if (from === to) return true;
      const fi = STATUS_ORDER.indexOf(from);
      const ti = STATUS_ORDER.indexOf(to);
      if (fi < 0 || ti < 0) return false;
      // Forward only through Draft → Validated → Published → Archived
      if (ti === fi + 1) return true;
      // Allow return to Draft from Validated for corrections
      if (from === "Validated" && to === "Draft") return true;
      // Allow archive from Validated or Published
      if (to === "Archived" && (from === "Validated" || from === "Published")) {
        return true;
      }
      return false;
    },

    requiresOwner(status) {
      return status === "Validated" || status === "Published";
    },

    validateForPublish(input) {
      if (!input.title.trim()) return "Title is required to publish.";
      if (!input.summary.trim()) return "Summary is required to publish.";
      if (!input.owner?.trim()) return "Owner is required to publish.";
      return null;
    },
  };
}
