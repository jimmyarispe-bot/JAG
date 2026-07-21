import type { CopilotV2SoftContext } from "@/lib/platform/executive-copilot/context/soft-reads";
import type { CopilotV2Evidence } from "@/lib/platform/executive-copilot/types";

export type OrgRisksResult = {
  risks: string[];
  evidence: CopilotV2Evidence[];
  answer: string;
};

/** Example: Show organizational risks this month. */
export function surfaceOrganizationalRisks(ctx: CopilotV2SoftContext): OrgRisksResult {
  const risks: string[] = [];
  const evidence: CopilotV2Evidence[] = [];
  const now = new Date();
  const monthPrefix = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  for (const r of ctx.risks.slice(0, 8)) {
    risks.push(`Graph: ${r.label}`);
    evidence.push({
      id: `risk-${r.id}`,
      statement: `Risk entity ${r.label}`,
      domain: r.domain ?? "knowledge-graph",
      supporting: true,
    });
  }

  if (ctx.finance) {
    if ((ctx.finance.forecasting.runwayMonths ?? 99) < 6) {
      risks.push(
        `Runway below 6 months (${ctx.finance.forecasting.runwayMonths} mo) — liquidity risk.`
      );
    }
    if (ctx.finance.finance.expenseAnomalyScore > 40) {
      risks.push(`Expense anomaly score ${ctx.finance.finance.expenseAnomalyScore}.`);
    }
    evidence.push({
      id: "risk-fin",
      statement: ctx.finance.briefBullets[0] ?? "Finance feed present",
      domain: "finance",
      supporting: true,
    });
  }

  if (ctx.crm && ctx.crm.crm.pipelineHealth < 55) {
    risks.push(`Pipeline health ${ctx.crm.crm.pipelineHealth}/100 — revenue execution risk.`);
  }
  if (ctx.crm && ctx.crm.crm.customerConcentration > 40) {
    risks.push(`Customer concentration ${ctx.crm.crm.customerConcentration}%.`);
  }

  if (ctx.hr) {
    if (ctx.hr.signals.turnoverRate >= 12) {
      risks.push(`Turnover ${ctx.hr.signals.turnoverRate}% — retention risk.`);
    }
    if (ctx.hr.signals.capacityGapFte > 0) {
      risks.push(`Capacity gap ${ctx.hr.signals.capacityGapFte} FTE.`);
    }
  }

  if (ctx.collaboration && ctx.collaboration.communicationHealth.score < 55) {
    risks.push(
      `Collaboration health ${ctx.collaboration.communicationHealth.score}/100 with ${ctx.collaboration.communicationHealth.siloCount} silo(s).`
    );
  }

  const monthEvents = ctx.timeline.filter((t) => t.at.startsWith(monthPrefix));
  if (monthEvents.length) {
    evidence.push({
      id: "risk-tl",
      statement: `${monthEvents.length} graph timeline events in ${monthPrefix}.`,
      domain: "knowledge-graph",
      supporting: true,
    });
  }

  if (!risks.length) {
    risks.push("No elevated organizational risks in current soft-reads.");
  }

  const answer = `Organizational risks (${monthPrefix}): ${risks.slice(0, 5).join(" · ")}`;

  return { risks, evidence, answer };
}
