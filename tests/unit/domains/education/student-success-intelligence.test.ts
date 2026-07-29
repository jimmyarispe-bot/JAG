import { describe, expect, it } from "vitest";
import {
  ATTENDANCE_CONTRIBUTOR_ID,
  EDUCATION_CONTRIBUTOR_IDS,
  ENROLLMENT_CONTRIBUTOR_ID,
  PROGRESS_CONTRIBUTOR_ID,
  STUDENT_SUCCESS_CONTRIBUTOR_ID,
  buildEducationDomain,
  buildStudentSuccessInputs,
  createEducationPlanner,
  createStudentSuccessContributor,
  runStudentSuccessIntelligence,
  type EducationContributorResult,
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
  partial: Partial<EducationContributorResult> & {
    readiness?: EducationContributorResult["readiness"];
  }
): { contributorId: string; result: EducationContributorResult } {
  return {
    contributorId,
    result: {
      subjectId: "stu-ss-1",
      evidence: (partial.evidence as EducationContributorResult["evidence"]) ?? [
        {
          source: contributorId,
          id: `${contributorId}:ok`,
          retrievedAt: "2026-01-01T00:00:00.000Z",
          attributes: { code: partial.attributes?.code ?? "ok" },
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

describe("Student Success Intelligence (D4.1 synthesis)", () => {
  describe("healthy learner", () => {
    it("synthesizes a healthy trajectory from ready upstream results", () => {
      const result = runStudentSuccessIntelligence(
        buildStudentSuccessInputs({
          subjectId: "stu-ss-1",
          upstream: [
            upstream(ENROLLMENT_CONTRIBUTOR_ID, { readiness: "ready" }),
            upstream(ATTENDANCE_CONTRIBUTOR_ID, { readiness: "ready" }),
            upstream(PROGRESS_CONTRIBUTOR_ID, {
              readiness: "ready",
              evidence: [evidenceCode(PROGRESS_CONTRIBUTOR_ID, "expected_progress")],
            }),
          ],
        })
      );

      expect(result.trajectory).toMatch(/healthy|positive_momentum/);
      expect(
        result.evidence.some((e) => e.attributes?.code === "synthesis_inputs_bound")
      ).toBe(true);
      expect(
        result.recommendations.some((r) => r.kind === "maintain_momentum")
      ).toBe(true);
      expect(result.suggestedActions.length).toBeGreaterThan(0);
    });
  });

  describe("high academic risk", () => {
    it("flags high academic risk from progress upstream", () => {
      const result = runStudentSuccessIntelligence(
        buildStudentSuccessInputs({
          subjectId: "stu-ss-1",
          upstream: [
            upstream(ENROLLMENT_CONTRIBUTOR_ID, { readiness: "ready" }),
            upstream(ATTENDANCE_CONTRIBUTOR_ID, { readiness: "ready" }),
            upstream(PROGRESS_CONTRIBUTOR_ID, {
              readiness: "blocked",
              blockingIssues: ["Behind expectations"],
              evidence: [
                evidenceCode(PROGRESS_CONTRIBUTOR_ID, "behind_expectations"),
                evidenceCode(PROGRESS_CONTRIBUTOR_ID, "intervention_indicated"),
              ],
              recommendations: [
                {
                  id: "rec.recommend_intervention",
                  kind: "recommend_intervention",
                  title: "Intervene",
                  explanation: "Behind",
                  confidence: 0.9,
                  priority: 1,
                  evidenceIds: [],
                  suggestedActions: [],
                  constitutionalTrace: {
                    domainPackageId: "education",
                    contributorId: PROGRESS_CONTRIBUTOR_ID,
                    laws: [],
                    rationale: "Behind",
                  },
                },
              ],
            }),
          ],
        })
      );

      expect(result.trajectory).toBe("high_academic_risk");
      expect(
        result.recommendations.some((r) => r.kind === "coordinate_intervention")
      ).toBe(true);
    });
  });

  describe("attendance concern", () => {
    it("surfaces attendance concern from attendance upstream", () => {
      const result = runStudentSuccessIntelligence(
        buildStudentSuccessInputs({
          subjectId: "stu-ss-1",
          upstream: [
            upstream(ENROLLMENT_CONTRIBUTOR_ID, { readiness: "ready" }),
            upstream(ATTENDANCE_CONTRIBUTOR_ID, {
              readiness: "blocked",
              blockingIssues: ["Chronic absenteeism"],
              evidence: [
                evidenceCode(ATTENDANCE_CONTRIBUTOR_ID, "chronic_absenteeism"),
              ],
              recommendations: [
                {
                  id: "rec.recommend_intervention",
                  kind: "recommend_intervention",
                  title: "Attendance intervention",
                  explanation: "Chronic",
                  confidence: 0.9,
                  priority: 1,
                  evidenceIds: [],
                  suggestedActions: [],
                  constitutionalTrace: {
                    domainPackageId: "education",
                    contributorId: ATTENDANCE_CONTRIBUTOR_ID,
                    laws: [],
                    rationale: "Chronic",
                  },
                },
              ],
            }),
            upstream(PROGRESS_CONTRIBUTOR_ID, { readiness: "ready" }),
          ],
        })
      );

      expect(result.trajectory).toBe("attendance_concern");
      expect(
        result.evidence.some((e) => e.attributes?.code === "attendance_concern")
      ).toBe(true);
    });
  });

  describe("conflicting contributor outputs", () => {
    it("detects ready vs blocked conflict across domains", () => {
      const result = runStudentSuccessIntelligence(
        buildStudentSuccessInputs({
          subjectId: "stu-ss-1",
          upstream: [
            upstream(ENROLLMENT_CONTRIBUTOR_ID, { readiness: "ready" }),
            upstream(ATTENDANCE_CONTRIBUTOR_ID, {
              readiness: "blocked",
              blockingIssues: ["Absent"],
              evidence: [
                evidenceCode(ATTENDANCE_CONTRIBUTOR_ID, "chronic_absenteeism"),
              ],
            }),
            upstream(PROGRESS_CONTRIBUTOR_ID, {
              readiness: "blocked",
              blockingIssues: ["Behind"],
              evidence: [
                evidenceCode(PROGRESS_CONTRIBUTOR_ID, "behind_expectations"),
              ],
            }),
          ],
        })
      );

      expect(result.trajectory).toBe("conflicting");
      expect(
        result.recommendations.some((r) => r.kind === "resolve_conflicts")
      ).toBe(true);
    });
  });

  describe("improving trajectory", () => {
    it("recognizes improving upstream signals", () => {
      const result = runStudentSuccessIntelligence(
        buildStudentSuccessInputs({
          subjectId: "stu-ss-1",
          upstream: [
            upstream(ENROLLMENT_CONTRIBUTOR_ID, { readiness: "ready" }),
            upstream(ATTENDANCE_CONTRIBUTOR_ID, {
              readiness: "ready",
              evidence: [
                evidenceCode(ATTENDANCE_CONTRIBUTOR_ID, "improving_trend"),
              ],
              recommendations: [
                {
                  id: "rec.recognize_improvement",
                  kind: "recognize_improvement",
                  title: "Improving",
                  explanation: "Improving",
                  confidence: 0.85,
                  priority: 3,
                  evidenceIds: [],
                  suggestedActions: [],
                  constitutionalTrace: {
                    domainPackageId: "education",
                    contributorId: ATTENDANCE_CONTRIBUTOR_ID,
                    laws: [],
                    rationale: "Improving",
                  },
                },
              ],
            }),
            upstream(PROGRESS_CONTRIBUTOR_ID, { readiness: "ready" }),
          ],
        })
      );

      expect(result.trajectory).toBe("improving");
      expect(
        result.evidence.some((e) => e.attributes?.code === "improving_trajectory")
      ).toBe(true);
    });
  });

  describe("outstanding achievement", () => {
    it("celebrates exceptional progress without risk blockers", () => {
      const result = runStudentSuccessIntelligence(
        buildStudentSuccessInputs({
          subjectId: "stu-ss-1",
          upstream: [
            upstream(ENROLLMENT_CONTRIBUTOR_ID, { readiness: "ready" }),
            upstream(ATTENDANCE_CONTRIBUTOR_ID, { readiness: "ready" }),
            upstream(PROGRESS_CONTRIBUTOR_ID, {
              readiness: "ready",
              evidence: [
                evidenceCode(PROGRESS_CONTRIBUTOR_ID, "exceptional_growth"),
              ],
              recommendations: [
                {
                  id: "rec.celebrate_growth",
                  kind: "celebrate_growth",
                  title: "Celebrate",
                  explanation: "Exceptional",
                  confidence: 0.9,
                  priority: 3,
                  evidenceIds: [],
                  suggestedActions: [],
                  constitutionalTrace: {
                    domainPackageId: "education",
                    contributorId: PROGRESS_CONTRIBUTOR_ID,
                    laws: [],
                    rationale: "Exceptional",
                  },
                },
              ],
            }),
          ],
        })
      );

      expect(result.trajectory).toBe("outstanding");
      expect(
        result.recommendations.some((r) => r.kind === "celebrate_achievement")
      ).toBe(true);
    });
  });

  describe("planner + domain registration", () => {
    it("selects synthesis only for cross-domain success intents", () => {
      const planner = createEducationPlanner();
      const success = planner.plan({
        intent: intent("education.student_success.review", "Student Success Review"),
      });
      expect(success.plan.orderedContributorIds).toContain(
        STUDENT_SUCCESS_CONTRIBUTOR_ID
      );
      expect(
        success.plan.orderedContributorIds.indexOf(ENROLLMENT_CONTRIBUTOR_ID)
      ).toBeLessThan(
        success.plan.orderedContributorIds.indexOf(STUDENT_SUCCESS_CONTRIBUTOR_ID)
      );

      const enrollOnly = planner.plan({
        intent: intent("education.enroll"),
      });
      expect(enrollOnly.plan.orderedContributorIds).not.toContain(
        STUDENT_SUCCESS_CONTRIBUTOR_ID
      );

      const quarterly = planner.plan({
        intent: intent("education.quarterly.review", "Quarterly Review"),
      });
      expect(quarterly.plan.orderedContributorIds).toContain(
        STUDENT_SUCCESS_CONTRIBUTOR_ID
      );
    });

    it("registers synthesis contributor on the domain package", () => {
      const contributor = createStudentSuccessContributor();
      expect(contributor.id).toBe(STUDENT_SUCCESS_CONTRIBUTOR_ID);
      const domain = buildEducationDomain();
      expect(
        domain.manifest.contributors.some(
          (c) => c.id === EDUCATION_CONTRIBUTOR_IDS.studentSuccessCognition
        )
      ).toBe(true);
    });
  });
});
