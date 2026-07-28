/**
 * Conversational CFO — deterministic Q&A over metric registry + CFO reports.
 * Does not modify accounting records.
 */

import { newId, nowIso } from "../ids";
import { publishCfoEvent } from "../events";
import { computeEbitda } from "../ebitda";
import { evaluateMetrics, metricValue } from "../metrics";
import { assessFinancialRisks } from "../risk";
import { computeRunway } from "../runway";
import { analyzeScenario } from "../scenario-analysis";
import { listAssistantAnswers, upsertAssistant } from "../store";
import type { AssistantAnswer, MetricKey } from "../types";

function match(q: string, ...patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(q));
}

export function askCfo(input: {
  organizationId: string;
  userId: string;
  question: string;
  periodKey?: string;
}): AssistantAnswer {
  const periodKey =
    input.periodKey ??
    `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
  const q = input.question.toLowerCase().trim();
  const snap = evaluateMetrics({
    organizationId: input.organizationId,
    periodKey,
  });
  const citations: { recordType: string; recordId: string }[] = [];
  const metricKeys: MetricKey[] = [];
  let answer = "";

  if (match(q, /runway/, /how much cash/)) {
    const runway = computeRunway({
      organizationId: input.organizationId,
      userId: input.userId,
      periodKey,
    });
    answer = `Cash runway is ${runway.runwayMonths?.toFixed(1) ?? "not applicable (non-positive burn)"} months with current cash ${runway.currentCash.toFixed(0)} and monthly burn ${runway.monthlyBurn.toFixed(0)}. Best/expected/worst: ${runway.sensitivity.best_case.runwayMonths?.toFixed(1) ?? "n/a"} / ${runway.sensitivity.expected.runwayMonths?.toFixed(1) ?? "n/a"} / ${runway.sensitivity.worst_case.runwayMonths?.toFixed(1) ?? "n/a"} months.`;
    citations.push({ recordType: "cash_runway", recordId: runway.id });
    metricKeys.push("cash");
  } else if (match(q, /ebitda/, /why did ebitda/)) {
    const e = computeEbitda({
      organizationId: input.organizationId,
      userId: input.userId,
      periodKey,
    });
    answer = `EBITDA is ${e.ebitda.toFixed(0)} (operating income ${e.operatingIncome.toFixed(0)} + D&A). Adjusted EBITDA is ${e.adjustedEbitda.toFixed(0)} after ${e.adjustments.length} adjustment(s). Declines typically trace to lower revenue or higher operating expenses in the metric registry lineage.`;
    citations.push({ recordType: "ebitda_report", recordId: e.id });
    metricKeys.push("ebitda", "adjusted_ebitda");
  } else if (match(q, /hire another teacher/, /can we hire/, /hiring/)) {
    const runway = computeRunway({
      organizationId: input.organizationId,
      userId: input.userId,
      periodKey,
    });
    const affordable =
      runway.runwayMonths == null || runway.runwayMonths >= 9;
    answer = affordable
      ? `Hiring appears supportable: runway ${runway.runwayMonths?.toFixed(1) ?? "open"} months and cash ${runway.currentCash.toFixed(0)}. Still model salary impact via scenario analysis.`
      : `Hiring looks constrained: runway ${runway.runwayMonths?.toFixed(1)} months. Prefer delay or part-time alternatives until burn improves.`;
    citations.push({ recordType: "cash_runway", recordId: runway.id });
    metricKeys.push("cash", "operating_margin");
  } else if (match(q, /open another campus/, /new building/, /afford a new/)) {
    const cash = metricValue(snap, "cash") ?? 0;
    const scen = analyzeScenario({
      organizationId: input.organizationId,
      userId: input.userId,
      kind: "capital_purchases",
      name: "Capital inquiry",
      periodKey,
      assumptions: { capitalAmount: Math.max(cash * 0.5, 100000) },
    });
    answer = `A capital purchase modeled at ${Math.max(cash * 0.5, 100000).toFixed(0)} leaves projected cash ${scen.projectedCash.toFixed(0)}. ${scen.projectedCash < 0 ? "Not affordable without financing." : "Potentially affordable — validate with board capital plan."}`;
    citations.push({ recordType: "cfo_scenario", recordId: scen.id });
    metricKeys.push("cash");
  } else if (match(q, /enrollment drops/, /enrollment drop/)) {
    const m = q.match(/(\d+)\s*%/);
    const pct = m ? -Number(m[1]) : -12;
    const scen = analyzeScenario({
      organizationId: input.organizationId,
      userId: input.userId,
      kind: "enrollment_changes",
      name: "Enrollment sensitivity",
      periodKey,
      assumptions: { changePct: pct },
    });
    answer = `If enrollment changes ${pct}%, projected revenue ${scen.projectedRevenue.toFixed(0)} and EBITDA ${scen.projectedEbitda?.toFixed(0)}. ${scen.impactSummary}`;
    citations.push({ recordType: "cfo_scenario", recordId: scen.id });
    metricKeys.push("revenue", "ebitda");
  } else if (match(q, /payroll increases/, /payroll increase/)) {
    const m = q.match(/(\d+)\s*%/);
    const pct = m ? Number(m[1]) : 8;
    const scen = analyzeScenario({
      organizationId: input.organizationId,
      userId: input.userId,
      kind: "salary_changes",
      name: "Payroll sensitivity",
      periodKey,
      assumptions: { payrollIncreasePct: pct / 100 },
    });
    answer = `An ${pct}% payroll increase projects expenses ${scen.projectedExpenses.toFixed(0)} and cash ${scen.projectedCash.toFixed(0)}.`;
    citations.push({ recordType: "cfo_scenario", recordId: scen.id });
    metricKeys.push("operating_income");
  } else if (match(q, /largest financial risks/, /what are our.*risks/)) {
    const risks = assessFinancialRisks({
      organizationId: input.organizationId,
      userId: input.userId,
      periodKey,
    });
    answer = `Largest financial risks: ${risks.join(" ")}`;
    metricKeys.push("cash", "current_ratio", "operating_margin");
  } else {
    answer = `Period ${periodKey}: revenue ${metricValue(snap, "revenue") ?? 0}, net income ${metricValue(snap, "net_income") ?? 0}, cash ${metricValue(snap, "cash") ?? 0}, EBITDA ${metricValue(snap, "ebitda") ?? 0}. Ask about runway, EBITDA, hiring, campus expansion, enrollment, payroll, or risks for a deeper answer.`;
    metricKeys.push("revenue", "net_income", "cash", "ebitda");
  }

  const result = upsertAssistant({
    id: newId("cask"),
    organizationId: input.organizationId,
    question: input.question,
    answer,
    citations: Object.freeze(citations),
    metricKeys: Object.freeze(metricKeys),
    generatedAt: nowIso(),
  });

  publishCfoEvent({
    type: "cfo.assistant_answered",
    organizationId: input.organizationId,
    recordType: "cfo_assistant",
    recordId: result.id,
    actorUserId: input.userId,
    payload: { question: input.question, metricKeys },
  });
  return result;
}

export { listAssistantAnswers };
