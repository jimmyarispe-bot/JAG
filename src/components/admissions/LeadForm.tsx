"use client";

import { useRouter } from "next/navigation";
import { createLead } from "@/lib/admissions/actions";
import { GRADES } from "@/lib/constants/grades";
import { PROGRAMS } from "@/lib/constants/programs";
import { FundingSourceCheckboxes } from "@/components/ui/FundingSourceCheckboxes";
import { FormField } from "@/components/experience-system/forms";
import { ActionButton, ErrorBanner, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";

interface LeadFormProps {
  schools: { id: string; name: string }[];
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export function LeadForm({ schools }: LeadFormProps) {
  const router = useRouter();
  const action = useActionFeedback({
    verb: "create",
    labels: { idle: "Create Lead" },
    successToast: "✓ Created",
    errorToast: "Unable to create.",
    progressLabel: "Creating lead…",
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    void action.run(async () => {
      const result = await createLead(formData);
      assertActionResult(result);
      if (result.id) {
        router.push(`/dashboard/admissions/leads/${result.id}`);
      }
      return result;
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6"
      aria-label="Create admissions lead"
      noValidate
    >
      {action.errorMessage && (
        <ErrorBanner message={action.errorMessage} title="Could not create lead" />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="First Name" htmlFor="first_name" required>
          <input id="first_name" name="first_name" required className={inputClass} autoComplete="given-name" />
        </FormField>
        <FormField label="Last Name" htmlFor="last_name" required>
          <input id="last_name" name="last_name" required className={inputClass} autoComplete="family-name" />
        </FormField>
        <FormField label="Preferred Name" htmlFor="preferred_name">
          <input id="preferred_name" name="preferred_name" className={inputClass} />
        </FormField>
        <FormField label="Date of Birth" htmlFor="date_of_birth">
          <input id="date_of_birth" name="date_of_birth" type="date" className={inputClass} />
        </FormField>
        <FormField label="Current Grade" htmlFor="current_grade">
          <select id="current_grade" name="current_grade" className={inputClass} defaultValue="">
            <option value="">Select grade</option>
            {GRADES.map((grade) => (
              <option key={grade.value} value={grade.value}>
                {grade.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Applying For Grade" htmlFor="applying_for_grade">
          <select id="applying_for_grade" name="applying_for_grade" className={inputClass} defaultValue="">
            <option value="">Select grade</option>
            {GRADES.map((grade) => (
              <option key={grade.value} value={grade.value}>
                {grade.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Campus" htmlFor="school_id" required>
          <select id="school_id" name="school_id" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Select campus
            </option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Program Applying For" htmlFor="program" required>
          <select id="program" name="program" required className={inputClass} defaultValue="">
            <option value="" disabled>
              Select program
            </option>
            {PROGRAMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </FormField>
        <div className="sm:col-span-2">
          <FundingSourceCheckboxes />
        </div>
        <FormField label="Referral Source" htmlFor="referral_source">
          <input id="referral_source" name="referral_source" className={inputClass} />
        </FormField>
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-slate-900">Guardian Information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First Name" htmlFor="guardian_first_name">
            <input id="guardian_first_name" name="guardian_first_name" className={inputClass} autoComplete="given-name" />
          </FormField>
          <FormField label="Last Name" htmlFor="guardian_last_name">
            <input id="guardian_last_name" name="guardian_last_name" className={inputClass} autoComplete="family-name" />
          </FormField>
          <FormField label="Email" htmlFor="guardian_email">
            <input id="guardian_email" name="guardian_email" type="email" className={inputClass} autoComplete="email" />
          </FormField>
          <FormField label="Phone" htmlFor="guardian_phone">
            <input id="guardian_phone" name="guardian_phone" type="tel" className={inputClass} autoComplete="tel" />
          </FormField>
        </div>
      </fieldset>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <ActionButton
          type="submit"
          status={action.status}
          verb="create"
          labels={{ idle: "Create Lead" }}
          errorMessage={action.errorMessage}
        />
      </div>
    </form>
  );
}
