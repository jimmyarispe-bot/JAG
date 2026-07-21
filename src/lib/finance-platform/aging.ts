import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { AgingBucket, AgingBuckets } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const OPEN_STATUSES = new Set([
  "draft",
  "pending",
  "sent",
  "partial",
  "partially_paid",
  "overdue",
]);

export function daysPastDue(dueDate: string, asOf: Date = new Date()): number {
  const due = new Date(dueDate);
  return Math.floor((asOf.getTime() - due.getTime()) / 86400000);
}

export function bucketForDays(daysPast: number): AgingBucket {
  if (daysPast <= 0) return "current";
  if (daysPast <= 30) return "days_30";
  if (daysPast <= 60) return "days_60";
  if (daysPast <= 90) return "days_90";
  return "days_120_plus";
}

export function emptyAging(): AgingBuckets {
  return {
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    days120Plus: 0,
    total: 0,
  };
}

export function accumulateAging(
  aging: AgingBuckets,
  balance: number,
  daysPast: number
): AgingBuckets {
  const bucket = bucketForDays(daysPast);
  const next = { ...aging, total: aging.total + balance };
  if (bucket === "current") next.current += balance;
  else if (bucket === "days_30") next.days30 += balance;
  else if (bucket === "days_60") next.days60 += balance;
  else if (bucket === "days_90") next.days90 += balance;
  else next.days120Plus += balance;
  return next;
}

export async function calculateAging(
  supabase: AuthClient,
  options?: { schoolId?: string | null; asOf?: Date }
): Promise<AgingBuckets> {
  const asOf = options?.asOf ?? new Date();
  let request = supabase.from("invoices").select(`
    total_amount, amount_paid, invoice_status, due_date,
    family_billing_accounts(school_id)
  `);

  const { data } = await request;
  let aging = emptyAging();

  for (const inv of data ?? []) {
    if (!OPEN_STATUSES.has(String(inv.invoice_status)) && inv.invoice_status !== "overdue") {
      if (["paid", "void", "voided", "written_off", "cancelled", "archived"].includes(
        String(inv.invoice_status)
      )) {
        continue;
      }
    }
    if (["paid", "void", "voided", "written_off", "cancelled", "archived"].includes(
      String(inv.invoice_status)
    )) {
      continue;
    }

    const acct = Array.isArray(inv.family_billing_accounts)
      ? inv.family_billing_accounts[0]
      : inv.family_billing_accounts;
    if (options?.schoolId && (acct as { school_id?: string } | null)?.school_id !== options.schoolId) {
      continue;
    }

    const balance = Number(inv.total_amount) - Number(inv.amount_paid ?? 0);
    if (balance <= 0) continue;
    aging = accumulateAging(aging, balance, daysPastDue(String(inv.due_date), asOf));
  }

  return aging;
}

export async function refreshAccountAging(
  supabase: AuthClient,
  accountId: string
): Promise<AgingBucket> {
  const { data, error } = await supabase.rpc("refresh_billing_account_aging", {
    p_account_id: accountId,
  });
  if (error) {
    // Fallback compute
    const { data: invoices } = await supabase
      .from("invoices")
      .select("total_amount, amount_paid, invoice_status, due_date")
      .eq("billing_account_id", accountId);

    let maxDays = 0;
    for (const inv of invoices ?? []) {
      if (["paid", "void", "voided", "written_off", "cancelled", "archived"].includes(
        String(inv.invoice_status)
      )) {
        continue;
      }
      const balance = Number(inv.total_amount) - Number(inv.amount_paid ?? 0);
      if (balance <= 0) continue;
      maxDays = Math.max(maxDays, daysPastDue(String(inv.due_date)));
    }
    const bucket = bucketForDays(maxDays);
    await supabase
      .from("family_billing_accounts")
      .update({ aging_bucket: bucket })
      .eq("id", accountId);
    return bucket;
  }
  return (data as AgingBucket) ?? "current";
}

export async function snapshotAging(
  supabase: AuthClient,
  input: {
    schoolId: string;
    organizationId?: string | null;
    asOfDate?: string;
  }
): Promise<AgingBuckets> {
  const aging = await calculateAging(supabase, { schoolId: input.schoolId });
  const asOfDate = input.asOfDate ?? new Date().toISOString().slice(0, 10);
  await supabase.from("billing_aging_snapshots").upsert(
    {
      school_id: input.schoolId,
      organization_id: input.organizationId ?? null,
      as_of_date: asOfDate,
      current_amount: aging.current,
      days_30: aging.days30,
      days_60: aging.days60,
      days_90: aging.days90,
      days_120_plus: aging.days120Plus,
      total_outstanding: aging.total,
    },
    { onConflict: "school_id,as_of_date" }
  );
  return aging;
}
