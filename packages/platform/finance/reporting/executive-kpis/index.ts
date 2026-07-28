import { listBills, listInvoices, listPayments } from "../../store";
import { cashBalances } from "../../treasury";
import { listInvoiceMeta } from "../../revenue/invoices";
import { listFunding } from "../../revenue/funding";
import { nowIso } from "../../ids";
import { computeAccountBalances } from "../financial-statements/balances";
import type { ExecutiveKpis } from "../types";

export function buildExecutiveKpis(input: {
  organizationId: string;
  periodKey?: string | null;
  custom?: Readonly<Record<string, number>>;
}): ExecutiveKpis {
  const balances = computeAccountBalances({
    organizationId: input.organizationId,
    periodKey: input.periodKey ?? null,
    consolidated: true,
  });
  const revenue = balances
    .filter((b) => b.account.type === "revenue")
    .reduce((s, b) => s + b.balance, 0);
  const expenses = balances
    .filter((b) => b.account.type === "expense")
    .reduce((s, b) => s + b.balance, 0);
  const netIncome = revenue - expenses;
  const operatingMargin = revenue === 0 ? null : (netIncome / revenue) * 100;
  const cash = cashBalances(input.organizationId).reduce(
    (s, b) => s + b.balanceHint,
    0
  );
  const ar = listInvoices(input.organizationId)
    .filter((i) => i.status === "sent" || i.status === "partial")
    .reduce((s, i) => s + i.amount, 0);
  const ap = listBills(input.organizationId)
    .filter((b) => b.status === "approved" || b.status === "pending_approval")
    .reduce((s, b) => s + b.amount, 0);
  const collections = listPayments(input.organizationId)
    .filter((p) => p.direction === "in")
    .reduce((s, p) => s + p.amount, 0);
  const vendorSpend = listPayments(input.organizationId)
    .filter((p) => p.direction === "out")
    .reduce((s, p) => s + p.amount, 0);

  const funding = listFunding(input.organizationId);
  const meta = listInvoiceMeta(input.organizationId);
  let enrollmentRevenue = 0;
  let grantRevenue = 0;
  let scholarshipRevenue = 0;
  let programRevenue = 0;
  for (const m of meta) {
    const src = funding.find((f) => f.id === m.fundingSourceId);
    const kind = src?.kind ?? "";
    const inv = listInvoices(input.organizationId).find(
      (i) => i.id === m.invoiceId
    );
    const amt = inv?.amount ?? 0;
    if (kind === "tuition" || kind === "registration_fee") enrollmentRevenue += amt;
    else if (kind === "grant" || kind === "state_funding") grantRevenue += amt;
    else if (kind === "scholarship" || kind === "financial_aid")
      scholarshipRevenue += amt;
    else if (kind === "district_contract" || kind === "therapy")
      programRevenue += amt;
  }

  return Object.freeze({
    organizationId: input.organizationId,
    generatedAt: nowIso(),
    revenue,
    expenses,
    operatingMargin,
    netIncome,
    cash,
    ar,
    ap,
    collections,
    vendorSpend,
    enrollmentRevenue,
    grantRevenue,
    scholarshipRevenue,
    programRevenue,
    custom: Object.freeze({ ...(input.custom ?? {}) }),
    ebitdaPlaceholder: null,
  });
}
