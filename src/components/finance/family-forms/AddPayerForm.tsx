"use client";

import { addBillingPayerAction } from "@/lib/finance/actions";
import { ActionButton } from "@/components/experience-system/feedback";
import { useFamilyFinancialForms } from "@/components/finance/FamilyFinancialFormsContext";
import { inputClass } from "@/components/finance/family-forms/shared";

export function FamilyFinancialAddPayerForm() {
  const { familyId, account, action, runForm } = useFamilyFinancialForms();
  if (!account) return null;

  return (
    <form
      className="mt-4 grid gap-2 sm:grid-cols-2"
      onSubmit={(e) =>
        runForm(e, async (fd) => {
          fd.set("family_id", familyId);
          fd.set("billing_account_id", account.id);
          return addBillingPayerAction(fd);
        })
      }
    >
      <input type="hidden" name="billing_account_id" value={account.id} />
      <input type="hidden" name="family_id" value={familyId} />
      <input name="payer_name" placeholder="Payer name" className={inputClass} required />
      <input name="payer_email" placeholder="Email" className={inputClass} />
      <input name="responsibility_percent" type="number" placeholder="%" defaultValue={50} className={inputClass} />
      <select name="custody_basis" className={inputClass}>
        <option value="primary">Primary custody</option>
        <option value="joint">Joint</option>
        <option value="split">Split</option>
      </select>
      <ActionButton
        type="submit"
        status={action.status}
        verb="create"
        labels={{ idle: "Add payer", loading: "Adding…", success: "✓ Added" }}
      />
    </form>
  );
}
