"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitApplication } from "@/lib/admissions/portal/actions";
import type { AdmissionsProgress } from "@/lib/admissions/portal/progress";
import { useBranding } from "@/components/branding/BrandingContext";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";

interface SubmitApplicationButtonProps {
  applicationId: string;
  progress: AdmissionsProgress;
  applicationStatus: string;
}

export function SubmitApplicationButton({
  applicationId,
  progress,
  applicationStatus,
}: SubmitApplicationButtonProps) {
  const router = useRouter();
  const branding = useBranding();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "submit",
    labels: { idle: "Submit Application", loading: "Submitting…", success: "✓ Submitted" },
    successToast: "✓ Submitted",
    errorToast: "Unable to submit.",
    progressLabel: "Submitting application…",
    onError: (err) => setError(err.message),
  });

  const alreadySubmitted = ["submitted", "under_review", "accepted", "waitlisted", "denied"].includes(
    applicationStatus
  );

  function handleSubmit() {
    setError(null);
    setMessage(null);
    void action.run(async () => {
      const result = await submitApplication(applicationId);
      if (result.error) throw new Error(result.error);
      if (result.autoAccepted) {
        setMessage(`Application submitted and automatically accepted. Welcome to ${branding.productName}!`);
      } else {
        setMessage("Application submitted for admissions review.");
      }
      router.refresh();
      return result;
    });
  }

  if (alreadySubmitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        Application status: <span className="font-semibold capitalize">{applicationStatus.replace("_", " ")}</span>
        {message && <p className="mt-2">{message}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Submit Application</h2>
      <p className="mt-1 text-sm text-slate-500">
        Submit when all required steps are complete. State funding must be verified by staff before
        automatic acceptance.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}

      <div className="mt-4">
        <ActionButton
          type="button"
          status={action.status}
          verb="submit"
          labels={{ idle: "Submit Application", loading: "Submitting…", success: "✓ Submitted" }}
          disabled={!progress.readyToSubmit}
          errorMessage={action.errorMessage}
          onClick={handleSubmit}
        />
      </div>

      {!progress.readyToSubmit && (
        <p className="mt-2 text-xs text-slate-400">
          Complete all required sections above before submitting.
        </p>
      )}
    </div>
  );
}
