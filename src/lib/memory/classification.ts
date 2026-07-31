/**
 * MemoryClassification — deterministic category / source helpers (no AI).
 */

import {
  MEMORY_CATEGORIES,
  MEMORY_SOURCES,
  type MemoryCategory,
  type MemorySource,
} from "@/lib/memory/types";

export type MemoryClassificationService = {
  isValidCategory(value: string): value is MemoryCategory;
  isValidSource(value: string): value is MemorySource;
  categories(): readonly MemoryCategory[];
  sources(): readonly MemorySource[];
  /** Map a source domain to a sensible default category when none provided. */
  defaultCategoryForSource(source: MemorySource): MemoryCategory;
};

export function createMemoryClassification(): MemoryClassificationService {
  return {
    isValidCategory(value): value is MemoryCategory {
      return (MEMORY_CATEGORIES as readonly string[]).includes(value);
    },
    isValidSource(value): value is MemorySource {
      return (MEMORY_SOURCES as readonly string[]).includes(value);
    },
    categories: () => MEMORY_CATEGORIES,
    sources: () => MEMORY_SOURCES,
    defaultCategoryForSource(source) {
      switch (source) {
        case "Decisions":
          return "Decision";
        case "Goals":
          return "Strategy";
        case "Risks":
          return "Risk";
        case "Work":
          return "Operational";
        case "Evidence":
          return "Compliance";
        case "Connectors":
          return "Operational";
        case "Manual entry":
        default:
          return "Lesson Learned";
      }
    },
  };
}
