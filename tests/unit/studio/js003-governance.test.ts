/**
 * JS-003 — Release Intelligence & Product Governance
 */

import { afterEach, describe, expect, it } from "vitest";
import { join } from "node:path";
import {
  APPROVAL_ROLES,
  buildGovernanceDashboard,
  computeProductQualityScore,
  createApprovalService,
  createCertificationEngine,
  createPolicyEngine,
  createReleaseArtifactService,
  createReleaseManager,
  evaluatePolicies,
  evaluateReleaseGates,
  getQualityWeights,
  installJagStudio,
  resetStudioStoreForTests,
  setQualityWeights,
  stageRank,
} from "@studio";
import {
  resetPlatformSdkForTests,
  resetPlatformSdkStoreForTests,
} from "@/lib/platform-sdk";

const root = join(__dirname, "../../..");
const ORG = "org.studio.js003";

afterEach(() => {
  resetStudioStoreForTests();
  resetPlatformSdkStoreForTests();
  resetPlatformSdkForTests();
});

describe("JS-003 Release Intelligence & Governance", () => {
  it(
    "evaluates release gates and enforces policies from evidence",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });

      const gates = evaluateReleaseGates({
        productId: "academyos",
        targetStage: "RC-2",
        root,
      });
      expect(gates.gates.length).toBeGreaterThan(5);
      expect(gates.gates.every((g) => g.evidence.length >= 0)).toBe(true);
      expect(gates.gates.some((g) => g.category === "Architecture")).toBe(true);
      expect(gates.gates.some((g) => g.category === "Testing")).toBe(true);
      expect(gates.gates.some((g) => g.category === "Documentation")).toBe(true);
      expect(gates.gates.some((g) => g.category === "Security")).toBe(true);
      expect(gates.gates.some((g) => g.category === "Operations")).toBe(true);

      const compliance = evaluatePolicies({ productId: "academyos", root });
      expect(compliance.evaluations.length).toBeGreaterThan(0);
      expect(compliance.compliancePercent).toBeGreaterThanOrEqual(0);
      expect(createPolicyEngine().list().length).toBeGreaterThanOrEqual(5);
    },
    60_000
  );

  it(
    "maintains certification records and multi-product governance",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });
      const engine = createCertificationEngine();
      const certs = engine.list(root);
      expect(certs.length).toBeGreaterThanOrEqual(4);
      expect(certs.some((c) => c.productId === "academyos")).toBe(true);
      expect(certs.some((c) => c.productId === "healthcareos")).toBe(true);

      const academy = engine.refresh("academyos", {
        root,
        actor: "test",
        note: "JS-003 refresh",
      });
      expect(academy.releaseStage).toBe("RC-3");
      expect(academy.certificationHistory.length).toBeGreaterThan(0);
      expect(academy.requiredGates.length).toBeGreaterThan(0);

      const signed = engine.sign({
        productId: "academyos",
        signedBy: "qa-bot",
        root,
      });
      expect("error" in signed).toBe(false);
      if (!("error" in signed)) {
        expect(signed.signedArtifacts.length).toBeGreaterThan(0);
        expect(signed.signedArtifacts[0]!.digest.startsWith("sha1-lite:")).toBe(
          true
        );
      }
    },
    90_000
  );

  it(
    "runs approval workflow and blocks Certified without approvals",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });
      const releases = createReleaseManager();
      const release = releases.list("academyos")[0]!;
      expect(release).toBeTruthy();

      const blocked = releases.advance({
        releaseId: release.id,
        status: "Certified",
        actor: "eng",
        skipGateCheck: true,
      });
      expect(blocked && "error" in blocked).toBe(true);

      const approvals = createApprovalService();
      for (const role of APPROVAL_ROLES) {
        const rec = approvals.record({
          productId: "academyos",
          releaseId: release.id,
          role,
          approver: `user.${role.toLowerCase()}`,
          decision: "Approved",
          comments: `${role} sign-off`,
        });
        expect("error" in rec).toBe(false);
      }
      const wf = approvals.workflow({
        productId: "academyos",
        releaseId: release.id,
      });
      expect(wf.complete).toBe(true);
      expect(wf.nextRole).toBeNull();

      const advanced = releases.advance({
        releaseId: release.id,
        status: "Certified",
        actor: "release-mgr",
        note: "All approvals complete",
        skipGateCheck: true,
      });
      expect(advanced && !("error" in advanced)).toBe(true);
      if (advanced && !("error" in advanced)) {
        expect(advanced.status).toBe("Certified");
        expect(advanced.certifiedAt).toBeTruthy();
      }
    },
    90_000
  );

  it(
    "generates release artifacts and computes transparent quality scores",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });

      const artifacts = createReleaseArtifactService().generate({
        productId: "academyos",
        root,
      });
      expect("error" in artifacts).toBe(false);
      if (!("error" in artifacts)) {
        expect(artifacts.canonical).toBe(true);
        expect(artifacts.releaseNotes.length).toBeGreaterThan(0);
        expect(artifacts.testSummary.suites).toBeGreaterThan(0);
        expect(artifacts.qualityReport.overall).toBeGreaterThanOrEqual(0);
        expect(artifacts.compatibilityMatrix.platform).toBeTruthy();
      }

      const weights = getQualityWeights();
      expect(
        Object.values(weights).reduce((a, b) => a + b, 0)
      ).toBeCloseTo(100);

      const score = computeProductQualityScore({
        productId: "academyos",
        root,
      });
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.components.length).toBe(8);
      expect(score.methodology).toContain("weights");

      const bad = setQualityWeights({
        ...weights,
        testHealth: 99,
      });
      expect("error" in bad).toBe(true);

      expect(stageRank("RC-2")).toBeGreaterThan(stageRank("Beta"));
      expect(stageRank("RC")).toBe(stageRank("RC-1"));
    },
    90_000
  );

  it(
    "governance dashboard identifies ready, blocked, and at-risk products",
    () => {
      installJagStudio({
        organizationId: ORG,
        freshSdk: true,
        repositoryRoot: root,
      });
      const dash = buildGovernanceDashboard(root);
      expect(dash.certificationProgress.length).toBeGreaterThanOrEqual(4);
      expect(dash.policyCompliance.length).toBeGreaterThanOrEqual(4);
      expect(dash.qualityTrends.length).toBeGreaterThanOrEqual(4);
      expect(
        dash.certificationProgress.some((c) => c.productId === "academyos")
      ).toBe(true);
      expect(Array.isArray(dash.blockedReleases)).toBe(true);
      expect(Array.isArray(dash.productsAwaitingApproval)).toBe(true);
      expect(Array.isArray(dash.openCriticalIssues)).toBe(true);
    },
    90_000
  );
});
