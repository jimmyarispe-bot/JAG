import { describe, expect, it } from "vitest";
import {
  ATTENDANCE_CONTRIBUTOR_ID,
  ENROLLMENT_CONTRIBUTOR_ID,
  createEducationIntelligenceGraph,
  createEducationTrace,
  evaluateEducationIntelligenceGraph,
  type EducationContributorResult,
  type EducationGraphContributorInput,
} from "@/lib/domains/education";

function evidence(id: string, code: string) {
  return {
    source: "education.test",
    id,
    retrievedAt: "2026-01-01T00:00:00.000Z",
    attributes: { code },
  };
}

function result(
  partial: Partial<EducationContributorResult> & {
    subjectId: string;
  }
): EducationContributorResult {
  return {
    evidence: [],
    recommendations: [],
    confidence: 0.9,
    explanation: "ok",
    priority: 3,
    blockingIssues: [],
    warnings: [],
    suggestedActions: [],
    readiness: "ready",
    analyzedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function enrollmentReady(): EducationGraphContributorInput {
  return {
    contributorId: ENROLLMENT_CONTRIBUTOR_ID,
    nodeKind: "enrollment",
    result: result({
      subjectId: "stu-1",
      evidence: [evidence("enr:docs_complete", "documents_complete")],
      confidence: 0.92,
      recommendations: [
        {
          id: "rec.approve_enrollment",
          kind: "approve_enrollment",
          title: "Approve Enrollment",
          explanation: "Ready to approve",
          confidence: 0.92,
          priority: 1,
          evidenceIds: ["enr:docs_complete"],
          suggestedActions: [
            {
              kind: "ApproveEnrollment",
              actionId: "education.enrollment.approve",
              label: "Approve",
              priority: 1,
              rationale: "Approve",
            },
          ],
          constitutionalTrace: createEducationTrace({
            contributorId: ENROLLMENT_CONTRIBUTOR_ID,
            rationale: "Ready to approve",
          }),
        },
      ],
      suggestedActions: [
        {
          kind: "ApproveEnrollment",
          actionId: "education.enrollment.approve",
          label: "Approve",
          priority: 1,
          rationale: "Approve",
        },
      ],
    }),
  };
}

function attendanceIntervention(): EducationGraphContributorInput {
  return {
    contributorId: ATTENDANCE_CONTRIBUTOR_ID,
    nodeKind: "attendance",
    result: result({
      subjectId: "stu-1",
      readiness: "blocked",
      confidence: 0.7,
      priority: 1,
      blockingIssues: ["Attendance below threshold"],
      evidence: [
        evidence("att:below", "attendance_below_threshold"),
        evidence("enr:docs_complete", "documents_complete"), // overlap with enrollment
      ],
      recommendations: [
        {
          id: "rec.recommend_intervention",
          kind: "recommend_intervention",
          title: "Recommend Intervention",
          explanation: "Chronic attendance risk",
          confidence: 0.9,
          priority: 1,
          evidenceIds: ["att:below"],
          suggestedActions: [
            {
              kind: "CreateIntervention",
              actionId: "education.attendance.create_intervention",
              label: "Intervene",
              priority: 1,
              rationale: "Intervene",
            },
            {
              kind: "NotifyFamily",
              actionId: "education.attendance.notify_family",
              label: "Notify",
              priority: 2,
              rationale: "Notify",
            },
          ],
          constitutionalTrace: createEducationTrace({
            contributorId: ATTENDANCE_CONTRIBUTOR_ID,
            rationale: "Chronic attendance risk",
          }),
        },
      ],
      suggestedActions: [
        {
          kind: "CreateIntervention",
          actionId: "education.attendance.create_intervention",
          label: "Intervene",
          priority: 1,
          rationale: "Intervene",
        },
      ],
    }),
  };
}

describe("Education Intelligence Graph (D2.4)", () => {
  describe("single contributor", () => {
    it("passes through enrollment result with graph provenance", () => {
      const graph = createEducationIntelligenceGraph();
      const unified = graph.evaluate({
        subjectId: "stu-1",
        inputs: [enrollmentReady()],
      });

      expect(unified.consultedContributorIds).toEqual([
        ENROLLMENT_CONTRIBUTOR_ID,
      ]);
      expect(unified.recommendations).toHaveLength(1);
      expect(unified.recommendations[0]?.originContributorIds).toEqual([
        ENROLLMENT_CONTRIBUTOR_ID,
      ]);
      expect(unified.evidence).toHaveLength(1);
      expect(unified.nodes.filter((n) => n.active)).toHaveLength(1);
      expect(unified.readiness).toBe("ready");
    });
  });

  describe("two contributors", () => {
    it("aggregates enrollment + attendance into one result", () => {
      const unified = evaluateEducationIntelligenceGraph({
        subjectId: "stu-1",
        inputs: [enrollmentReady(), attendanceIntervention()],
      });

      expect(unified.consultedContributorIds).toEqual(
        expect.arrayContaining([
          ENROLLMENT_CONTRIBUTOR_ID,
          ATTENDANCE_CONTRIBUTOR_ID,
        ])
      );
      expect(unified.readiness).toBe("blocked");
      expect(unified.blockingIssues).toContain("Attendance below threshold");
      expect(unified.suggestedActions.map((a) => a.actionId)).toEqual(
        expect.arrayContaining([
          "education.enrollment.approve",
          "education.attendance.create_intervention",
        ])
      );
      expect(unified.nodes.filter((n) => n.active).map((n) => n.kind).sort()).toEqual(
        ["attendance", "enrollment"]
      );
      expect(unified.edges.length).toBeGreaterThan(0);
    });
  });

  describe("conflicting recommendations", () => {
    it("keeps higher-severity recommendation and records conflict", () => {
      const hold: EducationGraphContributorInput = {
        contributorId: ENROLLMENT_CONTRIBUTOR_ID,
        nodeKind: "enrollment",
        result: result({
          subjectId: "stu-1",
          readiness: "blocked",
          confidence: 0.8,
          recommendations: [
            {
              id: "rec.hold_pending_documents",
              kind: "hold_pending_documents",
              title: "Hold Pending Documents",
              explanation: "Docs missing",
              confidence: 0.9,
              priority: 1,
              evidenceIds: ["e1"],
              suggestedActions: [],
              constitutionalTrace: createEducationTrace({
                contributorId: ENROLLMENT_CONTRIBUTOR_ID,
                rationale: "Docs missing",
              }),
            },
            {
              id: "rec.approve_enrollment",
              kind: "approve_enrollment",
              title: "Approve Enrollment",
              explanation: "Should not win",
              confidence: 0.95,
              priority: 1,
              evidenceIds: ["e2"],
              suggestedActions: [],
              constitutionalTrace: createEducationTrace({
                contributorId: ENROLLMENT_CONTRIBUTOR_ID,
                rationale: "Should not win",
              }),
            },
          ],
        }),
      };

      const unified = evaluateEducationIntelligenceGraph({
        inputs: [hold],
      });

      const kinds = unified.recommendations.map((r) => r.kind);
      expect(kinds).toContain("hold_pending_documents");
      expect(kinds).not.toContain("approve_enrollment");
      expect(
        unified.conflicts.some((c) => c.kind === "conflicting_recommendations")
      ).toBe(true);
    });
  });

  describe("duplicate evidence", () => {
    it("dedupes overlapping evidence and records multi-origin", () => {
      const unified = evaluateEducationIntelligenceGraph({
        inputs: [enrollmentReady(), attendanceIntervention()],
      });

      const overlap = unified.evidence.find(
        (e) => e.ref.id === "enr:docs_complete"
      );
      expect(overlap).toBeTruthy();
      expect(overlap?.originContributorIds).toEqual(
        expect.arrayContaining([
          ENROLLMENT_CONTRIBUTOR_ID,
          ATTENDANCE_CONTRIBUTOR_ID,
        ])
      );
      expect(
        unified.conflicts.some((c) => c.kind === "overlapping_evidence")
      ).toBe(true);
    });
  });

  describe("priority ordering", () => {
    it("orders recommendations by priority then confidence", () => {
      const input: EducationGraphContributorInput = {
        contributorId: ATTENDANCE_CONTRIBUTOR_ID,
        nodeKind: "attendance",
        result: result({
          subjectId: "stu-1",
          recommendations: [
            {
              id: "rec.continue_monitoring",
              kind: "continue_monitoring",
              title: "Continue Monitoring",
              explanation: "Soft",
              confidence: 0.8,
              priority: 3,
              evidenceIds: [],
              suggestedActions: [],
              constitutionalTrace: createEducationTrace({
                contributorId: ATTENDANCE_CONTRIBUTOR_ID,
                rationale: "Soft",
              }),
            },
            {
              id: "rec.escalate_support",
              kind: "escalate_support",
              title: "Escalate Support",
              explanation: "Urgent",
              confidence: 0.85,
              priority: 1,
              evidenceIds: [],
              suggestedActions: [],
              constitutionalTrace: createEducationTrace({
                contributorId: ATTENDANCE_CONTRIBUTOR_ID,
                rationale: "Urgent",
              }),
            },
          ],
        }),
      };

      const unified = evaluateEducationIntelligenceGraph({ inputs: [input] });
      expect(unified.recommendations[0]?.kind).toBe("escalate_support");
      expect(unified.recommendations[1]?.kind).toBe("continue_monitoring");
      expect(unified.priority).toBe(1);
    });
  });

  describe("recommendation aggregation", () => {
    it("merges duplicate kinds from multiple contributors", () => {
      const a: EducationGraphContributorInput = {
        contributorId: "education.cognition.attendance",
        nodeKind: "attendance",
        result: result({
          subjectId: "stu-1",
          recommendations: [
            {
              id: "rec.notify_family.a",
              kind: "notify_family",
              title: "Notify Family",
              explanation: "From attendance",
              confidence: 0.8,
              priority: 2,
              evidenceIds: ["a1"],
              suggestedActions: [
                {
                  kind: "NotifyFamily",
                  actionId: "education.attendance.notify_family",
                  label: "Notify",
                  priority: 1,
                  rationale: "Notify",
                },
              ],
              constitutionalTrace: createEducationTrace({
                contributorId: ATTENDANCE_CONTRIBUTOR_ID,
                rationale: "From attendance",
              }),
            },
          ],
        }),
      };
      const b: EducationGraphContributorInput = {
        contributorId: "education.cognition.family",
        nodeKind: "family_engagement",
        result: result({
          subjectId: "stu-1",
          recommendations: [
            {
              id: "rec.notify_family.b",
              kind: "notify_family",
              title: "Notify Family",
              explanation: "From family engagement",
              confidence: 0.95,
              priority: 1,
              evidenceIds: ["b1"],
              suggestedActions: [
                {
                  kind: "NotifyFamily",
                  actionId: "education.attendance.notify_family",
                  label: "Notify",
                  priority: 1,
                  rationale: "Notify",
                },
              ],
              constitutionalTrace: createEducationTrace({
                contributorId: "education.cognition.family",
                rationale: "From family engagement",
              }),
            },
          ],
        }),
      };

      const unified = evaluateEducationIntelligenceGraph({ inputs: [a, b] });
      const notify = unified.recommendations.filter(
        (r) => r.kind === "notify_family"
      );
      expect(notify).toHaveLength(1);
      expect(notify[0]?.originContributorIds.length).toBe(2);
      expect(notify[0]?.priority).toBe(1);
      expect(notify[0]?.confidence).toBe(0.95);
      expect(notify[0]?.evidenceIds).toEqual(
        expect.arrayContaining(["a1", "b1"])
      );
      expect(
        unified.conflicts.some((c) => c.kind === "duplicate_recommendations")
      ).toBe(true);
      expect(unified.suggestedActions).toHaveLength(1);
    });
  });

  describe("traceability", () => {
    it("preserves origin contributor, evidence, confidence, priority", () => {
      const unified = evaluateEducationIntelligenceGraph({
        inputs: [enrollmentReady()],
      });
      const rec = unified.recommendations[0]!;
      expect(rec.originContributorIds).toContain(ENROLLMENT_CONTRIBUTOR_ID);
      expect(rec.evidenceIds.length).toBeGreaterThan(0);
      expect(rec.confidence).toBeGreaterThan(0);
      expect(rec.priority).toBeGreaterThan(0);
      expect(rec.constitutionalTrace.domainPackageId).toBe("education");
    });
  });
});
