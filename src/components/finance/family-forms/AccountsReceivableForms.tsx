"use client";

import {
  applyLateFeeAction,
  applyWriteOffAction,
  processRefundAction,
} from "@/lib/finance/actions";
import { ActionButton } from "@/components/experience-system/feedback";
import { useFamilyFinancialForms } from "@/components/finance/FamilyFinancialFormsContext";
import { inputClass } from "@/components/finance/family-forms/shared";

export function FamilyFinancialAccountsReceivableForms() {
  const { portalMode, account, action, runForm } = useFamilyFinancialForms();
  if (portalMode || !account) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">Accounts receivable</h3>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <form
          className="space-y-2 rounded-lg border border-slate-100 p-3"
          onSubmit={(e) => runForm(e, (fd) => applyLateFeeAction(fd))}
        >
          <h4 className="text-sm font-medium">Late fee</h4>
          <input name="invoice_id" placeholder="Invoice ID" className={inputClass} required />
          <input name="amount" type="number" step="0.01" placeholder="Amount" className={inputClass} required />
          <input name="reason" placeholder="Reason" defaultValue="Late payment fee" className={inputClass} />
          <ActionButton
            type="submit"
            status={action.status}
            verb="save"
            variant="secondary"
            labels={{ idle: "Apply late fee", loading: "Applying…", success: "✓ Applied" }}
          />
        </form>
        <form
          className="space-y-2 rounded-lg border border-slate-100 p-3"
          onSubmit={(e) => runForm(e, (fd) => applyWriteOffAction(fd))}
        >
          <h4 className="text-sm font-medium">Write-off</h4>
          <input name="invoice_id" placeholder="Invoice ID" className={inputClass} required />
          <input name="amount" type="number" step="0.01" placeholder="Amount" className={inputClass} required />
          <input name="reason" placeholder="Reason" className={inputClass} required />
          <ActionButton
            type="submit"
            status={action.status}
            verb="save"
            variant="secondary"
            labels={{ idle: "Write off", loading: "Writing off…", success: "✓ Written off" }}
          />
        </form>
        <form
          className="space-y-2 rounded-lg border border-slate-100 p-3"
          onSubmit={(e) => runForm(e, (fd) => processRefundAction(fd))}
        >
          <input type="hidden" name="billing_account_id" value={account.id} />
          <h4 className="text-sm font-medium">Refund</h4>
          <input name="invoice_id" placeholder="Invoice ID (optional)" className={inputClass} />
          <input name="amount" type="number" step="0.01" placeholder="Amount" className={inputClass} required />
          <input name="reason" placeholder="Reason" className={inputClass} required />
          <ActionButton
            type="submit"
            status={action.status}
            verb="save"
            variant="secondary"
            labels={{ idle: "Process refund", loading: "Refunding…", success: "✓ Refunded" }}
          />
        </form>
      </div>
    </section>
  );
}
