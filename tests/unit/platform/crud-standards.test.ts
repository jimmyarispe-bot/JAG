import { describe, expect, it } from "vitest";
import { ACTIVITY_EVENT_CATALOG } from "@/lib/platform/activity/catalog";
import {
  CRUD_COMPLETION_RULE,
  DELETE_CONFIRMATION_TOKEN,
  ENTITY_CAPABILITIES,
  assertCanHardDelete,
  canMarkModuleComplete,
  emptyDependencyReport,
  entitySupports,
  evaluateCrudCompliance,
  getEntityCapability,
  getEntityReleaseStatus,
  lifecycleEventType,
  listEntityCapabilities,
  validateCrudCompletionGate,
  validateDeleteConfirmation,
} from "@/lib/platform/crud";

describe("CRUD confirmation policy", () => {
  it("requires acknowledgement and exact DELETE token", () => {
    expect(
      validateDeleteConfirmation({ confirmationText: "DELETE", acknowledged: false }).ok
    ).toBe(false);
    expect(
      validateDeleteConfirmation({ confirmationText: "delete", acknowledged: true }).ok
    ).toBe(false);
    expect(
      validateDeleteConfirmation({
        confirmationText: DELETE_CONFIRMATION_TOKEN,
        acknowledged: true,
      }).ok
    ).toBe(true);
  });

  it("blocks hard delete when dependencies exist and suggests archive", () => {
    const blocked = assertCanHardDelete({
      entityId: "x",
      blocking: [{ key: "invoices", label: "Invoices", count: 2 }],
      informational: [],
      canDelete: false,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.code).toBe("has_dependencies");
      expect(blocked.suggestArchive).toBe(true);
    }

    expect(assertCanHardDelete(emptyDependencyReport("x")).ok).toBe(true);
  });
});

describe("entity capability registry", () => {
  it("lists every major module entity", () => {
    const keys = listEntityCapabilities().map((c) => c.entityKey);
    for (const key of [
      "student",
      "family",
      "admission",
      "employee",
      "communication",
      "announcement",
      "template",
      "calendar_event",
      "workflow",
      "invoice",
      "payment",
    ] as const) {
      expect(keys).toContain(key);
    }
    expect(ENTITY_CAPABILITIES.length).toBeGreaterThanOrEqual(15);
  });

  it("marks archive preferred and hard-delete rules correctly", () => {
    expect(entitySupports("student", "archive")).toBe(true);
    expect(entitySupports("student", "delete")).toBe(true);
    expect(getEntityCapability("student")?.archivePreferred).toBe(true);

    expect(entitySupports("workflow", "duplicate")).toBe(true);
    expect(entitySupports("workflow", "restore")).toBe(true);

    expect(entitySupports("invoice", "delete")).toBe(false);
    expect(getEntityCapability("invoice")?.immutable).toBe(true);

    expect(entitySupports("employee", "deactivate")).toBe(true);
    expect(entitySupports("employee", "delete")).toBe(false);

    expect(entitySupports("calendar_event", "cancel")).toBe(true);
    expect(entitySupports("calendar_event", "duplicate")).toBe(true);
  });

  it("builds lifecycle event type keys", () => {
    expect(lifecycleEventType("student", "archive")).toBe("student.archived");
    expect(lifecycleEventType("workflow", "duplicate")).toBe("workflow.duplicated");
    expect(lifecycleEventType("employee", "deactivate")).toBe("employee.deactivated");
    expect(lifecycleEventType("student", "view")).toBeNull();
  });
});

describe("EI lifecycle catalog coverage", () => {
  it("registers restore/delete/duplicate events for core entities", () => {
    for (const key of [
      "student.archived",
      "student.restored",
      "student.deleted",
      "family.archived",
      "family.restored",
      "family.deleted",
      "communication.archived",
      "communication.restored",
      "communication.deleted",
      "communication.duplicated",
      "template.archived",
      "template.duplicated",
      "announcement.archived",
      "announcement.duplicated",
      "workflow.archived",
      "workflow.restored",
      "workflow.deleted",
      "workflow.duplicated",
      "employee.deactivated",
      "employee.restored",
    ] as const) {
      expect(ACTIVITY_EVENT_CATALOG[key]).toBeTruthy();
    }
  });
});

describe("CRUD completion gate", () => {
  it("states the platform rule", () => {
    expect(CRUD_COMPLETION_RULE).toMatch(/No new module may be considered complete/i);
  });

  it("allows complete modules that meet the standard", () => {
    expect(canMarkModuleComplete("student").ok).toBe(true);
    expect(canMarkModuleComplete("workflow").ok).toBe(true);
    expect(canMarkModuleComplete("invoice").ok).toBe(true);
    expect(getEntityReleaseStatus("student")).toBe("complete");
  });

  it("blocks marking incomplete / unregistered modules as complete", () => {
    // Admission is registered but partial — capability may or may not meet matrix;
    // release status must not be complete until compliant.
    expect(getEntityReleaseStatus("admission")).toBe("partial");
    // `document` was partial when this test was written and has since passed the
    // completion gate (see "validateCrudCompletionGate passes for current release
    // map"). Assert against an entity that is still genuinely partial instead.
    expect(getEntityReleaseStatus("notification")).toBe("partial");

    const unknown = canMarkModuleComplete("not_a_real_entity" as never);
    expect(unknown.ok).toBe(false);
    expect(unknown.reasons.join(" ")).toMatch(/not registered|CRUD/i);
  });

  it("validateCrudCompletionGate passes for current release map", () => {
    const gate = validateCrudCompletionGate();
    expect(gate.ok).toBe(true);
    for (const result of gate.results) {
      if (result.releaseStatus === "complete") {
        expect(result.meetsStandard).toBe(true);
        expect(evaluateCrudCompliance(getEntityCapability(result.entityKey)!).meetsStandard).toBe(
          true
        );
      }
    }
  });
});
