# RC-10 GA Package Matrix

Automated by `evaluatePackageMatrix` / `smokeImportPackages` in `@/lib/platform/production`.

| ID | Package path | Unit test |
|----|--------------|-----------|
| rc4_knowledge_graph | `src/lib/platform/knowledge-graph` | `tests/unit/platform/knowledge-graph/unified-graph.test.ts` |
| rc5_executive_copilot | `src/lib/platform/executive-copilot` | `tests/unit/platform/executive-copilot/executive-copilot-v2.test.ts` |
| rc6_executive_command_center | `src/lib/platform/executive-command-center` | `tests/unit/platform/executive-command-center/executive-command-center-v2.test.ts` |
| rc7_workflows | `src/lib/platform/workflows` | `tests/unit/platform/workflows/workflow-studio.test.ts` |
| rc8_marketplace | `src/lib/platform/marketplace` | `tests/unit/platform/marketplace/marketplace.test.ts` |
| rc9_enterprise | `src/lib/platform/enterprise` | `tests/unit/platform/enterprise/enterprise-admin.test.ts` |

Each row must be **present**, have a **unit test**, and **import-smoke** its public export.
