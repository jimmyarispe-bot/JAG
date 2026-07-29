import { describe, expect, it } from "vitest";
import type { RuntimeIntent } from "@/lib/jag/runtime";
import {
  ATTENDANCE_CONTRIBUTOR_ID,
  ENROLLMENT_CONTRIBUTOR_ID,
  createEducationIntelligenceOrchestrator,
  executeEducationIntelligence,
  type AttendanceObservation,
  type AttendanceSessionRecord,
  type EducationContributorResult,
  type EnrollmentObservation,
} from "@/lib/domains/education";

function intent(intentId: string, label?: string): RuntimeIntent {
  return {
    intentId,
    label,
    domainHints: ["education"],
    actionCandidates: [],
    confidence: 1,
    source: "explicit",
    signals: [],
    conflicts: [],
    requiresClarification: false,
    resolvedAt: "2026-01-01T00:00:00.000Z",
  };
}

function enrollmentObservation(
  overrides: Partial<EnrollmentObservation> = {}
): EnrollmentObservation {
  return {
    enrollmentRequestId: "enr-orch-1",
    organizationId: "org-edu",
    student: { studentId: "stu-orch-1", displayName: "Orch Student" },
    family: { familyId: "fam-1", displayName: "Family" },
    program: { programId: "prog-1", name: "Primary" },
    campus: { campusId: "camp-1", name: "Main" },
    capacity: { seatsTotal: 20, seatsFilled: 10, waitlistOpen: true },
    scholarship: { status: "none" },
    requiredDocuments: [
      {
        documentId: "doc-transcript",
        kind: "transcript",
        status: "verified",
        required: true,
      },
      {
        documentId: "doc-id",
        kind: "identification",
        status: "verified",
        required: true,
      },
    ],
    academicHistory: { transcriptOnFile: true },
    assessment: { status: "complete" },
    interview: { status: "complete" },
    signatures: [{ signatureId: "sig-1", role: "parent", complete: true }],
    ...overrides,
  };
}

function presentDays(count: number): AttendanceSessionRecord[] {
  return Array.from({ length: count }, (_, i) => ({
    sessionId: `p-${i}`,
    date: `2026-01-${String(i + 1).padStart(2, "0")}`,
    weekday: "tuesday",
    status: "present" as const,
  }));
}

function attendanceObservation(
  history: AttendanceSessionRecord[] = presentDays(10),
  overrides: Partial<AttendanceObservation> = {}
): AttendanceObservation {
  return {
    organizationId: "org-edu",
    student: { studentId: "stu-orch-1", displayName: "Orch Student" },
    enrollment: { enrollmentId: "enr-orch-1", programId: "prog-1" },
    attendanceHistory: history,
    requirements: {
      minimumAttendanceRate: 0.9,
      chronicAbsenceThreshold: 8,
      excessiveTardyThreshold: 5,
      consecutiveAbsenceThreshold: 5,
    },
    ...overrides,
  };
}

function stubResult(subjectId: string): EducationContributorResult {
  return {
    subjectId,
    evidence: [
      {
        source: "education.test",
        id: `ev-${subjectId}`,
        retrievedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    recommendations: [],
    confidence: 0.9,
    explanation: "stub",
    priority: 3,
    blockingIssues: [],
    warnings: [],
    suggestedActions: [
      {
        kind: "StubAction",
        actionId: "education.test.stub",
        label: "Stub",
        priority: 1,
        rationale: "test",
      },
    ],
    readiness: "ready",
    analyzedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("Education Intelligence Orchestrator (D2.6)", () => {
  describe("single contributor execution", () => {
    it("runs Enrollment only for enroll intent", () => {
      const orchestrator = createEducationIntelligenceOrchestrator();
      const result = orchestrator.execute({
        intent: intent("education.enroll"),
        observations: { enrollment: enrollmentObservation() },
        now: "2026-01-01T00:00:00.000Z",
      });

      expect(result.ok).toBe(true);
      expect(result.plan.orderedContributorIds).toEqual([
        ENROLLMENT_CONTRIBUTOR_ID,
      ]);
      expect(result.contributorResults).toHaveLength(1);
      expect(result.contributorResults[0]?.contributorId).toBe(
        ENROLLMENT_CONTRIBUTOR_ID
      );
      expect(result.graphResult.consultedContributorIds).toContain(
        ENROLLMENT_CONTRIBUTOR_ID
      );
      expect(result.telemetry.executedContributorIds).toEqual([
        ENROLLMENT_CONTRIBUTOR_ID,
      ]);
      expect(result.telemetry.skippedContributorIds).toContain(
        ATTENDANCE_CONTRIBUTOR_ID
      );
    });
  });

  describe("multi-contributor execution", () => {
    it("runs Enrollment and Attendance for student success review", () => {
      const result = executeEducationIntelligence({
        intent: intent(
          "education.student_success.review",
          "Student Success Review"
        ),
        observations: {
          enrollment: enrollmentObservation(),
          attendance: attendanceObservation(),
        },
        now: "2026-01-01T00:00:00.000Z",
      });

      expect(result.contributorResults.map((r) => r.contributorId)).toEqual(
        expect.arrayContaining([
          ENROLLMENT_CONTRIBUTOR_ID,
          ATTENDANCE_CONTRIBUTOR_ID,
        ])
      );
      expect(result.graphResult.consultedContributorIds).toEqual(
        expect.arrayContaining([
          ENROLLMENT_CONTRIBUTOR_ID,
          ATTENDANCE_CONTRIBUTOR_ID,
        ])
      );
      expect(result.telemetry.executedContributorIds.length).toBeGreaterThanOrEqual(
        2
      );
    });
  });

  describe("dependency ordering", () => {
    it("executes dependencies before dependents across stages", () => {
      const scholarshipId = "education.cognition.scholarship";
      const order: string[] = [];

      const orchestrator = createEducationIntelligenceOrchestrator({
        runners: {
          [ENROLLMENT_CONTRIBUTOR_ID]: () => {
            order.push(ENROLLMENT_CONTRIBUTOR_ID);
            return stubResult("stu-1");
          },
          [scholarshipId]: () => {
            order.push(scholarshipId);
            return stubResult("stu-1");
          },
        },
        planner: {
          catalog: () => [],
          plan: () => ({
            ok: true,
            plan: {
              planId: "plan.test",
              intentId: "education.scholarship.review",
              orderedContributorIds: [
                ENROLLMENT_CONTRIBUTOR_ID,
                scholarshipId,
              ],
              nodes: [
                {
                  id: "n1",
                  contributorId: ENROLLMENT_CONTRIBUTOR_ID,
                  nodeKind: "enrollment",
                  stage: 0,
                  order: 0,
                  decision: "include",
                  reason: "dep",
                  dependsOn: [],
                  expectedOutputs: [],
                  capabilities: [],
                },
                {
                  id: "n2",
                  contributorId: scholarshipId,
                  nodeKind: "scholarship",
                  stage: 1,
                  order: 1,
                  decision: "include",
                  reason: "dependent",
                  dependsOn: [ENROLLMENT_CONTRIBUTOR_ID],
                  expectedOutputs: [],
                  capabilities: [],
                },
              ],
              stages: [
                { stage: 0, contributorIds: [ENROLLMENT_CONTRIBUTOR_ID] },
                { stage: 1, contributorIds: [scholarshipId] },
              ],
              dependencyEdges: [
                {
                  from: ENROLLMENT_CONTRIBUTOR_ID,
                  to: scholarshipId,
                  kind: "requires",
                },
              ],
              skippedContributorIds: [],
              expectedOutputs: [],
              createdAt: "2026-01-01T00:00:00.000Z",
            },
            selections: [],
            validationIssues: [],
          }),
        },
      });

      const result = orchestrator.execute({
        intent: intent("education.scholarship.review", "Scholarship Review"),
        observations: {},
        now: "2026-01-01T00:00:00.000Z",
      });

      expect(order).toEqual([ENROLLMENT_CONTRIBUTOR_ID, scholarshipId]);
      expect(result.ok).toBe(true);
      expect(result.telemetry.stageCount).toBe(2);
    });
  });

  describe("contributor failure", () => {
    it("records failure, skips dependents, and continues pipeline", () => {
      const dependentId = "education.cognition.scholarship";
      const orchestrator = createEducationIntelligenceOrchestrator({
        runners: {
          [ENROLLMENT_CONTRIBUTOR_ID]: () => {
            throw new Error("enrollment boom");
          },
          [dependentId]: () => stubResult("stu-1"),
          [ATTENDANCE_CONTRIBUTOR_ID]: () => stubResult("stu-1"),
        },
        planner: {
          catalog: () => [],
          plan: () => ({
            ok: true,
            plan: {
              planId: "plan.fail",
              intentId: "education.student_success.review",
              orderedContributorIds: [
                ENROLLMENT_CONTRIBUTOR_ID,
                dependentId,
                ATTENDANCE_CONTRIBUTOR_ID,
              ],
              nodes: [
                {
                  id: "n1",
                  contributorId: ENROLLMENT_CONTRIBUTOR_ID,
                  nodeKind: "enrollment",
                  stage: 0,
                  order: 0,
                  decision: "include",
                  reason: "include",
                  dependsOn: [],
                  expectedOutputs: [],
                  capabilities: [],
                },
                {
                  id: "n2",
                  contributorId: dependentId,
                  nodeKind: "scholarship",
                  stage: 1,
                  order: 1,
                  decision: "include",
                  reason: "include",
                  dependsOn: [ENROLLMENT_CONTRIBUTOR_ID],
                  expectedOutputs: [],
                  capabilities: [],
                },
                {
                  id: "n3",
                  contributorId: ATTENDANCE_CONTRIBUTOR_ID,
                  nodeKind: "attendance",
                  stage: 0,
                  order: 2,
                  decision: "include",
                  reason: "include",
                  dependsOn: [],
                  expectedOutputs: [],
                  capabilities: [],
                },
              ],
              stages: [
                {
                  stage: 0,
                  contributorIds: [
                    ATTENDANCE_CONTRIBUTOR_ID,
                    ENROLLMENT_CONTRIBUTOR_ID,
                  ],
                },
                { stage: 1, contributorIds: [dependentId] },
              ],
              dependencyEdges: [
                {
                  from: ENROLLMENT_CONTRIBUTOR_ID,
                  to: dependentId,
                  kind: "requires",
                },
              ],
              skippedContributorIds: [],
              expectedOutputs: [],
              createdAt: "2026-01-01T00:00:00.000Z",
            },
            selections: [],
            validationIssues: [],
          }),
        },
      });

      const result = orchestrator.execute({
        intent: intent("education.student_success.review"),
        observations: {},
        now: "2026-01-01T00:00:00.000Z",
      });

      expect(result.telemetry.failures.some((f) => f.reason.includes("boom"))).toBe(
        true
      );
      expect(
        result.telemetry.skippedDependents.some(
          (s) => s.contributorId === dependentId
        )
      ).toBe(true);
      expect(result.telemetry.executedContributorIds).toContain(
        ATTENDANCE_CONTRIBUTOR_ID
      );
      expect(result.graphResult.consultedContributorIds).toContain(
        ATTENDANCE_CONTRIBUTOR_ID
      );
      expect(result.ok).toBe(false);
    });
  });

  describe("skipped contributors", () => {
    it("does not execute planner-skipped contributors", () => {
      const result = executeEducationIntelligence({
        intent: intent("education.enroll"),
        observations: {
          enrollment: enrollmentObservation(),
          attendance: attendanceObservation(),
        },
      });

      expect(result.plan.skippedContributorIds).toContain(
        ATTENDANCE_CONTRIBUTOR_ID
      );
      expect(
        result.contributorRecords.some(
          (r) =>
            r.contributorId === ATTENDANCE_CONTRIBUTOR_ID &&
            r.status === "skipped"
        )
      ).toBe(true);
      expect(result.telemetry.executedContributorIds).not.toContain(
        ATTENDANCE_CONTRIBUTOR_ID
      );
    });
  });

  describe("telemetry", () => {
    it("captures counts and timing", () => {
      const result = executeEducationIntelligence({
        intent: intent("education.enroll"),
        observations: { enrollment: enrollmentObservation() },
        now: "2026-01-01T00:00:00.000Z",
      });

      expect(result.telemetry.planOk).toBe(true);
      expect(result.telemetry.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.telemetry.evidenceCount).toBeGreaterThan(0);
      expect(result.telemetry.recommendationCount).toBeGreaterThanOrEqual(0);
      expect(result.telemetry.actionProposalCount).toBeGreaterThanOrEqual(0);
      expect(result.telemetry.analyzedAt).toBe("2026-01-01T00:00:00.000Z");
    });
  });

  describe("graph integration", () => {
    it("feeds contributor results into a unified graph result", () => {
      const result = executeEducationIntelligence({
        intent: intent(
          "education.student_success.review",
          "Student Success Review"
        ),
        observations: {
          enrollment: enrollmentObservation(),
          attendance: attendanceObservation(),
        },
        subjectId: "stu-orch-1",
        organizationId: "org-edu",
      });

      expect(result.graphResult.subjectId).toBe("stu-orch-1");
      expect(result.graphResult.evidence.length).toBeGreaterThan(0);
      expect(result.graphResult.nodes.length).toBeGreaterThan(0);
      expect(result.planValidation).toEqual(result.planResult.validationIssues);
    });
  });
});
