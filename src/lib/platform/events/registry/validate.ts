import {
  getAllEventDefinitions,
  getDuplicateEventRegistrations,
} from "@/lib/platform/events/registry/registry";
import type { EventDefinition } from "@/lib/platform/events/types";
import { EVENT_DISPATCH_MODES, EVENT_SCOPES } from "@/lib/platform/events/types";

export interface EventRegistryValidationIssue {
  code:
    | "duplicate_event_type"
    | "invalid_dispatch_mode"
    | "invalid_scope"
    | "empty_scopes"
    | "inactive_default"
    | "invalid_entity_type";
  message: string;
}

export interface EventRegistryValidationResult {
  ok: boolean;
  issues: EventRegistryValidationIssue[];
}

function validateDefinition(
  definition: EventDefinition,
  issues: EventRegistryValidationIssue[]
): void {
  if (!EVENT_DISPATCH_MODES.includes(definition.dispatchMode)) {
    issues.push({
      code: "invalid_dispatch_mode",
      message: `Event "${definition.eventType}" uses invalid dispatchMode "${definition.dispatchMode}"`,
    });
  }

  if (!definition.scopes.length) {
    issues.push({
      code: "empty_scopes",
      message: `Event "${definition.eventType}" must declare at least one scope`,
    });
  }

  for (const scope of definition.scopes) {
    if (!EVENT_SCOPES.includes(scope)) {
      issues.push({
        code: "invalid_scope",
        message: `Event "${definition.eventType}" uses invalid scope "${scope}"`,
      });
    }
  }
}

/** Validate platform event registry integrity — intended for build-time checks. */
export function validateEventRegistry(): EventRegistryValidationResult {
  const issues: EventRegistryValidationIssue[] = [];

  for (const duplicate of getDuplicateEventRegistrations()) {
    issues.push({
      code: "duplicate_event_type",
      message: `Duplicate event type "${duplicate}" registered`,
    });
  }

  const eventTypes = new Set<string>();
  for (const definition of getAllEventDefinitions()) {
    if (eventTypes.has(definition.eventType)) {
      issues.push({
        code: "duplicate_event_type",
        message: `Duplicate event type "${definition.eventType}"`,
      });
    }
    eventTypes.add(definition.eventType);
    validateDefinition(definition, issues);
  }

  return { ok: issues.length === 0, issues };
}
