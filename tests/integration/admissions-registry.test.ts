import { describe, expect, it } from "vitest";
import "@/lib/admissions/registry/register";
import {
  ADMISSIONS_ENTITIES,
  ADMISSIONS_PIPELINE_STAGES,
  ADMISSIONS_WORKFLOW_CATALOG,
  getAdmissionsDashboardTiles,
  getAdmissionsRegistrySnapshot,
  getAdmissionsWorkflowCatalogEntry,
  getAllowedPipelineTransitions,
  groupLeadCountsByPipelineStage,
  isAdmissionsRegistryRegistered,
  isPipelineTransitionAllowed,
  resolvePipelineStageFromLeadStage,
  resolvePipelineStageForTrigger,
  validateAdmissionsRegistry,
} from "@/lib/admissions/registry";

describe("Admissions registry validation", () => {
  it("passes build-time integrity checks", () => {
    const result = validateAdmissionsRegistry();
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("registers catalog on side-effect import", () => {
    expect(isAdmissionsRegistryRegistered()).toBe(true);
  });
});

describe("Admissions OS catalog", () => {
  it("defines all core entities", () => {
    const keys = ADMISSIONS_ENTITIES.map((entity) => entity.key);
    expect(keys).toContain("inquiry");
    expect(keys).toContain("application");
    expect(keys).toContain("interview");
    expect(keys).toContain("enrollment");
    expect(keys).toContain("waitlist");
    expect(keys).toHaveLength(11);
  });

  it("defines 14 pipeline stages", () => {
    expect(ADMISSIONS_PIPELINE_STAGES).toHaveLength(14);
    expect(ADMISSIONS_PIPELINE_STAGES[0]?.key).toBe("inquiry");
    expect(ADMISSIONS_PIPELINE_STAGES.at(-1)?.key).toBe("enrollment_complete");
  });

  it("maps legacy lead stages to OS pipeline stages", () => {
    expect(resolvePipelineStageFromLeadStage("new_inquiry")).toBe("inquiry");
    expect(resolvePipelineStageFromLeadStage("records_requested")).toBe("documents_pending");
    expect(resolvePipelineStageFromLeadStage("admissions_review")).toBe("committee_review");
    expect(resolvePipelineStageFromLeadStage("enrolled")).toBe("enrollment_complete");
  });

  it("groups legacy counts by OS pipeline stage", () => {
    const grouped = groupLeadCountsByPipelineStage({
      new_inquiry: 3,
      tour_scheduled: 2,
      application_submitted: 1,
    });
    const inquiry = grouped.find((item) => item.key === "inquiry");
    const information = grouped.find((item) => item.key === "information_requested");
    const submitted = grouped.find((item) => item.key === "application_submitted");
    expect(inquiry?.count).toBe(3);
    expect(information?.count).toBe(2);
    expect(submitted?.count).toBe(1);
  });

  it("exposes dashboard tiles backed by metric keys", () => {
    const tiles = getAdmissionsDashboardTiles();
    expect(tiles.length).toBeGreaterThanOrEqual(10);
    expect(tiles.every((tile) => tile.metricKey && tile.drillFilter)).toBe(true);
  });

  it("returns a complete registry snapshot", () => {
    const snapshot = getAdmissionsRegistrySnapshot();
    expect(snapshot.entities.length).toBeGreaterThan(0);
    expect(snapshot.integrations.length).toBeGreaterThan(0);
    expect(snapshot.pipelineStages).toHaveLength(14);
    expect(snapshot.workflows.length).toBeGreaterThanOrEqual(12);
    expect(snapshot.dashboardTiles.length).toBeGreaterThan(0);
    expect(snapshot.funnelSteps.length).toBeGreaterThan(0);
  });
});

describe("Admissions pipeline framework", () => {
  it("allows committee review to reach decision stages", () => {
    expect(isPipelineTransitionAllowed("committee_review", "accepted")).toBe(true);
    expect(isPipelineTransitionAllowed("committee_review", "waitlisted")).toBe(true);
    expect(isPipelineTransitionAllowed("committee_review", "declined")).toBe(true);
  });

  it("blocks invalid backward transitions", () => {
    expect(isPipelineTransitionAllowed("accepted", "inquiry")).toBe(false);
    expect(getAllowedPipelineTransitions("inquiry")).toContain("information_requested");
  });

  it("maps workflow triggers to pipeline stages", () => {
    expect(resolvePipelineStageForTrigger("application_submitted")).toBe("application_submitted");
    expect(resolvePipelineStageForTrigger("interview_scheduled")).toBe("interview_scheduled");
    expect(resolvePipelineStageForTrigger("enrollment_completed")).toBe("enrollment_complete");
  });
});

describe("Admissions workflow catalog", () => {
  it("includes seeded default workflows", () => {
    expect(getAdmissionsWorkflowCatalogEntry("wf_inquiry_submitted")).toBeDefined();
    expect(getAdmissionsWorkflowCatalogEntry("wf_accepted")).toBeDefined();
    expect(getAdmissionsWorkflowCatalogEntry("wf_enrollment_completed")).toBeDefined();
  });

  it("links workflows to trigger events", () => {
    const accepted = ADMISSIONS_WORKFLOW_CATALOG.find((w) => w.workflowKey === "wf_accepted");
    expect(accepted?.triggerEvent).toBe("accepted");
    expect(accepted?.pipelineStage).toBe("accepted");
  });
});
