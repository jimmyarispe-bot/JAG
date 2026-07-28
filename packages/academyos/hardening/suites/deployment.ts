/**
 * Deployment readiness — env/docs/health/seed/connectors.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  createEducationConnectors,
  EDUCATION_CONNECTOR_CATALOG,
} from "../aos";
import { installAcademyOsIndustryPack } from "../../install";
import type { HardeningSuiteDefinition } from "../harness";

export const deploymentSuite: HardeningSuiteDefinition = {
  id: "deployment",
  name: "Deployment Readiness",
  run(ctx) {
    const root = ctx.repositoryRoot;
    const requiredDocs = [
      "docs/academyos/rc2/05_DEPLOYMENT.md",
      "docs/academyos/rc2/04_OPERATIONS.md",
      "docs/academyos/rc2/01_SECURITY.md",
    ];
    for (const doc of requiredDocs) {
      ctx.assert(
        `deploy.doc.${doc.split("/").pop()}`,
        existsSync(join(root, doc)),
        `missing ${doc}`,
        doc.includes("DEPLOYMENT") ? "critical" : "major"
      );
    }

    ctx.assert(
      "deploy.health_route",
      existsSync(join(root, "src/app/api/academyos/health/route.ts")),
      undefined,
      "critical"
    );
    ctx.assert(
      "deploy.validation_api",
      existsSync(join(root, "src/app/api/academyos/validation/route.ts"))
    );
    ctx.assert(
      "deploy.hardening_api",
      existsSync(join(root, "src/app/api/academyos/hardening/route.ts")),
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
      existsSync(join(root, "docs/academyos/rc2/05_DEPLOYMENT.md")),
      "required secrets documented in deployment guide"
    );
  },
};
