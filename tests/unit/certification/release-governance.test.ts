import { describe, expect, it, beforeEach } from "vitest";
import {
  APPROVAL_FORMS,
  GOVERNANCE_CHECKLISTS,
  RELEASE_STATES,
  buildGoNoGoDecisionMatrix,
  buildReleaseDashboard,
  canTransition,
  getApprovalForm,
  getChecklistDefinition,
  getReleaseStateDefinition,
  nextReleaseStates,
  resetReleaseGovernanceStoreForTests,
} from "@/lib/certification/release-governance";

describe("Release Governance Framework (Phase G.1)", () => {
  beforeEach(() => {
    resetReleaseGovernanceStoreForTests();
  });

  it("defines the full release lifecycle including RC3.5 and GA", () => {
    const ids = RELEASE_STATES.map((s) => s.id);
    expect(ids).toContain("development");
    expect(ids).toContain("rc1");
    expect(ids).toContain("rc2");
    expect(ids).toContain("rc3");
    expect(ids).toContain("rc3_5");
    expect(ids).toContain("rc4");
    expect(ids).toContain("general_availability");
    expect(ids).toContain("maintenance");
    expect(getReleaseStateDefinition("rc3_5").label).toMatch(/Dress Rehearsal/);
  });

  it("enforces linear state transitions", () => {
    expect(canTransition("rc1", "rc2")).toBe(true);
    expect(canTransition("rc1", "rc4")).toBe(false);
    expect(nextReleaseStates("rc3")).toEqual(["rc3_5"]);
  });

  it("catalogs RC checklists and cross quality gates", () => {
    expect(GOVERNANCE_CHECKLISTS.length).toBeGreaterThanOrEqual(6);
    const cross = getChecklistDefinition("cross_quality_gates");
    expect(cross.items.length).toBe(14);
    expect(getChecklistDefinition("rc1_engineering").items.some((i) => i.id === "rc1.e2e")).toBe(
      true
    );
  });

  it("requires digital signature on approvals and appends immutable audit events", () => {
    const store = resetReleaseGovernanceStoreForTests();
    expect(() =>
      store.recordApproval({
        formId: "rc1_sign_off",
        phase: "rc1",
        approverName: "Ada",
        approverRole: "Engineering Lead",
        evidenceReviewed: ["ci"],
        decision: "approved",
        digitalSignature: "",
      })
    ).toThrow(/digitalSignature/);

    const before = store.audit.count();
    const approval = store.recordApproval({
      formId: "engineering_approval",
      phase: "rc1",
      approverName: "Ada Lovelace",
      approverRole: "Engineering Lead",
      evidenceReviewed: ["typecheck", "build"],
      decision: "conditional",
      digitalSignature: "Ada Lovelace",
      conditions: "E2E still open",
    });
    expect(approval.digitalSignature).toBe("Ada Lovelace");
    expect(store.audit.count()).toBe(before + 1);

    const events = store.audit.list();
    const last = events[events.length - 1]!;
    expect(Object.isFrozen(last)).toBe(true);
    expect(last.type).toBe("approval_recorded");
  });

  it("updates checklist items with audit trail", () => {
    const store = resetReleaseGovernanceStoreForTests();
    store.updateChecklistItem({
      checklistId: "rc1_engineering",
      itemId: "rc1.cicd",
      status: "complete",
      actor: "ci-bot",
      evidenceRef: "github-actions#123",
    });
    const release = store.getRelease();
    const row = release.checklistProgress.rc1_engineering!.find((r) => r.itemId === "rc1.cicd");
    expect(row?.status).toBe("complete");
    expect(store.audit.list().some((e) => e.type === "checklist_update")).toBe(true);
  });

  it("builds dashboard snapshot and go/no-go matrix for seeded AcademyOS 1.0", () => {
    const store = resetReleaseGovernanceStoreForTests();
    const dash = buildReleaseDashboard(store);
    expect(dash.release.version).toBe("1.0.0");
    expect(dash.release.currentState).toBe("rc1");
    expect(dash.goNoGoEligible).toBe(false);
    expect(dash.checklistCompletionPercent).toBeGreaterThan(0);
    expect(dash.openApprovals.length).toBeGreaterThan(0);

    const matrix = buildGoNoGoDecisionMatrix(store);
    expect(matrix.every((r) => typeof r.pass === "boolean")).toBe(true);
    expect(matrix.find((r) => r.criterion === "Critical defects")?.pass).toBe(false);
  });

  it("exposes approval form catalog used by workflows", () => {
    expect(APPROVAL_FORMS.length).toBeGreaterThanOrEqual(10);
    expect(getApprovalForm("go_no_go").requiredRoles).toContain("Executive Sponsor");
  });

  it("records legal state transitions in the audit trail", () => {
    const store = resetReleaseGovernanceStoreForTests();
    // Seed pretends rc1; transitioning to rc2 without sign-off is allowed at store level
    // (exit criteria enforced by process/dashboard, not hard-blocked here except linearity).
    store.transitionState("rc2", "release-manager", "Process test only");
    expect(store.getRelease().currentState).toBe("rc2");
    expect(() => store.transitionState("rc4", "x", "skip")).toThrow(/Illegal transition/);
  });
});
