/**
 * Final-target characteristics from the RC-10 charter.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { GaCharacteristicsCheck } from "@/lib/platform/production/types";

export function evaluateGaCharacteristics(root = process.cwd()): GaCharacteristicsCheck[] {
  const has = (p: string) => existsSync(join(root, p));

  return [
    {
      id: "integration_platform",
      statement:
        "A mature integration platform supporting multiple enterprise systems.",
      satisfied:
        has("src/lib/platform/integrations/connectors/crm") &&
        has("src/lib/platform/integrations/connectors/finance") &&
        has("src/lib/platform/integrations/connectors/hr") &&
        has("src/lib/platform/integrations/connectors/education") &&
        has("src/lib/platform/integrations/connectors/collaboration"),
      evidence: [
        "src/lib/platform/integrations/connectors/{crm,finance,hr,education,collaboration,enterprise}",
      ],
    },
    {
      id: "unified_knowledge_graph",
      statement:
        "A unified knowledge graph that serves as the single source of organizational truth.",
      satisfied: has("src/lib/platform/knowledge-graph/index.ts"),
      evidence: ["src/lib/platform/knowledge-graph"],
    },
    {
      id: "executive_copilot",
      statement:
        "An Executive Copilot capable of reasoning across finance, operations, HR, education, CRM, communications, and initiatives.",
      satisfied: has("src/lib/platform/executive-copilot/index.ts"),
      evidence: ["src/lib/platform/executive-copilot"],
    },
    {
      id: "executive_command_center",
      statement:
        "An Executive Command Center that acts as the operational hub for leaders.",
      satisfied: has("src/lib/platform/executive-command-center/index.ts"),
      evidence: [
        "src/lib/platform/executive-command-center",
        "src/lib/platform/intelligence/executive-command-center",
      ],
    },
    {
      id: "workflows_marketplace",
      statement:
        "A workflow engine and marketplace that allow organizations to extend JAG without modifying the core platform.",
      satisfied:
        has("src/lib/platform/workflows/index.ts") &&
        has("src/lib/platform/marketplace/index.ts"),
      evidence: ["src/lib/platform/workflows", "src/lib/platform/marketplace"],
    },
    {
      id: "enterprise_security_admin",
      statement:
        "Enterprise-grade security, administration, and deployment readiness suitable for production customer onboarding.",
      satisfied:
        has("src/lib/platform/enterprise/index.ts") &&
        has(".github/workflows/ci.yml") &&
        has("src/lib/observability"),
      evidence: [
        "src/lib/platform/enterprise",
        "src/lib/observability",
        ".github/workflows/ci.yml",
        "docs/operations/rc10",
      ],
    },
  ];
}
