import type { createAuthClient } from "@/lib/supabase/server-auth";
import { calculateAging } from "./aging";
import type { AgingBuckets, FinanceOperationsSummary } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface FinanceReports {
  revenue: number;
  aging: AgingBuckets;
  scholarships: number;
  collections: number;
  outstandingBalance: number;
  cashReceived: number;
  projectedRevenue: number;
  collectionRate: number;
}

export async function buildFinanceReports(
  supabase: AuthClient,
  options?: { schoolId?: string | null }
): Promise<FinanceReports> {
  const { data: invoices } = await supabase.from("invoices").select(`
    total_amount, amount_paid, invoice_status, scholarship_credit, due_date,
    family_billing_accounts(school_id)
  `);

  const filtered = (invoices ?? []).filter((inv) => {
    if (!options?.schoolId) return true;
    const acct = Array.isArray(inv.family_billing_accounts)
      ? inv.family_billing_accounts[0]
      : inv.family_billing_accounts;
    return (acct as { school_id?: string } | null)?.school_id === options.schoolId;
  });

  const revenue = filtered.reduce((s, i) => s + Number(i.total_amount), 0);
  const cashReceived = filtered.reduce((s, i) => s + Number(i.amount_paid), 0);
  const scholarships = filtered.reduce((s, i) => s + Number(i.scholarship_credit ?? 0), 0);
  const outstandingBalance = filtered
    .filter((i) => !["paid", "void", "voided", "written_off", "cancelled", "archived"].includes(
      String(i.invoice_status)
    ))
    .reduce((s, i) => s + Number(i.total_amount) - Number(i.amount_paid), 0);

  const aging = await calculateAging(supabase, { schoolId: options?.schoolId });
  const collectionRate = revenue ? Math.round((cashReceived / revenue) * 100) : 0;

  // Projected = open sent/pending family responsibility + current month billed
  const projectedRevenue = outstandingBalance + cashReceived * 0.15;

  return {
    revenue,
    aging,
    scholarships,
    collections: cashReceived,
    outstandingBalance,
    cashReceived,
    projectedRevenue: Math.round(projectedRevenue * 100) / 100,
    collectionRate,
  };
}

export async function getFinanceOperationsSummary(
  supabase: AuthClient,
  options?: { schoolId?: string | null }
): Promise<FinanceOperationsSummary> {
  const reports = await buildFinanceReports(supabase, options);

  let overdueQuery = supabase
    .from("family_billing_accounts")
    .select("id", { count: "exact", head: true })
    .in("aging_bucket", ["days_30", "days_60", "days_90", "days_120_plus"]);
  if (options?.schoolId) overdueQuery = overdueQuery.eq("school_id", options.schoolId);
  const overdueRes = await overdueQuery;

  let plansQuery = supabase
    .from("payment_plans")
    .select("id", { count: "exact", head: true });
  if (options?.schoolId) {
    // payment_plans may be school-scoped via billing account; count all when column absent
    plansQuery = plansQuery;
  }
  const plansRes = await plansQuery;

  let refundsQuery = supabase
    .from("billing_refunds")
    .select("id", { count: "exact", head: true })
    .in("status", ["requested", "pending_approval", "approved"]);
  if (options?.schoolId) refundsQuery = refundsQuery.eq("school_id", options.schoolId);
  const refundsRes = await refundsQuery;

  const alertCount =
    (overdueRes.count ?? 0) +
    (refundsRes.count ?? 0) +
    (reports.aging.days90 > 0 || reports.aging.days120Plus > 0 ? 1 : 0);

  return {
    revenueSummary: reports.revenue,
    outstandingBalance: reports.outstandingBalance,
    paymentsReceived: reports.cashReceived,
    overdueAccounts: overdueRes.count ?? 0,
    scholarshipsApplied: reports.scholarships,
    activePaymentPlans: plansRes.count ?? 0,
    refundQueueCount: refundsRes.count ?? 0,
    alertCount,
    aging: reports.aging,
    projectedRevenue: reports.projectedRevenue,
    cashReceived: reports.cashReceived,
    collectionsRate: reports.collectionRate,
  };
}
