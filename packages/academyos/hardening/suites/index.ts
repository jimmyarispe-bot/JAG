import type { HardeningSuiteDefinition } from "../harness";
import { accessibilitySuite } from "./accessibility";
import { auditObservabilitySuite } from "./audit";
import { backupRecoverySuite } from "./backup";
import { deploymentSuite } from "./deployment";
import { multiTenantIsolationSuite } from "./isolation";
import { performanceSuite } from "./performance";
import { resilienceSuite } from "./resilience";
import { securitySuite } from "./security";

export const ALL_HARDENING_SUITES: readonly HardeningSuiteDefinition[] =
  Object.freeze([
    securitySuite,
    resilienceSuite,
    performanceSuite,
    accessibilitySuite,
    auditObservabilitySuite,
    deploymentSuite,
    backupRecoverySuite,
    multiTenantIsolationSuite,
  ]);
