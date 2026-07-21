import type { CopilotV2SoftContext } from "@/lib/platform/executive-copilot/context/soft-reads";
import { buildExecutiveNarrative } from "@/lib/platform/executive-copilot/reasoning/narratives";
import { identifyDecisionMakers } from "@/lib/platform/executive-copilot/reasoning/decision-support";
import { surfaceOrganizationalRisks } from "@/lib/platform/executive-copilot/reasoning/risks";

export type BoardPrepPackage = {
  briefingSummary: string;
  risks: string[];
  decisions: string[];
  forecasts: string[];
};

export function prepareBoardPackage(ctx: CopilotV2SoftContext): BoardPrepPackage {
  const { narrative, headline } = buildExecutiveNarrative(ctx, "Board package");
  const dm = identifyDecisionMakers(ctx);
  const orgRisks = surfaceOrganizationalRisks(ctx);

  const forecasts: string[] = [];
  if (ctx.finance) {
    forecasts.push(
      `Cash forecast 30d $${ctx.finance.forecasting.cashForecast30d.toLocaleString()} · revenue forecast $${ctx.finance.forecasting.revenueForecast.toLocaleString()}.`
    );
  }
  if (ctx.crm) {
    forecasts.push(
      `Sales forecast $${Math.round(ctx.crm.crm.salesForecast).toLocaleString()} · open deals ${ctx.crm.crm.openDeals}.`
    );
  }

  const decisions = [
    ...dm.recommendations.slice(0, 2),
    ...(ctx.hr && ctx.hr.signals.capacityGapFte > 0
      ? [`Approve hiring plan for ${ctx.hr.signals.capacityGapFte} FTE capacity gap.`]
      : []),
  ];

  return {
    briefingSummary: `${headline} ${narrative}`,
    risks: orgRisks.risks.slice(0, 6),
    decisions: decisions.slice(0, 6),
    forecasts: forecasts.length
      ? forecasts
      : ["No forecast soft-reads attached — sync finance/CRM."],
  };
}
