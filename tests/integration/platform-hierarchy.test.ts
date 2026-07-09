import { describe, expect, it } from "vitest";
import "@/lib/platform/hierarchy";
import "@/lib/platform/rules";
import "@/lib/platform/events";
import "@/lib/platform/workflow";
import "@/lib/platform/decision";
import "@/lib/platform/ulr";
import {
  JAG_HIERARCHY_LAYER_KINDS,
  buildHierarchyTree,
  collectHierarchyDiagnostics,
  executeHierarchyCapability,
  getAllCapabilityBindings,
  getAllHierarchyNodes,
  getHierarchyRegistrySnapshot,
  isHierarchyRegistryRegistered,
  isKnownCapabilityKey,
  lookupExecutingProcedure,
  lookupGoverningProtocol,
  lookupGoverningStandard,
  lookupOwningProcess,
  resolveHierarchyReferences,
  resolveWorkflowContext,
  validateHierarchyRegistryComplete,
} from "@/lib/platform/hierarchy";

describe("JAG Hierarchy registry validation", () => {
  it("passes build-time integrity checks", () => {
    const result = validateHierarchyRegistryComplete();
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("registers on side-effect import", () => {
    expect(isHierarchyRegistryRegistered()).toBe(true);
    expect(getAllHierarchyNodes().length).toBeGreaterThanOrEqual(20);
  });

  it("registers all 20 layer kinds", () => {
    const kinds = new Set(getAllHierarchyNodes().map((n) => n.kind));
    for (const kind of JAG_HIERARCHY_LAYER_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
  });

  it("returns complete registry snapshot", () => {
    const snapshot = getHierarchyRegistrySnapshot();
    expect(snapshot.layerKinds).toHaveLength(20);
    expect(snapshot.capabilityBindings.length).toBeGreaterThanOrEqual(4);
  });
});

describe("JAG Hierarchy lookup services", () => {
  it("resolves teacher session delivery workflow context", () => {
    expect(isKnownCapabilityKey("cap.teacher.session_delivery")).toBe(true);
    const ctx = resolveWorkflowContext("cap.teacher.session_delivery");
    expect(ctx).not.toBeNull();
    expect(ctx!.governance.standard?.nodeKey).toBe("jag.standard.instructional_excellence");
    expect(ctx!.governance.procedure?.nodeKey).toBe("jag.procedure.conduct_session");
    expect(ctx!.ruleSetKeys).toContain("ref_platform_access_gate");
  });

  it("resolves governing chain accessors", () => {
    expect(lookupGoverningStandard("cap.teacher.progress_recording")?.kind).toBe("standard");
    expect(lookupGoverningProtocol("cap.teacher.progress_recording")?.kind).toBe("protocol");
    expect(lookupOwningProcess("cap.teacher.progress_recording")?.kind).toBe("process");
    expect(lookupExecutingProcedure("cap.teacher.progress_recording")?.kind).toBe("procedure");
  });

  it("extracts flat hierarchy references", () => {
    const refs = resolveHierarchyReferences("cap.paj.evidence_intake");
    expect(refs).not.toBeNull();
    expect(refs!.ruleSetKeys).toContain("ref_structured_literacy_placement");
    expect(refs!.evidenceTypeKeys).toContain("jag.evidence.assessment_result");
  });

  it("builds hierarchy tree from vision root", () => {
    const tree = buildHierarchyTree();
    expect(tree?.kind).toBe("vision");
    expect(tree!.children.length).toBeGreaterThan(0);
  });
});

describe("JAG Hierarchy runtime execution", () => {
  it("executes pipeline for teacher session delivery", async () => {
    const result = await executeHierarchyCapability({
      capabilityKey: "cap.teacher.session_delivery",
      facts: { role: "admin", has_permission: true },
    });

    expect(result.ok).toBe(true);
    expect(result.steps.map((s) => s.stepId)).toContain("done");
    expect(result.steps.find((s) => s.stepId === "load-standard")?.status).toBe("complete");
    expect(result.ruleEvaluationIds?.length).toBeGreaterThan(0);
  });

  it("skips rule evaluation when facts are omitted", async () => {
    const result = await executeHierarchyCapability({
      capabilityKey: "cap.teacher.progress_recording",
    });
    expect(result.steps.find((s) => s.stepId === "evaluate-rules")?.status).toBe("skipped");
  });

  it("fails for unknown capability", async () => {
    const result = await executeHierarchyCapability({ capabilityKey: "cap.unknown" });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("JAG Hierarchy diagnostics", () => {
  it("collects diagnostics report", () => {
    const report = collectHierarchyDiagnostics();
    expect(report.registered).toBe(true);
    expect(report.validationOk).toBe(true);
    expect(report.nodeCount).toBeGreaterThanOrEqual(20);
    expect(report.capabilityCount).toBe(getAllCapabilityBindings().length);
    expect(report.missingLayerKinds).toHaveLength(0);
  });
});
