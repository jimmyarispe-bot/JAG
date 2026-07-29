"use client";

import { useState } from "react";
import { experienceScheduleInterview } from "@/lib/admissions/experience/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import {
  portalInputClass,
  portalLabelClass,
  portalSectionClass,
} from "@/components/admissions/portal/styles";

/**
 * Staff interview scheduling + notes. Uses existing scheduleInterview service.
 */
export function InterviewDecisionPanel({
  leadId,
  applicationId,
}: {
  leadId: string;
  applicationId?: string | null;
  organizationId?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "schedule",
    successToast: "Interview scheduled",
    errorToast: "Unable to schedule.",
    onError: (err) => setError(err.message),
  });

  return (
    <form
      className={`${portalSectionClass} space-y-4`}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        formData.set("lead_id", leadId);
        if (applicationId) formData.set("application_id", applicationId);
        void action.run(async () => {
          const result = await experienceScheduleInterview(formData);
          if ("error" in result && result.error) throw new Error(result.error);
          return result;
        });
      }}
    >
      <h2 className="text-lg font-semibold text-slate-900">Interview</h2>
      <p className="text-sm text-slate-600">
        Scheduling, notes, recommendations, and decision support — CRM stages advance via
        existing interview workflow.
      </p>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={portalLabelClass} htmlFor="scheduled_at">Schedule</label>
          <input id="scheduled_at" name="scheduled_at" type="datetime-local" required className={portalInputClass} />
        </div>
        <div>
          <label className={portalLabelClass} htmlFor="interview_type">Type</label>
          <select id="interview_type" name="interview_type" className={portalInputClass} defaultValue="virtual">
            <option value="virtual">Virtual</option>
            <option value="in_person">In person</option>
            <option value="initial_assessment">Assessment interview</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={portalLabelClass} htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows={3} className={portalInputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={portalLabelClass} htmlFor="recommendation">Recommendation</label>
          <select id="recommendation" name="recommendation" className={portalInputClass} defaultValue="pending">
            <option value="pending">Pending</option>
            <option value="accept">Recommend accept</option>
            <option value="waitlist">Recommend waitlist</option>
            <option value="decline">Recommend decline</option>
          </select>
        </div>
      </div>
      <ActionButton
        type="submit"
        status={action.status}
        verb="schedule"
        labels={{ idle: "Schedule interview", loading: "Scheduling…", success: "✓ Scheduled" }}
        errorMessage={action.errorMessage}
      />
    </form>
  );
}
