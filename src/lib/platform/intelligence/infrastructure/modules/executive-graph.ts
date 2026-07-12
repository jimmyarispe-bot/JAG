/**
 * Intelligence Platform Infrastructure — Executive Graph module adapter (Sprint 027).
 *
 * Wraps existing createExecutiveGraphAnalyzer — does not regenerate Sprint 025.
 */

import {
  createExecutiveGraphAnalyzer,
  EXECUTIVE_GRAPH_ANALYZER_VERSION,
  type CreateExecutiveGraphAnalyzerOptions,
  type ExecutiveGraphAnalyzerStack,
  type GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createExecutiveGraphModule(
  options: CreateExecutiveGraphAnalyzerOptions = {},
  stack?: ExecutiveGraphAnalyzerStack
): IntelligenceModule {
  const analyzer = stack ?? createExecutiveGraphAnalyzer(options);

  return {
    id: "executive-graph",
    name: "Executive Graph Analyzer",
    version: EXECUTIVE_GRAPH_ANALYZER_VERSION,
    dependencies: ["organization-health", "financial", "founder", "executive"],
    capabilities: [
      { key: "graph.build", description: "Build organizational reasoning graph" },
      { key: "graph.analyze", description: "Analyze graph root causes and cascades" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const orgHealth = context.get<{
          overallScore?: number;
          enrollment?: { score?: number };
          financial?: { score?: number };
          workforce?: { score?: number };
          operations?: { score?: number };
          compliance?: { score?: number };
          academic?: { score?: number };
        }>("organizationHealth");
        const founder = context.get<{
          brief?: {
            organizationHealth?: { score?: number; status?: string };
            priorities?: Array<{
              id: string;
              title: string;
              severity?: string;
              confidence?: number;
            }>;
            risks?: Array<{
              id: string;
              title: string;
              severity?: string;
              probability?: number;
              impact?: number;
            }>;
            opportunities?: Array<{
              id: string;
              title: string;
              estimatedValue?: number;
              confidence?: number;
            }>;
          };
        }>("founder");

        const inputFromContext =
          typeof context.input === "object" &&
          context.input !== null &&
          "graphInput" in context.input
            ? ((context.input as { graphInput?: GraphBuildInput }).graphInput ?? {})
            : {};

        const graphInput: GraphBuildInput = {
          scope: {
            organizationId: context.scope.organizationId ?? undefined,
            schoolId: context.scope.schoolId ?? undefined,
          },
          organizationHealth: {
            overallScore: orgHealth?.overallScore ?? 0,
            enrollmentScore: orgHealth?.enrollment?.score ?? 0,
            financialScore: orgHealth?.financial?.score ?? 0,
            workforceScore: orgHealth?.workforce?.score ?? 0,
            operationsScore: orgHealth?.operations?.score ?? 0,
            complianceScore: orgHealth?.compliance?.score ?? 0,
            academicScore: orgHealth?.academic?.score ?? 0,
          },
          founder: founder?.brief
            ? {
                healthScore: founder.brief.organizationHealth?.score ?? 0,
                healthStatus:
                  founder.brief.organizationHealth?.status ?? "healthy",
                priorities: (founder.brief.priorities ?? []).map((item) => ({
                  id: item.id,
                  title: item.title,
                  severity: item.severity ?? "info",
                  confidence: item.confidence ?? 0,
                })),
                risks: (founder.brief.risks ?? []).map((item) => ({
                  id: item.id,
                  title: item.title,
                  severity: item.severity ?? "medium",
                  probability: item.probability ?? 0,
                  impact: item.impact ?? 0,
                })),
                opportunities: (founder.brief.opportunities ?? []).map(
                  (item) => ({
                    id: item.id,
                    title: item.title,
                    estimatedValue: item.estimatedValue ?? 0,
                    confidence: item.confidence ?? 0,
                  })
                ),
              }
            : undefined,
          ...inputFromContext,
        };

        const { graph, analysis } = analyzer.buildAndAnalyze(graphInput);
        const data = { graph, analysis, graphInput };
        context.set("executiveGraph", data);

        return createModuleResult({
          moduleId: "executive-graph",
          context,
          startedAt,
          ok: true,
          data,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "executive-graph",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
