import { describe, expect, it } from "vitest";
import {
  ATTENDANCE_CONTRIBUTOR_ID,
  EDUCATION_CONTRIBUTOR_IDS,
  ENROLLMENT_CONTRIBUTOR_ID,
  FAMILY_ENGAGEMENT_CONTRIBUTOR_ID,
  INTERVENTION_CONTRIBUTOR_ID,
  PROGRESS_CONTRIBUTOR_ID,
  STUDENT_SUCCESS_CONTRIBUTOR_ID,
  SUPPORT_PLANNING_CONTRIBUTOR_ID,
  buildEducationDomain,
  buildFamilyEngagementInputs,
  buildInterventionInputs,
  buildSupportPlanningInputs,
  createEducationPlanner,
  createFamilyEngagementContributor,
  createInterventionContributor,
  createSupportPlanningContributor,
  executeEducationIntelligence,
  runFamilyEngagementIntelligence,
  runInterventionIntelligence,
  runSupportPlanningIntelligence,
  type AcademicProgressObservation,
  type AttendanceObservation,
  type AttendanceSessionRecord,
  type EducationContributorResult,
  type EnrollmentObservation,
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
  } = {}
): { contributorId: string; result: EducationContributorResult } {
  return {
    contributorId,
    result: {
      subjectId: "stu-support-1",
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

describe("Student Support Capability Pack (D4.2)", () => {
  describe("Intervention Intelligence", () => {
    it("proposes academic intervention from progress upstream", () => {
      const result = runInterventionIntelligence(
        buildInterventionInputs({
          subjectId: "stu-support-1",
          upstream: [
            upstream(STUDENT_SUCCESS_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(STUDENT_SUCCESS_CONTRIBUTOR_ID, "emerging_risk"),
              ],
            }),
            upstream(PROGRESS_CONTRIBUTOR_ID, {
              readiness: "blocked",
              blockingIssues: ["Behind"],
              evidence: [
                evidenceCode(PROGRESS_CONTRIBUTOR_ID, "behind_expectations"),
                evidenceCode(PROGRESS_CONTRIBUTOR_ID, "intervention_indicated"),
              ],
            }),
            upstream(ATTENDANCE_CONTRIBUTOR_ID, { readiness: "ready" }),
          ],
        })
      );

      expect(
        result.candidates.some((c) => c.type === "academic" || c.type === "multi_domain")
      ).toBe(true);
      expect(
        result.recommendations.some(
          (r) =>
            r.kind === "propose_academic_intervention" ||
            r.kind === "propose_multi_domain_intervention"
        )
      ).toBe(true);
      expect(result.suggestedActions.length).toBeGreaterThan(0);
    });

    it("proposes attendance intervention from attendance upstream", () => {
      const result = runInterventionIntelligence(
        buildInterventionInputs({
          subjectId: "stu-support-1",
          upstream: [
            upstream(STUDENT_SUCCESS_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(
                  STUDENT_SUCCESS_CONTRIBUTOR_ID,
                  "attendance_concern"
                ),
              ],
            }),
            upstream(PROGRESS_CONTRIBUTOR_ID, { readiness: "ready" }),
            upstream(ATTENDANCE_CONTRIBUTOR_ID, {
              readiness: "blocked",
              evidence: [
                evidenceCode(ATTENDANCE_CONTRIBUTOR_ID, "chronic_absenteeism"),
              ],
            }),
          ],
        })
      );

      expect(
        result.candidates.some(
          (c) => c.type === "attendance" || c.type === "multi_domain"
        )
      ).toBe(true);
      expect(
        result.evidence.some(
          (e) => e.attributes?.code === "attendance_intervention_indicated"
        )
      ).toBe(true);
    });

    it("escalates multi-domain risk to MTSS", () => {
      const result = runInterventionIntelligence(
        buildInterventionInputs({
          subjectId: "stu-support-1",
          upstream: [
            upstream(STUDENT_SUCCESS_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(
                  STUDENT_SUCCESS_CONTRIBUTOR_ID,
                  "high_academic_risk"
                ),
              ],
            }),
            upstream(PROGRESS_CONTRIBUTOR_ID, {
              readiness: "blocked",
              evidence: [
                evidenceCode(PROGRESS_CONTRIBUTOR_ID, "behind_expectations"),
              ],
            }),
            upstream(ATTENDANCE_CONTRIBUTOR_ID, {
              readiness: "blocked",
              evidence: [
                evidenceCode(ATTENDANCE_CONTRIBUTOR_ID, "chronic_absenteeism"),
              ],
            }),
          ],
        })
      );

      expect(result.candidates.some((c) => c.type === "multi_domain")).toBe(
        true
      );
      expect(
        result.recommendations.some((r) => r.kind === "escalate_mtss")
      ).toBe(true);
    });
  });

  describe("Family Engagement Intelligence", () => {
    it("surfaces attendance partnership opportunity", () => {
      const result = runFamilyEngagementIntelligence(
        buildFamilyEngagementInputs({
          subjectId: "stu-support-1",
          upstream: [
            upstream(STUDENT_SUCCESS_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(
                  STUDENT_SUCCESS_CONTRIBUTOR_ID,
                  "attendance_concern"
                ),
              ],
            }),
            upstream(ATTENDANCE_CONTRIBUTOR_ID, {
              readiness: "blocked",
              evidence: [
                evidenceCode(ATTENDANCE_CONTRIBUTOR_ID, "chronic_absenteeism"),
              ],
            }),
            upstream(ENROLLMENT_CONTRIBUTOR_ID, { readiness: "ready" }),
          ],
        })
      );

      expect(result.opportunities).toContain("attendance_partnership");
      expect(result.communicationPriority).toMatch(/urgent|high/);
      expect(
        result.recommendations.some(
          (r) => r.kind === "prioritize_attendance_outreach"
        )
      ).toBe(true);
    });

    it("celebrates positive family outreach opportunity", () => {
      const result = runFamilyEngagementIntelligence(
        buildFamilyEngagementInputs({
          subjectId: "stu-support-1",
          upstream: [
            upstream(STUDENT_SUCCESS_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(
                  STUDENT_SUCCESS_CONTRIBUTOR_ID,
                  "outstanding_achievement"
                ),
              ],
            }),
            upstream(ATTENDANCE_CONTRIBUTOR_ID, { readiness: "ready" }),
            upstream(ENROLLMENT_CONTRIBUTOR_ID, { readiness: "ready" }),
          ],
        })
      );

      expect(result.opportunities).toContain("celebration_outreach");
      expect(
        result.recommendations.some((r) => r.kind === "celebrate_with_family")
      ).toBe(true);
    });
  });

  describe("Support Planning synthesis", () => {
    it("publishes unified intensive support plan", () => {
      const result = runSupportPlanningIntelligence(
        buildSupportPlanningInputs({
          subjectId: "stu-support-1",
          upstream: [
            upstream(INTERVENTION_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(
                  INTERVENTION_CONTRIBUTOR_ID,
                  "multi_domain_intervention"
                ),
                evidenceCode(INTERVENTION_CONTRIBUTOR_ID, "mtss_escalation"),
              ],
              recommendations: [
                {
                  id: "rec.multi",
                  kind: "propose_multi_domain_intervention",
                  title: "Multi",
                  explanation: "Multi",
                  confidence: 0.9,
                  priority: 1,
                  evidenceIds: [],
                  suggestedActions: [],
                  constitutionalTrace: {
                    domainPackageId: "education",
                    contributorId: INTERVENTION_CONTRIBUTOR_ID,
                    laws: [],
                    rationale: "Multi",
                  },
                },
              ],
            }),
            upstream(FAMILY_ENGAGEMENT_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(
                  FAMILY_ENGAGEMENT_CONTRIBUTOR_ID,
                  "risk_outreach"
                ),
              ],
            }),
            upstream(STUDENT_SUCCESS_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(
                  STUDENT_SUCCESS_CONTRIBUTOR_ID,
                  "high_academic_risk"
                ),
              ],
            }),
          ],
        })
      );

      expect(result.stance).toBe("intensive_support");
      expect(
        result.recommendations.some((r) => r.kind === "publish_support_plan")
      ).toBe(true);
      expect(
        result.evidence.some((e) => e.attributes?.code === "unified_support_plan")
      ).toBe(true);
      expect(result.expectedOutcomes.length).toBeGreaterThan(0);
      expect(result.suggestedActions.length).toBeGreaterThan(0);
    });

    it("maintains watch when upstream is stable", () => {
      const result = runSupportPlanningIntelligence(
        buildSupportPlanningInputs({
          subjectId: "stu-support-1",
          upstream: [
            upstream(INTERVENTION_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(INTERVENTION_CONTRIBUTOR_ID, "monitor_only"),
              ],
            }),
            upstream(FAMILY_ENGAGEMENT_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(
                  FAMILY_ENGAGEMENT_CONTRIBUTOR_ID,
                  "engagement_opportunity"
                ),
              ],
            }),
            upstream(STUDENT_SUCCESS_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(STUDENT_SUCCESS_CONTRIBUTOR_ID, "healthy_learner"),
              ],
            }),
          ],
        })
      );

      expect(result.stance).toBe("monitor_and_maintain");
      expect(
        result.recommendations.some((r) => r.kind === "maintain_support_watch")
      ).toBe(true);
    });
  });

  describe("planner + orchestration + registration", () => {
    it("selects support pack for Support Review / MTSS / Family Meeting intents", () => {
      const planner = createEducationPlanner();

      for (const [id, label] of [
        ["education.support.review", "Support Review"],
        ["education.intervention.planning", "Intervention Planning"],
        ["education.family.meeting", "Family Meeting"],
        ["education.mtss.review", "MTSS Review"],
        ["education.student_services.review", "Student Services"],
      ] as const) {
        const plan = planner.plan({ intent: intent(id, label) });
        expect(plan.plan.orderedContributorIds).toEqual(
          expect.arrayContaining([
            INTERVENTION_CONTRIBUTOR_ID,
            FAMILY_ENGAGEMENT_CONTRIBUTOR_ID,
            SUPPORT_PLANNING_CONTRIBUTOR_ID,
            STUDENT_SUCCESS_CONTRIBUTOR_ID,
          ])
        );
        expect(
          plan.plan.orderedContributorIds.indexOf(STUDENT_SUCCESS_CONTRIBUTOR_ID)
        ).toBeLessThan(
          plan.plan.orderedContributorIds.indexOf(SUPPORT_PLANNING_CONTRIBUTOR_ID)
        );
      }

      const enrollOnly = planner.plan({ intent: intent("education.enroll") });
      expect(enrollOnly.plan.orderedContributorIds).not.toContain(
        SUPPORT_PLANNING_CONTRIBUTOR_ID
      );
    });

    it("registers all three support contributors on the domain package", () => {
      expect(createInterventionContributor().id).toBe(INTERVENTION_CONTRIBUTOR_ID);
      expect(createFamilyEngagementContributor().id).toBe(
        FAMILY_ENGAGEMENT_CONTRIBUTOR_ID
      );
      expect(createSupportPlanningContributor().id).toBe(
        SUPPORT_PLANNING_CONTRIBUTOR_ID
      );

      const domain = buildEducationDomain();
      for (const id of [
        EDUCATION_CONTRIBUTOR_IDS.interventionCognition,
        EDUCATION_CONTRIBUTOR_IDS.familyEngagementCognition,
        EDUCATION_CONTRIBUTOR_IDS.supportPlanningCognition,
      ]) {
        expect(domain.manifest.contributors.some((c) => c.id === id)).toBe(
          true
        );
      }
    });

    it("orchestrates support review through synthesis", () => {
      const history: AttendanceSessionRecord[] = Array.from(
        { length: 10 },
        (_, i) => ({
          sessionId: `p-${i}`,
          date: `2026-01-${String(i + 1).padStart(2, "0")}`,
          weekday: "tuesday",
          status: "present" as const,
        })
      );
      const enrollment: EnrollmentObservation = {
        enrollmentRequestId: "enr-support-1",
        organizationId: "org-edu",
        student: { studentId: "stu-support-1", displayName: "Support Student" },
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
        ],
        academicHistory: { transcriptOnFile: true },
        assessment: { status: "complete" },
        interview: { status: "complete" },
        signatures: [{ signatureId: "sig-1", role: "parent", complete: true }],
      };
      const attendance: AttendanceObservation = {
        organizationId: "org-edu",
        student: { studentId: "stu-support-1", displayName: "Support Student" },
        enrollment: { enrollmentId: "enr-support-1", programId: "prog-1" },
        attendanceHistory: history,
        requirements: {
          minimumAttendanceRate: 0.9,
          chronicAbsenceThreshold: 8,
          excessiveTardyThreshold: 5,
          consecutiveAbsenceThreshold: 5,
        },
      };
      const progress: AcademicProgressObservation = {
        organizationId: "org-edu",
        student: { studentId: "stu-support-1", displayName: "Support Student" },
        program: { programId: "prog-1", typeCode: "academic" },
        goals: [
          { goalId: "goal-1", currentMastery: 0.7, targetMastery: 0.7 },
        ],
        courses: [
          {
            courseId: "course-1",
            progressRatio: 0.5,
            expectedProgressRatio: 0.5,
          },
        ],
        assessments: [
          { assessmentId: "a1", status: "complete", typeCode: "formative" },
        ],
        earnedCredits: 24,
      };

      const out = executeEducationIntelligence({
        intent: intent("education.support", "Support Review"),
        observations: { enrollment, attendance, progress },
        now: "2026-01-01T00:00:00.000Z",
      });

      expect(out.ok).toBe(true);
      expect(out.contributorResults.map((r) => r.contributorId)).toEqual(
        expect.arrayContaining([
          INTERVENTION_CONTRIBUTOR_ID,
          FAMILY_ENGAGEMENT_CONTRIBUTOR_ID,
          SUPPORT_PLANNING_CONTRIBUTOR_ID,
        ])
      );
    });
  });
});
