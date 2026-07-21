/**
 * GA package matrix — verifies RC-4…RC-9 packages exist and export surface is importable.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  GaPackageMatrixRow,
  GaProductRcPackage,
} from "@/lib/platform/production/types";

type MatrixDef = {
  id: GaProductRcPackage;
  packagePath: string;
  testPath: string;
  exportSmoke: string[];
  /** Dynamic import path for smoke (relative to @ alias). */
  importModule: string;
  expectedExport: string;
};

const GA_PACKAGE_DEFS: MatrixDef[] = [
  {
    id: "rc4_knowledge_graph",
    packagePath: "src/lib/platform/knowledge-graph",
    testPath: "tests/unit/platform/knowledge-graph/unified-graph.test.ts",
    exportSmoke: ["softReadOrganizationalGraph", "rebuildUnifiedKnowledgeGraph"],
    importModule: "@/lib/platform/knowledge-graph",
    expectedExport: "softReadOrganizationalGraph",
  },
  {
    id: "rc5_executive_copilot",
    packagePath: "src/lib/platform/executive-copilot",
    testPath: "tests/unit/platform/executive-copilot/executive-copilot-v2.test.ts",
    exportSmoke: ["answerExecutiveCopilotV2", "COPILOT_V2_CAPABILITIES"],
    importModule: "@/lib/platform/executive-copilot",
    expectedExport: "answerExecutiveCopilotV2",
  },
  {
    id: "rc6_executive_command_center",
    packagePath: "src/lib/platform/executive-command-center",
    testPath:
      "tests/unit/platform/executive-command-center/executive-command-center-v2.test.ts",
    exportSmoke: ["buildMissionControl", "MISSION_CONTROL_PANELS"],
    importModule: "@/lib/platform/executive-command-center",
    expectedExport: "buildMissionControl",
  },
  {
    id: "rc7_workflows",
    packagePath: "src/lib/platform/workflows",
    testPath: "tests/unit/platform/workflows/workflow-studio.test.ts",
    exportSmoke: ["createWorkflowStudioEngine", "EXAMPLE_WORKFLOW_KEYS"],
    importModule: "@/lib/platform/workflows",
    expectedExport: "createWorkflowStudioEngine",
  },
  {
    id: "rc8_marketplace",
    packagePath: "src/lib/platform/marketplace",
    testPath: "tests/unit/platform/marketplace/marketplace.test.ts",
    exportSmoke: ["createMarketplaceEngine", "MARKETPLACE_CATEGORIES"],
    importModule: "@/lib/platform/marketplace",
    expectedExport: "createMarketplaceEngine",
  },
  {
    id: "rc9_enterprise",
    packagePath: "src/lib/platform/enterprise",
    testPath: "tests/unit/platform/enterprise/enterprise-admin.test.ts",
    exportSmoke: ["createEnterpriseAdminEngine", "ENTERPRISE_CENTERS"],
    importModule: "@/lib/platform/enterprise",
    expectedExport: "createEnterpriseAdminEngine",
  },
];

export function evaluatePackageMatrix(root = process.cwd()): GaPackageMatrixRow[] {
  return GA_PACKAGE_DEFS.map((def) => {
    const present = existsSync(join(root, def.packagePath, "index.ts"));
    const testPresent = existsSync(join(root, def.testPath));
    return {
      id: def.id,
      packagePath: def.packagePath,
      testPath: def.testPath,
      exportSmoke: def.exportSmoke,
      present,
      testPresent,
      importOk: false,
      detail: !present
        ? "Package index missing"
        : !testPresent
          ? "Unit test missing"
          : "Pending import smoke",
    };
  });
}

/** Async import smoke — run in Node/Vitest with path aliases. */
export async function smokeImportPackages(): Promise<GaPackageMatrixRow[]> {
  const base = evaluatePackageMatrix();
  const rows: GaPackageMatrixRow[] = [];

  for (let i = 0; i < GA_PACKAGE_DEFS.length; i++) {
    const def = GA_PACKAGE_DEFS[i]!;
    const row = { ...base[i]! };
    if (!row.present) {
      rows.push(row);
      continue;
    }
    try {
      const mod = (await import(def.importModule)) as Record<string, unknown>;
      const ok = typeof mod[def.expectedExport] !== "undefined";
      row.importOk = ok;
      row.detail = ok
        ? `Import smoke ok (${def.expectedExport})`
        : `Missing export ${def.expectedExport}`;
    } catch (err) {
      row.importOk = false;
      row.detail = `Import failed: ${err instanceof Error ? err.message : String(err)}`;
    }
    rows.push(row);
  }

  return rows;
}
