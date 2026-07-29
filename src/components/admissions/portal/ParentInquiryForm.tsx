"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { experienceSubmitInterest } from "@/lib/admissions/experience/actions";
import { GRADES } from "@/lib/constants/grades";
import { PROGRAMS } from "@/lib/constants/programs";
import { FundingSourceCheckboxes } from "@/components/ui/FundingSourceCheckboxes";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { portalInputClass, portalLabelClass, portalSectionClass } from "./styles";

interface ParentInquiryFormProps {
  schools: { id: string; name: string }[];
}

export function ParentInquiryForm({ schools }: ParentInquiryFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "submit",
    labels: { idle: "Submit Inquiry", loading: "Submitting…", success: "✓ Submitted" },
    successToast: "✓ Submitted",
    errorToast: "Unable to submit.",
    progressLabel: "Submitting inquiry…",
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    void action.run(async () => {
      const result = await experienceSubmitInterest(formData);
      if ("error" in result && result.error) throw new Error(result.error);
      router.push(`/apply/thank-you?lead=${"leadId" in result ? result.leadId : ""}`);
      return result;
    });
  }

  return (
    <form onSubmit={handleSubmit} className={`${portalSectionClass} space-y-8`}>
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {/* B.1 honeypot — leave empty */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">Company website</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Student Information</h2>
          <p className="text-sm text-slate-500">
            Tell us about the student you would like to enroll.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={portalLabelClass} htmlFor="first_name">First Name *</label>
            <input id="first_name" name="first_name" required className={portalInputClass} />
          </div>
          <div>
            <label className={portalLabelClass} htmlFor="last_name">Last Name *</label>
            <input id="last_name" name="last_name" required className={portalInputClass} />
          </div>
          <div>
            <label className={portalLabelClass} htmlFor="preferred_name">Preferred Name</label>
            <input id="preferred_name" name="preferred_name" className={portalInputClass} />
          </div>
          <div>
            <label className={portalLabelClass} htmlFor="date_of_birth">Date of Birth</label>
            <input id="date_of_birth" name="date_of_birth" type="date" className={portalInputClass} />
          </div>
          <div>
            <label className={portalLabelClass} htmlFor="current_grade">Current Grade</label>
            <select id="current_grade" name="current_grade" className={portalInputClass} defaultValue="">
              <option value="">Select grade</option>
              {GRADES.map((grade) => (
                <option key={grade.value} value={grade.value}>{grade.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={portalLabelClass} htmlFor="applying_for_grade">Applying For Grade</label>
            <select id="applying_for_grade" name="applying_for_grade" className={portalInputClass} defaultValue="">
              <option value="">Select grade</option>
              {GRADES.map((grade) => (
                <option key={grade.value} value={grade.value}>{grade.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Program & School</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={portalLabelClass} htmlFor="school_id">School *</label>
            <select id="school_id" name="school_id" required className={portalInputClass} defaultValue="">
              <option value="" disabled>Select school</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={portalLabelClass} htmlFor="program">Program</label>
            <select id="program" name="program" className={portalInputClass} defaultValue="">
              <option value="">Select program</option>
              {PROGRAMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <FundingSourceCheckboxes />
          </div>
          <div>
            <label className={portalLabelClass} htmlFor="referral_source">Referral source</label>
            <input id="referral_source" name="referral_source" className={portalInputClass} placeholder="How did you hear about us?" />
          </div>
          <div className="sm:col-span-2">
            <label className={portalLabelClass} htmlFor="learning_concerns">Learning concerns</label>
            <textarea
              id="learning_concerns"
              name="learning_concerns"
              rows={3}
              className={portalInputClass}
              placeholder="Optional — learning, social, or support needs"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Parent / Guardian Contact</h2>
          <p className="text-sm text-slate-500">
            Use the email you will sign in with to access your admissions portal.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={portalLabelClass} htmlFor="guardian_first_name">First Name</label>
            <input id="guardian_first_name" name="guardian_first_name" className={portalInputClass} />
          </div>
          <div>
            <label className={portalLabelClass} htmlFor="guardian_last_name">Last Name</label>
            <input id="guardian_last_name" name="guardian_last_name" className={portalInputClass} />
          </div>
          <div>
            <label className={portalLabelClass} htmlFor="guardian_email">Email *</label>
            <input id="guardian_email" name="guardian_email" type="email" required className={portalInputClass} />
          </div>
          <div>
            <label className={portalLabelClass} htmlFor="guardian_phone">Phone</label>
            <input id="guardian_phone" name="guardian_phone" type="tel" className={portalInputClass} />
          </div>
          <div>
            <label className={portalLabelClass} htmlFor="preferred_contact_method">Preferred contact method</label>
            <select
              id="preferred_contact_method"
              name="preferred_contact_method"
              className={portalInputClass}
              defaultValue="email"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="text">Text</option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <ActionButton
          type="submit"
          status={action.status}
          verb="submit"
          labels={{ idle: "Submit Inquiry", loading: "Submitting…", success: "✓ Submitted" }}
          errorMessage={action.errorMessage}
        />
      </div>
    </form>
  );
}
