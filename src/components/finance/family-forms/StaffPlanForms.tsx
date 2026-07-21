"use client";

import { createBillingCreditAction, createPaymentPlanAction } from "@/lib/finance/actions";
import { ActionButton } from "@/components/experience-system/feedback";
import { useFamilyFinancialForms } from "@/components/finance/FamilyFinancialFormsContext";
import { inputClass } from "@/components/finance/family-forms/shared";

export function FamilyFinancialStaffPlanForms() {
  const { portalMode, account, action, runForm } = useFamilyFinancialForms();
  if (portalMode || !account) return null;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <form
        className="rounded-xl border border-slate-200 p-4 space-y-2"
        onSubmit={(e) => runForm(e, (fd) => createBillingCreditAction(fd))}
      >
        <input type="hidden" name="billing_account_id" value={account.id} />
        <h4 className="font-medium">Issue credit</h4>
        <input name="amount" type="number" step="0.01" placeholder="Amount" className={inputClass} required />
        <input name="reason" placeholder="Reason" className={inputClass} />
        <ActionButton
          type="submit"
          status={action.status}
          verb="create"
          labels={{ idle: "Add credit", loading: "Adding…", success: "✓ Added" }}
        />
      </form>
      <form
        className="rounded-xl border border-slate-200 p-4 space-y-2"
        onSubmit={(e) => runForm(e, (fd) => createPaymentPlanAction(fd))}
      >
        <input type="hidden" name="billing_account_id" value={account.id} />
        <h4 className="font-medium">Payment plan</h4>
        <input name="name" placeholder="Plan name" className={inputClass} required />
        <input name="total_amount" type="number" placeholder="Total" className={inputClass} required />
        <input name="installment_amount" type="number" placeholder="Installment" className={inputClass} required />
        <input name="installment_count" type="number" placeholder="# installments" className={inputClass} required />
        <input name="start_date" type="date" className={inputClass} required />
        <ActionButton
          type="submit"
          status={action.status}
          verb="create"
          labels={{ idle: "Create plan", loading: "Creating…", success: "✓ Created" }}
        />
      </form>
    </section>
  );
}
