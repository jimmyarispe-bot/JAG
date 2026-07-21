"use client";

import { useState } from "react";
import { saveFinancialAidApplication } from "@/lib/admissions/portal/actions";
import type { PortalScholarshipApplication } from "@/lib/admissions/portal/queries";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { portalInputClass, portalLabelClass, portalSectionClass } from "./styles";

interface FinancialAidSectionProps {
  applicationId: string;
  scholarship: PortalScholarshipApplication | null;
}

export function FinancialAidSection({ applicationId, scholarship }: FinancialAidSectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const action = useActionFeedback({
    verb: "save",
    labels: { idle: "Save Financial Aid Info", loading: "Saving…", success: "✓ Saved" },
    successToast: "✓ Changes saved.",
    errorToast: "Unable to save.",
    progressLabel: "Saving financial aid info…",
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    formData.set("application_id", applicationId);
    if (scholarship?.id) {
      formData.set("scholarship_application_id", scholarship.id);
    }

    void action.run(async () => {
      const result = await saveFinancialAidApplication(formData);
      if (result.error) throw new Error(result.error);
      setSaved(true);
      return result;
    });
  }

  return (
    <form onSubmit={handleSubmit} className={`${portalSectionClass} space-y-4`}>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Financial Aid Application</h2>
        <p className="text-sm text-slate-500">
          Provide household financial information for scholarship review.
        </p>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {saved && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Financial aid information saved.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={portalLabelClass} htmlFor="household_income">
            Annual Household Income *
          </label>
          <input
            id="household_income"
            name="household_income"
            type="number"
            min="0"
            step="1000"
            required
            defaultValue={scholarship?.household_income ?? ""}
            className={portalInputClass}
          />
        </div>
        <div>
          <label className={portalLabelClass} htmlFor="requested_amount">
            Requested Scholarship Amount *
          </label>
          <input
            id="requested_amount"
            name="requested_amount"
            type="number"
            min="0"
            step="100"
            required
            defaultValue={scholarship?.requested_amount ?? ""}
            className={portalInputClass}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <ActionButton
          type="submit"
          status={action.status}
          verb="save"
          labels={{ idle: "Save Financial Aid Info", loading: "Saving…", success: "✓ Saved" }}
          errorMessage={action.errorMessage}
        />
      </div>
    </form>
  );
}
