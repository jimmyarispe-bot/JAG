import { resetDecisionExtensionsForTests } from "@/jag/decisions/contracts/extensions";
import { resetDecisionContextCacheForTests } from "@/jag/decisions/context";
import { resetDecisionRegistryForTests } from "@/jag/decisions/registry";
import {
  resetDecisionClockForTests,
  resetDecisionIdsForTests,
  setDecisionClockForTests,
  setDecisionIdPrefixForTests,
} from "@/jag/decisions/runtime";
import {
  resetDecisionEventsForTests,
  resetDecisionTelemetryForTests,
} from "@/jag/decisions/telemetry";
import type { DecisionDefinition } from "@/jag/decisions/contracts/definitions";

export function resetDecisionEngineForTests(): void {
  resetDecisionRegistryForTests();
  resetDecisionContextCacheForTests();
  resetDecisionIdsForTests();
  resetDecisionClockForTests();
  resetDecisionEventsForTests();
  resetDecisionTelemetryForTests();
  resetDecisionExtensionsForTests();
}

export function freezeDecisionEngineForTests(input?: {
  now?: Date;
  idPrefix?: string;
}): void {
  const now = input?.now ?? new Date("2026-01-15T12:00:00.000Z");
  resetDecisionIdsForTests();
  setDecisionClockForTests(() => now);
  setDecisionIdPrefixForTests(input?.idPrefix ?? "test");
}

/** Minimal generic decision — no industry semantics. */
export function createTestDecisionDefinition(
  overrides?: Partial<DecisionDefinition> & { id?: string }
): DecisionDefinition {
  const id = overrides?.id ?? "test.decision.generic";
  return {
    id,
    applicationId: overrides?.applicationId ?? "test-app",
    version: overrides?.version ?? "1.0.0",
    label: overrides?.label ?? "Generic Test Decision",
    description: overrides?.description,
    defaultOutcome: overrides?.defaultOutcome ?? "undetermined",
    policies: overrides?.policies ?? [
      {
        id: "policy.primary",
        label: "Primary",
        precedence: 100,
        conflictStrategy: "first_match",
        rules: [
          {
            id: "rule.high",
            priority: 20,
            outcome: "approve",
            rationale: "score meets high threshold",
            conditions: [
              { path: "score", operator: "gte", value: 80 },
            ],
          },
          {
            id: "rule.mid",
            priority: 10,
            outcome: "review",
            rationale: "score in review band",
            conditions: [
              { path: "score", operator: "gte", value: 50 },
              { path: "score", operator: "lt", value: 80 },
            ],
          },
        ],
      },
      {
        id: "policy.deny",
        label: "Deny overrides",
        /** Higher precedence than primary so a block flag wins first. */
        precedence: 200,
        conflictStrategy: "deny_overrides",
        rules: [
          {
            id: "rule.blocked",
            priority: 100,
            outcome: "deny",
            rationale: "explicit block flag",
            conditions: [
              { path: "blocked", operator: "eq", value: true },
            ],
          },
        ],
      },
    ],
    dependsOn: overrides?.dependsOn,
    metadata: overrides?.metadata,
    extensions: overrides?.extensions,
  };
}
