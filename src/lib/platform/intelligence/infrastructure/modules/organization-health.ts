/**
 * Intelligence Platform Infrastructure — Organization Health module adapter (Sprint 027).
 *
 * Wraps existing organization-health evaluators — does not regenerate them.
 */

import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";
import { evaluateAcademicHealth } from "@/lib/platform/intelligence/organization-health/academic";
import { evaluateComplianceHealth } from "@/lib/platform/intelligence/organization-health/compliance";
import { evaluateEnrollmentHealth } from "@/lib/platform/intelligence/organization-health/enrollment";
import { evaluateFinancialHealth } from "@/lib/platform/intelligence/organization-health/financial";
import { evaluateOperationsHealth } from "@/lib/platform/intelligence/organization-health/operations";
import { evaluateWorkforceHealth } from "@/lib/platform/intelligence/organization-health/workforce";

export const ORGANIZATION_HEALTH_MODULE_VERSION = "0.1.0";

export function createOrganizationHealthModule(): IntelligenceModule {
  return {
    id: "organization-health",
    name: "Organization Health",
    version: ORGANIZATION_HEALTH_MODULE_VERSION,
    dependencies: [],
    capabilities: [
      { key: "health.enrollment", description: "Enrollment health evaluation" },
      { key: "health.financial", description: "Financial health evaluation" },
      { key: "health.workforce", description: "Workforce health evaluation" },
      { key: "health.operations", description: "Operations health evaluation" },
      { key: "health.compliance", description: "Compliance health evaluation" },
      { key: "health.academic", description: "Academic health evaluation" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = context.startedAt;
      try {
        const [
          enrollment,
          financial,
          workforce,
          operations,
          compliance,
          academic,
        ] = await Promise.all([
          evaluateEnrollmentHealth(),
          evaluateFinancialHealth(),
          evaluateWorkforceHealth(),
          evaluateOperationsHealth(),
          evaluateComplianceHealth(),
          evaluateAcademicHealth(),
        ]);

        // A.1 — exclude academic stub from overall so unavailable does not force critical/zero.
        const measured = [
          enrollment,
          financial,
          workforce,
          operations,
          compliance,
          academic,
        ].filter((item) => !("stub" in item && item.stub));
        const scores = measured.map((item) => item.score);
        const overallScore = scores.length
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;

        const data = {
          overallScore,
          enrollment,
          financial,
          workforce,
          operations,
          compliance,
          academic,
        };
        context.set("organizationHealth", data);

        return createModuleResult({
          moduleId: "organization-health",
          context,
          startedAt,
          ok: true,
          data,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "organization-health",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
