import type { CopilotV2SoftContext } from "@/lib/platform/executive-copilot/context/soft-reads";
import type { CopilotV2Evidence } from "@/lib/platform/executive-copilot/types";

/**
 * Digital Twin reasoning — soft-reads finance twin lights + org graph structure.
 * Does not hard-depend on the downstream digital-twin intelligence module.
 */
export function reasonDigitalTwin(ctx: CopilotV2SoftContext): {
  answer: string;
  scenarios: string[];
  evidence: CopilotV2Evidence[];
  confidence: number;
} {
  const scenarios: string[] = [];
  const evidence: CopilotV2Evidence[] = [];

  if (ctx.finance) {
    const twin = ctx.finance.digitalTwin;
    const lights = ctx.finance.softLights.digitalTwin;
    scenarios.push(
      `Baseline twin: working capital $${twin.workingCapital.toLocaleString()}, net cash flow $${twin.netCashFlow.toLocaleString()}, twin score ${lights.twinScore.value}.`
    );
    const runway = ctx.finance.forecasting.runwayMonths;
    if (runway != null) {
      scenarios.push(
        `If burn holds: ~${runway} months runway; a 20% burn cut extends runway to ~${Math.round(runway / 0.8 * 10) / 10} months.`
      );
      scenarios.push(
        `If revenue dips 15%: pressure on net cash flow (current $${twin.netCashFlow.toLocaleString()}).`
      );
    }
    evidence.push({
      id: "twin-fin",
      statement: `Finance digitalTwin soft-light health ${lights.healthScore.value}.`,
      domain: "finance",
      supporting: true,
    });
  }

  if (ctx.crm) {
    scenarios.push(
      `Revenue twin proxy: pipeline $${Math.round(ctx.crm.crm.pipelineValue).toLocaleString()} at health ${ctx.crm.crm.pipelineHealth}/100.`
    );
  }

  if (ctx.knowledgeGraph) {
    scenarios.push(
      `Structural twin: ${ctx.knowledgeGraph.counts.nodes} nodes / ${ctx.knowledgeGraph.counts.edges} edges — use for dependency stress tests.`
    );
    evidence.push({
      id: "twin-kg",
      statement: "Organizational graph available as structural twin substrate.",
      domain: "knowledge-graph",
      supporting: true,
    });
  }

  if (!scenarios.length) {
    scenarios.push(
      "Digital twin soft-reads unavailable — sync finance connectors (cash/burn) and rebuild the knowledge graph."
    );
  }

  return {
    answer: scenarios[0],
    scenarios,
    evidence,
    confidence: ctx.finance ? 0.72 : ctx.knowledgeGraph ? 0.45 : 0.2,
  };
}
