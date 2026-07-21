import type { CopilotV2SoftContext } from "@/lib/platform/executive-copilot/context/soft-reads";
import type { CopilotV2Evidence } from "@/lib/platform/executive-copilot/types";

export type DecisionSupportResult = {
  makers: Array<{ name: string; roleHint: string; reason: string }>;
  recommendations: string[];
  evidence: CopilotV2Evidence[];
  answer: string;
};

/** Example: Who are the key decision makers? */
export function identifyDecisionMakers(ctx: CopilotV2SoftContext): DecisionSupportResult {
  const makers: DecisionSupportResult["makers"] = [];
  const evidence: CopilotV2Evidence[] = [];

  for (const node of ctx.people.slice(0, 25)) {
    const label = node.label;
    const props = node.properties ?? {};
    const title = String(props.title ?? props.role ?? props.jobTitle ?? "");
    const isLeader =
      /ceo|cfo|coo|cto|vp|director|head|chief|principal|owner/i.test(title) ||
      /ceo|cfo|coo|cto|vp|director|head|chief/i.test(label);
    if (isLeader || makers.length < 5) {
      makers.push({
        name: label,
        roleHint: title || node.kind,
        reason: isLeader
          ? "Title/role matches executive decision authority"
          : "High-visibility person entity in org graph",
      });
    }
    if (makers.length >= 8) break;
  }

  const seen = new Set<string>();
  const unique = makers.filter((m) => {
    const k = m.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (ctx.crm?.relationship) {
    evidence.push({
      id: "dm-crm",
      statement: `CRM relationship graph: ${ctx.crm.relationship.nodes} nodes, density ${ctx.crm.relationship.density}.`,
      domain: "crm",
      supporting: true,
    });
  }
  if (ctx.knowledgeGraph) {
    evidence.push({
      id: "dm-kg",
      statement: `People soft-search returned ${ctx.people.length} person-like entities.`,
      domain: "knowledge-graph",
      supporting: true,
    });
  }

  const recommendations = [
    "Confirm RACI owners on top initiatives before board package lock.",
    "Route cash and pipeline decisions through CFO + revenue lead jointly.",
    unique.length
      ? `Engage ${unique
          .slice(0, 3)
          .map((m) => m.name)
          .join(", ")} for cross-domain tradeoffs.`
      : "Populate HR/CRM person records to surface decision makers.",
  ];

  const answer =
    unique.length === 0
      ? "No person entities found in the knowledge graph soft-read. Sync HR/CRM and rebuild the graph."
      : `Key decision makers (soft-read): ${unique
          .slice(0, 5)
          .map((m) => `${m.name}${m.roleHint ? ` (${m.roleHint})` : ""}`)
          .join("; ")}.`;

  return {
    makers: unique.slice(0, 8),
    recommendations,
    evidence,
    answer,
  };
}

export function buildDecisionSupport(
  ctx: CopilotV2SoftContext,
  question: string
): DecisionSupportResult {
  if (/decision maker|key decision|who (are|is)/i.test(question)) {
    return identifyDecisionMakers(ctx);
  }
  const dm = identifyDecisionMakers(ctx);
  const recommendations = [...dm.recommendations];
  if (ctx.finance) {
    recommendations.unshift("Frame decisions with runway and burn from finance soft-read.");
  }
  if (ctx.crm && ctx.crm.crm.pipelineHealth < 55) {
    recommendations.unshift("Defer expansion bets until pipeline health recovers above 55.");
  }
  return {
    ...dm,
    recommendations,
    answer: `${dm.answer} Decision framing: ${recommendations[0]}`,
  };
}
