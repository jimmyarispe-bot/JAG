import { describe, expect, it } from "vitest";
import {
  EDUCATION_CAPABILITY_IDS,
  EDUCATION_CONTRIBUTOR_IDS,
  EDUCATION_POLICY_IDS,
  PROGRESS_CONTRIBUTOR_ID,
  buildEducationDomain,
  createAcademicProgressContributor,
  createEducationPolicyEngine,
  runAcademicProgressIntelligence,
  type AcademicProgressObservation,
  type EducationPolicyEvaluationPort,
} from "@/lib/domains/education";

function baseObservation(
  overrides: Partial<AcademicProgressObservation> = {}
): AcademicProgressObservation {
  return {
    organizationId: "org-edu",
    student: { studentId: "stu-prog-1", displayName: "Progress Student" },
    program: { programId: "prog-1", typeCode: "academic" },
    goals: [
      {
        goalId: "goal-literacy",
        label: "Literacy",
        currentMastery: 0.7,
        targetMastery: 0.7,
      },
    ],
    masteryIndicators: [
      { skillId: "reading", level: 3, expectedLevel: 3 },
    ],
    assessments: [
      {
        assessmentId: "assess-1",
        typeCode: "formative",
        status: "complete",
        score: 0.8,
        readinessThreshold: 0.7,
      },
    ],
    courses: [
      {
        courseId: "math-1",
        progressRatio: 0.5,
        expectedProgressRatio: 0.5,
      },
    ],
    earnedCredits: 24,
    expectedCreditsAtCheckpoint: 24,
    ...overrides,
  };
}

describe("Academic Progress Intelligence (D4.0)", () => {
  describe("expected progress", () => {
    it("signals expected progress with recommendations", () => {
      const result = runAcademicProgressIntelligence(baseObservation());
      expect(result.studentId).toBe("stu-prog-1");
      expect(
        result.evidence.some(
          (e) => e.attributes?.code === "expected_progress"
        )
      ).toBe(true);
      expect(
        result.evidence.some(
          (e) => e.attributes?.code === "knowledge_entities_bound"
        )
      ).toBe(true);
      expect(
        result.recommendations.some((r) => r.kind === "continue_current_path")
      ).toBe(true);
      expect(result.suggestedActions.length).toBeGreaterThan(0);
      expect(result.recommendations[0]?.constitutionalTrace.domainPackageId).toBe(
        "education"
      );
    });
  });

  describe("ahead of expectations", () => {
    it("detects ahead trajectory and proposes acceleration", () => {
      const result = runAcademicProgressIntelligence(
        baseObservation({
          goals: [
            {
              goalId: "g1",
              currentMastery: 0.95,
              targetMastery: 0.7,
            },
          ],
          courses: [
            {
              courseId: "c1",
              progressRatio: 0.9,
              expectedProgressRatio: 0.5,
            },
          ],
        })
      );
      expect(
        result.evidence.some(
          (e) =>
            e.attributes?.code === "ahead_of_expectations" ||
            e.attributes?.code === "exceptional_growth"
        )
      ).toBe(true);
      expect(
        result.recommendations.some((r) => r.kind === "accelerate_learning")
      ).toBe(true);
    });
  });

  describe("behind expectations", () => {
    it("flags behind progress and recommends intervention", () => {
      const result = runAcademicProgressIntelligence(
        baseObservation({
          goals: [
            {
              goalId: "g1",
              currentMastery: 0.3,
              targetMastery: 0.8,
            },
          ],
          courses: [
            {
              courseId: "c1",
              progressRatio: 0.2,
              expectedProgressRatio: 0.6,
            },
          ],
          earnedCredits: 10,
          expectedCreditsAtCheckpoint: 20,
        })
      );
      expect(
        result.evidence.some(
          (e) =>
            e.attributes?.code === "behind_expectations" ||
            e.attributes?.code === "stalled_progress"
        )
      ).toBe(true);
      expect(
        result.recommendations.some((r) => r.kind === "recommend_intervention")
      ).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(1);
    });
  });

  describe("insufficient evidence", () => {
    it("blocks when observation lacks progress signals", () => {
      const result = runAcademicProgressIntelligence({
        organizationId: "org-edu",
        student: { studentId: "stu-empty" },
      });
      expect(result.readiness).toBe("blocked");
      expect(
        result.evidence.some(
          (e) => e.attributes?.code === "insufficient_evidence"
        )
      ).toBe(true);
      expect(
        result.recommendations.some((r) => r.kind === "gather_more_evidence")
      ).toBe(true);
    });
  });

  describe("policy satisfied", () => {
    it("records graduation policy satisfaction via Policy Engine", () => {
      const result = runAcademicProgressIntelligence(
        baseObservation({ earnedCredits: 30 })
      );
      expect(
        result.evidence.some(
          (e) =>
            e.attributes?.code === "policy_graduation_satisfied" ||
            (typeof e.attributes?.code === "string" &&
              e.attributes.code.includes("graduation") &&
              e.attributes.code.includes("satisfied"))
        )
      ).toBe(true);
      expect(
        result.evidence.some(
          (e) => e.attributes?.policyId === EDUCATION_POLICY_IDS.graduationCredits
        )
      ).toBe(true);
    });
  });

  describe("policy violated", () => {
    it("records graduation policy violation via Policy Engine", () => {
      const result = runAcademicProgressIntelligence(
        baseObservation({
          earnedCredits: 5,
          goals: [
            { goalId: "g1", currentMastery: 0.7, targetMastery: 0.7 },
          ],
        })
      );
      expect(
        result.evidence.some(
          (e) =>
            e.attributes?.code === "policy_graduation_violated" ||
            (typeof e.attributes?.code === "string" &&
              e.attributes.code.includes("graduation") &&
              e.attributes.code.includes("violated"))
        )
      ).toBe(true);
      expect(
        result.recommendations.some((r) => r.kind === "review_goals")
      ).toBe(true);
    });
  });

  describe("multiple recommendations", () => {
    it("can emit more than one recommendation for stalled progress", () => {
      const result = runAcademicProgressIntelligence(
        baseObservation({
          courses: [
            {
              courseId: "c1",
              progressRatio: 0.02,
              expectedProgressRatio: 0.5,
            },
          ],
          goals: [
            { goalId: "g1", currentMastery: 0.2, targetMastery: 0.8 },
          ],
          assessments: [{ assessmentId: "a1", status: "pending" }],
        })
      );
      expect(result.recommendations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("knowledge + domain registration", () => {
    it("binds Knowledge capability and registers contributor", () => {
      const contributor = createAcademicProgressContributor();
      expect(contributor.id).toBe(PROGRESS_CONTRIBUTOR_ID);

      const domain = buildEducationDomain();
      expect(
        domain.manifest.contributors.some(
          (c) => c.id === EDUCATION_CONTRIBUTOR_IDS.progressCognition
        )
      ).toBe(true);

      const result = runAcademicProgressIntelligence(baseObservation());
      const knowledge = result.evidence.find(
        (e) => e.attributes?.code === "knowledge_entities_bound"
      );
      expect(knowledge?.attributes?.capabilityId).toBe(
        EDUCATION_CAPABILITY_IDS.academicProgress
      );
    });

    it("accepts an injected Policy Engine port", () => {
      const engine = createEducationPolicyEngine();
      const port: EducationPolicyEvaluationPort = {
        evaluate: (input) => engine.evaluate(input),
      };
      const result = runAcademicProgressIntelligence(baseObservation(), {
        policyPort: port,
      });
      expect(result.evidence.length).toBeGreaterThan(0);
    });
  });
});
