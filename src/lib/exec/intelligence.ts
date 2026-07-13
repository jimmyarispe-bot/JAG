/**
 * Request-scoped access to the wired intelligence DI container.
 * ECC pages must consume stacks through this helper — never bypass abstractions.
 */

import { cache } from "react";
import { createIntelligenceService } from "@/lib/platform/intelligence/create-service";

export const getExecIntelligence = cache(() => createIntelligenceService());

export const DEFAULT_EXEC_SCOPE = {
  organizationId: "exec-demo-org",
  schoolId: null as string | null,
} as const;
