import { describe, expect, it } from "vitest";
import {
  ATTENDANCE_CONTRIBUTOR_ID,
  ATTENDANCE_OBSERVATION_ATTR,
  EDUCATION_CONTRIBUTOR_IDS,
  ENROLLMENT_CONTRIBUTOR_ID,
  analyzeAttendanceMetrics,
  buildEducationDomain,
  createAttendanceContributor,
  createEducationEvidenceBuilder,
  createEducationRecommendationBuilder,
  createEducationTrace,
  runAttendanceIntelligence,
  type AttendanceObservation,
  type AttendanceSessionRecord,
} from "@/lib/domains/education";
import { createJagRuntime } from "@/lib/jag/runtime";

function session(
  partial: AttendanceSessionRecord
): AttendanceSessionRecord {
  return partial;
}

function baseObservation(
  history: AttendanceSessionRecord[],
  overrides: Partial<AttendanceObservation> = {}
): AttendanceObservation {
  return {
    organizationId: "org-edu",
    student: { studentId: "stu-att-1", displayName: "Blake Student" },
    enrollment: { enrollmentId: "enr-att-1", programId: "prog-1" },
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

function presentDays(count: number, startDay = 1): AttendanceSessionRecord[] {
  return Array.from({ length: count }, (_, i) =>
    session({
      sessionId: `p-${i}`,
      date: `2026-01-${String(startDay + i).padStart(2, "0")}`,
      weekday: "tuesday",
      status: "present",
    })
  );
}

describe("Attendance Intelligence (D2.3)", () => {
  describe("perfect attendance", () => {
    it("recognizes perfect attendance", () => {
      const result = runAttendanceIntelligence(
        baseObservation(presentDays(10))
      );
      expect(result.readiness).toBe("ready");
      expect(
        result.evidence.some((e) => e.attributes?.code === "perfect_attendance")
      ).toBe(true);
      expect(
        result.recommendations.some(
          (r) => r.kind === "recognize_perfect_attendance"
        )
      ).toBe(true);
      expect(
        result.suggestedActions.some((a) => a.kind === "RecordRecognition")
      ).toBe(true);
    });
  });

  describe("chronic absenteeism", () => {
    it("flags chronic risk and proposes intervention", () => {
      const history: AttendanceSessionRecord[] = Array.from(
        { length: 12 },
        (_, i) =>
          session({
            sessionId: `a-${i}`,
            date: `2026-02-${String(i + 1).padStart(2, "0")}`,
            weekday: "wednesday",
            status: i < 10 ? "absent_unexcused" : "present",
          })
      );
      const result = runAttendanceIntelligence(baseObservation(history));
      expect(result.readiness).toBe("blocked");
      expect(
        result.evidence.some((e) => e.attributes?.code === "chronic_absenteeism")
      ).toBe(true);
      expect(
        result.recommendations.some((r) => r.kind === "recommend_intervention")
      ).toBe(true);
      expect(
        result.suggestedActions.some((a) => a.kind === "CreateIntervention")
      ).toBe(true);
    });
  });

  describe("improving attendance", () => {
    it("detects improving trend and recovery", () => {
      const history: AttendanceSessionRecord[] = [
        ...Array.from({ length: 6 }, (_, i) =>
          session({
            sessionId: `early-${i}`,
            date: `2026-03-${String(i + 1).padStart(2, "0")}`,
            status: "absent_unexcused",
            weekday: "thursday",
          })
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          session({
            sessionId: `late-${i}`,
            date: `2026-03-${String(i + 10).padStart(2, "0")}`,
            status: "present",
            weekday: "thursday",
          })
        ),
      ];
      const metrics = analyzeAttendanceMetrics(baseObservation(history));
      expect(metrics.trend).toBe("improving");
      const result = runAttendanceIntelligence(baseObservation(history));
      expect(
        result.evidence.some((e) => e.attributes?.code === "improving_trend")
      ).toBe(true);
      expect(
        result.recommendations.some((r) => r.kind === "recognize_improvement")
      ).toBe(true);
    });
  });

  describe("declining attendance", () => {
    it("detects declining trend and continues monitoring", () => {
      const history: AttendanceSessionRecord[] = [
        ...Array.from({ length: 6 }, (_, i) =>
          session({
            sessionId: `early-${i}`,
            date: `2026-04-${String(i + 1).padStart(2, "0")}`,
            status: "present",
            weekday: "tuesday",
          })
        ),
        ...Array.from({ length: 6 }, (_, i) =>
          session({
            sessionId: `late-${i}`,
            date: `2026-04-${String(i + 10).padStart(2, "0")}`,
            status: i < 4 ? "absent_unexcused" : "present",
            weekday: "tuesday",
          })
        ),
      ];
      // Adjust requirements so rate may not hit chronic if we want soft decline
      const observation = baseObservation(history, {
        requirements: {
          minimumAttendanceRate: 0.5,
          chronicAbsenceThreshold: 20,
          excessiveTardyThreshold: 5,
          consecutiveAbsenceThreshold: 5,
        },
      });
      const metrics = analyzeAttendanceMetrics(observation);
      expect(metrics.trend).toBe("declining");
      const result = runAttendanceIntelligence(observation);
      expect(
        result.evidence.some((e) => e.attributes?.code === "declining_trend")
      ).toBe(true);
      expect(
        result.recommendations.some((r) => r.kind === "continue_monitoring")
      ).toBe(true);
    });
  });

  describe("excused absence patterns", () => {
    it("records excused absence clusters as findings", () => {
      const history = Array.from({ length: 5 }, (_, i) =>
        session({
          sessionId: `ex-${i}`,
          date: `2026-05-${String(i + 1).padStart(2, "0")}`,
          status: "absent_excused",
          weekday: "wednesday",
          excusedReason: "illness",
        })
      );
      const result = runAttendanceIntelligence(
        baseObservation(history, {
          requirements: {
            minimumAttendanceRate: 0.1,
            chronicAbsenceThreshold: 20,
            consecutiveAbsenceThreshold: 10,
            excessiveTardyThreshold: 5,
          },
        })
      );
      expect(
        result.evidence.some(
          (e) => e.attributes?.code === "excused_absence_cluster"
        )
      ).toBe(true);
    });
  });

  describe("unexcused absence patterns", () => {
    it("warns on unexcused clusters", () => {
      const history = [
        ...presentDays(4),
        ...Array.from({ length: 4 }, (_, i) =>
          session({
            sessionId: `u-${i}`,
            date: `2026-06-${String(i + 10).padStart(2, "0")}`,
            status: "absent_unexcused",
            weekday: "thursday",
          })
        ),
      ];
      const result = runAttendanceIntelligence(
        baseObservation(history, {
          requirements: {
            minimumAttendanceRate: 0.4,
            chronicAbsenceThreshold: 20,
            consecutiveAbsenceThreshold: 10,
            excessiveTardyThreshold: 5,
          },
        })
      );
      expect(
        result.evidence.some(
          (e) => e.attributes?.code === "unexcused_absence_cluster"
        )
      ).toBe(true);
    });
  });

  describe("tardy accumulation", () => {
    it("flags excessive tardies", () => {
      const history = Array.from({ length: 6 }, (_, i) =>
        session({
          sessionId: `t-${i}`,
          date: `2026-07-${String(i + 1).padStart(2, "0")}`,
          status: "tardy",
          weekday: "monday",
        })
      );
      const result = runAttendanceIntelligence(baseObservation(history));
      expect(
        result.evidence.some((e) => e.attributes?.code === "excessive_tardies")
      ).toBe(true);
      expect(
        result.recommendations.some((r) => r.kind === "escalate_support")
      ).toBe(true);
    });
  });

  describe("multiple recommendations", () => {
    it("returns several recommendations for severe patterns", () => {
      const history: AttendanceSessionRecord[] = [
        ...Array.from({ length: 5 }, (_, i) =>
          session({
            sessionId: `m-${i}`,
            date: `2026-08-${String(i + 1).padStart(2, "0")}`,
            status: "absent_unexcused",
            weekday: "monday",
          })
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          session({
            sessionId: `f-${i}`,
            date: `2026-08-${String(i + 10).padStart(2, "0")}`,
            status: "absent_unexcused",
            weekday: "friday",
          })
        ),
      ];
      const result = runAttendanceIntelligence(
        baseObservation(history, {
          riskIndicators: { transportationConcern: true },
        })
      );
      expect(result.recommendations.length).toBeGreaterThanOrEqual(3);
      const kinds = result.recommendations.map((r) => r.kind);
      expect(kinds).toEqual(
        expect.arrayContaining([
          "recommend_intervention",
          "schedule_attendance_meeting",
          "review_transportation",
        ])
      );
    });
  });

  describe("evidence generation", () => {
    it("emits education.attendance evidence refs", () => {
      const result = runAttendanceIntelligence(
        baseObservation([
          session({
            sessionId: "c1",
            date: "2026-09-01",
            status: "absent_unexcused",
            weekday: "monday",
          }),
          session({
            sessionId: "c2",
            date: "2026-09-02",
            status: "absent_unexcused",
            weekday: "tuesday",
          }),
          session({
            sessionId: "c3",
            date: "2026-09-03",
            status: "absent_unexcused",
            weekday: "wednesday",
          }),
          session({
            sessionId: "c4",
            date: "2026-09-04",
            status: "absent_unexcused",
            weekday: "thursday",
          }),
          session({
            sessionId: "c5",
            date: "2026-09-05",
            status: "absent_unexcused",
            weekday: "friday",
          }),
        ])
      );
      expect(
        result.evidence.every((e) => e.source === "education.attendance")
      ).toBe(true);
      expect(
        result.evidence.some(
          (e) => e.attributes?.code === "five_consecutive_absences"
        )
      ).toBe(true);
    });
  });

  describe("framework integration", () => {
    it("uses shared evidence and recommendation builders", () => {
      const evidence = createEducationEvidenceBuilder({
        source: "education.attendance",
        scopeId: "stu-x",
      })
        .addBlockingIssue("attendance_below_threshold", "Below threshold")
        .build();
      expect(evidence.blockingIssues).toHaveLength(1);

      const recs = createEducationRecommendationBuilder(
        ATTENDANCE_CONTRIBUTOR_ID
      );
      recs
        .recommend("notify_family", "Notify Family")
        .because("Test reason")
        .confidence("high")
        .priority("high")
        .supportedBy("attendance_below_threshold")
        .proposeAction({
          kind: "NotifyFamily",
          actionId: "education.attendance.notify_family",
          rationale: "Notify",
        });
      const built = recs.build(evidence.items);
      expect(built[0]?.constitutionalTrace.contributorId).toBe(
        ATTENDANCE_CONTRIBUTOR_ID
      );
      expect(built[0]?.constitutionalTrace.laws).toEqual(
        createEducationTrace({
          contributorId: ATTENDANCE_CONTRIBUTOR_ID,
          rationale: "x",
        }).laws
      );
    });

    it("registers attendance contributor beside enrollment on Runtime", async () => {
      const domain = buildEducationDomain();
      const runtime = createJagRuntime();
      await domain.adapter.register(runtime.registry.asDomainAdapterApi());
      const ids = runtime.registry.listCognitiveContributors().map((c) => c.id);
      expect(ids).toContain(ATTENDANCE_CONTRIBUTOR_ID);
      expect(ids).toContain(ENROLLMENT_CONTRIBUTOR_ID);
      expect(ATTENDANCE_CONTRIBUTOR_ID).toBe(
        EDUCATION_CONTRIBUTOR_IDS.attendanceCognition
      );
    });

    it("contributor gather/recommend never executes actions", () => {
      const contributor = createAttendanceContributor();
      const observation = baseObservation(presentDays(8));
      const request = {
        identity: {
          principalId: "u1",
          effectiveUserId: "u1",
          roles: [],
          permissions: [],
          orgAssignments: [{ organizationId: "org-edu" }],
          activeOrganizationId: "org-edu",
          issuedAt: new Date().toISOString(),
        },
        intent: {
          intentId: "education.review",
          domainHints: ["education"],
          actionCandidates: [],
          confidence: 1,
          source: "explicit" as const,
          signals: [],
          conflicts: [],
          requiresClarification: false,
          resolvedAt: new Date().toISOString(),
          attributes: { [ATTENDANCE_OBSERVATION_ATTR]: observation },
        },
      };
      const evidence = contributor.gatherEvidence?.(request) ?? [];
      const recs = contributor.recommend?.(request, evidence, []) ?? [];
      expect(evidence.length).toBeGreaterThan(0);
      expect(recs[0]?.attributes?.actionProposalsOnly).toBe(true);
    });
  });
});
