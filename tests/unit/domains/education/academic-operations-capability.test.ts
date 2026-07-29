import { describe, expect, it } from "vitest";
import {
  ACADEMIC_OPERATIONS_CAPABILITY_PACK,
  CAPACITY_CONTRIBUTOR_ID,
  EDUCATION_CAPABILITY_PACK_IDS,
  EDUCATION_CONTRIBUTOR_IDS,
  OPERATIONAL_READINESS_CONTRIBUTOR_ID,
  SCHEDULING_CONTRIBUTOR_ID,
  STAFFING_CONTRIBUTOR_ID,
  buildEducationDomain,
  buildOperationalReadinessInputs,
  createCapacityContributor,
  createEducationPlanner,
  createOperationalReadinessContributor,
  createSchedulingContributor,
  createStaffingContributor,
  getCapabilityPack,
  listContributors,
  listPlannerIntents,
  runCapacityIntelligence,
  runOperationalReadinessIntelligence,
  runSchedulingIntelligence,
  runStaffingIntelligence,
  validateEducationCapabilityRegistry,
  type EducationContributorResult,
  type SchedulingObservation,
  type StaffingObservation,
  type CapacityObservation,
} from "@/lib/domains/education";
import type { RuntimeIntent } from "@/lib/jag/runtime";

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

function upstream(
  contributorId: string,
  partial: Partial<EducationContributorResult> = {}
): { contributorId: string; result: EducationContributorResult } {
  return {
    contributorId,
    result: {
      subjectId: "campus-1",
      evidence: (partial.evidence as EducationContributorResult["evidence"]) ?? [
        {
          source: contributorId,
          id: `${contributorId}:ok`,
          retrievedAt: "2026-01-01T00:00:00.000Z",
          attributes: { code: "ok" },
        },
      ],
      recommendations: partial.recommendations ?? [],
      confidence: partial.confidence ?? 0.9,
      explanation: partial.explanation ?? "upstream",
      priority: partial.priority ?? 3,
      blockingIssues: partial.blockingIssues ?? [],
      warnings: partial.warnings ?? [],
      suggestedActions: partial.suggestedActions ?? [],
      readiness: partial.readiness ?? "ready",
      analyzedAt: "2026-01-01T00:00:00.000Z",
      attributes: partial.attributes,
    },
  };
}

function evidenceCode(
  contributorId: string,
  code: string
): EducationContributorResult["evidence"][number] {
  return {
    source: contributorId,
    id: `${contributorId}:${code}`,
    retrievedAt: "2026-01-01T00:00:00.000Z",
    attributes: { code },
  };
}

describe("Academic Operations Capability Pack (D5.1)", () => {
  describe("scheduling conflicts", () => {
    it("detects teacher overlap conflicts", () => {
      const observation: SchedulingObservation = {
        organizationId: "org-1",
        subject: { subjectId: "campus-1" },
        sections: [{ sectionId: "sec-1" }, { sectionId: "sec-2" }],
        sessions: [
          {
            sessionId: "s1",
            sectionId: "sec-1",
            teacherId: "t1",
            classroomId: "r1",
            day: "monday",
            startTime: "09:00",
            endTime: "10:00",
            covered: true,
          },
          {
            sessionId: "s2",
            sectionId: "sec-2",
            teacherId: "t1",
            classroomId: "r2",
            day: "monday",
            startTime: "09:30",
            endTime: "10:30",
            covered: true,
          },
        ],
      };

      const result = runSchedulingIntelligence(observation);
      expect(result.conflictCount).toBeGreaterThan(0);
      expect(
        result.recommendations.some((r) => r.kind === "resolve_schedule_conflict")
      ).toBe(true);
    });
  });

  describe("teacher overload", () => {
    it("flags overloaded teachers", () => {
      const observation: StaffingObservation = {
        organizationId: "org-1",
        subject: { subjectId: "campus-1" },
        teachers: [
          {
            teacherId: "t1",
            load: 6,
            maxLoad: 5,
            certifications: ["math"],
            available: true,
          },
        ],
        assignments: [
          {
            assignmentId: "a1",
            teacherId: "t1",
            sectionId: "sec-1",
            requiredCertification: "math",
            loadUnits: 6,
          },
        ],
      };

      const result = runStaffingIntelligence(observation);
      expect(result.overloadCount).toBeGreaterThan(0);
      expect(
        result.recommendations.some((r) => r.kind === "reduce_teacher_load")
      ).toBe(true);
    });
  });

  describe("capacity exceeded", () => {
    it("flags over-capacity sections", () => {
      const observation: CapacityObservation = {
        organizationId: "org-1",
        subject: { subjectId: "campus-1" },
        sections: [
          { sectionId: "sec-1", enrolled: 32, seats: 28 },
        ],
      };

      const result = runCapacityIntelligence(observation);
      expect(result.overCapacityCount).toBe(1);
      expect(
        result.recommendations.some((r) => r.kind === "address_over_capacity")
      ).toBe(true);
    });
  });

  describe("capacity under-utilized", () => {
    it("flags under-utilized sections", () => {
      const observation: CapacityObservation = {
        organizationId: "org-1",
        subject: { subjectId: "campus-1" },
        sections: [
          { sectionId: "sec-1", enrolled: 5, seats: 28 },
        ],
      };

      const result = runCapacityIntelligence(observation);
      expect(result.underUtilizedCount).toBe(1);
      expect(
        result.recommendations.some((r) => r.kind === "consolidate_underutilized")
      ).toBe(true);
    });
  });

  describe("healthy operations", () => {
    it("reports healthy schedule, staffing, and capacity", () => {
      const schedule = runSchedulingIntelligence({
        organizationId: "org-1",
        subject: { subjectId: "campus-1" },
        sections: [{ sectionId: "sec-1" }],
        sessions: [
          {
            sessionId: "s1",
            sectionId: "sec-1",
            teacherId: "t1",
            classroomId: "r1",
            day: "monday",
            startTime: "09:00",
            endTime: "10:00",
            covered: true,
          },
        ],
      });
      expect(schedule.conflictCount).toBe(0);
      expect(
        schedule.recommendations.some((r) => r.kind === "maintain_schedule_health")
      ).toBe(true);

      const staffing = runStaffingIntelligence({
        organizationId: "org-1",
        subject: { subjectId: "campus-1" },
        teachers: [
          {
            teacherId: "t1",
            load: 2,
            maxLoad: 5,
            certifications: ["math"],
            available: true,
          },
        ],
        assignments: [
          {
            assignmentId: "a1",
            teacherId: "t1",
            sectionId: "sec-1",
            requiredCertification: "math",
            loadUnits: 2,
          },
        ],
      });
      expect(staffing.overloadCount).toBe(0);

      const capacity = runCapacityIntelligence({
        organizationId: "org-1",
        subject: { subjectId: "campus-1" },
        sections: [{ sectionId: "sec-1", enrolled: 20, seats: 28 }],
      });
      expect(capacity.overCapacityCount).toBe(0);
      expect(capacity.underUtilizedCount).toBe(0);
    });
  });

  describe("operational readiness / cross-contributor synthesis", () => {
    it("synthesizes blocked readiness from risk upstream", () => {
      const result = runOperationalReadinessIntelligence(
        buildOperationalReadinessInputs({
          subjectId: "campus-1",
          upstream: [
            upstream(SCHEDULING_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(SCHEDULING_CONTRIBUTOR_ID, "schedule_conflict"),
              ],
              readiness: "conditional",
              warnings: ["conflict"],
            }),
            upstream(STAFFING_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(STAFFING_CONTRIBUTOR_ID, "teacher_overload"),
              ],
              readiness: "blocked",
              blockingIssues: ["overload"],
            }),
            upstream(CAPACITY_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(CAPACITY_CONTRIBUTOR_ID, "over_capacity"),
              ],
              readiness: "conditional",
              warnings: ["over"],
            }),
          ],
        })
      );

      expect(result.stance).toMatch(/blocked|at_risk/);
      expect(result.readinessScore).toBeLessThan(80);
      expect(
        result.recommendations.some((r) => r.kind === "stabilize_operations")
      ).toBe(true);
    });

    it("synthesizes ready stance from healthy upstream", () => {
      const result = runOperationalReadinessIntelligence(
        buildOperationalReadinessInputs({
          subjectId: "campus-1",
          upstream: [
            upstream(SCHEDULING_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(SCHEDULING_CONTRIBUTOR_ID, "schedule_healthy"),
              ],
            }),
            upstream(STAFFING_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(STAFFING_CONTRIBUTOR_ID, "coverage_ok"),
                evidenceCode(STAFFING_CONTRIBUTOR_ID, "load_balanced"),
              ],
            }),
            upstream(CAPACITY_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(CAPACITY_CONTRIBUTOR_ID, "capacity_healthy"),
              ],
            }),
          ],
        })
      );

      expect(result.stance).toBe("ready");
      expect(result.readinessScore).toBeGreaterThan(50);
      expect(
        result.recommendations.some(
          (r) => r.kind === "maintain_operational_readiness"
        )
      ).toBe(true);
    });
  });

  describe("planner selection + pack registration", () => {
    it("selects academic operations contributors for ops intents", () => {
      const planner = createEducationPlanner();
      for (const [id, label] of [
        ["education.operations.daily_review", "Daily Operations Review"],
        ["education.scheduling.review", "Scheduling Review"],
        ["education.staffing.review", "Staffing Review"],
        ["education.capacity.review", "Capacity Review"],
        ["education.semester.planning", "Semester Planning"],
        [
          "education.leadership.operations_brief",
          "Leadership Operations Brief",
        ],
      ] as const) {
        const plan = planner.plan({ intent: intent(id, label) });
        expect(plan.plan.orderedContributorIds).toEqual(
          expect.arrayContaining([
            SCHEDULING_CONTRIBUTOR_ID,
            STAFFING_CONTRIBUTOR_ID,
            CAPACITY_CONTRIBUTOR_ID,
            OPERATIONAL_READINESS_CONTRIBUTOR_ID,
          ])
        );
        expect(
          plan.plan.orderedContributorIds.indexOf(SCHEDULING_CONTRIBUTOR_ID)
        ).toBeLessThan(
          plan.plan.orderedContributorIds.indexOf(
            OPERATIONAL_READINESS_CONTRIBUTOR_ID
          )
        );
      }
    });

    it("registers pack metadata and domain contributors", () => {
      expect(ACADEMIC_OPERATIONS_CAPABILITY_PACK.version).toBe("0.1.0");
      expect(ACADEMIC_OPERATIONS_CAPABILITY_PACK.dependencies).toEqual([
        EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle,
      ]);
      expect(
        getCapabilityPack(EDUCATION_CAPABILITY_PACK_IDS.academicOperations)?.id
      ).toBe(EDUCATION_CAPABILITY_PACK_IDS.academicOperations);
      expect(
        listContributors(EDUCATION_CAPABILITY_PACK_IDS.academicOperations)
      ).toEqual(
        expect.arrayContaining([
          EDUCATION_CONTRIBUTOR_IDS.schedulingCognition,
          EDUCATION_CONTRIBUTOR_IDS.operationalReadinessCognition,
        ])
      );
      expect(
        listPlannerIntents(EDUCATION_CAPABILITY_PACK_IDS.academicOperations)
      ).toContain("education.semester.planning");
      expect(validateEducationCapabilityRegistry().ok).toBe(true);

      expect(createSchedulingContributor().id).toBe(SCHEDULING_CONTRIBUTOR_ID);
      expect(createStaffingContributor().id).toBe(STAFFING_CONTRIBUTOR_ID);
      expect(createCapacityContributor().id).toBe(CAPACITY_CONTRIBUTOR_ID);
      expect(createOperationalReadinessContributor().id).toBe(
        OPERATIONAL_READINESS_CONTRIBUTOR_ID
      );

      const domain = buildEducationDomain();
      for (const id of [
        EDUCATION_CONTRIBUTOR_IDS.schedulingCognition,
        EDUCATION_CONTRIBUTOR_IDS.staffingCognition,
        EDUCATION_CONTRIBUTOR_IDS.capacityCognition,
        EDUCATION_CONTRIBUTOR_IDS.operationalReadinessCognition,
      ]) {
        expect(domain.manifest.contributors.some((c) => c.id === id)).toBe(
          true
        );
      }
    });
  });
});
