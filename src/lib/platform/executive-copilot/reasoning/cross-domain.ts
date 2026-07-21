import type { CopilotV2SoftContext } from "@/lib/platform/executive-copilot/context/soft-reads";
import type { CopilotV2Evidence } from "@/lib/platform/executive-copilot/types";

export type CrossDomainInsight = {
  summary: string;
  bridgingSignals: string[];
  evidence: CopilotV2Evidence[];
  confidence: number;
};

/** Join finance ↔ CRM ↔ HR ↔ collaboration ↔ KG into one executive picture. */
export function reasonCrossDomain(ctx: CopilotV2SoftContext): CrossDomainInsight {
  const bridgingSignals: string[] = [];
  const evidence: CopilotV2Evidence[] = [];
  let eid = 0;
  const push = (statement: string, domain: string, supporting = true) => {
    evidence.push({
      id: `xd-${++eid}`,
      statement,
      domain,
      supporting,
    });
  };

  if (ctx.finance) {
    const f = ctx.finance;
    bridgingSignals.push(
      `Finance runway ${f.forecasting.runwayMonths ?? "n/a"} mo · cash health ${f.softLights.financial.healthScore.value}`
    );
    push(
      `Cash/burn signals available from ${f.providersConnected.length} finance provider(s).`,
      "finance"
    );
  }
  if (ctx.crm) {
    bridgingSignals.push(
      `CRM pipeline $${Math.round(ctx.crm.crm.pipelineValue).toLocaleString()} · forecast $${Math.round(ctx.crm.crm.salesForecast).toLocaleString()}`
    );
    push(
      `Pipeline health ${ctx.crm.crm.pipelineHealth}/100 with ${ctx.crm.crm.openDeals} open deals.`,
      "crm"
    );
  }
  if (ctx.hr) {
    bridgingSignals.push(
      `HR headcount ${ctx.hr.signals.headcount} · capacity gap ${ctx.hr.signals.capacityGapFte} FTE`
    );
    push(`Turnover ${ctx.hr.signals.turnoverRate}% with ${ctx.hr.signals.openRoles} open roles.`, "hr");
  }
  if (ctx.collaboration) {
    const h = ctx.collaboration.communicationHealth;
    bridgingSignals.push(
      `Collaboration health ${h.score}/100 · ${h.siloCount} silos · ${h.bottleneckCount} bottlenecks`
    );
    push(h.explainability, "collaboration");
  }
  if (ctx.knowledgeGraph) {
    const g = ctx.knowledgeGraph;
    bridgingSignals.push(
      `Knowledge graph ${g.counts.nodes} nodes / ${g.counts.edges} edges across ${g.counts.domains} domains`
    );
    push(
      `Unified graph soft-read covers kinds: ${g.graph.kindsPresent.slice(0, 8).join(", ")}.`,
      "knowledge-graph"
    );
  }
  if (ctx.education) {
    bridgingSignals.push(...ctx.education.briefBullets.slice(0, 2));
    push("Education executive feed present.", "education");
  }
  if (ctx.enterprise) {
    bridgingSignals.push(...ctx.enterprise.briefBullets.slice(0, 2));
    push("Enterprise / gov soft-read present.", "enterprise");
  }

  const summary =
    bridgingSignals.length === 0
      ? "No cross-domain soft-reads available yet — sync connectors and rebuild the knowledge graph."
      : `Cross-domain picture across ${ctx.domainsPresent.length} domain(s): ${bridgingSignals.slice(0, 3).join(" · ")}.`;

  const confidence = Math.min(
    0.95,
    0.35 + ctx.domainsPresent.length * 0.1 + (ctx.knowledgeGraph ? 0.15 : 0)
  );

  return { summary, bridgingSignals, evidence, confidence };
}
