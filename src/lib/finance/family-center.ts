import type { createAuthClient } from "@/lib/supabase/server-auth";
import {
  ADJUSTMENT_PROFILE_COLS,
  AUTOPAY_COLS,
  BILLING_ACCOUNT_COLS,
  BILLING_CREDIT_COLS,
  BILLING_PAYER_COLS,
  FAMILY_PROFILE_COLS,
  GUARDIAN_BILLING_COLS,
  INVOICE_PROFILE_COLS,
  PAYMENT_METHOD_COLS,
  PAYMENT_PLAN_COLS,
  PAYMENT_PROFILE_COLS,
  STATE_FUNDING_PROFILE_COLS,
} from "@/lib/finance/family-financial-projections";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export async function getFamilyFinancialProfile(supabase: AuthClient, familyId: string) {
  const { data: family } = await supabase
    .from("families")
    .select(FAMILY_PROFILE_COLS)
    .eq("id", familyId)
    .single();

  if (!family) return null;

  const { data: account } = await supabase
    .from("family_billing_accounts")
    .select(BILLING_ACCOUNT_COLS)
    .eq("family_id", familyId)
    .maybeSingle();

  const accountId = account?.id;

  const [guardians, payers, paymentMethods, autopay, paymentPlans, credits, invoices, students] =
    await Promise.all([
      supabase
        .from("guardians")
        .select(GUARDIAN_BILLING_COLS)
        .eq("family_id", familyId)
        .order("is_primary", { ascending: false }),
      accountId
        ? supabase
            .from("family_billing_payers")
            .select(BILLING_PAYER_COLS)
            .eq("billing_account_id", accountId)
        : Promise.resolve({ data: [] }),
      accountId
        ? supabase
            .from("family_payment_methods")
            .select(PAYMENT_METHOD_COLS)
            .eq("billing_account_id", accountId)
            .eq("is_active", true)
        : Promise.resolve({ data: [] }),
      accountId
        ? supabase
            .from("family_autopay_enrollments")
            .select(AUTOPAY_COLS)
            .eq("billing_account_id", accountId)
            .eq("status", "active")
        : Promise.resolve({ data: [] }),
      accountId
        ? supabase
            .from("payment_plans")
            .select(PAYMENT_PLAN_COLS)
            .eq("billing_account_id", accountId)
            .neq("status", "cancelled")
        : Promise.resolve({ data: [] }),
      accountId
        ? supabase
            .from("billing_credits")
            .select(BILLING_CREDIT_COLS)
            .eq("billing_account_id", accountId)
            .eq("status", "available")
        : Promise.resolve({ data: [] }),
      accountId
        ? supabase
            .from("invoices")
            .select(INVOICE_PROFILE_COLS)
            .eq("billing_account_id", accountId)
            .order("due_date", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [] }),
      supabase
        .from("students")
        .select("id, first_name, last_name, program")
        .eq("family_id", familyId),
    ]);

  const studentIds = (students.data ?? []).map((s) => s.id);

  const [payments, scholarships, stateFunding, adjustments] = await Promise.all([
    accountId
      ? supabase
          .from("payments")
          .select(PAYMENT_PROFILE_COLS)
          .eq("invoices.billing_account_id", accountId)
          .order("paid_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [] }),
    studentIds.length
      ? supabase
          .from("scholarship_applications")
          .select(
            "id, approved_amount, remaining_award_balance, scholarship_status, scholarship_type, renewal_date, expires_on, conditions, student_id, students(first_name, last_name)"
          )
          .in("student_id", studentIds)
          .eq("scholarship_status", "approved")
      : Promise.resolve({ data: [] }),
    studentIds.length
      ? supabase
          .from("ssis_student_funding_records")
          .select(STATE_FUNDING_PROFILE_COLS)
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] }),
    accountId
      ? supabase
          .from("billing_adjustments")
          .select(ADJUSTMENT_PROFILE_COLS)
          .eq("billing_account_id", accountId)
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    family,
    account,
    guardians: guardians.data ?? [],
    payers: payers.data ?? [],
    paymentMethods: paymentMethods.data ?? [],
    autopay: autopay.data ?? [],
    paymentPlans: paymentPlans.data ?? [],
    credits: credits.data ?? [],
    invoices: invoices.data ?? [],
    students: students.data ?? [],
    payments: payments.data ?? [],
    scholarships: scholarships.data ?? [],
    stateFunding: stateFunding.data ?? [],
    adjustments: adjustments.data ?? [],
  };
}

export async function getGuardianFamilyFinancialProfiles(supabase: AuthClient, userId: string) {
  const { data: guardianLinks } = await supabase
    .from("guardians")
    .select("family_id")
    .eq("user_id", userId);

  const familyIds = [...new Set((guardianLinks ?? []).map((g) => g.family_id))];
  const profiles = await Promise.all(
    familyIds.map((familyId) => getFamilyFinancialProfile(supabase, familyId))
  );
  return profiles.filter((profile): profile is NonNullable<typeof profile> => profile != null);
}
