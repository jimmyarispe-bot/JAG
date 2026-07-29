import { describe, expect, it } from "vitest";
import type { RuntimeIntent } from "@/lib/jag/runtime";
import {
  ATTENDANCE_CONTRIBUTOR_ID,
  ENROLLMENT_CONTRIBUTOR_ID,
  PROGRESS_CONTRIBUTOR_ID,
  createEducationIntelligenceOrchestrator,
  executeEducationIntelligence,
  type AcademicProgressObservation,
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
    enrollmentRequestId: "enr-obs-1",
    organizationId: "org-edu",
    student: { studentId: "stu-obs-1", displayName: "Obs Student" },
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
  history: AttendanceSessionRecord[] = presentDays(10)
): AttendanceObservation {
  return {
    organizationId: "org-edu",
    student: { studentId: "stu-obs-1", displayName: "Obs Student" },
    enrollment: { enrollmentId: "enr-obs-1", programId: "prog-1" },
    attendanceHistory: history,
    requirements: {
      minimumAttendanceRate: 0.9,
      chronicAbsenceThreshold: 8,
      excessiveTardyThreshold: 5,
      consecutiveAbsenceThreshold: 5,
    },
  };
}

function progressObservation(): AcademicProgressObservation {
  return {
    organizationId: "org-edu",
    student: { studentId: "stu-obs-1", displayName: "Obs Student" },
    goals: [{ goalId: "g1", currentMastery: 0.7, targetMastery: 0.7 }],
    courses: [
      { courseId: "c1", progressRatio: 0.5, expectedProgressRatio: 0.5 },
    ],
    assessments: [{ assessmentId: "a1", status: "complete" }],
    earnedCredits: 24,
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
        attributes: { code: "stub" },
      },
    ],
    recommendations: [],
    confidence: 0.9,
    explanation: "stub",
    priority: 3,
    blockingIssues: [],
    warnings: ["warn"],
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

describe("Education Intelligence Observability (D2.7)", () => {
  describe("single contributor", () => {
    it("exposes result, telemetry, snapshot, trace, timeline, metrics", () => {
      const {
        result,
        telemetry,
        snapshot,
        trace,
        timeline,
        metrics,
      } = executeEducationIntelligence({
        intent: intent("education.enroll", "Enroll Student"),
        observations: { enrollment: enrollmentObservation() },
        now: "2026-01-01T00:00:00.000Z",
      });

      expect(result.ok).toBe(true);
      expect(result.result).toBe(result);
      expect(telemetry.executedContributorIds).toEqual([
        ENROLLMENT_CONTRIBUTOR_ID,
      ]);
      expect(trace.intentId).toBe("education.enroll");
      expect(trace.intentLabel).toBe("Enroll Student");
      expect(trace.contributorOrder).toEqual([ENROLLMENT_CONTRIBUTOR_ID]);
      expect(timeline.events[0]?.kind).toBe("planning");
      expect(metrics.executedContributorCount).toBe(1);
      expect(snapshot.snapshotId).toContain("snap.");
      expect(Object.isFrozen(snapshot)).toBe(true);
    });
  });

  describe("multiple contributors", () => {
    it("traces enrollment, attendance, and progress", () => {
      const out = executeEducationIntelligence({
        intent: intent(
          "education.student_success.review",
          "Student Success Review"
        ),
        observations: {
          enrollment: enrollmentObservation(),
          attendance: attendanceObservation(),
          progress: progressObservation(),
        },
        now: "2026-01-01T00:00:00.000Z",
      });

      expect(out.trace.contributorOrder).toEqual(
        expect.arrayContaining([
          ENROLLMENT_CONTRIBUTOR_ID,
          ATTENDANCE_CONTRIBUTOR_ID,
          PROGRESS_CONTRIBUTOR_ID,
        ])
      );
      expect(out.metrics.executedContributorCount).toBeGreaterThanOrEqual(3);
      expect(out.snapshot.contributorResults.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("failures", () => {
    it("records failure metrics and timeline events", () => {
      const orchestrator = createEducationIntelligenceOrchestrator({
        runners: {
          [ENROLLMENT_CONTRIBUTOR_ID]: () => {
            throw new Error("observability boom");
          },
        },
      });

      const out = orchestrator.execute({
        intent: intent("education.enroll"),
        observations: { enrollment: enrollmentObservation() },
        now: "2026-01-01T00:00:00.000Z",
      });

      expect(out.ok).toBe(false);
      expect(out.metrics.failureCount).toBe(1);
      expect(
        out.timeline.events.some((e) => e.kind === "contributor_failed")
      ).toBe(true);
      expect(
        out.telemetry.failures.some((f) => f.reason.includes("boom"))
      ).toBe(true);
      expect(out.snapshot.ok).toBe(false);
    });
  });

  describe("skipped contributors", () => {
    it("includes planner skips in trace and metrics", () => {
      const out = executeEducationIntelligence({
        intent: intent("education.enroll"),
        observations: {
          enrollment: enrollmentObservation(),
          attendance: attendanceObservation(),
        },
      });

      expect(out.trace.skippedContributorIds).toContain(
        ATTENDANCE_CONTRIBUTOR_ID
      );
      expect(out.metrics.skippedContributorCount).toBeGreaterThan(0);
      expect(
        out.timeline.events.some(
          (e) =>
            e.kind === "contributor_skipped" &&
            e.contributorId === ATTENDANCE_CONTRIBUTOR_ID
        )
      ).toBe(true);
    });
  });

  describe("timeline ordering", () => {
    it("keeps events in increasing seq with planning before completion", () => {
      const out = executeEducationIntelligence({
        intent: intent("education.enroll"),
        observations: { enrollment: enrollmentObservation() },
      });

      const seqs = out.timeline.events.map((e) => e.seq);
      expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
      expect(out.timeline.events[0]?.kind).toBe("planning");
      expect(
        out.timeline.events[out.timeline.events.length - 1]?.kind
      ).toBe("pipeline_completion");

      const kinds = out.timeline.events.map((e) => e.kind);
      expect(kinds.indexOf("planning")).toBeLessThan(
        kinds.indexOf("contributor_started")
      );
      expect(kinds.indexOf("contributor_completed")).toBeLessThan(
        kinds.indexOf("graph_aggregation")
      );
      expect(kinds.indexOf("graph_aggregation")).toBeLessThan(
        kinds.indexOf("recommendation_generation")
      );
    });
  });

  describe("audit integrity", () => {
    it("links recommendation and evidence origins to contributors", () => {
      const out = executeEducationIntelligence({
        intent: intent("education.enroll"),
        observations: { enrollment: enrollmentObservation() },
      });

      expect(out.snapshot.recommendationAudit.entries.length).toBeGreaterThan(0);
      expect(
        out.snapshot.recommendationAudit.entries.every(
          (e) =>
            e.originContributorIds.length > 0 &&
            e.constitutionalTrace.domainPackageId === "education"
        )
      ).toBe(true);

      expect(out.snapshot.evidenceAudit.entries.length).toBeGreaterThan(0);
      expect(
        out.snapshot.evidenceAudit.entries.some(
          (e) =>
            e.originContributorIds.includes(ENROLLMENT_CONTRIBUTOR_ID) &&
            e.phase === "contributor"
        )
      ).toBe(true);
      expect(
        out.snapshot.evidenceAudit.entries.some((e) => e.phase === "graph")
      ).toBe(true);
    });
  });

  describe("metrics accuracy", () => {
    it("matches telemetry counts for a successful enrollment run", () => {
      const out = executeEducationIntelligence({
        intent: intent("education.enroll"),
        observations: { enrollment: enrollmentObservation() },
        now: "2026-01-01T00:00:00.000Z",
      });

      expect(out.metrics.evidenceCount).toBe(out.telemetry.evidenceCount);
      expect(out.metrics.recommendationCount).toBe(
        out.telemetry.recommendationCount
      );
      expect(out.metrics.actionProposalCount).toBe(
        out.telemetry.actionProposalCount
      );
      expect(out.metrics.executionDurationMs).toBe(out.telemetry.durationMs);
      expect(out.metrics.executedContributorCount).toBe(
        out.telemetry.executedContributorIds.length
      );
      expect(
        out.metrics.contributorDurations[ENROLLMENT_CONTRIBUTOR_ID]
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe("snapshot completeness", () => {
    it("freezes a complete immutable snapshot", () => {
      const out = executeEducationIntelligence({
        intent: intent(
          "education.student_success.review",
          "Student Success Review"
        ),
        observations: {
          enrollment: enrollmentObservation(),
          attendance: attendanceObservation(),
          progress: progressObservation(),
        },
        subjectId: "stu-obs-1",
        organizationId: "org-edu",
        now: "2026-01-01T00:00:00.000Z",
      });

      const snap = out.snapshot;
      expect(snap.ok).toBe(out.ok);
      expect(snap.intentId).toBe("education.student_success.review");
      expect(snap.subjectId).toBe("stu-obs-1");
      expect(snap.organizationId).toBe("org-edu");
      expect(snap.plan.planId).toBe(out.plan.planId);
      expect(snap.trace.planId).toBe(out.plan.planId);
      expect(snap.timeline.events.length).toBeGreaterThan(3);
      expect(snap.metrics.stageCount).toBe(out.plan.stages.length);
      expect(snap.recommendationAudit).toBeDefined();
      expect(snap.evidenceAudit).toBeDefined();
      expect(snap.graphResult.subjectId).toBe("stu-obs-1");

      expect(Object.isFrozen(snap)).toBe(true);
      expect(() => {
        (snap as { ok: boolean }).ok = !snap.ok;
      }).toThrow();
    });
  });

  describe("dependency expansion in trace", () => {
    it("records dependsOn for included contributors when present", () => {
      const scholarshipId = "education.cognition.scholarship";
      const orchestrator = createEducationIntelligenceOrchestrator({
        runners: {
          [ENROLLMENT_CONTRIBUTOR_ID]: () => stubResult("stu-1"),
          [scholarshipId]: () => stubResult("stu-1"),
        },
        planner: {
          catalog: () => [],
          plan: () => ({
            ok: true,
            plan: {
              planId: "plan.dep",
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
            selections: [
              {
                contributorId: ENROLLMENT_CONTRIBUTOR_ID,
                decision: "include",
                reason: "dep",
              },
              {
                contributorId: scholarshipId,
                decision: "include",
                reason: "dependent",
              },
            ],
            validationIssues: [],
          }),
        },
      });

      const out = orchestrator.execute({
        intent: intent("education.scholarship.review"),
        observations: {},
        now: "2026-01-01T00:00:00.000Z",
      });

      expect(
        out.trace.dependencyExpansion.find(
          (d) => d.contributorId === scholarshipId
        )?.dependsOn
      ).toContain(ENROLLMENT_CONTRIBUTOR_ID);
      expect(out.trace.stages).toHaveLength(2);
    });
  });
});
