import { resolveActorUserId, resolveSchoolContext } from "@/lib/platform/shared/context";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import { recordFinanceActivity } from "./activity";
import { refreshAccountAging } from "./aging";
import type { FamilyFinancialAccountView } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function makeAccountNumber(): string {
  return `BA-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export async function ensureFamilyFinancialAccount(
  supabase: AuthClient,
  input: {
    familyId: string;
    schoolId: string;
    primaryResponsibleParty?: string | null;
    siblingDiscountPercent?: number;
  }
): Promise<{ ok: true; accountId: string; auditId: string; created: boolean } | { ok: false; error: string }> {
  const { data: existing } = await supabase
    .from("family_billing_accounts")
    .select("id, audit_id")
    .eq("family_id", input.familyId)
    .eq("school_id", input.schoolId)
    .maybeSingle();

  if (existing) {
    return {
      ok: true,
      accountId: existing.id,
      auditId: existing.audit_id ?? existing.id,
      created: false,
    };
  }

  const actorUserId = await resolveActorUserId(supabase);
  const { data, error } = await supabase
    .from("family_billing_accounts")
    .insert({
      family_id: input.familyId,
      school_id: input.schoolId,
      account_number: makeAccountNumber(),
      primary_payer_name: input.primaryResponsibleParty ?? null,
      sibling_discount_percent: input.siblingDiscountPercent ?? 0,
      account_status: "active",
      balance: 0,
      credit_balance: 0,
    })
    .select("id, audit_id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to create account" };

  const schoolCtx = await resolveSchoolContext(supabase, input.schoolId);
  await recordFinanceActivity(supabase, {
    eventType: "finance.account.created",
    title: "Family financial account created",
    summary: data.id,
    entityType: "family",
    entityId: data.id,
    organizationId: schoolCtx?.organizationId,
    schoolId: input.schoolId,
    familyId: input.familyId,
    actorUserId,
    sourceTable: "family_billing_accounts",
    sourceId: data.id,
  });

  return {
    ok: true,
    accountId: data.id,
    auditId: data.audit_id ?? data.id,
    created: true,
  };
}

export async function listFamilyFinancialAccounts(
  supabase: AuthClient,
  options?: { schoolId?: string | null }
): Promise<FamilyFinancialAccountView[]> {
  let request = supabase
    .from("family_billing_accounts")
    .select("*, families(family_name)")
    .order("updated_at", { ascending: false });
  if (options?.schoolId) request = request.eq("school_id", options.schoolId);

  const { data } = await request;
  const rows = data ?? [];

  const views: FamilyFinancialAccountView[] = [];
  for (const row of rows) {
    const family = Array.isArray(row.families) ? row.families[0] : row.families;
    let scholarshipsTotal = 0;
    if (row.family_id) {
      const { data: awards } = await supabase
        .from("scholarship_applications")
        .select("remaining_award_balance, approved_amount")
        .eq("family_id", row.family_id)
        .eq("scholarship_status", "approved");
      scholarshipsTotal = (awards ?? []).reduce(
        (s, a) => s + Number(a.remaining_award_balance ?? a.approved_amount ?? 0),
        0
      );
    }

    views.push({
      id: row.id,
      auditId: row.audit_id ?? null,
      accountNumber: row.account_number ?? null,
      familyId: row.family_id,
      familyName: (family as { family_name?: string } | null)?.family_name ?? null,
      schoolId: row.school_id,
      primaryResponsibleParty: row.primary_payer_name ?? null,
      currentBalance: Number(row.balance ?? 0),
      availableCredits: Number(row.credit_balance ?? 0),
      scholarshipsTotal,
      paymentPlanId: row.payment_plan_id ?? null,
      status: row.account_status ?? "active",
      agingBucket: row.aging_bucket ?? null,
    });
  }
  return views;
}

export async function syncAccountAgingForSchool(
  supabase: AuthClient,
  schoolId: string
): Promise<number> {
  const { data } = await supabase
    .from("family_billing_accounts")
    .select("id")
    .eq("school_id", schoolId);
  let count = 0;
  for (const row of data ?? []) {
    await refreshAccountAging(supabase, row.id);
    count += 1;
  }
  return count;
}
