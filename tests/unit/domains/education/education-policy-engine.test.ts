import { describe, expect, it } from "vitest";
import {
  EDUCATION_POLICY_CATALOG,
  EDUCATION_POLICY_IDS,
  createEducationPolicyEngine,
  createEducationPolicyRegistry,
  evaluateEducationPolicies,
  validateEducationPolicyRegistry,
} from "@/lib/domains/education";

describe("Education Policy Engine (D3.1)", () => {
  describe("satisfied policy", () => {
    it("satisfies minimum attendance rate when present rate meets threshold", () => {
      const result = evaluateEducationPolicies({
        subjectId: "stu-1",
        facts: { attendancePresentRate: 0.95 },
        policyIds: [EDUCATION_POLICY_IDS.attendanceMinimumRate],
        now: "2026-01-01T00:00:00.000Z",
      });

      expect(result.ok).toBe(true);
      expect(result.satisfied).toHaveLength(1);
      expect(result.satisfied[0]?.policyId).toBe(
        EDUCATION_POLICY_IDS.attendanceMinimumRate
      );
      expect(result.violated).toHaveLength(0);
      expect(result.traces[0]?.outcome).toBe("satisfied");
      expect(result.traces[0]?.supportingEvidence.length).toBeGreaterThan(0);
    });
  });

  describe("violated policy", () => {
    it("violates document requirements when kinds are missing", () => {
      const result = evaluateEducationPolicies({
        facts: {
          requiredDocumentKinds: ["transcript", "identification"],
          completedDocumentKinds: ["transcript"],
        },
        policyIds: [EDUCATION_POLICY_IDS.enrollmentDocumentsRequired],
      });

      expect(result.violated).toHaveLength(1);
      expect(result.violated[0]?.code).toBe("DOCUMENTS_INCOMPLETE");
      expect(result.traces[0]?.outcome).toBe("violated");
      expect(result.traces[0]?.explanation.toLowerCase()).toContain(
        "identification"
      );
    });

    it("violates chronic absence when count meets threshold", () => {
      const result = evaluateEducationPolicies({
        facts: { attendanceAbsenceCount: 10 },
        policyIds: [EDUCATION_POLICY_IDS.attendanceChronicAbsence],
        parameterOverrides: {
          [EDUCATION_POLICY_IDS.attendanceChronicAbsence]: {
            absenceCount: 8,
          },
        },
      });

      expect(result.violated[0]?.code).toBe("CHRONIC_ABSENCE_TRIGGERED");
    });
  });

  describe("unknown outcome", () => {
    it("returns unknown when required facts are absent", () => {
      const result = evaluateEducationPolicies({
        facts: {},
        policyIds: [EDUCATION_POLICY_IDS.attendanceMinimumRate],
      });

      expect(result.unknown).toHaveLength(1);
      expect(result.unknown[0]?.outcome).toBe("unknown");
      expect(result.traces[0]?.missingEvidence).toContain(
        "attendancePresentRate"
      );
      expect(result.satisfied).toHaveLength(0);
      expect(result.violated).toHaveLength(0);
    });
  });

  describe("missing evidence", () => {
    it("lists missing evidence keys on the trace", () => {
      const result = evaluateEducationPolicies({
        facts: {},
        policyIds: [EDUCATION_POLICY_IDS.graduationCredits],
      });

      expect(result.traces[0]?.missingEvidence).toEqual(
        expect.arrayContaining(["earnedCredits"])
      );
      expect(result.traces[0]?.supportingEvidence).toEqual([]);
    });
  });

  describe("multiple policy evaluations", () => {
    it("evaluates a mix of satisfied, violated, and unknown", () => {
      const engine = createEducationPolicyEngine();
      const result = engine.evaluate({
        subjectId: "stu-multi",
        organizationId: "org-edu",
        facts: {
          attendancePresentRate: 0.92,
          attendanceAbsenceCount: 2,
          requiredDocumentKinds: ["transcript", "identification"],
          completedDocumentKinds: ["transcript"],
          // graduation intentionally omitted → unknown
        },
        policyIds: [
          EDUCATION_POLICY_IDS.attendanceMinimumRate,
          EDUCATION_POLICY_IDS.attendanceChronicAbsence,
          EDUCATION_POLICY_IDS.enrollmentDocumentsRequired,
          EDUCATION_POLICY_IDS.graduationCredits,
        ],
      });

      expect(result.evaluations).toHaveLength(4);
      expect(result.satisfied.map((s) => s.policyId)).toEqual(
        expect.arrayContaining([
          EDUCATION_POLICY_IDS.attendanceMinimumRate,
          EDUCATION_POLICY_IDS.attendanceChronicAbsence,
        ])
      );
      expect(result.violated.map((v) => v.policyId)).toContain(
        EDUCATION_POLICY_IDS.enrollmentDocumentsRequired
      );
      expect(result.unknown.map((u) => u.policyId)).toContain(
        EDUCATION_POLICY_IDS.graduationCredits
      );
      expect(result.traces).toHaveLength(4);
      expect(
        result.traces.every(
          (t) =>
            t.policyId &&
            t.explanation &&
            t.outcome &&
            Array.isArray(t.supportingEvidence) &&
            Array.isArray(t.missingEvidence)
        )
      ).toBe(true);
    });
  });

  describe("registry validation", () => {
    it("accepts the default Knowledge policy catalog", () => {
      const issues = validateEducationPolicyRegistry(EDUCATION_POLICY_CATALOG);
      expect(issues.filter((i) => i.severity === "error")).toHaveLength(0);

      const registry = createEducationPolicyRegistry();
      expect(registry.list().length).toBe(EDUCATION_POLICY_CATALOG.length);
      expect(registry.has(EDUCATION_POLICY_IDS.scholarshipEligibility)).toBe(
        true
      );
    });

    it("flags duplicate policy ids and unknown requested policies", () => {
      const duplicateIssues = validateEducationPolicyRegistry([
        EDUCATION_POLICY_CATALOG[0]!,
        EDUCATION_POLICY_CATALOG[0]!,
      ]);
      expect(
        duplicateIssues.some((i) => i.code === "DUPLICATE_POLICY_ID")
      ).toBe(true);

      const engine = createEducationPolicyEngine();
      const result = engine.evaluate({
        facts: { attendancePresentRate: 1 },
        policyIds: ["education.policy.does_not_exist"],
      });
      expect(result.ok).toBe(false);
      expect(
        result.validationIssues.some((i) => i.code === "UNKNOWN_POLICY")
      ).toBe(true);
    });

    it("flags invalid policy metadata", () => {
      const issues = validateEducationPolicyRegistry([
        {
          id: "bad-id",
          name: "",
          kind: "general",
          description: "x",
          parameters: [{ key: "a", label: "A", valueType: "number" }],
        },
      ]);
      expect(issues.some((i) => i.code === "INVALID_POLICY_ID")).toBe(true);
      expect(issues.some((i) => i.code === "INVALID_POLICY_METADATA")).toBe(
        true
      );
    });
  });

  describe("capacity + scholarship", () => {
    it("satisfies capacity when seats remain", () => {
      const result = evaluateEducationPolicies({
        facts: { seatsTotal: 20, seatsFilled: 10 },
        policyIds: [EDUCATION_POLICY_IDS.enrollmentCapacity],
      });
      expect(result.satisfied[0]?.code).toBe("CAPACITY_AVAILABLE");
    });

    it("violates scholarship when GPA below minimum", () => {
      const result = evaluateEducationPolicies({
        facts: { studentGpa: 2.0, scholarshipStatus: "pending" },
        policyIds: [EDUCATION_POLICY_IDS.scholarshipEligibility],
        parameterOverrides: {
          [EDUCATION_POLICY_IDS.scholarshipEligibility]: {
            minimumGpa: 2.5,
            requiresReview: false,
          },
        },
      });
      expect(result.violated[0]?.code).toBe("SCHOLARSHIP_GPA_BELOW");
    });
  });
});
