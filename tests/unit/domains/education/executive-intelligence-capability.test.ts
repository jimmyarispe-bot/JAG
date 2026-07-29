import { describe, expect, it } from "vitest";
import {
  CAMPUS_PERFORMANCE_CONTRIBUTOR_ID,
  EDUCATION_CAPABILITY_PACK_IDS,
  EDUCATION_CONTRIBUTOR_IDS,
  EXECUTIVE_BRIEFING_CONTRIBUTOR_ID,
  EXECUTIVE_INTELLIGENCE_CAPABILITY_PACK,
  FUNDING_READINESS_CONTRIBUTOR_ID,
  OPERATIONAL_READINESS_CONTRIBUTOR_ID,
  SCHOOL_HEALTH_CONTRIBUTOR_ID,
  STUDENT_SUCCESS_CONTRIBUTOR_ID,
  SUPPORT_PLANNING_CONTRIBUTOR_ID,
  buildCampusPerformanceInputs,
  buildEducationDomain,
  buildExecutiveBriefingInputs,
  buildSchoolHealthInputs,
  createCampusPerformanceContributor,
  createEducationPlanner,
  createExecutiveBriefingContributor,
  createSchoolHealthContributor,
  getCapabilityPack,
  listContributors,
  listPlannerIntents,
  runCampusPerformanceIntelligence,
  runExecutiveBriefingIntelligence,
  runSchoolHealthIntelligence,
  validateEducationCapabilityRegistry,
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
  partial: Partial<EducationContributorResult> = {}
): { contributorId: string; result: EducationContributorResult } {
  return {
    contributorId,
    result: {
      subjectId: "org-exec-1",
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

function healthyFoundationalUpstream() {
  return [
    upstream(STUDENT_SUCCESS_CONTRIBUTOR_ID, {
      evidence: [evidenceCode(STUDENT_SUCCESS_CONTRIBUTOR_ID, "healthy")],
    }),
    upstream(SUPPORT_PLANNING_CONTRIBUTOR_ID, { readiness: "ready" }),
    upstream(OPERATIONAL_READINESS_CONTRIBUTOR_ID, {
      evidence: [
        evidenceCode(OPERATIONAL_READINESS_CONTRIBUTOR_ID, "readiness_ready"),
      ],
    }),
    upstream(FUNDING_READINESS_CONTRIBUTOR_ID, {
      evidence: [evidenceCode(FUNDING_READINESS_CONTRIBUTOR_ID, "funding_ready")],
    }),
  ];
}

describe("Executive Intelligence Capability Pack (D5.3)", () => {
  describe("healthy organization", () => {
    it("reports healthy school health from ready upstream", () => {
      const result = runSchoolHealthIntelligence(
        buildSchoolHealthInputs({
          subjectId: "org-exec-1",
          upstream: healthyFoundationalUpstream(),
        })
      );

      expect(result.stance).toBe("healthy");
      expect(result.healthScore).toBeGreaterThan(0.5);
      expect(
        result.recommendations.some((r) => r.kind === "reinforce_strengths")
      ).toBe(true);
    });
  });

  describe("operational concerns", () => {
    it("flags watch/at_risk when operational readiness is blocked", () => {
      const result = runSchoolHealthIntelligence(
        buildSchoolHealthInputs({
          subjectId: "org-exec-1",
          upstream: [
            upstream(STUDENT_SUCCESS_CONTRIBUTOR_ID),
            upstream(SUPPORT_PLANNING_CONTRIBUTOR_ID),
            upstream(OPERATIONAL_READINESS_CONTRIBUTOR_ID, {
              readiness: "blocked",
              blockingIssues: ["coverage"],
              evidence: [
                evidenceCode(
                  OPERATIONAL_READINESS_CONTRIBUTOR_ID,
                  "readiness_blocked"
                ),
              ],
            }),
            upstream(FUNDING_READINESS_CONTRIBUTOR_ID),
          ],
        })
      );

      expect(result.stance).toMatch(/watch|at_risk|critical/);
      expect(
        result.recommendations.some(
          (r) => r.kind === "stabilize_organizational_health"
        )
      ).toBe(true);
    });
  });

  describe("funding concerns", () => {
    it("flags health risk when funding readiness is at risk", () => {
      const result = runSchoolHealthIntelligence(
        buildSchoolHealthInputs({
          subjectId: "org-exec-1",
          upstream: [
            upstream(STUDENT_SUCCESS_CONTRIBUTOR_ID),
            upstream(SUPPORT_PLANNING_CONTRIBUTOR_ID),
            upstream(OPERATIONAL_READINESS_CONTRIBUTOR_ID),
            upstream(FUNDING_READINESS_CONTRIBUTOR_ID, {
              readiness: "conditional",
              warnings: ["renewal"],
              evidence: [
                evidenceCode(FUNDING_READINESS_CONTRIBUTOR_ID, "funding_at_risk"),
              ],
            }),
          ],
        })
      );

      expect(result.stance).not.toBe("healthy");
      expect(
        result.recommendations.some(
          (r) => r.kind === "prioritize_health_actions"
        )
      ).toBe(true);
    });
  });

  describe("student success concerns", () => {
    it("surfaces student success concerns in school health", () => {
      const result = runSchoolHealthIntelligence(
        buildSchoolHealthInputs({
          subjectId: "org-exec-1",
          upstream: [
            upstream(STUDENT_SUCCESS_CONTRIBUTOR_ID, {
              readiness: "conditional",
              warnings: ["attendance"],
              evidence: [
                evidenceCode(
                  STUDENT_SUCCESS_CONTRIBUTOR_ID,
                  "attendance_concern"
                ),
              ],
            }),
            upstream(SUPPORT_PLANNING_CONTRIBUTOR_ID),
            upstream(OPERATIONAL_READINESS_CONTRIBUTOR_ID),
            upstream(FUNDING_READINESS_CONTRIBUTOR_ID),
          ],
        })
      );

      expect(result.stance).toMatch(/watch|at_risk|critical/);
      expect(
        result.evidence.some(
          (e) =>
            e.attributes?.code === "health_risks" ||
            e.attributes?.code === "health_watch"
        )
      ).toBe(true);
    });
  });

  describe("cross-campus comparison", () => {
    it("compares campus units and produces comparative insights", () => {
      const result = runCampusPerformanceIntelligence(
        buildCampusPerformanceInputs({
          subjectId: "org-exec-1",
          upstream: healthyFoundationalUpstream(),
          attributes: {
            campuses: [
              {
                campusId: "campus-a",
                label: "North",
                score: 0.92,
                trend: "improving",
              },
              {
                campusId: "campus-b",
                label: "South",
                score: 0.48,
                trend: "declining",
              },
            ],
          },
        })
      );

      expect(result.stance).toMatch(/mixed|underperforming|strong/);
      expect(
        result.recommendations.some(
          (r) =>
            r.kind === "close_performance_gaps" ||
            r.kind === "replicate_high_performers" ||
            r.kind === "publish_performance_brief"
        )
      ).toBe(true);
      expect(
        result.evidence.some((e) => e.attributes?.code === "comparative_insights")
      ).toBe(true);
    });
  });

  describe("executive briefing synthesis", () => {
    it("synthesizes a top-level executive briefing", () => {
      const health = runSchoolHealthIntelligence(
        buildSchoolHealthInputs({
          subjectId: "org-exec-1",
          upstream: healthyFoundationalUpstream(),
        })
      );
      const campus = runCampusPerformanceIntelligence(
        buildCampusPerformanceInputs({
          subjectId: "org-exec-1",
          upstream: healthyFoundationalUpstream(),
          attributes: {
            campuses: [
              { campusId: "campus-a", label: "North", score: 0.9 },
              { campusId: "campus-b", label: "South", score: 0.85 },
            ],
          },
        })
      );

      const briefing = runExecutiveBriefingIntelligence(
        buildExecutiveBriefingInputs({
          subjectId: "org-exec-1",
          upstream: [
            {
              contributorId: SCHOOL_HEALTH_CONTRIBUTOR_ID,
              result: health,
            },
            {
              contributorId: CAMPUS_PERFORMANCE_CONTRIBUTOR_ID,
              result: campus,
            },
            upstream(FUNDING_READINESS_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(FUNDING_READINESS_CONTRIBUTOR_ID, "funding_ready"),
              ],
            }),
            upstream(SUPPORT_PLANNING_CONTRIBUTOR_ID),
            upstream(OPERATIONAL_READINESS_CONTRIBUTOR_ID),
          ],
        })
      );

      expect(briefing.stance).toMatch(/favorable|cautionary|urgent/);
      expect(briefing.briefingConfidence).toBeGreaterThan(0);
      expect(
        briefing.recommendations.some(
          (r) => r.kind === "publish_executive_brief"
        )
      ).toBe(true);
      expect(
        briefing.recommendations.some(
          (r) => r.kind === "set_strategic_priorities"
        )
      ).toBe(true);
      expect(
        briefing.evidence.some((e) => e.attributes?.code === "executive_summary")
      ).toBe(true);
      expect(
        briefing.evidence.some((e) => e.attributes?.code === "evidence_index")
      ).toBe(true);
    });
  });

  describe("planner selection", () => {
    it("selects executive intelligence contributors for leadership intents", () => {
      const planner = createEducationPlanner();
      for (const [id, label] of [
        ["education.executive.brief", "Executive Brief"],
        ["education.board.review", "Board Review"],
        ["education.quarterly.review", "Quarterly Review"],
        ["education.annual.planning", "Annual Planning"],
        ["education.strategic.review", "Strategic Review"],
        ["education.network.health", "Network Health"],
      ] as const) {
        const plan = planner.plan({ intent: intent(id, label) });
        expect(plan.plan.orderedContributorIds).toEqual(
          expect.arrayContaining([
            SCHOOL_HEALTH_CONTRIBUTOR_ID,
            CAMPUS_PERFORMANCE_CONTRIBUTOR_ID,
            EXECUTIVE_BRIEFING_CONTRIBUTOR_ID,
            STUDENT_SUCCESS_CONTRIBUTOR_ID,
          ])
        );
        expect(
          plan.plan.orderedContributorIds.indexOf(SCHOOL_HEALTH_CONTRIBUTOR_ID)
        ).toBeLessThan(
          plan.plan.orderedContributorIds.indexOf(
            EXECUTIVE_BRIEFING_CONTRIBUTOR_ID
          )
        );
      }
    });

    it("keeps executive funding brief on the funding pack scenario", () => {
      const planner = createEducationPlanner();
      const plan = planner.plan({
        intent: intent(
          "education.funding.executive_brief",
          "Executive Funding Brief"
        ),
      });
      expect(plan.plan.orderedContributorIds).toContain(
        FUNDING_READINESS_CONTRIBUTOR_ID
      );
      expect(plan.plan.orderedContributorIds).not.toContain(
        EXECUTIVE_BRIEFING_CONTRIBUTOR_ID
      );
    });
  });

  describe("pack registration", () => {
    it("registers pack metadata, dependencies, and domain contributors", () => {
      expect(EXECUTIVE_INTELLIGENCE_CAPABILITY_PACK.version).toBe("0.1.0");
      expect(EXECUTIVE_INTELLIGENCE_CAPABILITY_PACK.dependencies).toEqual([
        EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle,
        EDUCATION_CAPABILITY_PACK_IDS.studentSupport,
        EDUCATION_CAPABILITY_PACK_IDS.academicOperations,
        EDUCATION_CAPABILITY_PACK_IDS.fundingCompliance,
      ]);
      expect(
        getCapabilityPack(EDUCATION_CAPABILITY_PACK_IDS.executiveIntelligence)
          ?.name
      ).toBe("Executive Intelligence");
      expect(
        listContributors(EDUCATION_CAPABILITY_PACK_IDS.executiveIntelligence)
      ).toEqual(
        expect.arrayContaining([
          EDUCATION_CONTRIBUTOR_IDS.schoolHealthCognition,
          EDUCATION_CONTRIBUTOR_IDS.campusPerformanceCognition,
          EDUCATION_CONTRIBUTOR_IDS.executiveBriefingCognition,
        ])
      );
      expect(
        listPlannerIntents(EDUCATION_CAPABILITY_PACK_IDS.executiveIntelligence)
      ).toEqual(
        expect.arrayContaining([
          "education.executive.brief",
          "education.board.review",
          "education.network.health",
        ])
      );
      expect(validateEducationCapabilityRegistry().ok).toBe(true);

      expect(createSchoolHealthContributor().id).toBe(SCHOOL_HEALTH_CONTRIBUTOR_ID);
      expect(createCampusPerformanceContributor().id).toBe(
        CAMPUS_PERFORMANCE_CONTRIBUTOR_ID
      );
      expect(createExecutiveBriefingContributor().id).toBe(
        EXECUTIVE_BRIEFING_CONTRIBUTOR_ID
      );

      const domain = buildEducationDomain();
      for (const id of [
        EDUCATION_CONTRIBUTOR_IDS.schoolHealthCognition,
        EDUCATION_CONTRIBUTOR_IDS.campusPerformanceCognition,
        EDUCATION_CONTRIBUTOR_IDS.executiveBriefingCognition,
      ]) {
        expect(domain.manifest.contributors.some((c) => c.id === id)).toBe(
          true
        );
      }
    });
  });
});
