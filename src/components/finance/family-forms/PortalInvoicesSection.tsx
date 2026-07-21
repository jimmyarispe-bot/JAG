"use client";

import { recordPayment } from "@/lib/finance/actions";
import { ActionButton } from "@/components/experience-system/feedback";
import { useFamilyFinancialForms } from "@/components/finance/FamilyFinancialFormsContext";

export function FamilyFinancialPortalInvoicesSection() {
  const { profile, portalMode, account, action, runForm } = useFamilyFinancialForms();
  if (!portalMode) return null;

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
              {inv.invoice_status !== "paid" && account && (
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={(e) =>
                    runForm(e, async (fd) => {
                      fd.set("invoice_id", inv.id);
                      return recordPayment(fd);
                    })
                  }
                >
                  <input type="hidden" name="invoice_id" value={inv.id} />
                  <input name="amount" type="number" step="0.01" defaultValue={inv.total_amount - inv.amount_paid} className="w-24 rounded border px-2 py-1 text-xs" />
                  <select name="payment_method" className="rounded border px-2 py-1 text-xs">
                    <option value="credit_card">Card</option>
                    <option value="ach">ACH</option>
                  </select>
                  <ActionButton
                    type="submit"
                    status={action.status}
                    verb="save"
                    variant="success"
                    labels={{ idle: "Pay (Square planned)", loading: "Paying…", success: "✓ Paid" }}
                  />
                </form>
              )}
            </div>
          </li>
        ))}
        {!profile.invoices.length && <li className="text-slate-500">No invoices yet.</li>}
      </ul>
    </section>
  );
}
