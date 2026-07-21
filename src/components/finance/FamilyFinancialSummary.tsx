import {
  type FamilyFinancialCenterProps,
  studentLabel,
} from "@/components/finance/family-financial-types";
import { ActionChip, ActionChipGroup } from "@/components/ui/cta";

/**
 * P007 — Server Component read-only family financial display.
 */
export function FamilyFinancialKpiSection({ profile }: FamilyFinancialCenterProps) {
  const account = profile.account;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Outstanding balance</p>
        <p className="text-2xl font-semibold text-amber-600">${Number(account?.balance ?? 0).toLocaleString()}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Credits available</p>
        <p className="text-2xl font-semibold text-emerald-600">${Number(account?.credit_balance ?? 0).toLocaleString()}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Collections status</p>
        <p className="text-lg font-medium capitalize text-slate-900">{account?.collections_status ?? "—"}</p>
      </article>
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">AutoPay</p>
        <p className="text-lg font-medium text-slate-900">{profile.autopay.length ? "Enrolled" : account?.autopay_enabled ? "Enabled" : "Not enrolled"}</p>
      </article>
    </section>
  );
}

export function FamilyFinancialPayersList({ profile }: FamilyFinancialCenterProps) {
  return (
    <>
      <h3 className="font-semibold text-slate-900">Responsible payers</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {profile.payers.map((p) => (
          <li key={p.id} className="flex justify-between">
            <span>{p.payer_name}{p.is_primary ? " (primary)" : ""}</span>
            <span>{p.responsibility_percent}% · {p.custody_basis?.replace(/_/g, " ") ?? "—"}</span>
          </li>
        ))}
        {!profile.payers.length && profile.guardians.filter((g) => g.receives_billing).map((g) => (
          <li key={g.id}>{g.first_name} {g.last_name} — billing contact</li>
        ))}
      </ul>
    </>
  );
}

export function FamilyFinancialStaffInvoicesSection({ profile }: FamilyFinancialCenterProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">Invoices</h3>
      <ul className="mt-3 space-y-3">
        {profile.invoices.map((inv) => (
          <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
            <div>
              <p className="font-medium">{inv.invoice_number}</p>
              <p className="text-slate-500">Due {inv.due_date} · {inv.invoice_status}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">${Number(inv.total_amount - inv.amount_paid).toLocaleString()} due</p>
            </div>
          </li>
        ))}
        {!profile.invoices.length && <li className="text-slate-500">No invoices yet.</li>}
      </ul>
    </section>
  );
}

export function FamilyFinancialPaymentHistorySection({ profile, portalMode }: FamilyFinancialCenterProps) {
  const payments = profile.payments ?? [];
  if (!portalMode && payments.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">Payment history</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {payments.map((p) => {
          const inv = Array.isArray(p.invoices) ? p.invoices[0] : p.invoices;
          return (
            <li key={p.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
              <span>
                {p.paid_at?.split("T")[0] ?? "—"} · {inv?.invoice_number ?? "Payment"} · {p.payment_method.replace(/_/g, " ")}
              </span>
              <span className="font-medium">${Number(p.amount).toLocaleString()}</span>
              {p.receipt_number && (
                <span className="w-full text-xs text-slate-500">Receipt {p.receipt_number}</span>
              )}
            </li>
          );
        })}
        {!payments.length && <li className="text-slate-500">No payments recorded yet.</li>}
      </ul>
    </section>
  );
}

export function FamilyFinancialScholarshipsSection({ profile, portalMode }: FamilyFinancialCenterProps) {
  const scholarships = profile.scholarships ?? [];
  if (!portalMode && scholarships.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">Scholarship awards</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {scholarships.map((s) => (
          <li key={s.id} className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
            <p className="font-medium">{studentLabel(s.students ?? null)}</p>
            <p className="text-slate-600">
              {s.scholarship_type?.replace(/_/g, " ") ?? "Scholarship"} · Approved ${Number(s.approved_amount ?? 0).toLocaleString()}
              {s.remaining_award_balance != null && ` · Remaining $${Number(s.remaining_award_balance).toLocaleString()}`}
            </p>
            {(s.renewal_date || s.expires_on) && (
              <p className="mt-1 text-xs text-slate-500">
                {s.renewal_date && `Renewal ${s.renewal_date}`}
                {s.expires_on && ` · Expires ${s.expires_on}`}
              </p>
            )}
          </li>
        ))}
        {!scholarships.length && <li className="text-slate-500">No scholarship awards on file.</li>}
      </ul>
    </section>
  );
}

export function FamilyFinancialStateFundingSection({ profile, portalMode }: FamilyFinancialCenterProps) {
  const stateFunding = profile.stateFunding ?? [];
  if (!portalMode && stateFunding.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">State funding & ESA</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {stateFunding.map((f) => (
          <li key={f.id} className="rounded-lg border border-sky-100 bg-sky-50/50 p-3">
            <p className="font-medium">{studentLabel(f.students ?? null)}</p>
            <p className="capitalize text-slate-600">
              {f.funding_category.replace(/_/g, " ")}
              {f.program_name ? ` · ${f.program_name}` : ""}
              {f.state_code ? ` (${f.state_code})` : ""}
            </p>
            <p className="mt-1 text-slate-600">
              Award ${Number(f.award_amount ?? 0).toLocaleString()} · {f.verification_status} · {f.payment_status}
            </p>
          </li>
        ))}
        {!stateFunding.length && <li className="text-slate-500">No state funding records yet.</li>}
      </ul>
    </section>
  );
}

export function FamilyFinancialPaymentMethodsList({ profile }: FamilyFinancialCenterProps) {
  return (
    <>
      <h3 className="font-semibold">Payment methods</h3>
      <ul className="mt-2 space-y-1 text-sm text-slate-600">
        {profile.paymentMethods.map((m) => (
          <li key={m.id} className="capitalize">{m.method_type.replace(/_/g, " ")}{m.last_four ? ` ·••• ${m.last_four}` : ""}{m.is_default ? " (default)" : ""}</li>
        ))}
      </ul>
    </>
  );
}

export function FamilyFinancialPaymentPlansCreditsSection({ profile }: FamilyFinancialCenterProps) {
  const adjustments = profile.adjustments ?? [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold">Payment plans & credits</h3>
      {profile.paymentPlans.map((p) => (
        <p key={p.id} className="mt-2 text-sm">{p.name} — ${Number(p.installment_amount).toLocaleString()}/installment ({p.status})</p>
      ))}
      {profile.credits.map((c) => (
        <p key={c.id} className="mt-1 text-sm text-emerald-700">Credit ${Number(c.remaining_amount).toLocaleString()} — {c.reason ?? "Available"}</p>
      ))}
      {adjustments.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-xs font-medium text-slate-500">Recent adjustments</p>
          {adjustments.map((a) => (
            <p key={a.id} className="mt-1 text-xs text-slate-600 capitalize">
              {a.adjustment_type.replace(/_/g, " ")} ${Number(a.amount).toLocaleString()} — {a.reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function FamilyFinancialFooterLinks({ portalMode }: Pick<FamilyFinancialCenterProps, "portalMode">) {
  if (portalMode) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
      <span>State funding & scholarships:</span>
      <ActionChipGroup>
        <ActionChip href="/dashboard/admissions/state-funding" size="xs">
          State Funding Center
        </ActionChip>
        <ActionChip href="/dashboard/scholarships" size="xs">
          Scholarship Center
        </ActionChip>
      </ActionChipGroup>
    </div>
  );
}
