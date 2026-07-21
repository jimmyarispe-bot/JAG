"use client";

import { addPaymentMethodAction, enrollAutopayAction } from "@/lib/finance/actions";
import { ActionButton } from "@/components/experience-system/feedback";
import { useFamilyFinancialForms } from "@/components/finance/FamilyFinancialFormsContext";

export function FamilyFinancialPaymentMethodForms() {
  const { familyId, profile, portalMode, account, action, runForm } = useFamilyFinancialForms();
  if (!account) return null;

  return (
    <>
      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(e) =>
          runForm(e, async (fd) => {
            fd.set("family_id", familyId);
            return addPaymentMethodAction(fd);
          })
        }
      >
        <input type="hidden" name="billing_account_id" value={account.id} />
        <input type="hidden" name="family_id" value={familyId} />
        <select name="method_type" className="rounded border px-2 py-1 text-sm">
          <option value="credit_card">Credit card</option>
          <option value="ach">ACH</option>
        </select>
        <input name="last_four" placeholder="Last 4" className="w-20 rounded border px-2 py-1 text-sm" />
        <ActionButton
          type="submit"
          status={action.status}
          verb="create"
          variant="secondary"
          labels={{ idle: "Add method", loading: "Adding…", success: "✓ Added" }}
        />
      </form>
      {portalMode && !profile.autopay.length && profile.paymentMethods.length > 0 && (
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => runForm(e, (fd) => enrollAutopayAction(fd))}
        >
          <input type="hidden" name="billing_account_id" value={account.id} />
          <input type="hidden" name="payment_method_id" value={profile.paymentMethods.find((m) => m.is_default)?.id ?? profile.paymentMethods[0]?.id} />
          <label className="text-xs text-slate-600">
            AutoPay day
            <input name="day_of_month" type="number" min={1} max={28} defaultValue={1} className="ml-1 w-14 rounded border px-1 py-0.5" />
          </label>
          <ActionButton
            type="submit"
            status={action.status}
            verb="save"
            variant="success"
            labels={{ idle: "Enroll in AutoPay", loading: "Enrolling…", success: "✓ Enrolled" }}
          />
        </form>
      )}
    </>
  );
}
