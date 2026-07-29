"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  experienceRequestAssessment,
  experienceRequestDiscoveryCall,
} from "@/lib/admissions/experience/actions";
import { GRADES } from "@/lib/constants/grades";
import { PROGRAMS } from "@/lib/constants/programs";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import {
  portalInputClass,
  portalLabelClass,
  portalSectionClass,
} from "@/components/admissions/portal/styles";

type Mode = "discovery" | "assessment" | "tour";

export function SchedulingRequestForm({
  schools,
  mode,
}: {
  schools: { id: string; name: string }[];
  mode: Mode;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "submit",
    labels: {
      idle: mode === "assessment" ? "Request assessment" : "Request call / tour",
      loading: "Submitting…",
      success: "✓ Submitted",
    },
    successToast: "Request received",
    errorToast: "Unable to submit request.",
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    void action.run(async () => {
      const result =
        mode === "assessment"
          ? await experienceRequestAssessment(formData)
          : await experienceRequestDiscoveryCall(formData);
      if ("error" in result && result.error) throw new Error(result.error);
      const leadId = "leadId" in result ? result.leadId : "";
      router.push(`/apply/thank-you?lead=${leadId}&kind=${mode}`);
      return result;
    });
  }

  return (
    <form onSubmit={handleSubmit} className={`${portalSectionClass} space-y-6`}>
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">Company website</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={portalLabelClass} htmlFor="guardian_first_name">Parent first name *</label>
          <input id="guardian_first_name" name="guardian_first_name" required className={portalInputClass} />
        </div>
        <div>
          <label className={portalLabelClass} htmlFor="guardian_last_name">Parent last name *</label>
          <input id="guardian_last_name" name="guardian_last_name" required className={portalInputClass} />
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
          <label className={portalLabelClass} htmlFor="preferred_contact_method">Preferred contact</label>
          <select id="preferred_contact_method" name="preferred_contact_method" className={portalInputClass} defaultValue="email">
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="text">Text</option>
          </select>
        </div>
        <div>
          <label className={portalLabelClass} htmlFor="preferred_at">Preferred date / time</label>
          <input id="preferred_at" name="preferred_at" type="datetime-local" className={portalInputClass} />
        </div>
        <div>
          <label className={portalLabelClass} htmlFor="first_name">Student first name *</label>
          <input id="first_name" name="first_name" required className={portalInputClass} />
        </div>
        <div>
          <label className={portalLabelClass} htmlFor="last_name">Student last name *</label>
          <input id="last_name" name="last_name" required className={portalInputClass} />
        </div>
        <div>
          <label className={portalLabelClass} htmlFor="school_id">Location *</label>
          <select id="school_id" name="school_id" required className={portalInputClass} defaultValue="">
            <option value="" disabled>Select location</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={portalLabelClass} htmlFor="program">Program of interest</label>
          <select id="program" name="program" className={portalInputClass} defaultValue="">
            <option value="">Select program</option>
            {PROGRAMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={portalLabelClass} htmlFor="applying_for_grade">Grade</label>
          <select id="applying_for_grade" name="applying_for_grade" className={portalInputClass} defaultValue="">
            <option value="">Select grade</option>
            {GRADES.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={portalLabelClass} htmlFor="tour_type">Format</label>
          <select id="tour_type" name="tour_type" className={portalInputClass} defaultValue="virtual">
            <option value="virtual">Virtual</option>
            <option value="in_person">In person</option>
          </select>
        </div>
      </div>

      {mode === "assessment" ? (
        <div>
          <label className={portalLabelClass} htmlFor="areas_of_concern">Areas of concern</label>
          <textarea
            id="areas_of_concern"
            name="areas_of_concern"
            rows={4}
            className={portalInputClass}
            placeholder="Learning, social, medical, or assessment focus areas"
          />
          <p className="mt-2 text-xs text-slate-500">
            Assessment scoring uses Learning Intelligence; documents store in KnowledgeEngine after application.
          </p>
        </div>
      ) : (
        <div>
          <label className={portalLabelClass} htmlFor="learning_concerns">Notes for admissions</label>
          <textarea id="learning_concerns" name="learning_concerns" rows={3} className={portalInputClass} />
        </div>
      )}

      <input type="hidden" name="referral_source" value={mode} />

      <div className="flex justify-end">
        <ActionButton
          type="submit"
          status={action.status}
          verb="submit"
          labels={{
            idle: mode === "assessment" ? "Request assessment" : "Submit request",
            loading: "Submitting…",
            success: "✓ Submitted",
          }}
          errorMessage={action.errorMessage}
        />
      </div>
    </form>
  );
}
