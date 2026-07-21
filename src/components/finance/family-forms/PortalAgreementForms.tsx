"use client";

import {
  acknowledgeFinancialAgreementAction,
  registerFundingDocumentAction,
} from "@/lib/finance/actions";
import { ActionButton } from "@/components/experience-system/feedback";
import { useFamilyFinancialForms } from "@/components/finance/FamilyFinancialFormsContext";
import { inputClass } from "@/components/finance/family-forms/shared";

export function FamilyFinancialPortalAgreementForms() {
  const { familyId, profile, portalMode, account, action, runForm } = useFamilyFinancialForms();
  if (!portalMode || !account || profile.students.length === 0) return null;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <form
        className="rounded-xl border border-slate-200 p-4 space-y-2"
        onSubmit={(e) => runForm(e, (fd) => registerFundingDocumentAction(fd))}
      >
        <h4 className="font-medium">Upload funding document</h4>
        <p className="text-xs text-slate-500">Register award letters or verification documents for finance review.</p>
        <select name="student_id" className={inputClass} required>
          {profile.students.map((s) => (
            <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
          ))}
        </select>
        <select name="document_type" className={inputClass}>
          <option value="award_letter">Award letter</option>
          <option value="funding_verification">Funding verification</option>
          <option value="esa_voucher">ESA / voucher</option>
        </select>
        <input name="file_name" placeholder="Document file name" className={inputClass} required />
        <ActionButton
          type="submit"
          status={action.status}
          verb="submit"
          labels={{ idle: "Submit document", loading: "Submitting…", success: "✓ Submitted" }}
        />
      </form>
      <form
        className="rounded-xl border border-slate-200 p-4 space-y-2"
        onSubmit={(e) =>
          runForm(e, async (fd) => {
            fd.set("family_id", familyId);
            return acknowledgeFinancialAgreementAction(fd);
          })
        }
      >
        <input type="hidden" name="billing_account_id" value={account.id} />
        <input type="hidden" name="family_id" value={familyId} />
        <h4 className="font-medium">Financial agreement</h4>
        <p className="text-xs text-slate-600">
          I acknowledge tuition, payment plan, and refund policies for {profile.family.family_name}.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" required />
          I agree to the financial terms
        </label>
        <ActionButton
          type="submit"
          status={action.status}
          verb="submit"
          labels={{ idle: "Sign agreement", loading: "Signing…", success: "✓ Signed" }}
        />
      </form>
    </section>
  );
}
