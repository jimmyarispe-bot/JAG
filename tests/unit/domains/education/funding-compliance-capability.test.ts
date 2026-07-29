import { describe, expect, it } from "vitest";
import {
  COMPLIANCE_CONTRIBUTOR_ID,
  EDUCATION_CAPABILITY_PACK_IDS,
  EDUCATION_CONTRIBUTOR_IDS,
  ENROLLMENT_CONTRIBUTOR_ID,
  FUNDING_COMPLIANCE_CAPABILITY_PACK,
  FUNDING_READINESS_CONTRIBUTOR_ID,
  SCHOLARSHIP_CONTRIBUTOR_ID,
  buildEducationDomain,
  buildFundingReadinessInputs,
  createComplianceContributor,
  createEducationPlanner,
  createFundingReadinessContributor,
  createScholarshipContributor,
  getCapabilityPack,
  listContributors,
  listPlannerIntents,
  runComplianceIntelligence,
  runFundingReadinessIntelligence,
  runScholarshipIntelligence,
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
      subjectId: "stu-fund-1",
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

describe("Funding & Compliance Capability Pack (D5.2)", () => {
  describe("scholarship eligibility", () => {
    it("identifies eligible scholarships", () => {
      const result = runScholarshipIntelligence({
        organizationId: "org-1",
        student: { studentId: "stu-fund-1", gpa: 3.2 },
        enrollmentId: "enr-1",
        program: { programId: "prog-1" },
        scholarships: [
          {
            scholarshipId: "sch-1",
            name: "Merit",
            status: "eligible",
            minimumGpa: 3.0,
          },
        ],
      });

      expect(result.eligibleCount).toBe(1);
      expect(
        result.recommendations.some(
          (r) => r.kind === "pursue_eligible_scholarship"
        )
      ).toBe(true);
    });
  });

  describe("scholarship renewal", () => {
    it("flags renewal risk", () => {
      const result = runScholarshipIntelligence({
        organizationId: "org-1",
        student: { studentId: "stu-fund-1", gpa: 2.0 },
        scholarships: [
          {
            scholarshipId: "sch-1",
            status: "renewal_due",
            minimumGpa: 2.5,
            missingDocuments: ["transcript"],
          },
        ],
      });

      expect(result.renewalRiskCount).toBe(1);
      expect(
        result.recommendations.some((r) => r.kind === "address_renewal_risk")
      ).toBe(true);
    });
  });

  describe("compliance satisfied", () => {
    it("reports satisfied compliance posture", () => {
      const result = runComplianceIntelligence({
        organizationId: "org-1",
        student: { studentId: "stu-fund-1" },
        obligations: [
          {
            obligationId: "ob-1",
            kind: "documentation",
            status: "satisfied",
          },
        ],
        attendanceCompliant: true,
        assessmentsComplete: true,
      });

      expect(result.violationCount).toBe(0);
      expect(
        result.recommendations.some(
          (r) => r.kind === "maintain_compliance_posture"
        )
      ).toBe(true);
    });
  });

  describe("compliance violation", () => {
    it("flags violations and outstanding obligations", () => {
      const result = runComplianceIntelligence({
        organizationId: "org-1",
        student: { studentId: "stu-fund-1" },
        obligations: [
          {
            obligationId: "ob-1",
            kind: "required_review",
            status: "overdue",
            riskLevel: "high",
          },
          {
            obligationId: "ob-2",
            kind: "documentation",
            status: "outstanding",
          },
        ],
        attendanceCompliant: false,
      });

      expect(result.violationCount).toBeGreaterThan(0);
      expect(
        result.recommendations.some(
          (r) => r.kind === "resolve_compliance_violation"
        )
      ).toBe(true);
    });
  });

  describe("funding readiness / cross-contributor synthesis", () => {
    it("blocks funding readiness when compliance is violated", () => {
      const result = runFundingReadinessIntelligence(
        buildFundingReadinessInputs({
          subjectId: "stu-fund-1",
          upstream: [
            upstream(SCHOLARSHIP_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(SCHOLARSHIP_CONTRIBUTOR_ID, "renewal_risk"),
              ],
              readiness: "conditional",
              warnings: ["renewal"],
            }),
            upstream(COMPLIANCE_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(COMPLIANCE_CONTRIBUTOR_ID, "compliance_violation"),
              ],
              readiness: "blocked",
              blockingIssues: ["violation"],
            }),
            upstream(ENROLLMENT_CONTRIBUTOR_ID, { readiness: "ready" }),
          ],
        })
      );

      expect(result.stance).toMatch(/blocked|at_risk/);
      expect(
        result.recommendations.some((r) => r.kind === "stabilize_funding_posture")
      ).toBe(true);
    });

    it("reports ready funding posture from healthy upstream", () => {
      const result = runFundingReadinessIntelligence(
        buildFundingReadinessInputs({
          subjectId: "stu-fund-1",
          upstream: [
            upstream(SCHOLARSHIP_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(SCHOLARSHIP_CONTRIBUTOR_ID, "scholarship_healthy"),
              ],
            }),
            upstream(COMPLIANCE_CONTRIBUTOR_ID, {
              evidence: [
                evidenceCode(COMPLIANCE_CONTRIBUTOR_ID, "compliance_satisfied"),
              ],
            }),
            upstream(ENROLLMENT_CONTRIBUTOR_ID, { readiness: "ready" }),
          ],
        })
      );

      expect(result.stance).toBe("ready");
      expect(
        result.recommendations.some(
          (r) => r.kind === "maintain_funding_readiness"
        )
      ).toBe(true);
    });
  });

  describe("planner selection + pack registration", () => {
    it("selects funding pack contributors for funding intents", () => {
      const planner = createEducationPlanner();
      for (const [id, label] of [
        ["education.scholarship.review", "Scholarship Review"],
        ["education.funding.review", "Funding Review"],
        ["education.compliance.review", "Compliance Review"],
        ["education.eligibility.annual", "Annual Eligibility"],
        ["education.funding.audit", "Funding Audit"],
        ["education.funding.executive_brief", "Executive Funding Brief"],
      ] as const) {
        const plan = planner.plan({ intent: intent(id, label) });
        expect(plan.plan.orderedContributorIds).toEqual(
          expect.arrayContaining([
            ENROLLMENT_CONTRIBUTOR_ID,
            SCHOLARSHIP_CONTRIBUTOR_ID,
            COMPLIANCE_CONTRIBUTOR_ID,
            FUNDING_READINESS_CONTRIBUTOR_ID,
          ])
        );
        expect(
          plan.plan.orderedContributorIds.indexOf(SCHOLARSHIP_CONTRIBUTOR_ID)
        ).toBeLessThan(
          plan.plan.orderedContributorIds.indexOf(FUNDING_READINESS_CONTRIBUTOR_ID)
        );
      }
    });

    it("registers pack metadata and domain contributors", () => {
      expect(FUNDING_COMPLIANCE_CAPABILITY_PACK.version).toBe("0.1.0");
      expect(FUNDING_COMPLIANCE_CAPABILITY_PACK.dependencies).toEqual([
        EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle,
        EDUCATION_CAPABILITY_PACK_IDS.academicOperations,
      ]);
      expect(
        getCapabilityPack(EDUCATION_CAPABILITY_PACK_IDS.fundingCompliance)?.name
      ).toBe("Funding & Compliance");
      expect(
        listContributors(EDUCATION_CAPABILITY_PACK_IDS.fundingCompliance)
      ).toEqual(
        expect.arrayContaining([
          EDUCATION_CONTRIBUTOR_IDS.scholarshipCognition,
          EDUCATION_CONTRIBUTOR_IDS.fundingReadinessCognition,
        ])
      );
      expect(
        listPlannerIntents(EDUCATION_CAPABILITY_PACK_IDS.fundingCompliance)
      ).toContain("education.funding.audit");
      expect(validateEducationCapabilityRegistry().ok).toBe(true);

      expect(createScholarshipContributor().id).toBe(SCHOLARSHIP_CONTRIBUTOR_ID);
      expect(createComplianceContributor().id).toBe(COMPLIANCE_CONTRIBUTOR_ID);
      expect(createFundingReadinessContributor().id).toBe(
        FUNDING_READINESS_CONTRIBUTOR_ID
      );

      const domain = buildEducationDomain();
      for (const id of [
        EDUCATION_CONTRIBUTOR_IDS.scholarshipCognition,
        EDUCATION_CONTRIBUTOR_IDS.complianceCognition,
        EDUCATION_CONTRIBUTOR_IDS.fundingReadinessCognition,
      ]) {
        expect(domain.manifest.contributors.some((c) => c.id === id)).toBe(
          true
        );
      }
    });
  });
});
