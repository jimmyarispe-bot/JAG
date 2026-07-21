import type { CopilotV2SoftContext } from "@/lib/platform/executive-copilot/context/soft-reads";
import type { CopilotV2Evidence } from "@/lib/platform/executive-copilot/types";

export type RootCauseResult = {
  question: string;
  causes: string[];
  ranked: Array<{ cause: string; weight: number; domain: string }>;
  evidence: CopilotV2Evidence[];
  narrative: string;
  confidence: number;
};

/** Example: Why is revenue declining? */
export function analyzeRevenueDecline(ctx: CopilotV2SoftContext): RootCauseResult {
  const ranked: RootCauseResult["ranked"] = [];
  const evidence: CopilotV2Evidence[] = [];
  let eid = 0;

  if (ctx.crm) {
    const { pipelineHealth, salesForecast, customerConcentration, openDeals } = ctx.crm.crm;
    if (pipelineHealth < 60) {
      ranked.push({
        cause: `Weak pipeline health (${pipelineHealth}/100) with ${openDeals} open deals`,
        weight: 0.35,
        domain: "crm",
      });
    }
    if (customerConcentration > 40) {
      ranked.push({
        cause: `Customer concentration ${customerConcentration}% — revenue sensitive to few accounts`,
        weight: 0.25,
        domain: "crm",
      });
    }
    if (salesForecast <= 0) {
      ranked.push({
        cause: "Sales forecast at or near zero in CRM soft-read",
        weight: 0.2,
        domain: "crm",
      });
    } else {
      evidence.push({
        id: `rc-${++eid}`,
        statement: `CRM sales forecast $${Math.round(salesForecast).toLocaleString()}.`,
        domain: "crm",
        supporting: true,
      });
    }
    if (ctx.crm.attribution.topCompanySharePct > 35) {
      ranked.push({
        cause: `Top company share ${ctx.crm.attribution.topCompanySharePct}% of attributed revenue`,
        weight: 0.15,
        domain: "crm",
      });
    }
  }

  if (ctx.finance) {
    const bullets = ctx.finance.briefBullets ?? [];
    for (const b of bullets.slice(0, 3)) {
      if (/declin|down|negative|burn|risk/i.test(b)) {
        ranked.push({ cause: b, weight: 0.2, domain: "finance" });
      }
      evidence.push({
        id: `rc-${++eid}`,
        statement: b,
        domain: "finance",
        supporting: true,
      });
    }
  }

  if (ctx.hr && ctx.hr.signals.turnoverRate >= 15) {
    ranked.push({
      cause: `Elevated turnover (${ctx.hr.signals.turnoverRate}%) may impair sales capacity`,
      weight: 0.18,
      domain: "hr",
    });
  }

  if (ctx.collaboration && ctx.collaboration.communicationHealth.score < 55) {
    ranked.push({
      cause: `Low collaboration health (${ctx.collaboration.communicationHealth.score}/100) can slow deal execution`,
      weight: 0.12,
      domain: "collaboration",
    });
  }

  ranked.sort((a, b) => b.weight - a.weight);
  const causes =
    ranked.length > 0
      ? ranked.map((r) => r.cause)
      : [
          "Insufficient finance/CRM soft-reads to isolate revenue decline — sync Stripe/QuickBooks and HubSpot/Salesforce.",
        ];

  const narrative =
    ranked.length > 0
      ? `Primary drivers of revenue pressure: ${causes.slice(0, 2).join("; ")}. Cross-check CRM conversion with cash/burn and capacity.`
      : causes[0];

  const confidence = ranked.length
    ? Math.min(0.92, 0.4 + ranked.length * 0.12)
    : 0.25;

  return {
    question: "Why is revenue declining?",
    causes,
    ranked,
    evidence,
    narrative,
    confidence,
  };
}

export function analyzeRootCause(
  ctx: CopilotV2SoftContext,
  question: string
): RootCauseResult {
  if (/revenue/i.test(question)) return analyzeRevenueDecline(ctx);

  const xd = ctx.domainsPresent;
  const causes: string[] = [];
  const evidence: CopilotV2Evidence[] = [];

  if (ctx.finance?.briefBullets?.[0]) {
    causes.push(ctx.finance.briefBullets[0]);
    evidence.push({
      id: "rc-g1",
      statement: ctx.finance.briefBullets[0],
      domain: "finance",
      supporting: true,
    });
  }
  if (ctx.crm && ctx.crm.crm.pipelineHealth < 60) {
    causes.push(`Pipeline health ${ctx.crm.crm.pipelineHealth}/100`);
  }
  if (ctx.hr && ctx.hr.signals.capacityGapFte > 0) {
    causes.push(`Capacity gap ${ctx.hr.signals.capacityGapFte} FTE`);
  }
  if (ctx.collaboration && ctx.collaboration.communicationHealth.siloCount > 0) {
    causes.push(`${ctx.collaboration.communicationHealth.siloCount} collaboration silo(s)`);
  }
  if (!causes.length) {
    causes.push(`No strong root-cause signals across ${xd.join(", ") || "domains"}.`);
  }

  return {
    question,
    causes,
    ranked: causes.map((cause, i) => ({
      cause,
      weight: Math.max(0.1, 0.4 - i * 0.08),
      domain: xd[i] ?? "cross-domain",
    })),
    evidence,
    narrative: `Root-cause candidates: ${causes.slice(0, 3).join("; ")}.`,
    confidence: causes.length ? 0.55 : 0.2,
  };
}
