import { describe, expect, it } from "vitest";
import {
  EDUCATION_CONTRIBUTOR_IDS,
  ENROLLMENT_CONTRIBUTOR_ID,
  ENROLLMENT_OBSERVATION_ATTR,
  analyzeEnrollment,
  buildEducationDomain,
  createEnrollmentContributor,
  runEnrollmentIntelligence,
  type EnrollmentObservation,
} from "@/lib/domains/education";
import {
  createJagRuntime,
  type CognitiveThinkRequest,
  type RuntimeIdentity,
} from "@/lib/jag/runtime";

function identity(): RuntimeIdentity {
  return {
    principalId: "u1",
    effectiveUserId: "u1",
    roles: ["admissions"],
    permissions: ["education.enrollment.approve"],
    orgAssignments: [{ organizationId: "org-edu" }],
    activeOrganizationId: "org-edu",
    issuedAt: new Date().toISOString(),
  };
}

function baseObservation(
  overrides: Partial<EnrollmentObservation> = {}
): EnrollmentObservation {
  return {
    enrollmentRequestId: "enr-1",
    organizationId: "org-edu",
    student: { studentId: "stu-1", displayName: "Alex Student" },
    family: { familyId: "fam-1", displayName: "Student Family" },
    program: { programId: "prog-1", name: "Primary Program" },
    campus: { campusId: "camp-1", name: "Main Campus" },
    capacity: { seatsTotal: 20, seatsFilled: 10, waitlistOpen: true },
    scholarship: { status: "none" },
    requiredDocuments: [
      {
        documentId: "doc-transcript",
        kind: "transcript",
        label: "Transcript",
        status: "verified",
        required: true,
      },
      {
        documentId: "doc-id",
        kind: "identification",
        label: "ID",
        status: "verified",
        required: true,
      },
    ],
    academicHistory: { transcriptOnFile: true },
    assessment: { status: "complete" },
    interview: { status: "complete" },
    signatures: [
      { signatureId: "sig-parent", role: "parent", complete: true },
    ],
    ...overrides,
  };
}

function thinkRequest(
  observation: EnrollmentObservation
): CognitiveThinkRequest {
  return {
    identity: identity(),
    organizationalContext: {
      contextId: "education.enrollment",
      contextFamily: "admissions",
      organizationId: "org-edu",
      domainHints: ["education"],
      mode: "temporary",
      attributes: {
        [ENROLLMENT_OBSERVATION_ATTR]: observation,
      },
    },
    intent: {
      intentId: "education.enroll",
      domainHints: ["education"],
      actionCandidates: ["education.enrollment.approve"],
      confidence: 1,
      source: "explicit",
      signals: [],
      conflicts: [],
      requiresClarification: false,
      resolvedAt: new Date().toISOString(),
      attributes: {
        [ENROLLMENT_OBSERVATION_ATTR]: observation,
      },
    },
  };
}

describe("Enrollment Intelligence (D2.1)", () => {
  describe("complete enrollment", () => {
    it("recommends approve with high confidence and evidence", () => {
      const result = runEnrollmentIntelligence(baseObservation());
      expect(result.readiness).toBe("ready");
      expect(result.blockingIssues).toHaveLength(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.evidence.length).toBeGreaterThan(0);
      expect(
        result.recommendations.some((r) => r.kind === "approve_enrollment")
      ).toBe(true);
      expect(
        result.suggestedActions.some((a) => a.kind === "ApproveEnrollment")
      ).toBe(true);
      const approve = result.recommendations.find(
        (r) => r.kind === "approve_enrollment"
      );
      expect(approve?.constitutionalTrace.laws).toContain(
        "LAW_7_EVIDENCE_REQUIRED"
      );
      expect(approve?.explanation.length).toBeGreaterThan(10);
      expect(approve?.evidenceIds.length).toBeGreaterThan(0);
    });
  });

  describe("incomplete documents", () => {
    it("holds pending documents and proposes RequestDocuments", () => {
      const result = analyzeEnrollment(
        baseObservation({
          requiredDocuments: [
            {
              documentId: "doc-transcript",
              kind: "transcript",
              label: "Transcript",
              status: "missing",
              required: true,
            },
          ],
          academicHistory: { transcriptOnFile: false },
        })
      );
      expect(result.readiness).toBe("blocked");
      expect(
        result.evidence.some((e) =>
          String(e.attributes?.code).includes("missing_transcript")
        )
      ).toBe(true);
      expect(
        result.recommendations.some((r) => r.kind === "hold_pending_documents")
      ).toBe(true);
      expect(
        result.suggestedActions.some((a) => a.kind === "RequestDocuments")
      ).toBe(true);
      expect(
        result.recommendations.some((r) => r.kind === "approve_enrollment")
      ).toBe(false);
    });
  });

  describe("no capacity", () => {
    it("recommends waitlist when capacity reached and waitlist open", () => {
      const result = analyzeEnrollment(
        baseObservation({
          capacity: { seatsTotal: 20, seatsFilled: 20, waitlistOpen: true },
        })
      );
      expect(result.blockingIssues.some((b) => /capacity/i.test(b))).toBe(true);
      expect(result.recommendations.some((r) => r.kind === "waitlist")).toBe(
        true
      );
      expect(
        result.suggestedActions.some((a) => a.kind === "WaitlistEnrollment")
      ).toBe(true);
    });
  });

  describe("scholarship pending", () => {
    it("flags scholarship review", () => {
      const result = analyzeEnrollment(
        baseObservation({
          scholarship: { status: "pending", scholarshipId: "sch-1" },
        })
      );
      expect(result.warnings.some((w) => /scholarship/i.test(w))).toBe(true);
      expect(
        result.recommendations.some((r) => r.kind === "flag_scholarship_review")
      ).toBe(true);
      expect(
        result.suggestedActions.some((a) => a.kind === "FlagScholarshipReview")
      ).toBe(true);
    });
  });

  describe("assessment pending", () => {
    it("requests evaluation", () => {
      const result = analyzeEnrollment(
        baseObservation({
          assessment: { status: "pending", assessmentId: "asmt-1" },
        })
      );
      expect(result.readiness).toBe("blocked");
      expect(
        result.recommendations.some((r) => r.kind === "request_evaluation")
      ).toBe(true);
      expect(
        result.suggestedActions.some((a) => a.kind === "ScheduleEvaluation")
      ).toBe(true);
    });
  });

  describe("multiple recommendations", () => {
    it("returns several recommendations when multiple issues exist", () => {
      const result = analyzeEnrollment(
        baseObservation({
          campus: undefined,
          capacity: { seatsTotal: 5, seatsFilled: 5, waitlistOpen: true },
          scholarship: { status: "review_required" },
          assessment: { status: "incomplete" },
          requiredDocuments: [
            {
              documentId: "doc-transcript",
              kind: "transcript",
              status: "missing",
              required: true,
            },
          ],
          academicHistory: { transcriptOnFile: false },
          interview: { status: "pending" },
        })
      );
      expect(result.recommendations.length).toBeGreaterThanOrEqual(3);
      const kinds = result.recommendations.map((r) => r.kind);
      expect(kinds).toEqual(
        expect.arrayContaining([
          "hold_pending_documents",
          "waitlist",
          "request_evaluation",
          "flag_scholarship_review",
        ])
      );
    });
  });

  describe("evidence generation", () => {
    it("emits typed evidence codes on refs", () => {
      const result = analyzeEnrollment(
        baseObservation({
          signatures: [
            { signatureId: "sig-1", role: "parent", complete: false },
          ],
        })
      );
      expect(
        result.evidence.some(
          (e) => e.attributes?.code === "required_signatures_missing"
        )
      ).toBe(true);
      expect(
        result.evidence.every((e) => e.source === "education.enrollment")
      ).toBe(true);
    });
  });

  describe("confidence calculation", () => {
    it("lowers confidence as blockers increase", () => {
      const ready = analyzeEnrollment(baseObservation());
      const blocked = analyzeEnrollment(
        baseObservation({
          assessment: { status: "pending" },
          capacity: { seatsTotal: 1, seatsFilled: 1, waitlistOpen: false },
          requiredDocuments: [
            {
              documentId: "d1",
              kind: "transcript",
              status: "missing",
              required: true,
            },
          ],
          academicHistory: { transcriptOnFile: false },
        })
      );
      expect(blocked.confidence).toBeLessThan(ready.confidence);
      expect(blocked.confidence).toBeLessThan(0.7);
    });
  });

  describe("cognitive contributor surface", () => {
    it("gathers evidence and recommends without executing actions", () => {
      const contributor = createEnrollmentContributor();
      const request = thinkRequest(baseObservation());
      expect(contributor.supports?.(request)).toBe(true);

      const evidence = contributor.gatherEvidence?.(request) ?? [];
      expect(evidence.length).toBeGreaterThan(0);

      const findings = contributor.analyze?.(request, evidence) ?? [];
      expect(findings.length).toBeGreaterThan(0);

      const recs = contributor.recommend?.(request, evidence, findings) ?? [];
      expect(recs.length).toBeGreaterThan(0);
      expect(recs[0]?.attributes?.actionProposalsOnly).toBe(true);
      expect(recs[0]?.attributes?.constitutionalTrace).toBeTruthy();
    });
  });

  describe("domain registration", () => {
    it("registers enrollment contributor on Runtime via Education package", async () => {
      const domain = buildEducationDomain();
      const runtime = createJagRuntime();
      await domain.adapter.register(runtime.registry.asDomainAdapterApi());

      const cognitive = runtime.registry.listCognitiveContributors();
      expect(
        cognitive.some((c) => c.id === ENROLLMENT_CONTRIBUTOR_ID)
      ).toBe(true);
      expect(
        cognitive.some((c) => c.id === EDUCATION_CONTRIBUTOR_IDS.cognition)
      ).toBe(true);
      expect(ENROLLMENT_CONTRIBUTOR_ID).toBe(
        EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition
      );
    });
  });
});
