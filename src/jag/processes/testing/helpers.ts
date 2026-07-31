import { resetProcessExtensionsForTests } from "@/jag/processes/contracts/extensions";
import { resetProcessEventsForTests } from "@/jag/processes/events";
import { resetLifecycleHooksForTests } from "@/jag/processes/lifecycle";
import { resetProcessRegistryForTests } from "@/jag/processes/registry";
import {
  resetProcessClockForTests,
  resetProcessIdsForTests,
  resetProcessInstanceStoreForTests,
  setProcessClockForTests,
  setProcessIdPrefixForTests,
} from "@/jag/processes/runtime";
import { resetProcessTelemetryForTests } from "@/jag/processes/telemetry";
import type { ProcessDefinition } from "@/jag/processes/contracts/definitions";

/** Reset all Process Engine in-memory state (registry, runtime, hooks, telemetry). */
export function resetProcessEngineForTests(): void {
  resetProcessRegistryForTests();
  resetProcessInstanceStoreForTests();
  resetProcessIdsForTests();
  resetProcessClockForTests();
  resetLifecycleHooksForTests();
  resetProcessEventsForTests();
  resetProcessTelemetryForTests();
  resetProcessExtensionsForTests();
}

/** Freeze clock + id sequence for deterministic contract tests. */
export function freezeProcessEngineForTests(input?: {
  now?: Date;
  idPrefix?: string;
}): void {
  const now = input?.now ?? new Date("2026-01-15T12:00:00.000Z");
  resetProcessIdsForTests();
  setProcessClockForTests(() => now);
  setProcessIdPrefixForTests(input?.idPrefix ?? "test");
}

/** Minimal valid generic process (no industry semantics). */
export function createTestProcessDefinition(
  overrides?: Partial<ProcessDefinition> & { id?: string }
): ProcessDefinition {
  const id = overrides?.id ?? "test.process.generic";
  return {
    id,
    applicationId: overrides?.applicationId ?? "test-app",
    version: overrides?.version ?? "1.0.0",
    label: overrides?.label ?? "Generic Test Process",
    description: overrides?.description,
    initialStageId: overrides?.initialStageId ?? "draft",
    stages: overrides?.stages ?? [
      { id: "draft", label: "Draft", kind: "initial" },
      { id: "review", label: "Review", kind: "intermediate" },
      { id: "done", label: "Done", kind: "terminal" },
      { id: "void", label: "Void", kind: "cancelled" },
    ],
    transitions: overrides?.transitions ?? [
      { id: "submit", from: "draft", to: "review", label: "Submit" },
      { id: "approve", from: "review", to: "done", label: "Approve" },
      { id: "reject", from: "review", to: "void", label: "Reject" },
      { id: "withdraw", from: "draft", to: "void", label: "Withdraw" },
    ],
    participants: overrides?.participants,
    permissions: overrides?.permissions,
    dependsOn: overrides?.dependsOn,
    metadata: overrides?.metadata,
    extensions: overrides?.extensions,
  };
}
