"use client";

import { useState } from "react";
import { experienceGenerateOffer } from "@/lib/admissions/experience/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { portalSectionClass } from "@/components/admissions/portal/styles";

export function EnrollmentOfferPanel({
  applicationId,
  leadId,
  packetStatus,
}: {
  applicationId: string;
  leadId: string;
  packetStatus?: string | null;
}) {
  const [status, setStatus] = useState(packetStatus ?? null);
  const [error, setError] = useState<string | null>(null);
  const action = useActionFeedback({
    verb: "create",
    successToast: "Offer generated",
    errorToast: "Unable to generate offer.",
    onError: (err) => setError(err.message),
  });

  return (
    <section className={`${portalSectionClass} space-y-3`}>
      <h2 className="text-lg font-semibold text-slate-900">Enrollment offer</h2>
      <p className="text-sm text-slate-600">
        Generates the enrollment packet (offer) with expiration handled by packet workflow.
        Accept / decline / waitlist continue through existing decision and acceptance services.
      </p>
      {status && (
        <p className="text-sm text-emerald-700">Packet status: {status}</p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <ActionButton
        type="button"
        status={action.status}
        verb="create"
        labels={{ idle: "Generate offer", loading: "Generating…", success: "✓ Generated" }}
        onClick={() => {
          void action.run(async () => {
            const result = await experienceGenerateOffer(applicationId, leadId);
            if ("error" in result && result.error) throw new Error(result.error);
            setStatus("sent");
            return result;
          });
        }}
      />
    </section>
  );
}
