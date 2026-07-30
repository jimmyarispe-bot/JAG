/**
 * Registry of memory types — Sprint 204.
 */

import {
  MEMORY_TYPE_LABELS,
  MEMORY_TYPES,
  type MemoryType,
} from "./MemoryRecord";

export type MemoryTypeDefinition = {
  readonly type: MemoryType;
  readonly label: string;
  readonly description: string;
};

const DESCRIPTIONS: Record<MemoryType, string> = {
  decision: "A decision that entered or left the executive queue.",
  execution: "Execution progress on an approved decision.",
  outcome: "Reviewed outcome of a decision.",
  forecast: "Advisory forecast that informed executive attention.",
  scenario: "Scenario projection used in planning.",
  executive_note: "Executive annotation on organizational experience.",
  lesson_learned: "Structured lesson from what worked or failed.",
  risk_event: "Materialized or near-miss risk event.",
  opportunity: "Captured opportunity and response.",
  milestone: "Organizational milestone with institutional relevance.",
  custom: "Custom institutional memory entry.",
};

export const MemoryRegistry = {
  listTypes(): readonly MemoryType[] {
    return MEMORY_TYPES;
  },

  get(type: MemoryType): MemoryTypeDefinition {
    return {
      type,
      label: MEMORY_TYPE_LABELS[type],
      description: DESCRIPTIONS[type],
    };
  },

  list(): readonly MemoryTypeDefinition[] {
    return MEMORY_TYPES.map((t) => this.get(t));
  },
} as const;
