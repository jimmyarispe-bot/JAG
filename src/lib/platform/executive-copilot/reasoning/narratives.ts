import type { CopilotV2SoftContext } from "@/lib/platform/executive-copilot/context/soft-reads";
import { reasonCrossDomain } from "@/lib/platform/executive-copilot/reasoning/cross-domain";

/** Executive narrative — one coherent story across domains. */
export function buildExecutiveNarrative(
  ctx: CopilotV2SoftContext,
  focus?: string
): { narrative: string; headline: string } {
  const xd = reasonCrossDomain(ctx);
  const parts: string[] = [];

  if (focus) {
    parts.push(`Focus: ${focus}.`);
  }

  if (ctx.finance) {
    parts.push(
      `Liquidity story: cash $${ctx.finance.finance.cashPosition.toLocaleString()} with runway ${ctx.finance.forecasting.runwayMonths ?? "n/a"} months and twin score ${ctx.finance.softLights.digitalTwin.twinScore.value}.`
    );
  }
  if (ctx.crm) {
    parts.push(
      `Revenue story: pipeline health ${ctx.crm.crm.pipelineHealth}/100 and forecast $${Math.round(ctx.crm.crm.salesForecast).toLocaleString()}.`
    );
  }
  if (ctx.hr) {
    parts.push(
      `People story: ${ctx.hr.signals.headcount} headcount, ${ctx.hr.signals.openRoles} open roles, turnover ${ctx.hr.signals.turnoverRate}%.`
    );
  }
  if (ctx.collaboration) {
    parts.push(
      `Operating rhythm: collaboration health ${ctx.collaboration.communicationHealth.score}/100.`
    );
  }
  if (ctx.knowledgeGraph) {
    parts.push(
      `Organizational fabric: ${ctx.knowledgeGraph.counts.nodes} graph entities spanning ${ctx.knowledgeGraph.counts.domains} domains.`
    );
  }

  const headline =
    xd.bridgingSignals[0] ??
    "Executive narrative awaiting domain soft-reads.";

  const narrative =
    parts.length > 0
      ? parts.join(" ")
      : "Insufficient soft-reads to compose an executive narrative. Sync finance, CRM, HR, and rebuild the knowledge graph.";

  return { narrative, headline };
}
