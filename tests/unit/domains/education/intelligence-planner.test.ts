import { describe, expect, it } from "vitest";
import type { RuntimeIntent } from "@/lib/jag/runtime";
import {
  ATTENDANCE_CONTRIBUTOR_ID,
  EDUCATION_CONTRIBUTOR_IDS,
  ENROLLMENT_CONTRIBUTOR_ID,
  createDefaultEducationContributorCatalog,
  createEducationPlanner,
  normalizeCatalogDependencies,
  orderContributorsByDependencies,
  validateEducationExecutionPlan,
  type EducationContributorDescriptor,
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

describe("Education Intelligence Planner (D2.5)", () => {
  describe("single contributor plans", () => {
    it("plans Enrollment only for enroll intent", () => {
      const planner = createEducationPlanner();
      const result = planner.plan({ intent: intent("education.enroll") });
      expect(result.ok).toBe(true);
      expect(result.plan.orderedContributorIds).toEqual([
        ENROLLMENT_CONTRIBUTOR_ID,
      ]);
      expect(result.plan.skippedContributorIds).toContain(
        ATTENDANCE_CONTRIBUTOR_ID
      );
      expect(
        result.selections.find(
          (s) => s.contributorId === ATTENDANCE_CONTRIBUTOR_ID
        )?.decision
      ).toBe("skip");
    });

    it("plans Attendance only for attendance review", () => {
      const planner = createEducationPlanner();
      const result = planner.plan({
        intent: intent("education.attendance.review", "Attendance Review"),
      });
      expect(result.ok).toBe(true);
      expect(result.plan.orderedContributorIds).toEqual([
        ATTENDANCE_CONTRIBUTOR_ID,
      ]);
      expect(result.plan.skippedContributorIds).toContain(
        ENROLLMENT_CONTRIBUTOR_ID
      );
    });
  });

  describe("multi-contributor plans", () => {
    it("plans student success with available contributors only", () => {
      const planner = createEducationPlanner();
      const result = planner.plan({
        intent: intent(
          "education.student_success.review",
          "Student Success Review"
        ),
      });
      expect(result.plan.orderedContributorIds).toEqual(
        expect.arrayContaining([
          ENROLLMENT_CONTRIBUTOR_ID,
          ATTENDANCE_CONTRIBUTOR_ID,
        ])
      );
      expect(result.plan.skippedContributorIds).toEqual(
        expect.arrayContaining([
          "education.cognition.progress",
          "education.cognition.intervention",
        ])
      );
      expect(result.plan.stages.length).toBeGreaterThanOrEqual(1);
    });

    it("plans scholarship review as Enrollment then Scholarship when available", () => {
      const catalog = createDefaultEducationContributorCatalog().map((d) =>
        d.contributorId === "education.cognition.scholarship"
          ? { ...d, available: true }
          : d
      );
      const planner = createEducationPlanner({ catalog });
      const result = planner.plan({
        intent: intent("education.scholarship.review", "Scholarship Review"),
      });
      expect(result.ok).toBe(true);
      expect(result.plan.orderedContributorIds).toEqual([
        ENROLLMENT_CONTRIBUTOR_ID,
        "education.cognition.scholarship",
      ]);
      expect(result.plan.stages[0]?.contributorIds).toContain(
        ENROLLMENT_CONTRIBUTOR_ID
      );
    });
  });

  describe("dependency ordering", () => {
    it("orders dependencies before dependents", () => {
      const { ordered, stages } = orderContributorsByDependencies(
        [
          "education.cognition.scholarship",
          EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition,
        ],
        [
          {
            from: EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition,
            to: "education.cognition.scholarship",
            kind: "requires",
          },
        ]
      );
      expect(ordered.indexOf(ENROLLMENT_CONTRIBUTOR_ID)).toBeLessThan(
        ordered.indexOf("education.cognition.scholarship")
      );
      expect(stages[0]?.contributorIds).toContain(ENROLLMENT_CONTRIBUTOR_ID);
      expect(stages[1]?.contributorIds).toContain(
        "education.cognition.scholarship"
      );
    });
  });

  describe("skipped contributors", () => {
    it("records inclusion/exclusion reasons", () => {
      const planner = createEducationPlanner();
      const result = planner.plan({ intent: intent("education.enroll") });
      const enroll = result.selections.find(
        (s) => s.contributorId === ENROLLMENT_CONTRIBUTOR_ID
      );
      const attendance = result.selections.find(
        (s) => s.contributorId === ATTENDANCE_CONTRIBUTOR_ID
      );
      expect(enroll?.decision).toBe("include");
      expect(enroll?.reason.toLowerCase()).toContain("enroll");
      expect(attendance?.decision).toBe("skip");
      expect(attendance?.reason.length).toBeGreaterThan(0);
    });
  });

  describe("missing dependency detection", () => {
    it("fails validation when intervention is available without deps", () => {
      const catalog: EducationContributorDescriptor[] =
        normalizeCatalogDependencies(
          createDefaultEducationContributorCatalog().map((d) => {
            if (d.contributorId === "education.cognition.intervention") {
              return { ...d, available: true };
            }
            if (d.contributorId === ATTENDANCE_CONTRIBUTOR_ID) {
              return { ...d, available: false };
            }
            if (d.contributorId === "education.cognition.progress") {
              return { ...d, available: false };
            }
            return d;
          })
        );

      const planner = createEducationPlanner({ catalog });
      const result = planner.plan({
        intent: intent("education.support"),
        context: { focusTags: ["intervention"] },
      });

      const hasMissingDep = result.validationIssues.some(
        (i) => i.code === "MISSING_DEPENDENCY"
      );
      expect(hasMissingDep || !result.ok).toBe(true);
    });

    it("detects missing dependency on an explicit plan", () => {
      const catalog = createDefaultEducationContributorCatalog();
      const issues = validateEducationExecutionPlan({
        catalog,
        selectedIds: ["education.cognition.scholarship"],
        plan: {
          planId: "test",
          intentId: "education.scholarship.review",
          orderedContributorIds: ["education.cognition.scholarship"],
          nodes: [],
          stages: [
            {
              stage: 0,
              contributorIds: ["education.cognition.scholarship"],
            },
          ],
          dependencyEdges: [
            {
              from: ENROLLMENT_CONTRIBUTOR_ID,
              to: "education.cognition.scholarship",
              kind: "requires",
            },
          ],
          skippedContributorIds: [],
          expectedOutputs: [],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      });
      expect(issues.some((i) => i.code === "MISSING_DEPENDENCY")).toBe(true);
    });
  });

  describe("plan validation", () => {
    it("marks enroll plan as ok with expected outputs", () => {
      const planner = createEducationPlanner();
      const result = planner.plan({ intent: intent("education.enroll") });
      expect(result.ok).toBe(true);
      expect(
        result.validationIssues.filter((i) => i.severity === "error")
      ).toHaveLength(0);
      expect(result.plan.expectedOutputs).toEqual(
        expect.arrayContaining(["evidence.enrollment"])
      );
    });
  });

  describe("graph integration contract", () => {
    it("exposes ordered ids for graph evaluateResults without changing graph API", () => {
      const planner = createEducationPlanner();
      const { plan } = planner.plan({
        intent: intent(
          "education.student_success.review",
          "Student Success Review"
        ),
      });
      expect(Array.isArray(plan.orderedContributorIds)).toBe(true);
      expect(plan.orderedContributorIds.length).toBeGreaterThan(0);
    });
  });
});
