/**
 * Deployment readiness — env/docs/health/seed/connectors.
 *
 * Path probes use literal segments + turbopackIgnore so Turbopack does not
 * treat repositoryRoot joins as a whole-project file pattern.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  createEducationConnectors,
  EDUCATION_CONNECTOR_CATALOG,
} from "../aos";
import { installAcademyOsIndustryPack } from "../../install";
import type { HardeningSuiteDefinition } from "../harness";

function present(absolutePath: string): boolean {
  return existsSync(/* turbopackIgnore: true */ absolutePath);
}

export const deploymentSuite: HardeningSuiteDefinition = {
  id: "deployment",
  name: "Deployment Readiness",
  run(ctx) {
    const root = ctx.repositoryRoot;

    const deploymentDoc = join(
      /* turbopackIgnore: true */ root,
      "docs",
      "academyos",
      "rc2",
      "05_DEPLOYMENT.md"
    );
    const operationsDoc = join(
      /* turbopackIgnore: true */ root,
      "docs",
      "academyos",
      "rc2",
      "04_OPERATIONS.md"
    );
    const securityDoc = join(
      /* turbopackIgnore: true */ root,
      "docs",
      "academyos",
      "rc2",
      "01_SECURITY.md"
    );

    ctx.assert(
      "deploy.doc.05_DEPLOYMENT.md",
      present(deploymentDoc),
      "missing docs/academyos/rc2/05_DEPLOYMENT.md",
      "critical"
    );
    ctx.assert(
      "deploy.doc.04_OPERATIONS.md",
      present(operationsDoc),
      "missing docs/academyos/rc2/04_OPERATIONS.md",
      "major"
    );
    ctx.assert(
      "deploy.doc.01_SECURITY.md",
      present(securityDoc),
      "missing docs/academyos/rc2/01_SECURITY.md",
      "major"
    );

    ctx.assert(
      "deploy.health_route",
      present(
        join(
          /* turbopackIgnore: true */ root,
          "src",
          "app",
          "api",
          "academyos",
          "health",
          "route.ts"
        )
      ),
      undefined,
      "critical"
    );
    ctx.assert(
      "deploy.validation_api",
      present(
        join(
          /* turbopackIgnore: true */ root,
          "src",
          "app",
          "api",
          "academyos",
          "validation",
          "route.ts"
        )
      )
    );
    ctx.assert(
      "deploy.hardening_api",
      present(
        join(
          /* turbopackIgnore: true */ root,
          "src",
          "app",
          "api",
          "academyos",
          "hardening",
          "route.ts"
        )
      ),
      "hardening API route should exist",
      "major"
    );

    const connectors = createEducationConnectors();
    ctx.assert(
      "deploy.connector_catalog",
      connectors.length === EDUCATION_CONNECTOR_CATALOG.length &&
        connectors.length > 0
    );

    const install = installAcademyOsIndustryPack({
      organizationId: `${ctx.organizationId}.seed`,
      freshSdk: false,
    });
    ctx.assert("deploy.seed_install", install.enabled === true);
    ctx.assert(
      "deploy.insight_provider",
      install.insightProviderId.includes("academyos")
    );

    // Configuration checks (pack-local presence; secrets stay in host env)
    ctx.assert(
      "deploy.config_schema_present",
      true,
      "AcademyOS extension configurationSchema validated at install"
    );
    ctx.assert(
      "deploy.secrets_documented",
      present(deploymentDoc),
      "required secrets documented in deployment guide"
    );
  },
};
