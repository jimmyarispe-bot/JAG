/**
 * Intelligence Platform Infrastructure — OIOS Core module adapter (Sprint 031).
 *
 * Permanent organizational operating-system layer. Depends on organization-dna
 * and writes context key `oios` for future domains and agents.
 */

import {
  createOiosOperatingSystem,
  OIOS_VERSION,
  type CreateOiosOptions,
  type OiosStack,
} from "@/lib/platform/oios";
import type {
  CompanyBuilderSeed,
  OrganizationDnaResult,
} from "@/lib/platform/intelligence/organization-dna/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createOiosCoreModule(
  options: CreateOiosOptions = {},
  stack?: OiosStack
): IntelligenceModule {
  const oios =
    stack ??
    createOiosOperatingSystem({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
    });

  return {
    id: "oios-core",
    name: "JAG Organizational Intelligence Operating System",
    version: OIOS_VERSION,
    dependencies: ["organization-dna"],
    capabilities: [
      {
        key: "oios.operating_system",
        description: "Compose the organizational operating system snapshot",
      },
      {
        key: "oios.digital_twin",
        description: "Maintain the organizational digital twin",
      },
      {
        key: "oios.domain_registry",
        description: "Register and order intelligence domains",
      },
      {
        key: "oios.improvement_loop",
        description: "Run continuous improvement cycles",
      },
      {
        key: "oios.health_maturity",
        description: "Score organizational health and maturity",
      },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const dnaResult = context.get<OrganizationDnaResult>("organizationDna");
        const input = context.input as
          | {
              question?: string;
              seed?: CompanyBuilderSeed;
              dnaSeed?: CompanyBuilderSeed;
            }
          | undefined;

        oios.operatingSystem.bootstrap({
          organizationId: context.scope.organizationId ?? null,
          schoolId: context.scope.schoolId ?? null,
        });

        const result = oios.service.build({
          requestId: context.runId,
          dnaResult: dnaResult ?? undefined,
          dnaSeed: input?.dnaSeed ?? input?.seed,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
          metadata: {
            question:
              typeof input?.question === "string"
                ? input.question
                : "What is the current organizational operating system state?",
          },
        });

        context.set("oios", result);

        return createModuleResult({
          moduleId: "oios-core",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "oios-core",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
